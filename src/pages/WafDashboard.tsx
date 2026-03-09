import { useState } from "react";
import { Shield, ShieldAlert, Globe, Radar, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVpsTool } from "@/hooks/useVpsTool";
import { Link } from "react-router-dom";

export default function WafDashboard() {
  const { runTool, loading, error } = useVpsTool();
  const [serverIp, setServerIp] = useState("");
  const [wafLogs, setWafLogs] = useState<any[] | null>(null);
  const [iptablesLogs, setIptablesLogs] = useState<any[] | null>(null);
  const [fail2banLogs, setFail2banLogs] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState<"waf" | "iptables" | "fail2ban">("iptables");

  const handleFetchLogs = async () => {
    if (!serverIp.trim()) return;

    const [iptResult, f2bResult] = await Promise.all([
      runTool("iptables_logs", serverIp),
      runTool("fail2ban_logs", serverIp),
    ]);

    if (iptResult) setIptablesLogs(iptResult.output || []);
    if (f2bResult) setFail2banLogs(f2bResult.output || []);
  };

  const currentLogs = activeTab === "iptables" ? iptablesLogs : activeTab === "fail2ban" ? fail2banLogs : wafLogs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">WAF & Defesa Ativa</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Logs reais de iptables, fail2ban e WAF do servidor</p>
      </div>

      {/* Input */}
      <div className="v-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              placeholder="IP ou hostname do servidor"
              className="bg-secondary/50 pl-9 font-mono text-xs border-border"
              onKeyDown={(e) => e.key === "Enter" && handleFetchLogs()}
            />
          </div>
          <Button onClick={handleFetchLogs} disabled={loading} size="sm" className="text-xs font-medium">
            <Radar className="mr-1.5 h-3.5 w-3.5" />
            {loading ? "Coletando..." : "Coletar Logs"}
          </Button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="v-card flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Coletando logs de {serverIp}...</p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">iptables · fail2ban · ModSecurity</p>
        </div>
      )}

      {/* Results */}
      {!loading && (iptablesLogs || fail2banLogs) && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1">
            {(["iptables", "fail2ban"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab ? "bg-primary/10 text-cyan border border-primary/30" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "iptables" ? "iptables" : "fail2ban"}
              </button>
            ))}
          </div>

          {/* Log Table */}
          <div className="v-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="v-section-title">
                {activeTab === "iptables" ? "Logs iptables" : "Logs fail2ban"}
                {currentLogs && <span className="text-muted-foreground ml-2">({currentLogs.length})</span>}
              </p>
            </div>
            {currentLogs && currentLogs.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left v-label">Timestamp</th>
                      <th className="px-4 py-2.5 text-left v-label">IP Origem</th>
                      <th className="px-4 py-2.5 text-left v-label">Ação</th>
                      <th className="px-4 py-2.5 text-left v-label">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log: any, i: number) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{log.timestamp || "—"}</td>
                        <td className="px-4 py-2.5 font-mono text-foreground">{log.source_ip || log.ip || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-mono text-[10px] font-medium ${
                            log.action === "DROP" || log.action === "Ban" ? "text-destructive" : "text-success"
                          }`}>
                            {log.action || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground text-[10px] max-w-[300px] truncate">
                          {log.details || log.raw || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-xs">
                Nenhum log encontrado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !iptablesLogs && !fail2banLogs && (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum log coletado</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Informe o IP do servidor e colete logs reais de iptables e fail2ban via VPS Kali Linux.
          </p>
          <Link to="/admin" className="mt-3 text-xs text-cyan hover:underline">
            Configurar VPS no Admin →
          </Link>
        </div>
      )}
    </div>
  );
}
