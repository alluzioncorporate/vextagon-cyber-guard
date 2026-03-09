import { AlertTriangle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { mockLeakedCredentials } from "@/data/mockData";
import { useState } from "react";

export default function DataLeaks() {
  const [showPasswords, setShowPasswords] = useState(false);
  const leaked = mockLeakedCredentials.filter((c) => c.status === "leaked").length;
  const safe = mockLeakedCredentials.filter((c) => c.status === "protected").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Data Leak Monitor</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Monitoramento de credenciais vazadas</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: "Total Monitorado", value: mockLeakedCredentials.length },
          { label: "Vazados", value: leaked, danger: true },
          { label: "Protegidos", value: safe, success: true },
        ].map((s) => (
          <div key={s.label} className="v-card p-4">
            <span className="v-label">{s.label}</span>
            <p className={`mt-2 v-stat ${s.danger ? "severity-critical" : s.success ? "text-success" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="v-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="v-section-title">Credenciais</p>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPasswords ? "Ocultar" : "Mostrar Hashes"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left v-label">Status</th>
                <th className="px-4 py-2.5 text-left v-label">E-mail</th>
                <th className="px-4 py-2.5 text-left v-label">Fonte</th>
                <th className="px-4 py-2.5 text-left v-label">Data</th>
                {showPasswords && <th className="px-4 py-2.5 text-left v-label">Hash</th>}
              </tr>
            </thead>
            <tbody>
              {mockLeakedCredentials.map((cred) => (
                <tr key={cred.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2.5">
                    {cred.status === "leaked" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium severity-critical">
                        <AlertTriangle className="h-3 w-3" /> VAZADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-success">
                        <ShieldCheck className="h-3 w-3" /> OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{cred.email}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{cred.source}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{cred.date}</td>
                  {showPasswords && <td className="px-4 py-2.5 font-mono text-muted-foreground">{cred.passwordHash}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
