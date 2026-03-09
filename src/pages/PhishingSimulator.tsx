import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  campaign_name: string;
  status: string;
  target_emails: string[];
  email_template: string;
  created_at: string;
  stats: any;
}

export default function PhishingSimulator() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [targetEmails, setTargetEmails] = useState("");

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("phishing_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !emailTemplate.trim() || !targetEmails.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const emails = targetEmails.split("\n").map((e) => e.trim()).filter((e) => e);
      const { error } = await supabase.from("phishing_campaigns").insert({ user_id: user.id, campaign_name: campaignName, email_template: emailTemplate, target_emails: emails, status: "draft" });
      if (error) throw error;
      toast({ title: "Campanha Criada", description: `${campaignName} com ${emails.length} alvos` });
      setCampaignName(""); setEmailTemplate(""); setTargetEmails(""); setShowForm(false);
      loadCampaigns();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("phishing_campaigns").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Removida" }); loadCampaigns();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-foreground">Phishing Simulator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Treinamento de conscientização via simulação de phishing</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="text-xs font-medium">
          <Plus className="h-3.5 w-3.5 mr-1" /> Nova Campanha
        </Button>
      </div>

      {showForm && (
        <div className="v-card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <p className="v-section-title">Criar Campanha</p>
          </div>
          <div className="space-y-2">
            <label className="v-label">Nome</label>
            <Input placeholder="Ex: Teste Q1 2026" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="bg-secondary/50 font-mono text-xs border-border" />
          </div>
          <div className="space-y-2">
            <label className="v-label">Template de E-mail</label>
            <Textarea placeholder="Assunto: Atualização Urgente..." value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={5} className="bg-secondary/50 font-mono text-xs border-border" />
          </div>
          <div className="space-y-2">
            <label className="v-label">E-mails Alvo (um por linha)</label>
            <Textarea placeholder="user@exemplo.com" value={targetEmails} onChange={(e) => setTargetEmails(e.target.value)} rows={4} className="bg-secondary/50 font-mono text-xs border-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateCampaign} disabled={loading} size="sm" className="text-xs">
              {loading ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Criando</> : "Criar Campanha"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {campaigns.length > 0 ? (
        <div className="v-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="v-section-title">Campanhas ({campaigns.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left v-label">Nome</th>
                  <th className="px-4 py-2.5 text-left v-label">Status</th>
                  <th className="px-4 py-2.5 text-left v-label">Alvos</th>
                  <th className="px-4 py-2.5 text-left v-label">Enviados</th>
                  <th className="px-4 py-2.5 text-left v-label">Clicaram</th>
                  <th className="px-4 py-2.5 text-left v-label">Reportaram</th>
                  <th className="px-4 py-2.5 text-left v-label">Criado</th>
                  <th className="px-4 py-2.5 text-left v-label"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.campaign_name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="font-mono text-[10px]">{c.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-foreground">{c.target_emails.length}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{c.stats?.sent || 0}</td>
                    <td className="px-4 py-2.5 font-mono severity-critical font-semibold">{c.stats?.clicked || 0}</td>
                    <td className="px-4 py-2.5 font-mono text-success font-semibold">{c.stats?.reported || 0}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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
          <Mail className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma campanha criada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma campanha de teste para treinar seus colaboradores</p>
        </div>
      )}
    </div>
  );
}
