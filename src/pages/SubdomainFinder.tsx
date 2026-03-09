import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Radar, Search, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Subdomain {
  subdomain: string;
  discovered_at: string;
  source: string;
}

export default function SubdomainFinder() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Subdomain[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const handleScan = async () => {
    if (!domain.trim()) {
      toast({ title: "Erro", description: "Digite um domínio válido", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("subdomain-finder", {
        body: { domain: domain.trim() },
      });
      if (error) throw error;
      setResults(data.subdomains || []);
      setTotalCount(data.count || 0);
      toast({ title: "Scan Concluído", description: `${data.count} subdomínios encontrados` });
    } catch (error: any) {
      toast({ title: "Erro no Scan", description: error.message || "Falha ao buscar subdomínios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Subdomain Finder</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Descoberta via Certificate Transparency (crt.sh)</p>
      </div>

      <div className="v-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="exemplo.com"
              className="bg-secondary/50 pl-9 font-mono text-xs border-border"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              disabled={loading}
            />
          </div>
          <Button onClick={handleScan} disabled={loading} size="sm" className="text-xs font-medium">
            <Radar className="mr-1.5 h-3.5 w-3.5" />
            {loading ? "Scanning..." : "Scan"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="v-card flex flex-col items-center py-12">
          <Radar className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Buscando subdomínios de {domain}...</p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">Certificate Transparency · crt.sh (~5–10s)</p>
        </div>
      )}

      {!loading && totalCount > 0 && (
        <div className="space-y-4">
          <div className="v-card p-4 text-center">
            <p className="v-label">Subdomínios Encontrados</p>
            <p className="font-mono text-4xl font-bold text-cyan mt-1">{totalCount}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{domain}</p>
          </div>

          <div className="v-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="v-section-title">Resultados</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left v-label">Subdomínio</th>
                    <th className="px-4 py-2.5 text-left v-label">Fonte</th>
                    <th className="px-4 py-2.5 text-left v-label">Descoberto</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-foreground">{r.subdomain}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="font-mono text-[10px]">{r.source}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {new Date(r.discovered_at).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !domain && (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Digite um domínio para iniciar</p>
          <p className="text-xs text-muted-foreground mt-1">Descubra subdomínios via Certificate Transparency</p>
        </div>
      )}
    </div>
  );
}
