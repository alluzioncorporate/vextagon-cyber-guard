import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Search, Lock, Globe, Server, Bug, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockScanResults } from "@/data/mockData";

const riskColor: Record<string, string> = {
  critical: "text-destructive",
  high: "status-danger",
  medium: "status-warning",
  low: "text-muted-foreground",
};

export default function DeepScan() {
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<typeof mockScanResults | null>(null);

  const handleScan = () => {
    if (!domain.trim()) return;
    setScanning(true);
    setResults(null);
    setTimeout(() => {
      setScanning(false);
      setResults({ ...mockScanResults, domain: domain.trim() });
    }, 3000);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "neon-text" : score >= 60 ? "status-warning" : "status-danger";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-wide neon-text">Deep Scan Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise completa de domínio: DNS, SSL, Portas e Vulnerabilidades</p>
      </motion.div>

      {/* Scan Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Insira o domínio (ex: alluzion.com)"
              className="bg-input/50 pl-10 font-mono text-sm border-border focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
          </div>
          <Button onClick={handleScan} disabled={scanning} className="font-display text-xs tracking-wider">
            <Radar className="mr-2 h-4 w-4" />
            {scanning ? "Escaneando..." : "Iniciar Scan"}
          </Button>
        </div>
      </motion.div>

      {/* Scanning Animation */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card flex flex-col items-center justify-center p-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Radar className="h-16 w-16 text-primary" />
            </motion.div>
            <p className="mt-4 font-mono text-sm text-primary animate-pulse">Analisando {domain}...</p>
            <div className="mt-3 space-y-1 text-center font-mono text-xs text-muted-foreground">
              <p>→ Resolvendo DNS...</p>
              <p>→ Verificando certificado SSL...</p>
              <p>→ Escaneando portas abertas...</p>
              <p>→ Detectando vulnerabilidades...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && !scanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score */}
            <div className="glass-card p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Security Score</p>
              <p className={`font-display text-6xl font-bold ${scoreColor(results.score)}`}>{results.score}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{results.domain}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* DNS */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold tracking-wide">DNS Records</h3>
                </div>
                <div className="space-y-2">
                  {results.dns.records.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-secondary/30 px-3 py-2">
                      <span className="font-mono text-xs font-semibold text-primary">{r.type}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SSL */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold tracking-wide">SSL Certificate</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Status", value: results.ssl.valid ? "Válido" : "Inválido", className: results.ssl.valid ? "status-safe" : "status-danger" },
                    { label: "Emissor", value: results.ssl.issuer },
                    { label: "Protocolo", value: results.ssl.protocol },
                    { label: "Grade", value: results.ssl.grade, className: "neon-text font-bold" },
                    { label: "Expira", value: results.ssl.expiresAt },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between rounded bg-secondary/30 px-3 py-2">
                      <span className="font-mono text-xs text-muted-foreground">{item.label}</span>
                      <span className={`font-mono text-xs ${item.className || "text-foreground"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ports */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold tracking-wide">Portas Abertas</h3>
                </div>
                <div className="space-y-2">
                  {results.ports.map((p) => (
                    <div key={p.port} className="flex items-center justify-between rounded bg-secondary/30 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-foreground">:{p.port}</span>
                        <span className="font-mono text-xs text-muted-foreground">{p.service}</span>
                      </div>
                      <span className={`font-mono text-xs font-semibold uppercase ${riskColor[p.risk]}`}>{p.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vulnerabilities */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="h-4 w-4 text-destructive" />
                  <h3 className="font-display text-sm font-semibold tracking-wide">Vulnerabilidades</h3>
                </div>
                <div className="space-y-3">
                  {results.vulnerabilities.map((v) => (
                    <div key={v.id} className="rounded bg-secondary/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-primary">{v.id}</span>
                        <span className={`font-mono text-[10px] font-bold uppercase ${riskColor[v.severity]}`}>{v.severity}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-foreground">{v.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
