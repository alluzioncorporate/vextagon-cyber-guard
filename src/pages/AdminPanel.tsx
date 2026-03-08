import { motion } from "framer-motion";
import { Users, Globe, DollarSign, Shield, Crown } from "lucide-react";
import { mockAdminUsers } from "@/data/mockData";

export default function AdminPanel() {
  const totalRevenue = mockAdminUsers.reduce((a, u) => a + u.monthlyRevenue, 0);
  const premiumCount = mockAdminUsers.filter((u) => u.tier === "premium").length;
  const totalDomains = mockAdminUsers.reduce((a, u) => a + u.domains, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-wide gold-text">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral de usuários, domínios e faturamento</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Usuários", value: mockAdminUsers.length, icon: Users, color: "text-foreground" },
          { label: "Premium", value: premiumCount, icon: Crown, color: "gold-text" },
          { label: "Domínios", value: totalDomains, icon: Globe, color: "neon-text" },
          { label: "MRR", value: `R$ ${totalRevenue}`, icon: DollarSign, color: "status-safe" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card-hover p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`mt-2 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">Todos os Usuários</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Plano</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Domínios</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Último Acesso</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Receita</th>
              </tr>
            </thead>
            <tbody>
              {mockAdminUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.tier === "premium" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase gold-text">
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{user.domains}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.lastActive}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {user.monthlyRevenue > 0 ? `R$ ${user.monthlyRevenue}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
