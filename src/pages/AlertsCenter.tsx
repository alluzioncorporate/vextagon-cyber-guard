import { Bell, AlertTriangle, ShieldAlert, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const severityClass: Record<string, string> = {
  critical: "severity-critical",
  high: "severity-high",
  medium: "severity-medium",
  info: "text-muted-foreground",
};

const severityIcon: Record<string, typeof AlertTriangle> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: Lock,
  info: Bell,
};

export default function AlertsCenter() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("security_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

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

  const unreadCount = alerts.filter((a: any) => !a.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground">Central de Alertas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Eventos de segurança em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => markAllRead.mutate()}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Marcar todos como lidos
            </Button>
          )}
          <div className="v-card px-3 py-1.5 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs text-foreground">{unreadCount} não lidos</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum alerta</p>
          <p className="text-xs text-muted-foreground mt-1">Alertas de segurança aparecerão aqui quando detectados</p>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map((alert: any) => {
          const Icon = severityIcon[alert.severity] || Bell;
          return (
            <div
              key={alert.id}
              className={`v-card p-4 flex items-start gap-3 cursor-pointer transition-opacity ${!alert.read ? "border-l-2 border-l-primary" : "opacity-60"}`}
              onClick={() => !alert.read && markRead.mutate(alert.id)}
            >
              <div className="mt-0.5">
                <Icon className={`h-4 w-4 ${severityClass[alert.severity]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{alert.title}</p>
                  <span className={`font-mono text-[9px] font-medium uppercase shrink-0 ${severityClass[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {alert.domain && <span className="font-mono text-[10px] text-muted-foreground">{alert.domain}</span>}
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
