import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Network,
  Users,
  Container,
  FileText,
  Cog,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Types ──

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
  modules: string[] | null;
  extra_data: Record<string, any> | null;
};

// ── Available modules ──

const AVAILABLE_MODULES = [
  { id: "open_ports", label: "Portas Abertas", description: "Detecta portas TCP em escuta", icon: Shield },
  { id: "installed_services", label: "Serviços Instalados", description: "Lista serviços systemd ativos", icon: Cog },
  { id: "running_processes", label: "Processos Ativos", description: "Top 20 processos por CPU", icon: Activity },
  { id: "logged_users", label: "Usuários Logados", description: "Sessões ativas no servidor", icon: Users },
  { id: "network_connections", label: "Conexões de Rede", description: "Conexões TCP estabelecidas", icon: Network },
  { id: "docker_containers", label: "Docker Containers", description: "Lista containers Docker", icon: Container },
  { id: "auth_logs", label: "Logs de Autenticação", description: "Últimas 50 linhas do auth.log", icon: FileText },
] as const;

// ── Helpers ──

function generateToken() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "vxt_";
  for (let i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
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
        <span className="v-label flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</span>
        <span className={`font-mono text-xs font-semibold ${color}`}>{v.toFixed(1)}%</span>
      </div>
      <Progress value={v} className="h-1.5" />
    </div>
  );
}

// ── Main Component ──

export default function ServerMonitoring() {
  const [addOpen, setAddOpen] = useState(false);
  const [hostname, setHostname] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["open_ports"]);
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
      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      const { error } = await supabase.from("server_monitoring").insert({
        hostname: hostname || "novo-servidor",
        ip_address: "0.0.0.0",
        agent_token: token,
        user_id: user.id,
        install_expires_at: expiresAt,
        modules: selectedModules,
      } as any);
      if (error) throw error;
      return token;
    },
    onSuccess: (token) => {
      setGeneratedToken(token);
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      toast({ title: "Servidor adicionado", description: "Link válido por 1 minuto." });
    },
    onError: (err: Error) => {
      console.error("Erro ao adicionar servidor:", err);
      toast({ title: "Erro", description: err?.message || "Falha ao adicionar servidor.", variant: "destructive" });
    },
  });

  const getInstallUrl = (token: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/agent-install?token=${token}`;
  };

  const copyCommand = (token: string) => {
    const cmd = `curl -sSL "${getInstallUrl(token)}" | sudo bash`;
    navigator.clipboard.writeText(cmd);
    toast({ title: "Copiado!", description: "Comando copiado. Link válido por 1 minuto." });
  };

  const toggleModule = (id: string) => {
    setSelectedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Vextagon Insight</h1>
          <p className="text-sm text-muted-foreground">Monitoramento de servidores via agente</p>
        </div>
        <Button onClick={() => { setAddOpen(true); setGeneratedToken(""); setHostname(""); setSelectedModules(["open_ports"]); }}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Servidor
        </Button>
      </div>

      {/* Server Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-48" />)}
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
            <Card key={s.id} className="v-card-interactive cursor-pointer" onClick={() => setSelectedServer(s)}>
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
                  {s.modules && Array.isArray(s.modules) && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {s.modules.length} módulo{s.modules.length !== 1 ? "s" : ""}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Servidor</DialogTitle>
            <DialogDescription>Configure o hostname e selecione os módulos de coleta.</DialogDescription>
          </DialogHeader>
          {!generatedToken ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Hostname</Label>
                <Input placeholder="ex: srv-prod-01" value={hostname} onChange={(e) => setHostname(e.target.value)} />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Módulos de Coleta</Label>
                <p className="text-xs text-muted-foreground">Selecione quais dados o agente deve coletar além das métricas base (CPU, RAM, Disco).</p>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {AVAILABLE_MODULES.map((mod) => {
                    const checked = selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          checked ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleModule(mod.id)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <mod.icon className={`h-3.5 w-3.5 shrink-0 ${checked ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-sm font-medium text-foreground">{mod.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
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
                  <code className="flex-1 rounded bg-secondary px-3 py-2 font-mono text-xs text-foreground break-all">{generatedToken}</code>
                  <Button size="icon" variant="ghost" onClick={() => copyCommand(generatedToken)}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comando de Instalação</Label>
                <div className="rounded bg-secondary p-3">
                  <code className="font-mono text-xs text-cyan break-all">
                    curl -sSL "{getInstallUrl(generatedToken)}" | sudo bash
                  </code>
                  <p className="mt-2 text-[10px] text-destructive font-medium">⏱ Link expira em 1 minuto · uso único</p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => copyCommand(generatedToken)}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Comando
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Módulos selecionados</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedModules.map(m => {
                    const mod = AVAILABLE_MODULES.find(am => am.id === m);
                    return <Badge key={m} variant="outline" className="text-[10px]">{mod?.label || m}</Badge>;
                  })}
                  {selectedModules.length === 0 && <span className="text-xs text-muted-foreground">Apenas métricas base</span>}
                </div>
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
                    <h3 className="v-section-title flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-primary" /> Sistema Operacional</h3>
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

                {/* Tabs for module data */}
                <ModuleDataTabs server={selectedServer} />
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ── Module Data Tabs ──

function ModuleDataTabs({ server }: { server: ServerRow }) {
  const extra = server.extra_data || {};
  const modules = server.modules || [];

  // Combine legacy open_ports with module data
  const hasOpenPorts = server.open_ports && Array.isArray(server.open_ports) && server.open_ports.length > 0;
  const hasExtraPorts = extra.open_ports && Array.isArray(extra.open_ports) && extra.open_ports.length > 0;
  const ports = hasExtraPorts ? extra.open_ports : hasOpenPorts ? server.open_ports : [];

  const hasSecUpdates = server.security_updates && Array.isArray(server.security_updates) && server.security_updates.length > 0;

  // Build available tabs
  const tabs: { id: string; label: string; icon: React.ElementType }[] = [];
  if (ports.length > 0) tabs.push({ id: "ports", label: "Portas", icon: Shield });
  if (hasSecUpdates) tabs.push({ id: "updates", label: "Atualizações", icon: AlertTriangle });
  if (extra.installed_services?.length) tabs.push({ id: "services", label: "Serviços", icon: Cog });
  if (extra.running_processes?.length) tabs.push({ id: "processes", label: "Processos", icon: Activity });
  if (extra.logged_users?.length) tabs.push({ id: "users", label: "Usuários", icon: Users });
  if (extra.network_connections?.length) tabs.push({ id: "network", label: "Conexões", icon: Network });
  if (extra.docker_containers?.length) tabs.push({ id: "docker", label: "Docker", icon: Container });
  if (extra.auth_logs?.length) tabs.push({ id: "auth_logs", label: "Auth Logs", icon: FileText });

  if (tabs.length === 0) {
    if (modules.length > 0) {
      return (
        <Card className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Aguardando primeiro relatório com dados dos módulos...</p>
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {modules.map(m => {
              const mod = AVAILABLE_MODULES.find(am => am.id === m);
              return <Badge key={m} variant="outline" className="text-[10px]">{mod?.label || m}</Badge>;
            })}
          </div>
        </Card>
      );
    }
    return null;
  }

  return (
    <Tabs defaultValue={tabs[0].id}>
      <TabsList className="w-full flex-wrap h-auto gap-1 bg-secondary/50 p-1">
        {tabs.map(t => (
          <TabsTrigger key={t.id} value={t.id} className="text-xs gap-1.5">
            <t.icon className="h-3 w-3" />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Ports */}
      {ports.length > 0 && (
        <TabsContent value="ports">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Porta</TableHead><TableHead className="text-xs">Serviço</TableHead></TableRow></TableHeader>
              <TableBody>
                {ports.map((p: any, i: number) => (
                  <TableRow key={i}><TableCell className="font-mono text-xs">{p.port}</TableCell><TableCell className="text-xs text-muted-foreground">{p.service || "—"}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Security Updates */}
      {hasSecUpdates && (
        <TabsContent value="updates">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Pacote</TableHead><TableHead className="text-xs">Prioridade</TableHead></TableRow></TableHeader>
              <TableBody>
                {server.security_updates!.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{u.package}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${u.priority === "critical" ? "severity-critical" : u.priority === "high" ? "severity-high" : "text-muted-foreground"}`}>
                        {u.priority || "normal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Installed Services */}
      {extra.installed_services?.length > 0 && (
        <TabsContent value="services">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Serviço</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {extra.installed_services.map((s: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${s.status === "running" ? "text-success" : "text-muted-foreground"}`}>
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Running Processes */}
      {extra.running_processes?.length > 0 && (
        <TabsContent value="processes">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">PID</TableHead>
                  <TableHead className="text-xs">Usuário</TableHead>
                  <TableHead className="text-xs">CPU%</TableHead>
                  <TableHead className="text-xs">MEM%</TableHead>
                  <TableHead className="text-xs">Comando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extra.running_processes.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{p.pid}</TableCell>
                    <TableCell className="text-xs">{p.user}</TableCell>
                    <TableCell className="font-mono text-xs">{p.cpu}</TableCell>
                    <TableCell className="font-mono text-xs">{p.mem}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[200px]">{p.cmd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Logged Users */}
      {extra.logged_users?.length > 0 && (
        <TabsContent value="users">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Usuário</TableHead>
                  <TableHead className="text-xs">TTY</TableHead>
                  <TableHead className="text-xs">Origem</TableHead>
                  <TableHead className="text-xs">Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extra.logged_users.map((u: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{u.user}</TableCell>
                    <TableCell className="text-xs">{u.tty}</TableCell>
                    <TableCell className="font-mono text-xs">{u.from}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.login_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Network Connections */}
      {extra.network_connections?.length > 0 && (
        <TabsContent value="network">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs">Local</TableHead>
                  <TableHead className="text-xs">Remoto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extra.network_connections.map((c: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${c.state === "ESTAB" ? "text-success" : "text-muted-foreground"}`}>
                        {c.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.local}</TableCell>
                    <TableCell className="font-mono text-xs">{c.remote}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Docker Containers */}
      {extra.docker_containers?.length > 0 && (
        <TabsContent value="docker">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Imagem</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extra.docker_containers.map((c: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="text-xs font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.image}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${c.status?.startsWith("Up") ? "text-success" : "text-destructive"}`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      )}

      {/* Auth Logs */}
      {extra.auth_logs?.length > 0 && (
        <TabsContent value="auth_logs">
          <Card>
            <CardContent className="pt-4">
              <div className="max-h-64 overflow-auto rounded bg-secondary p-3">
                {extra.auth_logs.map((line: string, i: number) => (
                  <p key={i} className="font-mono text-[11px] text-muted-foreground leading-relaxed">{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
