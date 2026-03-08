import { Bell, BellOff, AlertTriangle, ShieldAlert, Lock, Zap } from "lucide-react";
import { mockSecurityAlerts } from "@/data/mockData";

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
  const unreadCount = mockSecurityAlerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground">Central de Alertas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Eventos de segurança e notificações</p>
        </div>
        <div className="v-card px-3 py-1.5 flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-xs text-foreground">{unreadCount} não lidos</span>
        </div>
      </div>

      <div className="space-y-2">
        {mockSecurityAlerts.map((alert) => {
          const Icon = severityIcon[alert.severity] || Bell;
          return (
            <div
              key={alert.id}
              className={`v-card p-4 flex items-start gap-3 ${!alert.read ? "border-l-2 border-l-primary" : "opacity-60"}`}
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
                  <span className="font-mono text-[10px] text-muted-foreground">{alert.domain}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{alert.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
