import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Radar, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Subdomain {
  subdomain: string;
  discovered_at: string;
  source: string;
}

export default function SubdomainFinder() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Subdomain[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const handleScan = async () => {
    if (!domain.trim()) {
      toast({
        title: "Erro",
        description: "Digite um domínio válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('subdomain-finder', {
        body: { domain: domain.trim() }
      });

      if (error) throw error;

      setResults(data.subdomains || []);
      setTotalCount(data.count || 0);

      toast({
        title: "Scan Concluído",
        description: `${data.count} subdomínios encontrados`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no Scan",
        description: error.message || "Falha ao buscar subdomínios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subdomain Finder</h1>
        <p className="text-muted-foreground mt-1">
          Descoberta de subdomínios via Certificate Transparency
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            Scanner de Subdomínios
          </CardTitle>
          <CardDescription>
            Consulta logs de transparência de certificados (crt.sh) para descobrir subdomínios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="exemplo.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              disabled={loading}
            />
            <Button onClick={handleScan} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                'Iniciar Scan'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {totalCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Scan</CardTitle>
            <CardDescription>
              {totalCount} subdomínios descobertos para {domain}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subdomínio</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Descoberto Em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{result.subdomain}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.source}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(result.discovered_at).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results.length === 0 && domain && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Execute um scan para visualizar resultados</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
