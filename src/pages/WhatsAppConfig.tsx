import { useState } from "react";
import { MessageSquare, Phone, Wifi, WifiOff, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function WhatsAppConfig() {
  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [alertOnCritical, setAlertOnCritical] = useState(true);
  const [alertOnLeak, setAlertOnLeak] = useState(true);

  const handleConnect = () => {
    if (!phone.trim()) return;
    setConnectionStatus("connecting");
    setTimeout(() => setConnectionStatus("connected"), 2000);
  };

  const handleDisconnect = () => {
    setConnectionStatus("disconnected");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground">WhatsApp Notifications</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Integração Baileys — receba alertas críticos no WhatsApp</p>
      </div>

      {/* Status */}
      <div className="v-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs font-medium text-foreground">Status da Conexão</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {connectionStatus === "connected" && "Conectado ao servidor Baileys"}
                {connectionStatus === "connecting" && "Conectando..."}
                {connectionStatus === "disconnected" && "Desconectado"}
              </p>
            </div>
          </div>
          <div className={`h-2 w-2 rounded-full ${
            connectionStatus === "connected" ? "bg-emerald-500" :
            connectionStatus === "connecting" ? "bg-amber-500 animate-pulse" :
            "bg-muted-foreground"
          }`} />
        </div>
      </div>

      {/* Config */}
      <div className="v-card p-4 space-y-4">
        <p className="v-section-title">Configuração</p>

        <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">Ativar Notificações</p>
            <p className="text-[10px] text-muted-foreground">Habilitar envio de alertas via WhatsApp</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            <div>
              <label className="v-label mb-1.5 block">Número WhatsApp</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="bg-secondary/50 pl-9 font-mono text-xs border-border"
                  />
                </div>
                {connectionStatus === "disconnected" ? (
                  <Button onClick={handleConnect} size="sm" className="text-xs font-medium">
                    Conectar
                  </Button>
                ) : (
                  <Button onClick={handleDisconnect} size="sm" variant="outline" className="text-xs font-medium">
                    Desconectar
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="v-label">Gatilhos de Alerta</p>
              <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-xs text-foreground">Alertas Críticos</p>
                </div>
                <Switch checked={alertOnCritical} onCheckedChange={setAlertOnCritical} />
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-warning" />
                  <p className="text-xs text-foreground">Vazamento Detectado</p>
                </div>
                <Switch checked={alertOnLeak} onCheckedChange={setAlertOnLeak} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Connection Log */}
      {connectionStatus === "connected" && (
        <div className="v-card p-4">
          <p className="v-section-title mb-3">Log de Conexão</p>
          <div className="space-y-1.5 font-mono text-[10px] text-muted-foreground">
            <p>→ Sessão iniciada com Baileys v6.7.0</p>
            <p>→ Autenticado via QR Code</p>
            <p>→ Número registrado: {phone}</p>
            <p>→ <span className="text-success">Pronto para enviar notificações</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
