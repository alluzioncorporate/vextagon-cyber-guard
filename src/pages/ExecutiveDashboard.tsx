import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, Server, Swords, Database, ArrowUpRight, Activity, Clock, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  Icon: any;
  accent: "cyan" | "indigo" | "gold" | "destructive";
  to?: string;
};

const accentMap: Record<Kpi["accent"], string> = {
  cyan: "text-cyan",
  indigo: "text-indigo",
  gold: "text-gold",
  destructive: "text-destructive",
};

const accentGlow: Record<Kpi["accent"], string> = {
  cyan: "shadow-[0_0_24px_-6px_hsl(188_100%_56%/0.45)]",
  indigo: "shadow-[0_0_24px_-6px_hsl(230_85%_68%/0.45)]",
  gold: "shadow-[0_0_24px_-6px_hsl(46_100%_62%/0.40)]",
  destructive: "shadow-[0_0_24px_-6px_hsl(0_75%_58%/0.45)]",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const content = (
    <div className={cn("v-card-interactive group p-6", accentGlow[kpi.accent])}>
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl p-2 bg-white/[0.04] border border-white/10", accentMap[kpi.accent])}>
          <kpi.Icon strokeWidth={1.6} className="h-4 w-4" />
        </div>
        {kpi.to && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        )}
      </div>
      <div className="mt-6">
        <p className="v-label">{kpi.label}</p>
        <p className={cn("font-mono text-3xl font-semibold tracking-tight mt-1", accentMap[kpi.accent])}>
          {kpi.value}
        </p>
        {kpi.hint && <p className="text-[11px] text-muted-foreground mt-1">{kpi.hint}</p>}
      </div>
      {kpi.trend && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          {kpi.trend}
        </div>
      )}
    </div>
  );
  return kpi.to ? <Link to={kpi.to}>{content}</Link> : content;
}

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const [drawerLog, setDrawerLog] = useState<any | null>(null);

  const { data: servers } = useQuery({
    queryKey: ["exec.servers", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("server_monitoring").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: alerts } = useQuery({
    queryKey: ["exec.alerts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("security_alerts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: leaks } = useQuery({
    queryKey: ["exec.leaks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("leaked_data").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const onlineServers = (servers ?? []).filter(
    (s: any) => s.last_seen && Date.now() - new Date(s.last_seen).getTime() < 30 * 60 * 1000
  ).length;
  const totalServers = (servers ?? []).length;
  const blockedThreats = (alerts ?? []).filter((a: any) => ["high", "critical"].includes(a.severity)).length;
  const leakCount = (leaks ?? []).length;

  // Security Score: simple heuristic
  const score = Math.max(
    0,
    Math.min(100, 100 - blockedThreats * 3 - leakCount * 2 - (totalServers - onlineServers) * 5)
  );

  const kpis: Kpi[] = [
    {
      label: "Security Score",
      value: `${score}`,
      hint: score >= 80 ? "Postura saudável" : score >= 50 ? "Atenção recomendada" : "Risco elevado",
      Icon: ShieldCheck,
      accent: score >= 80 ? "cyan" : score >= 50 ? "gold" : "destructive",
    },
    {
      label: "Servidores Online",
      value: `${onlineServers}/${totalServers}`,
      hint: totalServers === 0 ? "Nenhum agente instalado" : "Última leitura ≤ 30 min",
      Icon: Server,
      accent: "indigo",
      to: "/dashboard/servers",
    },
    {
      label: "Ameaças Bloqueadas",
      value: blockedThreats,
      hint: "Alertas críticos / altos",
      Icon: Swords,
      accent: "gold",
      to: "/alerts",
    },
    {
      label: "Vazamentos Detectados",
      value: leakCount,
      hint: "Credenciais e dados expostos",
      Icon: Database,
      accent: "destructive",
      to: "/data-leaks",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-1">
        <p className="v-label">Resumo Executivo</p>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Bom retorno, <span className="text-cyan">{user?.user_metadata?.full_name?.split(" ")[0] || "Operador"}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Painel consolidado da sua superfície de defesa. Detalhes técnicos disponíveis nas abas abaixo.
        </p>
      </header>

      {/* KPI grid */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </section>

      {/* Detail tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/[0.03] border border-white/10 backdrop-blur-glass p-1 h-auto">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white/[0.06] data-[state=active]:text-cyan">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs data-[state=active]:bg-white/[0.06] data-[state=active]:text-cyan">
            Logs de Ataque
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-xs data-[state=active]:bg-white/[0.06] data-[state=active]:text-cyan">
            Agentes
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="v-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="v-label">Atividade recente</p>
                  <p className="text-sm text-foreground mt-0.5">Últimos eventos de segurança</p>
                </div>
                <Link to="/alerts" className="text-[11px] text-cyan hover:underline flex items-center gap-1">
                  Ver tudo <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {(alerts ?? []).slice(0, 5).length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  Nenhum evento registrado. O sistema está silencioso.
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {(alerts ?? []).slice(0, 5).map((a: any) => (
                    <li key={a.id}>
                      <button
                        onClick={() => setDrawerLog(a)}
                        className="w-full flex items-center gap-3 py-3 text-left hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            a.severity === "critical" || a.severity === "high"
                              ? "bg-destructive shadow-[0_0_8px_hsl(0_75%_58%/0.7)]"
                              : a.severity === "medium"
                              ? "bg-gold shadow-[0_0_8px_hsl(46_100%_62%/0.6)]"
                              : "bg-cyan shadow-[0_0_8px_hsl(188_100%_56%/0.6)]"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{a.message || a.title || "Evento"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {a.alert_type || "alert"} ·{" "}
                            {a.created_at &&
                              formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="v-card p-6">
              <p className="v-label">Status do Domo</p>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Domo 1 — Reconhecimento", status: "Ativo", color: "text-cyan" },
                  { name: "Domo 2 — Monitoramento", status: totalServers > 0 ? "Ativo" : "Inativo", color: totalServers > 0 ? "text-cyan" : "text-muted-foreground" },
                  { name: "Domo 3 — Ofensivo", status: "Disponível", color: "text-indigo" },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-foreground">{d.name}</span>
                    <span className={cn("font-mono text-[10px] uppercase tracking-widest", d.color)}>{d.status}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/domo"
                className="mt-5 flex items-center justify-center gap-1.5 rounded-lg border border-cyan/20 bg-cyan/5 py-2 text-[11px] font-medium text-cyan hover:bg-cyan/10 transition-colors"
              >
                Iniciar varredura completa
              </Link>
            </div>
          </div>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="mt-0">
          <div className="v-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="v-label">Logs de ataque</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(alerts ?? []).length} eventos no histórico</p>
              </div>
              <Link to="/" className="text-[11px] text-cyan hover:underline">
                Coletar logs do servidor →
              </Link>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 v-label font-normal">Quando</th>
                  <th className="px-6 py-3 v-label font-normal">Tipo</th>
                  <th className="px-6 py-3 v-label font-normal">Severidade</th>
                  <th className="px-6 py-3 v-label font-normal">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {(alerts ?? []).slice(0, 12).map((a: any, i: number) => (
                  <tr
                    key={a.id}
                    onClick={() => setDrawerLog(a)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-white/[0.03]",
                      i % 2 === 1 && "bg-white/[0.015]"
                    )}
                  >
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      {a.created_at && formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                    </td>
                    <td className="px-6 py-3 font-mono text-foreground/90">{a.alert_type || "—"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          a.severity === "critical" || a.severity === "high"
                            ? "text-destructive"
                            : a.severity === "medium"
                            ? "text-gold"
                            : "text-muted-foreground"
                        )}
                      >
                        {a.severity || "info"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground truncate max-w-md">
                      {a.message || a.title || "—"}
                    </td>
                  </tr>
                ))}
                {(alerts ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-xs">
                      Nenhum log para exibir
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Agents */}
        <TabsContent value="agents" className="mt-0">
          <div className="v-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="v-label">Agentes Vextagon Insight</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalServers} servidor(es) registrado(s)
                </p>
              </div>
              <Link
                to="/dashboard/servers"
                className="text-[11px] text-cyan hover:underline flex items-center gap-1"
              >
                Gerenciar agentes <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {totalServers === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Server strokeWidth={1.4} className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-foreground">Nenhum agente instalado</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Instale o Vextagon Insight nos seus servidores para começar a coletar telemetria.
                </p>
                <Link
                  to="/dashboard/servers"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-cyan/20 bg-cyan/5 px-3 py-1.5 text-[11px] font-medium text-cyan hover:bg-cyan/10"
                >
                  + Adicionar Servidor
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {(servers ?? []).slice(0, 6).map((s: any) => {
                  const online = s.last_seen && Date.now() - new Date(s.last_seen).getTime() < 30 * 60 * 1000;
                  return (
                    <li key={s.id} className="py-3 flex items-center gap-3">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          online ? "bg-cyan shadow-[0_0_8px_hsl(188_100%_56%/0.8)]" : "bg-muted-foreground/40"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{s.hostname}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {s.ip_address} ·{" "}
                          {s.last_seen
                            ? formatDistanceToNow(new Date(s.last_seen), { addSuffix: true, locale: ptBR })
                            : "nunca"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                        <span>CPU {s.cpu_usage ?? "—"}%</span>
                        <span>RAM {s.ram_usage ?? "—"}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Drawer for log details */}
      <Drawer open={!!drawerLog} onOpenChange={(o) => !o && setDrawerLog(null)}>
        <DrawerContent className="bg-card/80 backdrop-blur-2xl border-t border-white/10">
          <div className="mx-auto w-full max-w-2xl p-6">
            <DrawerHeader className="px-0">
              <DrawerTitle className="font-mono text-sm tracking-wide">
                {drawerLog?.alert_type || "Detalhe do evento"}
              </DrawerTitle>
              <DrawerDescription className="text-xs flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {drawerLog?.created_at &&
                  formatDistanceToNow(new Date(drawerLog.created_at), { addSuffix: true, locale: ptBR })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 mt-2">
              <div>
                <p className="v-label mb-1">Mensagem</p>
                <p className="text-sm text-foreground">{drawerLog?.message || drawerLog?.title || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="v-label mb-1">Severidade</p>
                  <p className="font-mono text-xs text-foreground uppercase">{drawerLog?.severity || "info"}</p>
                </div>
                <div>
                  <p className="v-label mb-1">Origem</p>
                  <p className="font-mono text-xs text-foreground">{drawerLog?.source || "sistema"}</p>
                </div>
              </div>
              {drawerLog?.metadata && (
                <div>
                  <p className="v-label mb-1">Metadata</p>
                  <pre className="rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[10px] text-muted-foreground overflow-auto max-h-60">
                    {JSON.stringify(drawerLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
