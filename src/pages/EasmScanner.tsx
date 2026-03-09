import { useState } from "react";
import { Search, Globe, Lock, Server, Bug, Cpu, Radar, AlertCircle, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVpsTool } from "@/hooks/useVpsTool";
import { Link } from "react-router-dom";

const severityClass: Record<string, string> = {
  critical: "severity-critical",
  high: "severity-high",
  medium: "severity-medium",
  low: "severity-low",
};

export default function EasmScanner() {
  const [domain, setDomain] = useState("");
  const { runTool, loading, error } = useVpsTool();
  const [nmapResult, setNmapResult] = useState<any>(null);
  const [niktoResult, setNiktoResult] = useState<any>(null);
  const [whoisResult, setWhoisResult] = useState<any>(null);
  const [digResult, setDigResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState("");

  const handleScan = async () => {
    if (!domain.trim()) return;
    setScanning(true);
    setNmapResult(null);
    setNiktoResult(null);
    setWhoisResult(null);
    setDigResult(null);

    // Run all tools in parallel
    setScanPhase("Executando nmap, dig, whois, nikto...");
    const [nmap, dig, whois, nikto] = await Promise.all([
      runTool("nmap", domain.trim(), { flags: "-sV -sC --top-ports 100" }),
      runTool("dig", domain.trim()),
      runTool("whois", domain.trim()),
      runTool("nikto", domain.trim()),
    ]);

    if (nmap) setNmapResult(nmap);
    if (dig) setDigResult(dig);
    if (whois) setWhoisResult(whois);
    if (nikto) setNiktoResult(nikto);

    setScanning(false);
    setScanPhase("");
  };

  const hasResults = nmapResult || niktoResult || whoisResult || digResult;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">EASM — Surface Monitor</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Ferramentas reais: Nmap · Nikto · Whois · Dig (via VPS Kali Linux)</p>
      </div>

      {/* Scan Input */}
      <div className="v-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="dominio.com"
              className="bg-secondary/50 pl-9 font-mono text-xs border-border"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
          </div>
          <Button onClick={handleScan} disabled={scanning} size="sm" className="text-xs font-medium">
            <Radar className="mr-1.5 h-3.5 w-3.5" />
            {scanning ? "Scanning..." : "Full Scan"}
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
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">{scanPhase}</p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">Executando em {domain} via VPS Kali</p>
        </div>
      )}

      {/* Results */}
      {!scanning && hasResults && (
        <Tabs defaultValue="nmap" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="nmap" className="text-xs">Nmap</TabsTrigger>
            <TabsTrigger value="nikto" className="text-xs">Nikto</TabsTrigger>
            <TabsTrigger value="dig" className="text-xs">Dig (DNS)</TabsTrigger>
            <TabsTrigger value="whois" className="text-xs">Whois</TabsTrigger>
          </TabsList>

          <TabsContent value="nmap">
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Nmap — Port Scan & Service Detection</p>
              </div>
              {nmapResult ? (
                <div className="space-y-3">
                  {/* Ports table */}
                  {nmapResult.ports && Array.isArray(nmapResult.ports) && nmapResult.ports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left v-label">Porta</th>
                            <th className="px-3 py-2 text-left v-label">Estado</th>
                            <th className="px-3 py-2 text-left v-label">Serviço</th>
                            <th className="px-3 py-2 text-left v-label">Versão</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nmapResult.ports.map((p: any, i: number) => (
                            <tr key={i} className="border-b border-border/40">
                              <td className="px-3 py-2 font-mono text-cyan">{p.port}</td>
                              <td className="px-3 py-2">
                                <span className={`font-mono text-[10px] ${p.state === "open" ? "text-success" : "text-muted-foreground"}`}>{p.state}</span>
                              </td>
                              <td className="px-3 py-2 font-mono text-foreground">{p.service || "—"}</td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{p.version || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <pre className="rounded bg-secondary/40 p-3 font-mono text-[10px] text-foreground/80 overflow-auto max-h-[400px] whitespace-pre-wrap">
                      {typeof nmapResult.output === "string" ? nmapResult.output : JSON.stringify(nmapResult.output || nmapResult, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum resultado</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="nikto">
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-3.5 w-3.5 text-destructive" />
                <p className="v-section-title">Nikto — Web Vulnerability Scanner</p>
              </div>
              {niktoResult ? (
                <div className="space-y-2">
                  {niktoResult.vulnerabilities && Array.isArray(niktoResult.vulnerabilities) ? (
                    niktoResult.vulnerabilities.map((v: any, i: number) => (
                      <div key={i} className="rounded bg-secondary/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{v.id || `Finding #${i + 1}`}</span>
                          <span className={`font-mono text-[10px] font-medium uppercase ${severityClass[v.severity] || "text-muted-foreground"}`}>
                            {v.severity || "info"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{v.description || v.message || JSON.stringify(v)}</p>
                      </div>
                    ))
                  ) : (
                    <pre className="rounded bg-secondary/40 p-3 font-mono text-[10px] text-foreground/80 overflow-auto max-h-[400px] whitespace-pre-wrap">
                      {typeof niktoResult.output === "string" ? niktoResult.output : JSON.stringify(niktoResult.output || niktoResult, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum resultado</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dig">
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Dig — DNS Records</p>
              </div>
              {digResult ? (
                <pre className="rounded bg-secondary/40 p-3 font-mono text-[10px] text-foreground/80 overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {typeof digResult.output === "string" ? digResult.output : JSON.stringify(digResult.output || digResult, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum resultado</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="whois">
            <div className="v-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Whois — Registro de Domínio</p>
              </div>
              {whoisResult ? (
                <pre className="rounded bg-secondary/40 p-3 font-mono text-[10px] text-foreground/80 overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {typeof whoisResult.output === "string" ? whoisResult.output : JSON.stringify(whoisResult.output || whoisResult, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum resultado</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!scanning && !hasResults && (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Radar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum scan executado</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Digite um domínio e execute um Full Scan real via Nmap, Nikto, Dig e Whois na sua VPS Kali Linux.
          </p>
          <Link to="/admin" className="mt-3 text-xs text-cyan hover:underline">
            Configurar VPS no Admin →
          </Link>
        </div>
      )}
    </div>
  );
}
