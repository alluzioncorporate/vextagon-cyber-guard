import { AlertTriangle, ShieldCheck, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { useVpsTool } from "@/hooks/useVpsTool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DataLeaks() {
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState<any>(null);
  const { runTool, loading } = useVpsTool();

  const handleScan = async () => {
    if (!domain.trim()) return;
    const data = await runTool("theharvester", domain.trim());
    if (data?.output) setResults(data.output);
  };

  const emails = results?.emails || [];
  const hosts = results?.hosts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">OSINT & Data Leaks</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Descoberta de emails, hosts e informações expostas via theHarvester</p>
      </div>

      <div className="v-card p-4">
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="dominio.com"
            className="bg-secondary/50 font-mono text-xs border-border flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
          <Button onClick={handleScan} disabled={loading || !domain.trim()} size="sm" className="text-xs">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
            Buscar OSINT
          </Button>
        </div>
      </div>

      {results && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="v-card p-4">
              <span className="v-label">Emails encontrados</span>
              <p className="mt-2 v-stat text-foreground">{emails.length}</p>
            </div>
            <div className="v-card p-4">
              <span className="v-label">Hosts encontrados</span>
              <p className="mt-2 v-stat text-foreground">{hosts.length}</p>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="v-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <p className="v-section-title">Emails Expostos</p>
              </div>
              <div className="divide-y divide-border/40">
                {emails.map((email: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                    <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                    <span className="font-mono text-xs text-foreground">{email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hosts.length > 0 && (
            <div className="v-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <p className="v-section-title">Hosts Descobertos</p>
              </div>
              <div className="divide-y divide-border/40">
                {hosts.map((host: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                    <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs text-foreground">{host}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emails.length === 0 && hosts.length === 0 && (
            <div className="v-card p-8 text-center">
              <p className="text-xs text-muted-foreground">Nenhum resultado encontrado para este domínio.</p>
            </div>
          )}
        </>
      )}

      {!results && !loading && (
        <div className="v-card p-8 text-center">
          <Search className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Digite um domínio para buscar informações OSINT via theHarvester</p>
        </div>
      )}
    </div>
  );
}
