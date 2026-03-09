import { useState } from "react";
import { Zap, Play, Pause, Settings, AlertTriangle, Shield, Ban, FileX, Bell, CheckCircle, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Playbook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
}

const defaultPlaybooks: Playbook[] = [
  {
    id: "1",
    name: "Bloqueio de IP Malicioso",
    description: "Quando um IP é detectado em feeds de threat intel, bloqueia automaticamente no firewall",
    trigger: "IOC detectado em Threat Intel",
    actions: ["Adicionar IP ao iptables DROP", "Criar alerta crítico", "Notificar WhatsApp"],
    enabled: true,
    lastTriggered: "2024-02-20 14:30",
    triggerCount: 47,
  },
  {
    id: "2",
    name: "Quarentena de Malware",
    description: "Isola arquivos detectados pelo YARA para análise posterior",
    trigger: "YARA match encontrado",
    actions: ["Mover arquivo para /quarantine", "Remover permissões de execução", "Gerar hash SHA256", "Criar alerta"],
    enabled: true,
    lastTriggered: "2024-02-19 09:15",
    triggerCount: 12,
  },
  {
    id: "3",
    name: "Resposta a Brute Force",
    description: "Bloqueia IPs que tentam brute force em SSH/admin",
    trigger: "5+ tentativas de login falhas em 1 minuto",
    actions: ["Bloquear IP por 24h", "Notificar admin", "Registrar no log de segurança"],
    enabled: true,
    lastTriggered: "2024-02-20 18:45",
    triggerCount: 234,
  },
  {
    id: "4",
    name: "Honey Token Comprometido",
    description: "Resposta imediata quando um honey token é acessado",
    trigger: "Acesso a Honey Token",
    actions: ["Capturar IP e headers", "Bloquear IP origem", "Alerta crítico", "Snapshot do servidor"],
    enabled: true,
    lastTriggered: null,
    triggerCount: 0,
  },
  {
    id: "5",
    name: "CVE Crítico Detectado",
    description: "Quando um CVE crítico afeta seu stack, notifica e sugere mitigação",
    trigger: "CVE crítico no Threat Intel afeta seu Tech Stack",
    actions: ["Alerta imediato", "Gerar relatório de impacto", "Sugerir patches", "Notificar equipe"],
    enabled: false,
    lastTriggered: "2024-02-15 11:20",
    triggerCount: 3,
  },
  {
    id: "6",
    name: "Servidor Offline",
    description: "Resposta automática quando um servidor para de responder",
    trigger: "Insight Agent sem heartbeat por 5 minutos",
    actions: ["Alerta crítico", "Tentar reconexão SSH", "Notificar WhatsApp", "Escalar para on-call"],
    enabled: true,
    lastTriggered: "2024-02-18 03:30",
    triggerCount: 8,
  },
];

const triggerIcons: Record<string, typeof AlertTriangle> = {
  "IOC detectado em Threat Intel": AlertTriangle,
  "YARA match encontrado": FileX,
  "5+ tentativas de login falhas em 1 minuto": Ban,
  "Acesso a Honey Token": Shield,
  "CVE crítico no Threat Intel afeta seu Tech Stack": AlertTriangle,
  "Insight Agent sem heartbeat por 5 minutos": Bell,
};

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState(defaultPlaybooks);

  const togglePlaybook = (id: string) => {
    setPlaybooks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const enabledCount = playbooks.filter((p) => p.enabled).length;
  const totalTriggers = playbooks.reduce((acc, p) => acc + p.triggerCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-destructive" />
          Playbooks Automáticos
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Resposta automática a incidentes — quando detectar ameaça X, executar ação Y
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="v-card p-4">
          <span className="v-label">Total Playbooks</span>
          <p className="mt-2 v-stat text-foreground">{playbooks.length}</p>
        </div>
        <div className="v-card p-4">
          <span className="v-label">Ativos</span>
          <p className="mt-2 v-stat text-success">{enabledCount}</p>
        </div>
        <div className="v-card p-4">
          <span className="v-label">Execuções Total</span>
          <p className="mt-2 v-stat text-cyan">{totalTriggers}</p>
        </div>
        <div className="v-card p-4">
          <span className="v-label">Ameaças Bloqueadas</span>
          <p className="mt-2 v-stat text-destructive">{playbooks[0].triggerCount + playbooks[2].triggerCount}</p>
        </div>
      </div>

      {/* Add new */}
      <Button variant="outline" size="sm" className="text-xs">
        <Plus className="h-3.5 w-3.5 mr-1" />
        Criar Playbook Personalizado
      </Button>

      {/* Playbook List */}
      <div className="space-y-3">
        {playbooks.map((playbook) => {
          const TriggerIcon = triggerIcons[playbook.trigger] || AlertTriangle;
          return (
            <div
              key={playbook.id}
              className={cn(
                "v-card p-4 transition-all",
                playbook.enabled ? "border-destructive/20" : "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className={cn("h-4 w-4", playbook.enabled ? "text-destructive" : "text-muted-foreground")} />
                    <p className="text-sm font-semibold text-foreground">{playbook.name}</p>
                    {playbook.enabled && (
                      <span className="font-mono text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        ATIVO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{playbook.description}</p>

                  {/* Trigger */}
                  <div className="flex items-center gap-2 mt-3 p-2 rounded bg-secondary/50">
                    <TriggerIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span className="text-[10px] text-muted-foreground">
                      <span className="text-foreground font-medium">Gatilho:</span> {playbook.trigger}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 space-y-1">
                    {playbook.actions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <CheckCircle className="h-3 w-3 text-cyan" />
                        <span className="text-foreground">{action}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {playbook.triggerCount} execuções
                    </span>
                    {playbook.lastTriggered && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Último: {playbook.lastTriggered}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Switch checked={playbook.enabled} onCheckedChange={() => togglePlaybook(playbook.id)} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
