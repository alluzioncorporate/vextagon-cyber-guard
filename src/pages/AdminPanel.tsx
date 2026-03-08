import { Users, Globe, DollarSign, Crown } from "lucide-react";
import { mockAdminUsers } from "@/data/mockData";

export default function AdminPanel() {
  const totalRevenue = mockAdminUsers.reduce((a, u) => a + u.monthlyRevenue, 0);
  const premiumCount = mockAdminUsers.filter((u) => u.tier === "premium").length;
  const totalDomains = mockAdminUsers.reduce((a, u) => a + u.domains, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Admin Panel</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Usuários, domínios e faturamento</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Usuários", value: mockAdminUsers.length, icon: Users },
          { label: "Premium", value: premiumCount, icon: Crown, gold: true },
          { label: "Domínios", value: totalDomains, icon: Globe, cyan: true },
          { label: "MRR", value: `R$ ${totalRevenue}`, icon: DollarSign, success: true },
        ].map((s) => (
          <div key={s.label} className="v-card p-4">
            <div className="flex items-center justify-between">
              <span className="v-label">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.gold ? "text-gold" : s.cyan ? "text-cyan" : s.success ? "text-success" : "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 v-stat ${s.gold ? "text-gold" : s.cyan ? "text-cyan" : s.success ? "text-success" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="v-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="v-section-title">Todos os Usuários</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left v-label">Nome</th>
                <th className="px-4 py-2.5 text-left v-label">E-mail</th>
                <th className="px-4 py-2.5 text-left v-label">Plano</th>
                <th className="px-4 py-2.5 text-left v-label">Domínios</th>
                <th className="px-4 py-2.5 text-left v-label">Último Acesso</th>
                <th className="px-4 py-2.5 text-left v-label">Receita</th>
              </tr>
            </thead>
            <tbody>
              {mockAdminUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2.5 text-foreground">{user.name}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-2.5">
                    {user.tier === "premium" ? (
                      <span className="font-mono text-[10px] font-medium text-gold uppercase">Premium</span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{user.domains}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{user.lastActive}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">
                    {user.monthlyRevenue > 0 ? `R$ ${user.monthlyRevenue}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
