import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Plus, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface HoneyToken {
  id: string;
  label: string;
  token: string;
  status: string;
  access_count: number;
  created_at: string;
  accessed_at: string | null;
}

export default function HoneyTokenGenerator() {
  const [tokens, setTokens] = useState<HoneyToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tokenLabel, setTokenLabel] = useState("");

  useEffect(() => { loadTokens(); }, []);

  const loadTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("honey_tokens").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!tokenLabel.trim()) {
      toast({ title: "Erro", description: "Digite um rótulo", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const token = crypto.randomUUID();
      const { error } = await supabase.from("honey_tokens").insert({ user_id: user.id, label: tokenLabel, token, status: "active" });
      if (error) throw error;
      toast({ title: "Token Criado" });
      setTokenLabel(""); setShowForm(false); loadTokens();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("honey_tokens").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Token Removido" }); loadTokens();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getTokenUrl = (token: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/honey-token-tracker?token=${token}`;
  };

  const copyUrl = (token: string) => {
    navigator.clipboard.writeText(getTokenUrl(token));
    toast({ title: "Copiado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground">Honey Token Generator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tokens de rastreio para detecção de intrusões</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="text-xs font-medium">
          <Plus className="h-3.5 w-3.5 mr-1" /> Novo Token
        </Button>
      </div>

      <div className="v-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          <p className="text-xs font-medium text-foreground">Como Funciona</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Honey Tokens são URLs únicas que disparam alertas quando acessadas. Use em documentos falsos, configs de armadilha ou repositórios privados.
        </p>
      </div>

      {showForm && (
        <div className="v-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <p className="v-section-title">Criar Honey Token</p>
          </div>
          <div className="space-y-2">
            <label className="v-label">Rótulo</label>
            <Input placeholder="Ex: Documento Financeiro Q1" value={tokenLabel} onChange={(e) => setTokenLabel(e.target.value)} className="bg-secondary/50 font-mono text-xs border-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={loading} size="sm" className="text-xs">
              {loading ? "Gerando..." : "Gerar Token"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {tokens.length > 0 ? (
        <div className="v-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="v-section-title">Tokens Ativos ({tokens.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left v-label">Rótulo</th>
                  <th className="px-4 py-2.5 text-left v-label">Status</th>
                  <th className="px-4 py-2.5 text-left v-label">Acessos</th>
                  <th className="px-4 py-2.5 text-left v-label">Último Acesso</th>
                  <th className="px-4 py-2.5 text-left v-label">URL</th>
                  <th className="px-4 py-2.5 text-left v-label"></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{t.label}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={t.access_count > 0 ? "destructive" : "outline"} className="font-mono text-[10px]">
                        {t.access_count > 0 ? "TRIGGERED" : t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-mono font-semibold ${t.access_count > 0 ? "severity-critical" : "text-foreground"}`}>
                        {t.access_count}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {t.accessed_at ? new Date(t.accessed_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-[10px] text-muted-foreground max-w-[200px] truncate">{getTokenUrl(t.token)}</code>
                        <button onClick={() => copyUrl(t.token)} className="text-muted-foreground hover:text-cyan transition-colors">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <Eye className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum token criado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie tokens para detectar acessos não autorizados</p>
        </div>
      )}
    </div>
  );
}
