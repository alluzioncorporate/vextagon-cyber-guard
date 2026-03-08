// Dynamic scan simulation engine — generates unique results per domain
// Uses domain string as seed for deterministic but varied output

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  bool(chance = 0.5): boolean {
    return this.next() < chance;
  }
}

const ISPS = ["Cloudflare Inc.", "Amazon AWS", "Google Cloud", "DigitalOcean", "OVHcloud", "Hetzner Online", "Linode LLC", "Vultr Holdings"];
const ORGS = ["Cloudflare", "Amazon.com", "Google LLC", "DigitalOcean", "OVH SAS", "Hetzner", "Akamai Technologies", "Fastly Inc."];
const OS_LIST = ["Ubuntu 22.04 LTS", "Debian 12", "CentOS Stream 9", "Alpine 3.19", "Amazon Linux 2023", "Windows Server 2022", "FreeBSD 14.0"];
const SSL_ISSUERS = ["Let's Encrypt Authority X3", "DigiCert SHA2 Extended", "Sectigo RSA Domain", "Google Trust Services", "Amazon RSA 2048"];
const WEB_SERVERS = ["nginx", "Apache", "LiteSpeed", "Caddy", "IIS"];
const WEB_VERSIONS: Record<string, string[]> = {
  nginx: ["1.24.0", "1.25.3", "1.22.1"],
  Apache: ["2.4.58", "2.4.57", "2.4.54"],
  LiteSpeed: ["6.1", "6.0.12"],
  Caddy: ["2.7.5", "2.7.4"],
  IIS: ["10.0", "8.5"],
};
const SSH_VERSIONS = ["OpenSSH 9.6p1", "OpenSSH 9.5p1", "OpenSSH 8.9p1", "OpenSSH 9.0p1"];
const CVE_TEMPLATES = [
  { severity: "critical", title: "Remote Code Execution in {product}", desc: "Buffer overflow allows unauthenticated RCE" },
  { severity: "critical", title: "Authentication Bypass in {product}", desc: "Logic flaw permits privilege escalation" },
  { severity: "high", title: "SQL Injection in {product}", desc: "Unsanitized user input in query parameter" },
  { severity: "high", title: "Server-Side Request Forgery in {product}", desc: "Internal network accessible via crafted request" },
  { severity: "high", title: "Cross-Site Scripting in {product}", desc: "Reflected XSS via unescaped output" },
  { severity: "medium", title: "Information Disclosure via {product}", desc: "Server version and internal paths exposed" },
  { severity: "medium", title: "Insecure TLS Configuration in {product}", desc: "Weak cipher suites accepted" },
  { severity: "medium", title: "Missing Rate Limiting in {product}", desc: "API endpoint vulnerable to brute force" },
  { severity: "low", title: "Missing Security Headers", desc: "X-Frame-Options and CSP not configured" },
  { severity: "low", title: "Cookie without Secure flag", desc: "Session cookie transmitted over HTTP" },
];

const HEADER_NAMES = [
  "Strict-Transport-Security",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Content-Security-Policy",
  "X-XSS-Protection",
  "Referrer-Policy",
  "Permissions-Policy",
] as const;

const HEADER_VALUES: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'self'",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export type ScanResult = ReturnType<typeof generateScanResults>;

export function generateScanResults(domain: string) {
  const seed = hashCode(domain);
  const rng = new SeededRandom(seed);

  // Generate deterministic IP from domain
  const ip = `${rng.int(1, 223)}.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`;
  const webServer = rng.pick(WEB_SERVERS);
  const webVersion = rng.pick(WEB_VERSIONS[webServer] || ["1.0"]);

  // DNS records
  const dnsRecords = [
    { type: "A", value: ip },
  ];
  if (rng.bool(0.7)) dnsRecords.push({ type: "AAAA", value: `2606:${rng.int(1000, 9999)}:${rng.int(100, 999)}::${rng.int(1, 99)}` });
  dnsRecords.push({ type: "MX", value: `mail.${domain} (priority: ${rng.pick([5, 10, 20])})` });
  if (rng.bool(0.8)) dnsRecords.push({ type: "TXT", value: `v=spf1 include:_spf.${rng.pick(["google.com", "outlook.com", "zoho.com"])} ~all` });
  dnsRecords.push({ type: "NS", value: `ns1.${rng.pick(["cloudflare.com", "awsdns-01.com", "google.com", "digitalocean.com"])}, ns2.${rng.pick(["cloudflare.com", "awsdns-02.com", "google.com"])}` });

  // Security headers
  const securityHeaders: Record<string, { present: boolean; value: string | null }> = {};
  for (const h of HEADER_NAMES) {
    const present = rng.bool(0.55);
    securityHeaders[h] = { present, value: present ? HEADER_VALUES[h] : null };
  }

  // SSL
  const sslValid = rng.bool(0.75);
  const sslGrades = sslValid ? ["A+", "A", "B"] : ["C", "D", "F"];
  const protocols = sslValid ? ["TLS 1.3", "TLS 1.2"] : ["TLS 1.1", "TLS 1.0", "TLS 1.2"];
  const monthsToExpiry = rng.int(-2, 18);
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + monthsToExpiry);

  const ssl = {
    valid: sslValid && monthsToExpiry > 0,
    issuer: sslValid ? rng.pick(SSL_ISSUERS) : "Self-Signed",
    expiresAt: expiryDate.toISOString().slice(0, 10),
    protocol: rng.pick(protocols),
    grade: rng.pick(sslGrades),
  };

  // Ports
  const allPorts = [
    { port: 21, service: "FTP", risk: "high" as const },
    { port: 22, service: "SSH", risk: "medium" as const },
    { port: 25, service: "SMTP", risk: "medium" as const },
    { port: 80, service: "HTTP", risk: "low" as const },
    { port: 443, service: "HTTPS", risk: "low" as const },
    { port: 3306, service: "MySQL", risk: "critical" as const },
    { port: 5432, service: "PostgreSQL", risk: "critical" as const },
    { port: 6379, service: "Redis", risk: "critical" as const },
    { port: 8080, service: "HTTP-Alt", risk: "high" as const },
    { port: 8443, service: "HTTPS-Alt", risk: "medium" as const },
    { port: 27017, service: "MongoDB", risk: "critical" as const },
    { port: 9200, service: "Elasticsearch", risk: "high" as const },
  ];
  const ports = allPorts.map((p) => ({
    ...p,
    status: (p.port === 80 || p.port === 443) ? "open" : rng.bool(0.35) ? "open" : "closed",
  }));

  // Shodan
  const shodanServices = [
    { port: 80, product: webServer, version: webVersion },
    { port: 443, product: webServer, version: webVersion },
  ];
  if (ports.find((p) => p.port === 22 && p.status === "open")) {
    shodanServices.push({ port: 22, product: "OpenSSH", version: rng.pick(SSH_VERSIONS).replace("OpenSSH ", "") });
  }
  for (const p of ports.filter((p) => p.status === "open" && ![22, 80, 443].includes(p.port))) {
    shodanServices.push({ port: p.port, product: p.service, version: `${rng.int(1, 9)}.${rng.int(0, 30)}.${rng.int(0, 9)}` });
  }

  const vulnCount = rng.int(1, 6);
  const usedCVEs = new Set<string>();
  const vulnerabilities = [];
  for (let i = 0; i < vulnCount; i++) {
    const tpl = rng.pick(CVE_TEMPLATES);
    const cve = `CVE-${rng.int(2023, 2026)}-${rng.int(1000, 9999)}`;
    if (usedCVEs.has(cve)) continue;
    usedCVEs.add(cve);
    const product = rng.pick([webServer, "Authentication Module", "API Gateway", "Proxy", "CMS Plugin", domain.split(".")[0]]);
    vulnerabilities.push({
      id: cve,
      severity: tpl.severity,
      title: tpl.title.replace("{product}", product),
      description: tpl.desc,
      affected: product,
    });
  }

  // Score calculation
  const headersPresent = Object.values(securityHeaders).filter((h) => h.present).length;
  const criticalPorts = ports.filter((p) => p.status === "open" && p.risk === "critical").length;
  const criticalVulns = vulnerabilities.filter((v) => v.severity === "critical").length;
  let score = 100;
  score -= (HEADER_NAMES.length - headersPresent) * 4;
  score -= criticalPorts * 12;
  score -= criticalVulns * 10;
  score -= vulnerabilities.filter((v) => v.severity === "high").length * 6;
  if (!ssl.valid) score -= 15;
  if (ssl.grade === "F") score -= 10;
  score = Math.max(0, Math.min(100, score));

  const shodanVulns = vulnerabilities.filter((v) => v.severity === "critical" || v.severity === "high").map((v) => v.id);

  return {
    domain,
    scanDate: new Date().toISOString(),
    score,
    dns: { status: "resolved" as const, records: dnsRecords },
    securityHeaders,
    ssl,
    ports,
    shodan: {
      ip,
      os: rng.pick(OS_LIST),
      organization: rng.pick(ORGS),
      isp: rng.pick(ISPS),
      services: shodanServices,
      vulns: shodanVulns,
      lastUpdate: new Date(Date.now() - rng.int(1, 14) * 86400000).toISOString().slice(0, 10),
    },
    vulnerabilities,
  };
}

// Domain validation
export function validateDomain(input: string): { valid: boolean; reason?: string } {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return { valid: false, reason: "Domínio vazio" };
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|localhost)/i.test(trimmed)) {
    return { valid: false, reason: "IPs internos/localhost não são permitidos" };
  }
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
    return { valid: false, reason: "Insira um domínio, não um IP" };
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(trimmed)) {
    return { valid: false, reason: "Formato de domínio inválido" };
  }
  return { valid: true };
}
