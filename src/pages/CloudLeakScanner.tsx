import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Cloud, Loader2, AlertTriangle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BucketResult {
  bucket_name: string;
  url: string;
  exists: boolean;
  is_public: boolean;
  status: string;
  severity: string;
  checked_at: string;
}

export default function CloudLeakScanner() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BucketResult[]>([]);
  const [stats, setStats] = useState({ scanned: 0, found: 0, public: 0 });

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
      const { data, error } = await supabase.functions.invoke('cloud-leak-scanner', {
        body: { domain: domain.trim() }
      });

      if (error) throw error;

      setResults(data.results || []);
      setStats({
        scanned: data.scanned_patterns || 0,
        found: data.found_buckets || 0,
        public: data.public_buckets || 0,
      });

      if (data.public_buckets > 0) {
        toast({
          title: "⚠️ Buckets Públicos Detectados!",
          description: `${data.public_buckets} bucket(s) exposto(s) encontrado(s)`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scan Concluído",
          description: `${data.found_buckets} bucket(s) encontrado(s), nenhum público`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no Scan",
        description: error.message || "Falha ao verificar buckets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cloud Leak Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Verificador de buckets S3 públicos e exposição de dados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Padrões Verificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scanned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Buckets Encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.found}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Buckets Públicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.public}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Scanner de Buckets AWS S3
          </CardTitle>
          <CardDescription>
            Verifica padrões comuns de nomenclatura de buckets S3 baseados no domínio
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

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buckets Encontrados</CardTitle>
            <CardDescription>
              Análise de exposição de buckets S3 para {domain}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Bucket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{result.bucket_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result.is_public ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Shield className="h-4 w-4 text-green-500" />
                          )}
                          <span>{result.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.severity === 'critical' ? 'destructive' : 'outline'}>
                          {result.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {result.url}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
