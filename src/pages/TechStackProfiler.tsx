import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Code2, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Technology {
  name: string;
  value: string;
  category: string;
  source: string;
}

interface Vulnerability {
  type: string;
  severity: string;
  description: string;
}

export default function TechStackProfiler() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [securityScore, setSecurityScore] = useState<number | null>(null);

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
    setTechnologies([]);
    setVulnerabilities([]);
    setSecurityScore(null);

    try {
      const { data, error } = await supabase.functions.invoke('tech-stack-profiler', {
        body: { domain: domain.trim() }
      });

      if (error) throw error;

      setTechnologies(data.technologies || []);
      setVulnerabilities(data.vulnerabilities || []);
      setSecurityScore(data.security_score || 0);

      toast({
        title: "Análise Concluída",
        description: `Score de segurança: ${data.security_score}/100`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na Análise",
        description: error.message || "Falha ao analisar stack tecnológico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" | "outline" => {
    if (severity === 'high' || severity === 'critical') return "destructive";
    if (severity === 'medium') return "default";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tech Stack Profiler</h1>
        <p className="text-muted-foreground mt-1">
          Análise de tecnologias e vulnerabilidades via headers e meta tags
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Analisador de Stack Tecnológico
          </CardTitle>
          <CardDescription>
            Identifica frameworks, servidores e vulnerabilidades conhecidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="https://exemplo.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              disabled={loading}
            />
            <Button onClick={handleScan} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando
                </>
              ) : (
                'Iniciar Análise'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {securityScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Score de Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              {securityScore >= 80 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {technologies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tecnologias Detectadas</CardTitle>
            <CardDescription>
              {technologies.length} tecnologia(s) identificada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technologies.map((tech, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{tech.name}</TableCell>
                      <TableCell className="font-mono text-sm">{tech.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tech.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{tech.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {vulnerabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Vulnerabilidades Identificadas
            </CardTitle>
            <CardDescription>
              {vulnerabilities.length} problema(s) de segurança encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vulnerabilities.map((vuln, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{vuln.type}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityVariant(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{vuln.description}</TableCell>
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
