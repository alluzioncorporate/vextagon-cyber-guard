import { useState } from "react";
import { Shield, ShieldAlert, Zap, Globe, ToggleLeft, ToggleRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockWafData } from "@/data/mockData";
import { Switch } from "@/components/ui/switch";

const severityClass: Record<string, string> = {
  critical: "severity-critical",
  high: "severity-high",
  medium: "severity-medium",
  low: "severity-low",
};

export default function WafDashboard() {
  const [geoBlock, setGeoBlock] = useState(mockWafData.geoBlocking.enabled);
  const [antiDdos, setAntiDdos] = useState(mockWafData.antiDdos);
  const [rateLimit, setRateLimit] = useState(mockWafData.rateLimiting.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">WAF & Defesa Ativa</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Monitoramento de tráfego e proteção em tempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Requisições", value: mockWafData.totalRequests.toLocaleString(), icon: Globe },
          { label: "Bloqueadas", value: mockWafData.blockedRequests.toLocaleString(), icon: ShieldAlert, accent: true },
          { label: "SQL Injection", value: mockWafData.threats.sqlInjection.toLocaleString(), icon: Shield },
          { label: "Taxa Bloqueio", value: `${mockWafData.blockedPercentage}%`, icon: Zap, cyan: true },
        ].map((stat) => (
          <div key={stat.label} className="v-card p-4">
            <div className="flex items-center justify-between">
              <span className="v-label">{stat.label}</span>
              <stat.icon className={`h-3.5 w-3.5 ${stat.accent ? "text-destructive" : stat.cyan ? "text-cyan" : "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 v-stat ${stat.accent ? "text-destructive" : stat.cyan ? "text-cyan" : "text-foreground"}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="v-card p-4">
        <p className="v-section-title mb-3">Controles de Defesa</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">Geo-Blocking</p>
              <p className="text-[10px] text-muted-foreground">CN, RU, KP bloqueados</p>
            </div>
            <Switch checked={geoBlock} onCheckedChange={setGeoBlock} />
          </div>
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">Anti-DDoS</p>
              <p className="text-[10px] text-muted-foreground">Mitigação automática</p>
            </div>
            <Switch checked={antiDdos} onCheckedChange={setAntiDdos} />
          </div>
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">Rate Limiting</p>
              <p className="text-[10px] text-muted-foreground">120 req/min</p>
            </div>
            <Switch checked={rateLimit} onCheckedChange={setRateLimit} />
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="v-card p-4">
        <p className="v-section-title mb-4">Tráfego (24h)</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={mockWafData.trafficTimeline}>
            <defs>
              <linearGradient id="totalG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(245,80%,62%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(245,80%,62%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blockedG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,72%,51%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(0,72%,51%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,20%,13%)" />
            <XAxis dataKey="time" stroke="hsl(220,12%,38%)" fontSize={10} fontFamily="JetBrains Mono" />
            <YAxis stroke="hsl(220,12%,38%)" fontSize={10} fontFamily="JetBrains Mono" />
            <Tooltip
              contentStyle={{
                background: "hsl(230,40%,7%)",
                border: "1px solid hsl(230,20%,16%)",
                borderRadius: "6px",
                fontFamily: "JetBrains Mono",
                fontSize: 11,
              }}
            />
            <Area type="monotone" dataKey="total" stroke="hsl(185,100%,50%)" fill="url(#totalG)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="blocked" stroke="hsl(0,72%,51%)" fill="url(#blockedG)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Invasion Logs */}
      <div className="v-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="v-section-title">Logs de Invasão</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left v-label">Tipo</th>
                <th className="px-4 py-2.5 text-left v-label">IP</th>
                <th className="px-4 py-2.5 text-left v-label">Payload</th>
                <th className="px-4 py-2.5 text-left v-label">Ação</th>
                <th className="px-4 py-2.5 text-left v-label">Severidade</th>
                <th className="px-4 py-2.5 text-left v-label">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {mockWafData.invasionLogs.map((log) => (
                <tr key={log.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-foreground">{log.type}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{log.ip}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground max-w-[200px] truncate">{log.payload}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[10px] font-medium text-cyan">{log.action}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono text-[10px] font-medium uppercase ${severityClass[log.severity]}`}>{log.severity}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
