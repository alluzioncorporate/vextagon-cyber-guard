import { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Filter,
  Search,
  Zap,
  Globe,
  Server,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const severityConfig: Record<string, { class: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { class: "text-red-400", icon: ShieldAlert, label: "Crítico" },
  high: { class: "text-orange-400", icon: AlertTriangle, label: "Alto" },
  medium: { class: "text-amber-400", icon: Lock, label: "Médio" },
  info: { class: "text-muted-foreground", icon: Bell, label: "Info" },
};

const typeLabels: Record<string, string> = {
  port_scan: "Port Scan",
  ssl_expire: "SSL Expirando",
  vulnerability: "Vulnerabilidade",
  data_leak: "Vazamento",
  brute_force: "Brute Force",
  malware: "Malware",
  config_change: "Configuração",
  uptime: "Uptime",
};

type FilterType = "all" | "critical" | "high" | "medium" | "info";
type WhatsAppFilter = "all" | "whatsapp" | "not_whatsapp";

export default function AlertsCenter() {
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<FilterType>("all");
  const [whatsappFilter, setWhatsappFilter] = useState<WhatsAppFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch alerts
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("security_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "security_alerts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("security_alerts").update({ read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-alerts"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("security_alerts").update({ read: true }).eq("user_id", user.id).eq("read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-alerts"] }),
  });

  // Filter logic
  const filtered = alerts.filter((alert: any) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (whatsappFilter === "whatsapp" && !alert.notified_whatsapp) return false;
    if (whatsappFilter === "not_whatsapp" && alert.notified_whatsapp) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title?.toLowerCase().includes(q) ||
        alert.description?.toLowerCase().includes(q) ||
        alert.domain?.toLowerCase().includes(q) ||
        alert.alert_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = alerts.filter((a: any) => !a.read).length;
  const whatsappCount = alerts.filter((a: any) => a.notified_whatsapp).length;
  const criticalCount = alerts.filter((a: any) => a.severity === "critical" && !a.read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-gold" />
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            Central de Alertas
          </h1>
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20 text-[10px]">
            DOMO 2
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] ml-1">
            TEMPO REAL
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Todos os alertas da plataforma em tempo real. Monitore o que está indo para o WhatsApp.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Não lidos", value: unreadCount, icon: Bell, color: "text-primary" },
          { label: "Críticos", value: criticalCount, icon: ShieldAlert, color: "text-destructive" },
          { label: "Enviados WhatsApp", value: whatsappCount, icon: MessageSquare, color: "text-emerald-400" },
          { label: "Total", value: alerts.length, icon: Zap, color: "text-gold" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-3">
              <stat.icon className={cn("h-4 w-4 shrink-0", stat.color)} />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar alertas..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Severity filter */}
        <div className="flex gap-1">
          {(["all", "critical", "high", "medium", "info"] as FilterType[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={severityFilter === f ? "default" : "outline"}
              className="h-7 text-[10px] px-2"
              onClick={() => setSeverityFilter(f)}
            >
              {f === "all" ? "Todos" : severityConfig[f]?.label}
            </Button>
          ))}
        </div>

        {/* WhatsApp filter */}
        <div className="flex gap-1 border-l border-border/50 pl-2">
          {([
            { key: "all", label: "Todos", icon: Filter },
            { key: "whatsapp", label: "WhatsApp ✓", icon: MessageSquare },
            { key: "not_whatsapp", label: "Sem WhatsApp", icon: MessageSquare },
          ] as { key: WhatsAppFilter; label: string; icon: typeof Filter }[]).map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={whatsappFilter === f.key ? "default" : "outline"}
              className={cn(
                "h-7 text-[10px] px-2",
                whatsappFilter === f.key && f.key === "whatsapp" && "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={() => setWhatsappFilter(f.key)}
            >
              {f.key !== "all" && <MessageSquare className="h-3 w-3 mr-1" />}
              {f.label}
            </Button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => markAllRead.mutate()}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Marcar lidos
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{filtered.length} alertas encontrados</span>
        {whatsappFilter === "whatsapp" && (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
            Filtro: WhatsApp ativo
          </Badge>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum alerta encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || severityFilter !== "all" || whatsappFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Alertas aparecerão aqui quando detectados"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alerts list */}
      <div className="space-y-1.5">
        {filtered.map((alert: any) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-lg border border-border/50 bg-card p-3 flex items-start gap-3 cursor-pointer transition-all hover:border-primary/20",
                !alert.read && "border-l-2 border-l-primary bg-primary/5",
                alert.read && "opacity-60"
              )}
              onClick={() => !alert.read && markRead.mutate(alert.id)}
            >
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.class)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-foreground">{alert.title}</p>
                  <Badge variant="outline" className={cn("text-[8px] h-4 px-1", config.class)}>
                    {config.label}
                  </Badge>
                  {alert.alert_type && typeLabels[alert.alert_type] && (
                    <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {typeLabels[alert.alert_type]}
                    </span>
                  )}
                  {alert.notified_whatsapp && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                      WhatsApp
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {alert.domain && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {alert.domain}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
