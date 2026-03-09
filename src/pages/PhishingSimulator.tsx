import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  campaign_name: string;
  status: string;
  target_emails: string[];
  email_template: string;
  created_at: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    reported: number;
  };
}

export default function PhishingSimulator() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [campaignName, setCampaignName] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [targetEmails, setTargetEmails] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('phishing_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar campanhas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !emailTemplate.trim() || !targetEmails.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const emails = targetEmails.split('\n').map(e => e.trim()).filter(e => e);

      const { error } = await supabase
        .from('phishing_campaigns')
        .insert({
          user_id: user.id,
          campaign_name: campaignName,
          email_template: emailTemplate,
          target_emails: emails,
          status: 'draft',
        });

      if (error) throw error;

      toast({
        title: "Campanha Criada",
        description: `${campaignName} foi criada com ${emails.length} alvos`,
      });

      setCampaignName("");
      setEmailTemplate("");
      setTargetEmails("");
      setShowForm(false);
      loadCampaigns();
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('phishing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Campanha Excluída",
        description: "A campanha foi removida com sucesso",
      });

      loadCampaigns();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" => {
    if (status === 'completed') return "default";
    if (status === 'active') return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phishing Simulator</h1>
          <p className="text-muted-foreground mt-1">
            Treinamento de conscientização de segurança via simulação de phishing
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Criar Campanha de Teste
            </CardTitle>
            <CardDescription>
              Configure uma campanha de e-mail simulado para treinar funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome da Campanha</label>
              <Input
                placeholder="Ex: Teste Q1 2024 - Equipe TI"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Template de E-mail</label>
              <Textarea
                placeholder="Assunto: Atualização Urgente de Senha&#10;&#10;Olá [NOME],&#10;&#10;Detectamos atividade suspeita em sua conta..."
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                E-mails Alvo (um por linha)
              </label>
              <Textarea
                placeholder="usuario1@exemplo.com&#10;usuario2@exemplo.com&#10;usuario3@exemplo.com"
                value={targetEmails}
                onChange={(e) => setTargetEmails(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando
                  </>
                ) : (
                  'Criar Campanha'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campanhas Ativas</CardTitle>
          <CardDescription>
            {campaigns.length} campanha(s) configurada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alvos</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Abertos</TableHead>
                    <TableHead>Clicados</TableHead>
                    <TableHead>Reportados</TableHead>
                    <TableHead>Criado Em</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-semibold">{campaign.campaign_name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.target_emails.length}</TableCell>
                      <TableCell>{campaign.stats?.sent || 0}</TableCell>
                      <TableCell>{campaign.stats?.opened || 0}</TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {campaign.stats?.clicked || 0}
                      </TableCell>
                      <TableCell className="text-green-500 font-semibold">
                        {campaign.stats?.reported || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma campanha criada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
