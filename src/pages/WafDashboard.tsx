import { motion } from "framer-motion";
import { Shield, ShieldAlert, Zap, Globe } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { mockWafData } from "@/data/mockData";

const severityColor: Record<string, string> = {
  critical: "text-destructive",
  high: "status-danger",
  medium: "status-warning",
  low: "text-muted-foreground",
};

const pieData = [
  { name: "SQL Injection", value: mockWafData.threats.sqlInjection, color: "#ef4444" },
  { name: "XSS", value: mockWafData.threats.xss, color: "#f59e0b" },
  { name: "DDoS", value: mockWafData.threats.ddos, color: "#00F0FF" },
  { name: "Other", value: mockWafData.threats.other, color: "#6b7280" },
];

export default function WafDashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-wide neon-text">WAF Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoramento de tráfego em tempo real</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Requisições", value: mockWafData.totalRequests.toLocaleString(), icon: Globe, color: "text-foreground" },
          { label: "Bloqueadas", value: mockWafData.blockedRequests.toLocaleString(), icon: ShieldAlert, color: "text-destructive" },
          { label: "SQL Injection", value: mockWafData.threats.sqlInjection.toLocaleString(), icon: Shield, color: "status-danger" },
          { label: "Taxa de Bloqueio", value: `${mockWafData.blockedPercentage}%`, icon: Zap, color: "neon-text" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`mt-2 font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Traffic Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-foreground">Tráfego (24h)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockWafData.trafficTimeline}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(185,100%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(185,100%,50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,15%)" />
              <XAxis dataKey="time" stroke="hsl(210,15%,40%)" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="hsl(210,15%,40%)" fontSize={11} fontFamily="JetBrains Mono" />
              <Tooltip
                contentStyle={{
                  background: "hsl(220,30%,8%)",
                  border: "1px solid hsl(185,100%,50%,0.2)",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(185,100%,50%)" fill="url(#totalGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="url(#blockedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-foreground">Ameaças por Tipo</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" stroke="none">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(220,30%,8%)",
                  border: "1px solid hsl(185,100%,50%,0.2)",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono text-foreground">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Threats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="border-b border-border p-4">
          <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">Ameaças Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">IP</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Path</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Severidade</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {mockWafData.recentThreats.map((t) => (
                <tr key={t.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">{t.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.ip}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[200px] truncate">{t.path}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-semibold uppercase ${severityColor[t.severity]}`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
