import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Code2, Search, Radar, ShieldAlert, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Technology {
  name: string;
  value: string;
  category: string;
  source: string;
}

interface Vulnerability {
  type: string;
  severity: string;
  description: string;
}

const severityClass: Record<string, string> = {
  critical: "severity-critical",
  high: "severity-high",
  medium: "severity-medium",
  low: "severity-low",
};

export default function TechStackProfiler() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [securityScore, setSecurityScore] = useState<number | null>(null);

  const handleScan = async () => {
    if (!domain.trim()) {
      toast({ title: "Erro", description: "Digite um domínio válido", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTechnologies([]);
    setVulnerabilities([]);
    setSecurityScore(null);
    try {
      const { data, error } = await supabase.functions.invoke("tech-stack-profiler", {
        body: { domain: domain.trim() },
      });
      if (error) throw error;
      setTechnologies(data.technologies || []);
      setVulnerabilities(data.vulnerabilities || []);
      setSecurityScore(data.security_score || 0);
      toast({ title: "Análise Concluída", description: `Score: ${data.security_score}/100` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? "text-success" : s >= 50 ? "text-warning" : "severity-critical";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Tech Stack Profiler</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Análise de tecnologias e vulnerabilidades via headers</p>
      </div>

      <div className="v-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://exemplo.com"
              className="bg-secondary/50 pl-9 font-mono text-xs border-border"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              disabled={loading}
            />
          </div>
          <Button onClick={handleScan} disabled={loading} size="sm" className="text-xs font-medium">
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            {loading ? "Analisando..." : "Analisar"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="v-card flex flex-col items-center py-12">
          <Radar className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Analisando stack de {domain}...</p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">Headers · Meta Tags · Frameworks (~5s)</p>
        </div>
      )}

      {!loading && securityScore !== null && (
        <div className="space-y-4">
          <div className="v-card p-5 text-center">
            <p className="v-label">Security Score</p>
            <p className={`font-mono text-5xl font-bold mt-1 ${scoreColor(securityScore)}`}>{securityScore}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{domain}</p>
            <div className="mt-3">
              {securityScore >= 80 ? (
                <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-destructive mx-auto" />
              )}
            </div>
          </div>

          {technologies.length > 0 && (
            <div className="v-card overflow-hidden">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <p className="v-section-title">Tecnologias ({technologies.length})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left v-label">Nome</th>
                      <th className="px-4 py-2.5 text-left v-label">Valor</th>
                      <th className="px-4 py-2.5 text-left v-label">Categoria</th>
                      <th className="px-4 py-2.5 text-left v-label">Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technologies.map((t, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{t.name}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{t.value}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className="font-mono text-[10px]">{t.category}</Badge></td>
                        <td className="px-4 py-2.5 text-muted-foreground">{t.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {vulnerabilities.length > 0 && (
            <div className="v-card overflow-hidden">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                <p className="v-section-title">Vulnerabilidades ({vulnerabilities.length})</p>
              </div>
              <div className="space-y-0">
                {vulnerabilities.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border/40 px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{v.type}</span>
                        <span className={`font-mono text-[10px] font-medium uppercase ${severityClass[v.severity] || ""}`}>{v.severity}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{v.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && securityScore === null && (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Code2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma análise executada</p>
          <p className="text-xs text-muted-foreground mt-1">Identifique frameworks, servidores e vulnerabilidades</p>
        </div>
      )}
    </div>
  );
}
