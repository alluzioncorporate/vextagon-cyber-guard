import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('honey_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tokens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateToken = () => {
    return crypto.randomUUID();
  };

  const handleCreateToken = async () => {
    if (!tokenLabel.trim()) {
      toast({
        title: "Erro",
        description: "Digite um rótulo para o token",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const token = generateToken();

      const { error } = await supabase
        .from('honey_tokens')
        .insert({
          user_id: user.id,
          label: tokenLabel,
          token: token,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "Token Criado",
        description: "Token de rastreio gerado com sucesso",
      });

      setTokenLabel("");
      setShowForm(false);
      loadTokens();
    } catch (error: any) {
      toast({
        title: "Erro ao criar token",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    try {
      const { error } = await supabase
        .from('honey_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Token Excluído",
        description: "O token foi removido com sucesso",
      });

      loadTokens();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTokenUrl = (token: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/honey-token-tracker?token=${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "URL copiada para a área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Honey Token Generator</h1>
          <p className="text-muted-foreground mt-1">
            Tokens de rastreio para detecção de intrusões e vazamentos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Token
        </Button>
      </div>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Honey Tokens são URLs únicas que disparam alertas quando acessadas. Use-os em:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1 text-muted-foreground">
            <li>Documentos falsos para detectar vazamentos</li>
            <li>Arquivos de configuração como "armadilha"</li>
            <li>Repositórios privados para monitorar acessos não autorizados</li>
            <li>E-mails de teste para identificar exfiltração de dados</li>
          </ul>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Criar Honey Token
            </CardTitle>
            <CardDescription>
              Gere uma URL única de rastreio que dispara alertas quando acessada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rótulo do Token</label>
              <Input
                placeholder="Ex: Documento Financeiro Q1 2024"
                value={tokenLabel}
                onChange={(e) => setTokenLabel(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateToken} disabled={loading}>
                {loading ? 'Gerando...' : 'Gerar Token'}
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
          <CardTitle>Tokens Ativos</CardTitle>
          <CardDescription>
            {tokens.length} token(s) de rastreio configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acessos</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>URL do Token</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-semibold">{token.label}</TableCell>
                      <TableCell>
                        <Badge variant={token.access_count > 0 ? "destructive" : "outline"}>
                          {token.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={token.access_count > 0 ? "text-destructive font-bold" : ""}>
                          {token.access_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {token.accessed_at 
                          ? new Date(token.accessed_at).toLocaleString('pt-BR')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[300px] overflow-hidden text-ellipsis">
                            {getTokenUrl(token.token)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(getTokenUrl(token.token))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteToken(token.id)}
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
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum token criado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
