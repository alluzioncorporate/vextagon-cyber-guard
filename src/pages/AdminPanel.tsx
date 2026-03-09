import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Users, Crown, Globe, Activity, Trash2, ChevronDown,
  Calendar, Server as ServerIcon, Loader2, Save, Link as LinkIcon,
  ShieldCheck, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  subscription_tier: string;
  whatsapp_enabled: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
  const [baileysUrl, setBaileysUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  const invokeAdmin = async (action: string, body?: Record<string, unknown>, method: string = "POST") => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");

    const url = method === "GET"
      ? `https://${projectId}.supabase.co/functions/v1/admin-users?action=${action}`
      : `https://${projectId}.supabase.co/functions/v1/admin-users?action=${action}`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro na requisição");
    return data;
  };

  // Load users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await invokeAdmin("list_users", undefined, "GET");
      return result.users as AdminUser[];
    },
  });

  const users = usersData || [];

  // Load baileys URL
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const baileys = await invokeAdmin("get_setting", { key: "baileys_url" });
        setBaileysUrl(baileys.value || "");
      } catch {}
    };
    if (user) loadSettings();
  }, [user]);

  // Update plan
  const updatePlan = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      return invokeAdmin("update_plan", { user_id: userId, plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Plano atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return invokeAdmin("delete_user", { user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteConfirm(null);
      toast({ title: "Usuário removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // Save baileys URL
  const handleSaveSetting = async (key: string, value: string, label: string) => {
    setSavingUrl(true);
    try {
      await invokeAdmin("save_setting", { key, value });
      toast({ title: `${label} salvo` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingUrl(false);
    }
  };

  // Stats
  const now = new Date();
  const thisMonth = users.filter((u) => {
    const created = new Date(u.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });
  const premiumCount = users.filter((u) => u.subscription_tier === "premium").length;
  const freeCount = users.filter((u) => u.subscription_tier === "free").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestão de usuários, planos e configurações</p>
        </div>
        <Link
          to="/admin/diagnostics"
          className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-cyan hover:border-primary/30"
        >
          <Activity className="h-3 w-3" />
          Diagnóstico
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Usuários", value: users.length, icon: Users },
          { label: "Premium", value: premiumCount, icon: Crown, gold: true },
          { label: "Free", value: freeCount, icon: Globe, cyan: true },
          { label: "Novos (mês)", value: thisMonth.length, icon: Calendar, success: true },
        ].map((s) => (
          <div key={s.label} className="v-card p-4">
            <div className="flex items-center justify-between">
              <span className="v-label">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.gold ? "text-gold" : s.cyan ? "text-cyan" : s.success ? "text-success" : "text-muted-foreground"}`} />
            </div>
            <p className={`mt-2 v-stat ${s.gold ? "text-gold" : s.cyan ? "text-cyan" : s.success ? "text-success" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Baileys Config */}
      <div className="v-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="h-3.5 w-3.5 text-primary" />
          <p className="v-section-title">Servidor Baileys (WhatsApp)</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          URL do servidor Baileys para envio de notificações WhatsApp.
        </p>
        <div className="flex gap-2">
          <Input
            value={baileysUrl}
            onChange={(e) => setBaileysUrl(e.target.value)}
            placeholder="https://baileys.seudominio.com"
            className="bg-secondary/50 font-mono text-xs border-border flex-1"
          />
          <Button onClick={() => handleSaveSetting("baileys_url", baileysUrl, "URL do Baileys")} size="sm" disabled={savingUrl} className="text-xs">
            {savingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="v-card overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <p className="v-section-title">Todos os Usuários</p>
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left v-label">Nome</th>
                <th className="px-4 py-2.5 text-left v-label">CPF</th>
                <th className="px-4 py-2.5 text-left v-label">Plano</th>
                <th className="px-4 py-2.5 text-left v-label">Role</th>
                <th className="px-4 py-2.5 text-left v-label">Criado em</th>
                <th className="px-4 py-2.5 text-left v-label">Último Login</th>
                <th className="px-4 py-2.5 text-left v-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="text-foreground font-medium">{u.full_name || "—"}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{u.cpf || "—"}</td>
                  <td className="px-4 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-secondary/50">
                          {u.subscription_tier === "premium" ? (
                            <span className="font-mono text-[10px] font-medium text-gold uppercase">Premium</span>
                          ) : (
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">Free</span>
                          )}
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[120px]">
                        <DropdownMenuItem
                          onClick={() => updatePlan.mutate({ userId: u.id, plan: "free" })}
                          className="text-xs"
                        >
                          <Globe className="h-3 w-3 mr-1.5 text-muted-foreground" /> Free
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updatePlan.mutate({ userId: u.id, plan: "premium" })}
                          className="text-xs"
                        >
                          <Crown className="h-3 w-3 mr-1.5 text-gold" /> Premium
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant="outline" className={`text-[9px] ${r === "admin" ? "border-primary/30 text-cyan" : ""}`}>
                          {r === "admin" && <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />}
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">
                    {u.last_sign_in_at
                      ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true, locale: ptBR })
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(u)}
                        disabled={u.roles.includes("admin")}
                        title={u.roles.includes("admin") ? "Não é possível excluir admin" : "Excluir usuário"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered This Month */}
      {thisMonth.length > 0 && (
        <div className="v-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-success" />
            <p className="v-section-title">Cadastrados este mês ({thisMonth.length})</p>
          </div>
          <div className="space-y-1.5">
            {thisMonth.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded bg-secondary/40 px-3 py-2">
                <div>
                  <span className="text-xs text-foreground">{u.full_name || u.email}</span>
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground">{u.cpf || ""}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" /> Excluir Usuário
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirm?.full_name || deleteConfirm?.email}</strong>?
              Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} className="text-xs">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirm && deleteUser.mutate(deleteConfirm.id)}
              disabled={deleteUser.isPending}
              className="text-xs"
            >
              {deleteUser.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
