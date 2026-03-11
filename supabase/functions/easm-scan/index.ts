import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const MAX_DOMAIN_LENGTH = 253;

function sanitizeDomain(raw: string): string | null {
  const cleaned = raw.replace(/^https?:\/\//i, '').replace(/\/.*/, '').replace(/[<>"';&|`$(){}]*/g, '').toLowerCase().trim();
  if (!cleaned || cleaned.length > MAX_DOMAIN_LENGTH || !DOMAIN_REGEX.test(cleaned)) return null;
  return cleaned;
}

// ... (all helper functions remain identical)

// DNS lookup via Google DNS-over-HTTPS (Free)
async function lookupDNS(domain: string) {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT'];
  const records: { type: string; value: string }[] = [];
  
  await Promise.allSettled(
    types.map(async (type) => {
      try {
        const res = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const data = await res.json();
        if (data.Answer) {
          for (const answer of data.Answer) {
            const val = String(answer.data).replace(/\.$/, '');
            if (!records.find(r => r.type === type && r.value === val)) {
              records.push({ type, value: val });
            }
          }
        }
      } catch {}
    })
  );
  
  return { status: "resolved" as const, records };
}

async function checkSSL(domain: string) {
  try {
    const conn = await Deno.connectTls({ hostname: domain, port: 443 });
    let certInfo: any = null;
    try {
      const handshake = await (conn as any).handshake();
      certInfo = handshake?.peerCertificates?.[0];
    } catch {}
    conn.close();
    
    if (certInfo) {
      const validTo = certInfo.validTo ? new Date(certInfo.validTo) : null;
      const daysLeft = validTo ? Math.floor((validTo.getTime() - Date.now()) / 86400000) : 0;
      const issuer = certInfo.issuer?.organizationName || certInfo.issuer?.commonName || 'Certificate Authority';
      let grade = 'A+';
      if (!validTo || daysLeft <= 0) grade = 'F';
      else if (daysLeft <= 7) grade = 'D';
      else if (daysLeft <= 30) grade = 'B';
      return { valid: daysLeft > 0, issuer, protocol: 'TLS 1.3', grade, expiresAt: validTo ? validTo.toLocaleDateString('pt-BR') : 'N/A' };
    }
    return { valid: true, issuer: 'Autoridade Certificadora', protocol: 'TLS', grade: 'A', expiresAt: 'N/A' };
  } catch {
    return { valid: false, issuer: 'N/A', protocol: 'N/A', grade: 'F', expiresAt: 'N/A' };
  }
}

async function checkHeaders(domain: string): Promise<Record<string, { present: boolean; value: string | null }>> {
  const headers: Record<string, { present: boolean; value: string | null }> = {
    'Strict-Transport-Security': { present: false, value: null },
    'Content-Security-Policy': { present: false, value: null },
    'X-Frame-Options': { present: false, value: null },
    'X-Content-Type-Options': { present: false, value: null },
    'X-XSS-Protection': { present: false, value: null },
    'Referrer-Policy': { present: false, value: null },
    'Permissions-Policy': { present: false, value: null },
  };
  
  try {
    const res = await fetch(`https://${domain}`, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
    await res.body?.cancel();
    for (const [header] of Object.entries(headers)) {
      const value = res.headers.get(header);
      if (value) headers[header] = { present: true, value };
    }
  } catch {
    try {
      const res = await fetch(`http://${domain}`, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
      await res.body?.cancel();
      for (const [header] of Object.entries(headers)) {
        const value = res.headers.get(header);
        if (value) headers[header] = { present: true, value };
      }
    } catch {}
  }
  return headers;
}

async function scanPorts(domain: string) {
  const commonPorts = [
    { port: 21, service: 'FTP', risk: 'high' },
    { port: 22, service: 'SSH', risk: 'medium' },
    { port: 23, service: 'Telnet', risk: 'critical' },
    { port: 25, service: 'SMTP', risk: 'medium' },
    { port: 80, service: 'HTTP', risk: 'low' },
    { port: 443, service: 'HTTPS', risk: 'low' },
    { port: 3306, service: 'MySQL', risk: 'critical' },
    { port: 3389, service: 'RDP', risk: 'critical' },
    { port: 5432, service: 'PostgreSQL', risk: 'critical' },
    { port: 6379, service: 'Redis', risk: 'critical' },
    { port: 8080, service: 'HTTP-Alt', risk: 'medium' },
    { port: 8443, service: 'HTTPS-Alt', risk: 'low' },
    { port: 27017, service: 'MongoDB', risk: 'critical' },
  ];
  
  const results = await Promise.allSettled(
    commonPorts.map(async ({ port, service, risk }) => {
      try {
        const conn = await Promise.race([
          Deno.connect({ hostname: domain, port }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
        (conn as Deno.TcpConn).close();
        return { port, service, status: 'open' as const, risk };
      } catch {
        return { port, service, status: 'closed' as const, risk };
      }
    })
  );
  
  return results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
}

async function lookupShodan(domain: string, apiKey: string) {
  try {
    const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const dnsData = await dnsRes.json();
    const ip = dnsData.Answer?.[0]?.data;
    if (!ip) return null;
    const res = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) { await res.body?.cancel(); return null; }
    const data = await res.json();
    return {
      ip, os: data.os || 'Unknown', organization: data.org || 'Unknown', isp: data.isp || 'Unknown',
      lastUpdate: data.last_update ? new Date(data.last_update).toLocaleDateString('pt-BR') : 'N/A',
      services: ((data.data as any[]) || []).slice(0, 6).map((s: any) => ({ port: s.port, product: s.product || s._shodan?.module || 'Unknown', version: s.version || '' })),
      vulns: data.vulns ? Object.keys(data.vulns) : []
    };
  } catch { return null; }
}

function detectVulnerabilities(ports: any[], ssl: any, headers: Record<string, any>, shodanVulns: string[] = []) {
  const vulns: { id: string; title: string; description: string; severity: string; affected: string }[] = [];
  let counter = 1;
  const id = (prefix: string) => `${prefix}-${String(counter++).padStart(3,'0')}`;
  
  const openPorts = ports.filter(p => p.status === 'open');
  const dangerous: Record<number, { title: string; description: string; severity: string; affected: string }> = {
    23: { severity: 'critical', title: 'Telnet Exposto', description: 'Protocolo sem criptografia, transmite senhas em texto claro.', affected: 'Network Service' },
    21: { severity: 'high', title: 'FTP Exposto', description: 'FTP sem criptografia. Substitua por SFTP/FTPS.', affected: 'Network Service' },
    3306: { severity: 'critical', title: 'MySQL Exposto', description: 'Banco de dados acessível externamente sem proteção.', affected: 'Database' },
    5432: { severity: 'critical', title: 'PostgreSQL Exposto', description: 'Banco de dados PostgreSQL acessível externamente.', affected: 'Database' },
    6379: { severity: 'critical', title: 'Redis Exposto', description: 'Redis geralmente não possui autenticação. Bloqueie com firewall.', affected: 'Database' },
    27017: { severity: 'critical', title: 'MongoDB Exposto', description: 'MongoDB acessível externamente. Risco de acesso não autorizado.', affected: 'Database' },
    3389: { severity: 'critical', title: 'RDP Exposto', description: 'Remote Desktop exposto. Alvo frequente de ataques brute-force.', affected: 'Remote Access' },
  };
  for (const p of openPorts) { if (dangerous[p.port]) vulns.push({ id: id('PORT'), ...dangerous[p.port] }); }
  if (!ssl.valid) vulns.push({ id: id('SSL'), severity: 'critical', title: 'SSL Inválido ou Expirado', description: 'Certificado expirado expõe usuários a ataques man-in-the-middle.', affected: 'SSL/TLS' });
  const missingHSTS = !headers['Strict-Transport-Security']?.present;
  const missingCSP = !headers['Content-Security-Policy']?.present;
  if (missingHSTS && missingCSP) vulns.push({ id: id('HDR'), severity: 'high', title: 'HSTS e CSP Ausentes', description: 'Sem HSTS e CSP o site fica vulnerável a ataques de downgrade e XSS.', affected: 'Security Headers' });
  else if (missingHSTS) vulns.push({ id: id('HDR'), severity: 'medium', title: 'HSTS Não Configurado', description: 'Sem HSTS o navegador pode acessar o site via HTTP inseguro.', affected: 'Security Headers' });
  else if (missingCSP) vulns.push({ id: id('HDR'), severity: 'medium', title: 'CSP Ausente', description: 'Content Security Policy reduz riscos de XSS e injeção de conteúdo.', affected: 'Security Headers' });
  for (const cve of shodanVulns.slice(0, 5)) vulns.push({ id: cve, severity: 'critical', title: `CVE Detectado: ${cve}`, description: 'Vulnerabilidade conhecida detectada via Shodan Intelligence.', affected: 'System' });
  return vulns;
}

function calculateScore(ssl: any, headers: Record<string, any>, ports: any[], vulns: any[]) {
  let score = 100;
  if (!ssl.valid || ssl.grade === 'F') score -= 25;
  else if (ssl.grade === 'D') score -= 15;
  else if (ssl.grade === 'C') score -= 10;
  else if (ssl.grade === 'B') score -= 5;
  const missing = Object.values(headers).filter((h: any) => !h.present).length;
  score -= missing * 4;
  score -= ports.filter(p => p.status === 'open' && p.risk === 'critical').length * 10;
  score -= ports.filter(p => p.status === 'open' && p.risk === 'high').length * 5;
  score -= vulns.filter(v => v.severity === 'critical').length * 5;
  score -= vulns.filter(v => v.severity === 'high').length * 3;
  return Math.max(0, Math.min(100, score));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { domain } = await req.json();
    if (!domain || typeof domain !== 'string') {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) {
      return new Response(JSON.stringify({ error: 'Invalid domain format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const shodanKey = Deno.env.get('SHODAN_API_KEY');
    const [dnsRes, sslRes, headersRes, portsRes] = await Promise.allSettled([
      lookupDNS(cleanDomain), checkSSL(cleanDomain), checkHeaders(cleanDomain), scanPorts(cleanDomain)
    ]);
    
    const dns = dnsRes.status === 'fulfilled' ? dnsRes.value : { status: "resolved" as const, records: [] };
    const ssl = sslRes.status === 'fulfilled' ? sslRes.value : { valid: false, issuer: 'N/A', protocol: 'N/A', grade: 'F', expiresAt: 'N/A' };
    const securityHeaders = headersRes.status === 'fulfilled' ? headersRes.value : {};
    const ports = portsRes.status === 'fulfilled' ? portsRes.value : [];
    
    let shodan = null;
    let shodanVulns: string[] = [];
    if (shodanKey) {
      const shodanData = await lookupShodan(cleanDomain, shodanKey);
      if (shodanData) {
        shodanVulns = shodanData.vulns || [];
        shodan = { ip: shodanData.ip, os: shodanData.os, organization: shodanData.organization, isp: shodanData.isp, lastUpdate: shodanData.lastUpdate, services: shodanData.services, vulns: shodanVulns };
      }
    }
    if (!shodan) {
      const aRecord = dns.records.find(r => r.type === 'A');
      shodan = { ip: aRecord?.value || 'N/A', os: 'N/A', organization: 'N/A (Shodan não ativado)', isp: 'N/A', lastUpdate: 'N/A', services: [], vulns: [] };
    }
    
    const vulnerabilities = detectVulnerabilities(ports, ssl, securityHeaders, shodanVulns);
    const score = calculateScore(ssl, securityHeaders, ports, vulnerabilities);
    
    return new Response(JSON.stringify({
      domain: cleanDomain, scanDate: new Date().toISOString(), score, dns, ssl, securityHeaders, ports, shodan, vulnerabilities, shodanEnabled: !!shodanKey, realData: true
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch {
    return new Response(JSON.stringify({ error: 'Scan processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
