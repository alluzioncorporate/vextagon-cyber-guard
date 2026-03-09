import { useState, useEffect } from "react";
import { Brain, RefreshCw, AlertTriangle, Shield, Target, Clock, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockThreatFeeds = [
  { id: 1, type: "CVE", name: "CVE-2024-21762", severity: "critical", description: "Fortinet FortiOS RCE - Ativamente explorado", exploited: true, date: "2024-02-08" },
  { id: 2, type: "CVE", name: "CVE-2024-1709", severity: "critical", description: "ConnectWise ScreenConnect Auth Bypass", exploited: true, date: "2024-02-19" },
  { id: 3, type: "IOC", name: "45.227.254.8", severity: "high", description: "IP associado a ransomware LockBit 3.0", exploited: false, date: "2024-02-20" },
  { id: 4, type: "IOC", name: "evil-domain.ru", severity: "high", description: "C2 server para Cobalt Strike", exploited: false, date: "2024-02-18" },
  { id: 5, type: "Malware", name: "BlackCat/ALPHV", severity: "critical", description: "Nova variante de ransomware detectada", exploited: true, date: "2024-02-15" },
  { id: 6, type: "CVE", name: "CVE-2024-0204", severity: "high", description: "GoAnywhere MFT Auth Bypass", exploited: true, date: "2024-01-22" },
  { id: 7, type: "Campaign", name: "APT29", severity: "critical", description: "Campanha ativa contra setor financeiro", exploited: false, date: "2024-02-12" },
  { id: 8, type: "IOC", name: "hash:a1b2c3d4e5f6...", severity: "medium", description: "Trojan bancário Emotet sample", exploited: false, date: "2024-02-10" },
];

const typeColors: Record<string, string> = {
  CVE: "bg-destructive/10 text-destructive",
  IOC: "bg-warning/10 text-warning",
  Malware: "bg-purple-500/10 text-purple-400",
  Campaign: "bg-cyan/10 text-cyan",
};

export default function ThreatIntel() {
  const [threats, setThreats] = useState(mockThreatFeeds);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filter, setFilter] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLastUpdate(new Date());
    setLoading(false);
  };

  const filteredThreats = filter ? threats.filter(t => t.type === filter) : threats;
  const criticalCount = threats.filter(t => t.severity === "critical").length;
  const exploitedCount = threats.filter(t => t.exploited).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-destructive" />
            Threat Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Feed em tempo real de ameaças, CVEs e IOCs sendo explorados ativamente
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm" className="text-xs">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="v-card p-4">
          <span className="v-label">Total Ameaças</span>
          <p className="mt-2 v-stat text-foreground">{threats.length}</p>
        </div>
        <div className="v-card p-4">
          <span className="v-label">Críticas</span>
          <p className="mt-2 v-stat text-destructive">{criticalCount}</p>
        </div>
        <div className="v-card p-4">
          <span className="v-label">Ativamente Exploradas</span>
          <p className="mt-2 v-stat text-warning">{exploitedCount}</p>
        </div>
        <div className="v-card p-4">
          <span className="v-label">Última Atualização</span>
          <p className="mt-2 text-xs font-mono text-muted-foreground">{lastUpdate.toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          className="text-[10px]"
          onClick={() => setFilter(null)}
        >
          Todas
        </Button>
        {["CVE", "IOC", "Malware", "Campaign"].map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            className="text-[10px]"
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Threat Feed */}
      <div className="v-card overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <p className="v-section-title">Feed de Ameaças</p>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Atualiza a cada 15 min
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {filteredThreats.map((threat) => (
            <div key={threat.id} className="flex items-start gap-3 px-4 py-3">
              <div className={cn("rounded px-2 py-1 font-mono text-[9px] font-bold", typeColors[threat.type])}>
                {threat.type}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono font-medium text-foreground">{threat.name}</p>
                  {threat.exploited && (
                    <span className="flex items-center gap-0.5 font-mono text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                      <Target className="h-2.5 w-2.5" />
                      EXPLOITED
                    </span>
                  )}
                  <span className={cn(
                    "font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                    threat.severity === "critical" ? "bg-destructive/10 text-destructive" :
                    threat.severity === "high" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                  )}>
                    {threat.severity}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{threat.description}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{threat.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="v-card p-4">
        <p className="v-section-title mb-3">Fontes de Inteligência</p>
        <div className="flex flex-wrap gap-2">
          {["CISA KEV", "NVD", "AlienVault OTX", "Abuse.ch", "VirusTotal", "Shodan", "GreyNoise", "MITRE ATT&CK"].map((source) => (
            <span key={source} className="font-mono text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {source}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
