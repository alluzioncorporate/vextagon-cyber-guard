import { useState } from "react";
import { Search, Globe, Lock, Server, Bug, Cpu, Radar, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateDomain, type ScanResult } from "@/lib/scanEngine";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const severityClass: Record<string, string> = {
  critical: "severity-critical",
  high: "severity-high",
  medium: "severity-medium",
  low: "severity-low",
};

export default function EasmScanner() {
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shodanEnabled, setShodanEnabled] = useState(false);

  const handleScan = async () => {
    const validation = validateDomain(domain);
    if (!validation.valid) {
      setError(validation.reason || "Domínio inválido");
      return;
    }
    setError(null);
    setScanning(true);
    setResults(null);
    setShodanEnabled(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('easm-scan', {
        body: { domain: domain.trim().toLowerCase() }
      });
      
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      
      setShodanEnabled(data.shodanEnabled || false);
      setResults(data as ScanResult);
    } catch (err: any) {
      setError(err.message || "Erro ao realizar scan. Tente novamente.");
    } finally {
      setScanning(false);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "severity-critical";

  const generateRecommendations = (data: ScanResult) => {
    const recs: { severity: "critical" | "high" | "medium" | "low"; title: string; action: string }[] = [];

    // SSL Issues
    if (!data.ssl.valid) {
      recs.push({ severity: "critical", title: "Certificado SSL Inválido", action: "Renove o certificado SSL imediatamente. Use Let's Encrypt ou DigiCert para obter um certificado válido." });
    }
    if (data.ssl.grade === "F" || data.ssl.grade === "D") {
      recs.push({ severity: "high", title: "Configuração SSL Fraca", action: "Atualize para TLS 1.3 e desabilite cipher suites fracos (3DES, RC4). Configure HSTS com preload." });
    }

    // Security Headers
    const missingHeaders = Object.entries(data.securityHeaders).filter(([_, h]) => !h.present);
    if (missingHeaders.length >= 4) {
      recs.push({ severity: "high", title: `${missingHeaders.length} Headers de Segurança Ausentes`, action: "Implemente HSTS, X-Frame-Options, CSP e X-Content-Type-Options no servidor web." });
    } else if (missingHeaders.length > 0) {
      recs.push({ severity: "medium", title: `${missingHeaders.length} Headers Faltando`, action: `Configure: ${missingHeaders.slice(0, 2).map(([k]) => k).join(", ")}` });
    }

    // Critical Ports
    const criticalOpen = data.ports.filter(p => p.status === "open" && (p.risk === "critical" || p.risk === "high"));
    if (criticalOpen.length > 0) {
      recs.push({ severity: "critical", title: `${criticalOpen.length} Portas de Alto Risco Abertas`, action: `Feche ou restrinja: ${criticalOpen.map(p => p.port).join(", ")}. Use firewall para bloquear acesso não autorizado.` });
    }

    // Vulnerabilities
    const criticalVulns = data.vulnerabilities.filter(v => v.severity === "critical");
    if (criticalVulns.length > 0) {
      recs.push({ severity: "critical", title: `${criticalVulns.length} Vulnerabilidades Críticas`, action: `Aplique patches imediatamente: ${criticalVulns.slice(0, 2).map(v => v.id).join(", ")}` });
    }

    // DNS Security
    const hasSPF = data.dns.records.some(r => r.type === "TXT" && r.value.includes("spf1"));
    if (!hasSPF) {
      recs.push({ severity: "medium", title: "SPF Não Configurado", action: "Configure SPF record para prevenir spoofing de e-mail: v=spf1 include:_spf.google.com ~all" });
    }

    // Good practices if score is high
    if (data.score >= 85) {
      recs.push({ severity: "low", title: "Configuração Sólida Detectada", action: "Continue monitorando regularmente. Configure alertas automáticos para mudanças." });
    }

    return recs.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">EASM — Surface Monitor</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Análise de superfície: DNS, SSL, Portas, Headers e Shodan Intel</p>
      </div>

      {/* Scan Input */}
      <div className="v-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setError(null); }}
              placeholder="dominio.com"
              className="bg-secondary/50 pl-9 font-mono text-xs border-border"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
          </div>
          <Button onClick={handleScan} disabled={scanning} size="sm" className="text-xs font-medium">
            <Radar className="mr-1.5 h-3.5 w-3.5" />
            {scanning ? "Analisando..." : "Scan"}
          </Button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Scanning */}
      {scanning && (
        <div className="v-card flex flex-col items-center py-12">
          <Radar className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Analisando {domain}...</p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">DNS · SSL · Headers · Portas (~10–15s)</p>
        </div>
      )}

      {/* Results */}
      {results && !scanning && (
        <div className="space-y-4">
          {/* Score */}
          <div className="v-card p-5 text-center">
            <p className="v-label">Security Score</p>
            <p className={`font-mono text-5xl font-bold mt-1 ${scoreColor(results.score)}`}>{results.score}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{results.domain}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* DNS */}
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">DNS Records</p>
              </div>
              <div className="space-y-1.5">
                {results.dns.records.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-secondary/40 px-3 py-2">
                    <span className="font-mono text-[11px] font-medium text-cyan">{r.type}</span>
                    <span className="font-mono text-[11px] text-muted-foreground truncate ml-2 max-w-[200px]">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Headers */}
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Security Headers</p>
              </div>
              <div className="space-y-1.5">
                {Object.entries(results.securityHeaders).map(([header, data]) => (
                  <div key={header} className="flex items-center justify-between rounded bg-secondary/40 px-3 py-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{header}</span>
                    <span className={`font-mono text-[10px] font-medium ${data.present ? "text-success" : "severity-critical"}`}>
                      {data.present ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SSL */}
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">SSL Certificate</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Status", value: results.ssl.valid ? "Válido" : "Inválido", cls: results.ssl.valid ? "text-success" : "severity-critical" },
                  { label: "Emissor", value: results.ssl.issuer },
                  { label: "Protocolo", value: results.ssl.protocol },
                  { label: "Grade", value: results.ssl.grade, cls: results.ssl.grade.startsWith("A") ? "text-cyan font-medium" : results.ssl.grade === "F" ? "severity-critical" : "text-warning" },
                  { label: "Expira", value: results.ssl.expiresAt },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between rounded bg-secondary/40 px-3 py-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{item.label}</span>
                    <span className={`font-mono text-[10px] ${item.cls || "text-foreground"}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ports */}
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Portas</p>
              </div>
              <div className="space-y-1.5">
                {results.ports.map((p) => (
                  <div key={p.port} className="flex items-center justify-between rounded bg-secondary/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-medium text-foreground">:{p.port}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{p.service}</span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${p.status === "open" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                    <span className={`font-mono text-[10px] font-medium uppercase ${severityClass[p.risk]}`}>{p.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shodan Intel */}
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Shodan Intelligence</p>
                {!shodanEnabled && (
                  <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">opcional</span>
                )}
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "IP", value: results.shodan.ip },
                  { label: "OS", value: results.shodan.os },
                  { label: "Org", value: results.shodan.organization },
                  { label: "ISP", value: results.shodan.isp },
                  { label: "Última Atualização", value: results.shodan.lastUpdate },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between rounded bg-secondary/40 px-3 py-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-[10px] text-foreground">{item.value}</span>
                  </div>
                ))}
                <div className="mt-2">
                  <p className="v-label mb-1.5">Serviços Detectados</p>
                  {results.shodan.services.map((s) => (
                    <div key={s.port} className="flex items-center justify-between rounded bg-secondary/40 px-3 py-1.5 mb-1">
                      <span className="font-mono text-[10px] text-cyan">:{s.port}</span>
                      <span className="font-mono text-[10px] text-foreground">{s.product} {s.version}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vulnerabilities */}
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-3.5 w-3.5 text-destructive" />
                <p className="v-section-title">Vulnerabilidades ({results.vulnerabilities.length})</p>
              </div>
              <div className="space-y-2">
                {results.vulnerabilities.map((v) => (
                  <div key={v.id} className="rounded bg-secondary/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-medium text-foreground">{v.id}</span>
                      <span className={`font-mono text-[9px] font-medium uppercase ${severityClass[v.severity]}`}>{v.severity}</span>
                    </div>
                    <p className="text-[11px] text-foreground mt-1">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="v-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h2 className="v-section-title">Recomendações de Segurança</h2>
            </div>
            {!shodanEnabled && (
              <Alert className="mb-3 bg-secondary/60 border-border">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <AlertDescription className="text-[11px] text-muted-foreground ml-1">
                  <strong className="text-foreground">Shodan não ativado:</strong> Inteligência de IP, OS e CVEs indisponível. 
                  Adicione <code className="text-cyan font-mono text-[10px]">SHODAN_API_KEY</code> em Cloud Secrets para ativar.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              {generateRecommendations(results).map((rec, idx) => (
                <div key={idx} className={`rounded border-l-4 bg-secondary/40 p-3 ${
                  rec.severity === "critical" ? "border-l-[#FF4444]" :
                  rec.severity === "high" ? "border-l-[#FF8C00]" :
                  rec.severity === "medium" ? "border-l-[#FFA500]" :
                  "border-l-[#00D9FF]"
                }`}>
                  <div className="flex items-start gap-2">
                    {rec.severity === "low" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${severityClass[rec.severity]}`} />
                    )}
                    <div className="flex-1">
                      <p className={`font-mono text-[11px] font-medium ${severityClass[rec.severity]}`}>{rec.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{rec.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
