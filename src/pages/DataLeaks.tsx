import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { mockLeakedCredentials } from "@/data/mockData";
import { useState } from "react";

export default function DataLeaks() {
  const [showPasswords, setShowPasswords] = useState(false);
  const leaked = mockLeakedCredentials.filter((c) => c.status === "leaked").length;
  const safe = mockLeakedCredentials.filter((c) => c.status === "protected").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-wide neon-text">Data Leak Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoramento de credenciais vazadas</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Monitorado</p>
          <p className="mt-2 font-mono text-3xl font-bold text-foreground">{mockLeakedCredentials.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-hover p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Vazados</p>
          <p className="mt-2 font-mono text-3xl font-bold status-danger">{leaked}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-hover p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Protegidos</p>
          <p className="mt-2 font-mono text-3xl font-bold status-safe">{safe}</p>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">Credenciais</h2>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPasswords ? "Ocultar Hashes" : "Mostrar Hashes"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Fonte</th>
                <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</th>
                {showPasswords && <th className="px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Hash</th>}
              </tr>
            </thead>
            <tbody>
              {mockLeakedCredentials.map((cred, i) => (
                <motion.tr
                  key={cred.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    {cred.status === "leaked" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase status-danger">
                        <AlertTriangle className="h-3 w-3" /> Vazado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase status-safe">
                        <ShieldCheck className="h-3 w-3" /> Protegido
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{cred.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cred.source}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cred.date}</td>
                  {showPasswords && (
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cred.passwordHash}</td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
