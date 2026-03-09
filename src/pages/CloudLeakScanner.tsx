import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cloud, Search, Shield, AlertTriangle, Radar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BucketResult {
  bucket_name: string;
  url: string;
  exists: boolean;
  is_public: boolean;
  status: string;
  severity: string;
  checked_at: string;
}

export default function CloudLeakScanner() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BucketResult[]>([]);
  const [stats, setStats] = useState({ scanned: 0, found: 0, public: 0 });

  const handleScan = async () => {
    if (!domain.trim()) {
      toast({ title: "Erro", description: "Digite um domínio válido", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("cloud-leak-scanner", {
        body: { domain: domain.trim() },
      });
      if (error) throw error;
      setResults(data.results || []);
      setStats({ scanned: data.scanned_patterns || 0, found: data.found_buckets || 0, public: data.public_buckets || 0 });
      if (data.public_buckets > 0) {
        toast({ title: "⚠️ Buckets Públicos!", description: `${data.public_buckets} bucket(s) exposto(s)`, variant: "destructive" });
      } else {
        toast({ title: "Scan Concluído", description: `${data.found_buckets} bucket(s), nenhum público` });
      }
    } catch (error: any) {
      toast({ title: "Erro no Scan", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const severityClass: Record<string, string> = {
    critical: "severity-critical",
    high: "severity-high",
    medium: "severity-medium",
    low: "severity-low",
    info: "text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Cloud Leak Scanner</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Verificação de buckets S3 públicos e exposição de dados</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: "Padrões Verificados", value: stats.scanned, icon: Cloud },
          { label: "Buckets Encontrados", value: stats.found, icon: Shield, cyan: true },
          { label: "Buckets Públicos", value: stats.public, icon: AlertTriangle, danger: true },
        ].map((s) => (
          <div key={s.label} className="v-card p-4">
            <div className="flex items-center justify-between">
              <span className="v-label">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.danger ? "text-destructive" : s.cyan ? "text-cyan" : "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 v-stat ${s.danger ? "text-destructive" : s.cyan ? "text-cyan" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
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
          <p className="mt-3 font-mono text-xs text-muted-foreground">Verificando buckets para {domain}...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="v-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="v-section-title">Buckets Encontrados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left v-label">Bucket</th>
                  <th className="px-4 py-2.5 text-left v-label">Status</th>
                  <th className="px-4 py-2.5 text-left v-label">Severidade</th>
                  <th className="px-4 py-2.5 text-left v-label">URL</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-foreground">{r.bucket_name}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {r.is_public ? <AlertTriangle className="h-3 w-3 text-destructive" /> : <Shield className="h-3 w-3 text-success" />}
                        <span className="font-mono text-[11px]">{r.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-mono text-[10px] font-medium uppercase ${severityClass[r.severity] || ""}`}>{r.severity}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-cyan hover:underline">
                        {r.url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !domain && (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Cloud className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum scan executado</p>
          <p className="text-xs text-muted-foreground mt-1">Verifique buckets S3 expostos para qualquer domínio</p>
        </div>
      )}
    </div>
  );
}
