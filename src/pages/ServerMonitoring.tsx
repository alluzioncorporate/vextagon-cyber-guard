import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Server,
  Plus,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Copy,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ServerRow = {
  id: string;
  hostname: string;
  ip_address: string;
  os_info: Record<string, string> | null;
  cpu_usage: number | null;
  ram_usage: number | null;
  disk_usage: number | null;
  open_ports: Array<{ port: number; service?: string }> | null;
  security_updates: Array<{ package: string; priority?: string }> | null;
  last_seen: string;
  agent_token: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

function generateToken() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "vxt_";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function getStatusColor(lastSeen: string) {
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60 * 1000) return "text-success";
  if (diff < 30 * 60 * 1000) return "text-warning";
  return "severity-critical";
}

function getStatusLabel(lastSeen: string) {
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60 * 1000) return "Online";
  if (diff < 30 * 60 * 1000) return "Atrasado";
  return "Offline";
}

function UsageBar({ value, label, icon: Icon }: { value: number | null; label: string; icon: React.ElementType }) {
  const v = value ?? 0;
  const color = v > 90 ? "severity-critical" : v > 70 ? "text-warning" : "text-success";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="v-label flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className={`font-mono text-xs font-semibold ${color}`}>{v.toFixed(1)}%</span>
      </div>
      <Progress value={v} className="h-1.5" />
    </div>
  );
}

export default function ServerMonitoring() {
  const [addOpen, setAddOpen] = useState(false);
  const [hostname, setHostname] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [selectedServer, setSelectedServer] = useState<ServerRow | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("server_monitoring")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ServerRow[];
    },
  });

  const addServer = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const token = generateToken();
      const { error } = await supabase.from("server_monitoring").insert({
        hostname: hostname || "novo-servidor",
        ip_address: "0.0.0.0",
        agent_token: token,
        user_id: user.id,
      });
      if (error) throw error;
      return token;
    },
    onSuccess: (token) => {
      setGeneratedToken(token);
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      toast({ title: "Servidor adicionado", description: "Use o comando abaixo para instalar o agente." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao adicionar servidor.", variant: "destructive" });
    },
  });

  const copyCommand = (token: string) => {
    const cmd = `curl -sSL https://vextagon.com/install.sh | bash -s -- --token ${token}`;
    navigator.clipboard.writeText(cmd);
    toast({ title: "Copiado!", description: "Comando copiado para a área de transferência." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Vextagon Insight
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento de servidores via agente
          </p>
        </div>
        <Button onClick={() => { setAddOpen(true); setGeneratedToken(""); setHostname(""); }}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Servidor
        </Button>
      </div>

      {/* Server Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Server className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum servidor monitorado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione um servidor para começar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map((s) => (
            <Card
              key={s.id}
              className="v-card-interactive cursor-pointer"
              onClick={() => setSelectedServer(s)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    {s.hostname}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${getStatusColor(s.last_seen).replace("text-", "bg-").replace("severity-critical", "bg-destructive")}`} />
                    {getStatusLabel(s.last_seen)}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{s.ip_address}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <UsageBar value={s.cpu_usage} label="CPU" icon={Cpu} />
                <UsageBar value={s.ram_usage} label="RAM" icon={MemoryStick} />
                <UsageBar value={s.disk_usage} label="Disco" icon={HardDrive} />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Visto {formatDistanceToNow(new Date(s.last_seen), { addSuffix: true, locale: ptBR })}
                  </span>
                  {s.open_ports && Array.isArray(s.open_ports) && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {s.open_ports.length} porta{s.open_ports.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Server Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Servidor</DialogTitle>
            <DialogDescription>
              Configure o hostname e IP, depois instale o agente.
            </DialogDescription>
          </DialogHeader>
          {!generatedToken ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hostname</Label>
                <Input
                  placeholder="ex: srv-prod-01"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="ex: 192.168.1.100"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={() => addServer.mutate()} disabled={addServer.isPending}>
                  {addServer.isPending ? "Gerando..." : "Gerar Token & Comando"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Token do Agente</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-secondary px-3 py-2 font-mono text-xs text-foreground break-all">
                    {generatedToken}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copyCommand(generatedToken)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comando de Instalação</Label>
                <div className="rounded bg-secondary p-3">
                  <code className="font-mono text-xs text-cyan break-all">
                    curl -sSL https://vextagon.com/install.sh | bash -s -- --token {generatedToken}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyCommand(generatedToken)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Comando
                </Button>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setAddOpen(false)}>Fechar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Server Detail Drawer */}
      <Drawer open={!!selectedServer} onOpenChange={(open) => !open && setSelectedServer(null)}>
        <DrawerContent className="max-h-[85vh]">
          {selectedServer && (
            <>
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  {selectedServer.hostname}
                </DrawerTitle>
                <DrawerDescription className="font-mono text-xs">
                  {selectedServer.ip_address} · Visto{" "}
                  {formatDistanceToNow(new Date(selectedServer.last_seen), { addSuffix: true, locale: ptBR })}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-6 overflow-auto">
                {/* Resource Usage */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "CPU", value: selectedServer.cpu_usage, icon: Cpu },
                    { label: "RAM", value: selectedServer.ram_usage, icon: MemoryStick },
                    { label: "Disco", value: selectedServer.disk_usage, icon: HardDrive },
                  ].map((m) => (
                    <Card key={m.label}>
                      <CardContent className="pt-4 pb-3 text-center">
                        <m.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <p className="v-stat text-lg">{(m.value ?? 0).toFixed(1)}%</p>
                        <p className="v-label">{m.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* OS Info */}
                {selectedServer.os_info && (
                  <div>
                    <h3 className="v-section-title flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-primary" /> Sistema Operacional
                    </h3>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(selectedServer.os_info).map(([key, val]) => (
                            <div key={key}>
                              <p className="v-label">{key}</p>
                              <p className="font-mono text-xs text-foreground">{String(val)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Open Ports */}
                {selectedServer.open_ports && Array.isArray(selectedServer.open_ports) && selectedServer.open_ports.length > 0 && (
                  <div>
                    <h3 className="v-section-title flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-primary" /> Portas Abertas
                    </h3>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Porta</TableHead>
                            <TableHead className="text-xs">Serviço</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedServer.open_ports.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{p.port}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{p.service || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}

                {/* Security Updates */}
                {selectedServer.security_updates && Array.isArray(selectedServer.security_updates) && selectedServer.security_updates.length > 0 && (
                  <div>
                    <h3 className="v-section-title flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-warning" /> Atualizações Pendentes
                    </h3>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Pacote</TableHead>
                            <TableHead className="text-xs">Prioridade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedServer.security_updates.map((u, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{u.package}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${u.priority === "critical" ? "severity-critical" : u.priority === "high" ? "severity-high" : "text-muted-foreground"}`}
                                >
                                  {u.priority || "normal"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
