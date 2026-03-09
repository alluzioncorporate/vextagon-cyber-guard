import { useState } from "react";
import { Ghost, Search, Loader2, AlertTriangle, Mail, Key, FileText, Globe, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVpsTool } from "@/hooks/useVpsTool";
import { cn } from "@/lib/utils";

const mockDarkWebFindings = [
  { type: "credential", email: "admin@empresa.com", source: "BreachForums", date: "2024-02-15", severity: "critical" },
  { type: "credential", email: "dev@empresa.com", source: "RaidForums Archive", date: "2024-01-20", severity: "high" },
  { type: "document", name: "contrato_confidencial.pdf", source: "Telegram Leak", date: "2024-02-01", severity: "critical" },
  { type: "mention", context: "Empresa mencionada em discussão de alvos", source: "XSS.is", date: "2024-02-10", severity: "medium" },
];

export default function DarkWebMonitor() {
  const [domain, setDomain] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<typeof mockDarkWebFindings | null>(null);

  const handleSearch = async () => {
    if (!domain.trim()) return;
    setSearching(true);
    // Simulate dark web search
    await new Promise((r) => setTimeout(r, 3000));
    setResults(mockDarkWebFindings);
    setSearching(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "credential": return Key;
      case "document": return FileText;
      case "mention": return Globe;
      default: return Eye;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground flex items-center gap-2">
          <Ghost className="h-5 w-5 text-destructive" />
          Dark Web Monitor
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monitore vazamentos de dados da sua empresa em fóruns, marketplaces e canais da dark web
        </p>
      </div>

      {/* Search */}
      <div className="v-card p-4">
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="empresa.com ou email@empresa.com"
            className="bg-secondary/50 font-mono text-xs border-border flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching || !domain.trim()} className="bg-destructive hover:bg-destructive/90 text-xs">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
            Buscar na Dark Web
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          🕵️ Buscamos em: BreachForums, XSS.is, Exploit.in, RaidForums Archive, Telegram Leaks, Onion Sites
        </p>
      </div>

      {/* Stats */}
      {results && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="v-card p-4">
            <span className="v-label">Total Encontrado</span>
            <p className="mt-2 v-stat text-destructive">{results.length}</p>
          </div>
          <div className="v-card p-4">
            <span className="v-label">Credenciais</span>
            <p className="mt-2 v-stat text-foreground">{results.filter(r => r.type === "credential").length}</p>
          </div>
          <div className="v-card p-4">
            <span className="v-label">Documentos</span>
            <p className="mt-2 v-stat text-foreground">{results.filter(r => r.type === "document").length}</p>
          </div>
          <div className="v-card p-4">
            <span className="v-label">Menções</span>
            <p className="mt-2 v-stat text-foreground">{results.filter(r => r.type === "mention").length}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="v-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="v-section-title">Vazamentos Encontrados</p>
          </div>
          <div className="divide-y divide-border/40">
            {results.map((finding, i) => {
              const Icon = getIcon(finding.type);
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className={cn(
                    "rounded p-1.5 mt-0.5",
                    finding.severity === "critical" ? "bg-destructive/10" :
                    finding.severity === "high" ? "bg-warning/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-3.5 w-3.5",
                      finding.severity === "critical" ? "text-destructive" :
                      finding.severity === "high" ? "text-warning" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground">
                        {finding.type === "credential" && finding.email}
                        {finding.type === "document" && finding.name}
                        {finding.type === "mention" && "Menção encontrada"}
                      </p>
                      <span className={cn(
                        "font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                        finding.severity === "critical" ? "bg-destructive/10 text-destructive" :
                        finding.severity === "high" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                      )}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {finding.type === "mention" ? finding.context : `Fonte: ${finding.source}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Detectado em {finding.date}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] text-destructive hover:text-destructive">
                    Ver detalhes
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!results && !searching && (
        <div className="v-card p-8 text-center">
          <Ghost className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-xs text-muted-foreground">
            Digite um domínio ou email para buscar vazamentos na dark web
          </p>
        </div>
      )}
    </div>
  );
}
