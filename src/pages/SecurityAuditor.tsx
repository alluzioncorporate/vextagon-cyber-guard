import { motion } from "framer-motion";
import { FileText, Download, Shield, AlertTriangle, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockScanResults } from "@/data/mockData";

export default function SecurityAuditor() {
  const handleGeneratePdf = () => {
    // In production, this would generate a real PDF
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

--- Open Ports ---
${mockScanResults.ports.map((p) => `Port ${p.port} (${p.service}) - Risk: ${p.risk}`).join("\n")}

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
  const highCount = mockScanResults.vulnerabilities.filter((v) => v.severity === "high").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide neon-text">Security Auditor</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerador automático de relatórios de auditoria</p>
        </div>
        <Button onClick={handleGeneratePdf} className="font-display text-xs tracking-wider">
          <Download className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Domínio", value: mockScanResults.domain, icon: Globe, color: "text-foreground" },
          { label: "Score", value: `${mockScanResults.score}/100`, icon: Shield, color: "neon-text" },
          { label: "Críticas", value: criticalCount.toString(), icon: AlertTriangle, color: "text-destructive" },
          { label: "SSL Grade", value: mockScanResults.ssl.grade, icon: Lock, color: "status-safe" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card-hover p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`mt-2 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Full Report Preview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-display text-sm font-semibold tracking-wide">Preview do Relatório</h2>
        </div>

        <div className="space-y-6 rounded-lg bg-secondary/20 p-6">
          {/* Header */}
          <div className="border-b border-border pb-4 text-center">
            <h3 className="font-display text-lg font-bold neon-text">VEXTAGON SECURITY AUDIT</h3>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {mockScanResults.domain} | {new Date(mockScanResults.scanDate).toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-primary mb-2">Vulnerabilidades Encontradas</h4>
              {mockScanResults.vulnerabilities.map((v) => (
                <div key={v.id} className="mb-2 rounded bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">{v.id}</span>
                    <span className={`font-mono text-[10px] font-bold uppercase ${
                      v.severity === "critical" ? "text-destructive" :
                      v.severity === "high" ? "status-danger" :
                      v.severity === "medium" ? "status-warning" : "text-muted-foreground"
                    }`}>{v.severity}</span>
                  </div>
                  <p className="text-xs text-foreground mt-1">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Afetado: {v.affected}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-primary mb-2">Portas Abertas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mockScanResults.ports.map((p) => (
                  <div key={p.port} className="flex justify-between rounded bg-secondary/30 px-3 py-2">
                    <span className="font-mono text-xs">:{p.port} ({p.service})</span>
                    <span className={`font-mono text-xs font-bold uppercase ${
                      p.risk === "critical" ? "text-destructive" :
                      p.risk === "high" ? "status-danger" :
                      p.risk === "medium" ? "status-warning" : "text-muted-foreground"
                    }`}>{p.risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-4 text-center">
            <p className="font-mono text-[10px] text-muted-foreground">
              Relatório gerado por <span className="gold-text font-semibold">Vextagon</span> | Alluzion Corporate
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
