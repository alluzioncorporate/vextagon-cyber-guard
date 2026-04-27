import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Users, Megaphone, Loader2, Send, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  full_name: string | null;
  cpf: string | null;
  recovery_email: string | null;
  created_at: string;
  tiers: { tier: string; status: string; expires_at: string | null }[];
}

export default function AdminMaster() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // Broadcast form
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");
  const [bSeverity, setBSeverity] = useState("info");
  const [bAudience, setBAudience] = useState("all");
  const [bSendEmail, setBSendEmail] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name, cpf, recovery_email, created_at")
      .order("created_at", { ascending: false }).limit(500);
    const { data: subs } = await supabase
      .from("subscriptions").select("user_id, tier, status, expires_at");

    const bySubs = new Map<string, any[]>();
    (subs || []).forEach((s: any) => {
      const arr = bySubs.get(s.user_id) || [];
      arr.push({ tier: s.tier, status: s.status, expires_at: s.expires_at });
      bySubs.set(s.user_id, arr);
    });

    setUsers((profiles || []).map((p: any) => ({ ...p, tiers: bySubs.get(p.id) || [] })));
    setLoading(false);
  }

  async function sendBroadcast() {
    if (!bTitle.trim() || !bMessage.trim()) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-broadcast", {
        body: { title: bTitle, message: bMessage, severity: bSeverity, audience: bAudience, sendEmail: bSendEmail },
      });
      if (error) throw error;
      toast({ title: "Broadcast enviado", description: `${data.sent} usuários notificados.` });
      setBTitle(""); setBMessage("");
    } catch (e: any) {
      toast({ title: "Falha", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const filtered = users.filter((u) =>
    !filter ||
    (u.full_name || "").toLowerCase().includes(filter.toLowerCase()) ||
    (u.cpf || "").includes(filter) ||
    (u.recovery_email || "").toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: users.length,
    paid: users.filter((u) => u.tiers.some((t) => ["domo_1", "domo_2", "domo_3"].includes(t.tier) && t.status === "active")).length,
    trial: users.filter((u) => u.tiers.some((t) => t.tier === "trial" && t.status === "active")).length,
    overdue: users.filter((u) => u.tiers.some((t) => t.status === "overdue")).length,
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-7 w-7 text-cyan-400" />
        <h1 className="text-3xl font-bold tracking-tight">Master Admin</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Pagantes" value={stats.paid} color="text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Trial" value={stats.trial} color="text-amber-400" />
        <StatCard icon={XCircle} label="Em atraso" value={stats.overdue} color="text-red-400" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Usuários</TabsTrigger>
          <TabsTrigger value="broadcast"><Megaphone className="h-4 w-4 mr-2" />Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Usuário</th>
                      <th className="p-3 text-left">CPF</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Tiers ativos</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-t border-border/40 hover:bg-muted/10">
                        <td className="p-3 font-medium">{u.full_name || "—"}</td>
                        <td className="p-3 font-mono text-xs">{u.cpf || "—"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{u.recovery_email || "—"}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {u.tiers.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            {u.tiers.map((t) => (
                              <Badge
                                key={t.tier}
                                variant="outline"
                                className={t.status === "active" ? "border-cyan-500/40 text-cyan-400" : "border-muted text-muted-foreground"}
                              >
                                {t.tier.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          {u.tiers.some((t) => t.status === "overdue") ? (
                            <Badge variant="destructive">Em atraso</Badge>
                          ) : u.tiers.some((t) => ["domo_1","domo_2","domo_3"].includes(t.tier) && t.status === "active") ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">Pagante</Badge>
                          ) : u.tiers.some((t) => t.tier === "trial" && t.status === "active") ? (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">Trial</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="broadcast">
          <Card className="p-6 space-y-4 max-w-2xl">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-cyan-400" /> Notificação em Massa
            </h2>
            <Input
              placeholder="Título"
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              maxLength={200}
            />
            <Textarea
              placeholder="Mensagem..."
              value={bMessage}
              onChange={(e) => setBMessage(e.target.value)}
              rows={5}
              maxLength={5000}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={bSeverity} onValueChange={setBSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bAudience} onValueChange={setBAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Apenas pagantes</SelectItem>
                  <SelectItem value="trial">Apenas trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bSendEmail} onChange={(e) => setBSendEmail(e.target.checked)} />
              Também enviar por e-mail
            </label>
            <Button
              onClick={sendBroadcast}
              disabled={sending}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Disparar para {bAudience === "all" ? "todos" : bAudience}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-cyan-400" }: any) {
  return (
    <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/40">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-background/50 ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}
