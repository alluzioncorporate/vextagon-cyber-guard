import { FileText, Download, Shield, AlertTriangle, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockScanResults } from "@/data/mockData";

const severityClass: Record<string, string> = {
  critical: "severity-critical",
  high: "severity-high",
  medium: "severity-medium",
  low: "severity-low",
};

export default function SecurityAuditor() {
  const handleGenerateReport = () => {
    const content = `
=== VEXTAGON SECURITY AUDIT REPORT ===
Domain: ${mockScanResults.domain}
Date: ${mockScanResults.scanDate}
Security Score: ${mockScanResults.score}/100

--- DNS Records ---
${mockScanResults.dns.records.map((r) => `${r.type}: ${r.value}`).join("\n")}

--- SSL Certificate ---
Valid: ${mockScanResults.ssl.valid}
Issuer: ${mockScanResults.ssl.issuer}
Protocol: ${mockScanResults.ssl.protocol}
Grade: ${mockScanResults.ssl.grade}

--- Security Headers ---
${Object.entries(mockScanResults.securityHeaders).map(([h, d]) => `${h}: ${d.present ? "PRESENT" : "MISSING"}`).join("\n")}

--- Open Ports ---
${mockScanResults.ports.map((p) => `Port ${p.port} (${p.service}) - ${p.status} - Risk: ${p.risk}`).join("\n")}

--- Shodan Intelligence ---
IP: ${mockScanResults.shodan.ip}
OS: ${mockScanResults.shodan.os}
Organization: ${mockScanResults.shodan.organization}
Services: ${mockScanResults.shodan.services.map(s => `${s.product} ${s.version} (:${s.port})`).join(", ")}

--- Vulnerabilities ---
${mockScanResults.vulnerabilities.map((v) => `[${v.severity.toUpperCase()}] ${v.id}: ${v.title}\n  ${v.description}`).join("\n\n")}

=== END OF REPORT ===
Powered by Vextagon | Alluzion Corporate
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vextagon-audit-${mockScanResults.domain}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = mockScanResults.vulnerabilities.filter((v) => v.severity === "critical").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground">Security Auditor</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerador de relatórios de auditoria</p>
        </div>
        <Button onClick={handleGenerateReport} size="sm" className="text-xs font-medium">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Gerar Relatório
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Domínio", value: mockScanResults.domain, icon: Globe },
          { label: "Score", value: `${mockScanResults.score}/100`, icon: Shield, cyan: true },
          { label: "Críticas", value: criticalCount.toString(), icon: AlertTriangle, danger: true },
          { label: "SSL", value: mockScanResults.ssl.grade, icon: Lock, success: true },
        ].map((s) => (
          <div key={s.label} className="v-card p-4">
            <div className="flex items-center justify-between">
              <span className="v-label">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.danger ? "text-destructive" : s.cyan ? "text-cyan" : s.success ? "text-success" : "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 v-stat ${s.danger ? "text-destructive" : s.cyan ? "text-cyan" : s.success ? "text-success" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Report Preview */}
      <div className="v-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <p className="v-section-title">Preview do Relatório</p>
        </div>

        <div className="space-y-4 rounded bg-secondary/30 p-5">
          <div className="border-b border-border pb-3 text-center">
            <h3 className="text-sm font-semibold text-foreground">VEXTAGON SECURITY AUDIT</h3>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {mockScanResults.domain} | {new Date(mockScanResults.scanDate).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div>
            <p className="v-label mb-2">Vulnerabilidades</p>
            {mockScanResults.vulnerabilities.map((v) => (
              <div key={v.id} className="mb-1.5 rounded bg-secondary/40 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium text-foreground">{v.id}</span>
                  <span className={`font-mono text-[9px] font-medium uppercase ${severityClass[v.severity]}`}>{v.severity}</span>
                </div>
                <p className="text-[11px] text-foreground mt-0.5">{v.title}</p>
                <p className="text-[10px] text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="v-label mb-2">Portas Abertas</p>
            <div className="grid grid-cols-2 gap-1.5">
              {mockScanResults.ports.map((p) => (
                <div key={p.port} className="flex justify-between rounded bg-secondary/40 px-2.5 py-1.5">
                  <span className="font-mono text-[10px]">:{p.port} ({p.service})</span>
                  <span className={`font-mono text-[10px] font-medium uppercase ${severityClass[p.risk]}`}>{p.risk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3 text-center">
            <p className="font-mono text-[9px] text-muted-foreground">
              Vextagon | Alluzion Corporate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
