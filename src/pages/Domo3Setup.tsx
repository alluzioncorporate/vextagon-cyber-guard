import { useState } from "react";
import {
  Terminal,
  Skull,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Server,
  Shield,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ToolSetup {
  id: string;
  name: string;
  description: string;
  category: "Scanner" | "Brute Force" | "Fuzzing" | "Forense" | "Defesa" | "Audit";
  installCmd: string;
  verifyCmd: string;
  notes?: string;
  url?: string;
}

const tools: ToolSetup[] = [
  {
    id: "nuclei",
    name: "Nuclei",
    description: "Scanner de vulnerabilidades com 10k+ templates. Detecta CVEs, misconfigurations, exposed panels.",
    category: "Scanner",
    installCmd: "go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest\nnuclei -update-templates",
    verifyCmd: "nuclei -version",
    notes: "Requer Go 1.21+. Templates atualizados automaticamente.",
    url: "https://github.com/projectdiscovery/nuclei",
  },
  {
    id: "masscan",
    name: "Masscan",
    description: "Scanner de portas ultrarrápido. Pode escanear a internet inteira em 5 minutos.",
    category: "Scanner",
    installCmd: "sudo apt install -y masscan",
    verifyCmd: "masscan --version",
    notes: "Use com cuidado — taxa alta pode triggerar firewalls e IDS.",
  },
  {
    id: "nikto",
    name: "Nikto",
    description: "Scanner de vulnerabilidades web. Detecta arquivos perigosos, versões desatualizadas e misconfigurations.",
    category: "Scanner",
    installCmd: "sudo apt install -y nikto",
    verifyCmd: "nikto -Version",
    url: "https://github.com/sullo/nikto",
  },
  {
    id: "gobuster",
    name: "Gobuster",
    description: "Brute force de diretórios, DNS e vhosts. Rápido e escrito em Go.",
    category: "Brute Force",
    installCmd: "sudo apt install -y gobuster",
    verifyCmd: "gobuster version",
    url: "https://github.com/OJ/gobuster",
  },
  {
    id: "hydra",
    name: "Hydra",
    description: "Brute force de login para SSH, FTP, HTTP, RDP, MySQL e mais 50 protocolos.",
    category: "Brute Force",
    installCmd: "sudo apt install -y hydra",
    verifyCmd: "hydra -h | head -3",
    notes: "Apenas para uso autorizado em pentest controlado.",
  },
  {
    id: "sqlmap",
    name: "SQLMap",
    description: "Detecção e exploração automatizada de SQL Injection. Suporta MySQL, PostgreSQL, MSSQL, Oracle.",
    category: "Fuzzing",
    installCmd: "sudo apt install -y sqlmap",
    verifyCmd: "sqlmap --version",
    url: "https://github.com/sqlmapproject/sqlmap",
  },
  {
    id: "wfuzz",
    name: "Wfuzz",
    description: "Fuzzing de parâmetros web, headers, cookies. Encontra endpoints ocultos e bypasses.",
    category: "Fuzzing",
    installCmd: "pip3 install wfuzz",
    verifyCmd: "wfuzz --version",
  },
  {
    id: "volatility",
    name: "Volatility 3",
    description: "Framework de análise forense de memória. Extrai processos, conexões, malware de dumps de RAM.",
    category: "Forense",
    installCmd: "pip3 install volatility3",
    verifyCmd: "vol -h | head -5",
    url: "https://github.com/volatilityfoundation/volatility3",
  },
  {
    id: "yara",
    name: "YARA",
    description: "Regras para identificação e classificação de malware. Usado por analistas de segurança globalmente.",
    category: "Forense",
    installCmd: "sudo apt install -y yara",
    verifyCmd: "yara --version",
    url: "https://github.com/VirusTotal/yara",
  },
  {
    id: "rkhunter",
    name: "rkhunter & chkrootkit",
    description: "Detecção de rootkits, backdoors e exploits locais em servidores Linux.",
    category: "Defesa",
    installCmd: "sudo apt install -y rkhunter chkrootkit\nsudo rkhunter --update",
    verifyCmd: "rkhunter --version && chkrootkit -V",
  },
  {
    id: "lynis",
    name: "Lynis",
    description: "Auditoria de segurança completa do sistema. Gera score e recomendações de hardening.",
    category: "Audit",
    installCmd: "sudo apt install -y lynis",
    verifyCmd: "lynis show version",
    url: "https://cisofy.com/lynis/",
  },
];

const fullInstallScript = `#!/bin/bash
# Vextagon DOMO 3 — Setup Completo
# Execute como root no seu servidor Linux (Ubuntu/Debian)

set -e
echo "🔴 VEXTAGON DOMO 3 — Instalando Arsenal..."

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Dependências base
sudo apt install -y git curl wget python3 python3-pip golang-go build-essential

# === SCANNERS ===
sudo apt install -y masscan nikto nmap
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
nuclei -update-templates

# === BRUTE FORCE ===
sudo apt install -y gobuster hydra

# === FUZZING & INJECTION ===
sudo apt install -y sqlmap
pip3 install wfuzz

# === FORENSE ===
pip3 install volatility3
sudo apt install -y yara

# === DEFESA ===
sudo apt install -y rkhunter chkrootkit lynis
sudo rkhunter --update

echo ""
echo "✅ DOMO 3 Arsenal instalado com sucesso!"
echo "Execute 'nuclei -version && masscan --version && lynis show version' para verificar."
`;

const categoryColors: Record<string, string> = {
  Scanner: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Brute Force": "bg-red-500/10 text-red-400 border-red-500/20",
  Fuzzing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Forense: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Defesa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Audit: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function Domo3Setup() {
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const { toast } = useToast();

  const categories = ["Todos", ...new Set(tools.map((t) => t.category))];

  const filtered =
    selectedCategory === "Todos"
      ? tools
      : tools.filter((t) => t.category === selectedCategory);

  const toggleTool = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Skull className="h-6 w-6 text-destructive" />
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            DOMO 3 — Setup Arsenal
          </h1>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
            HIGH
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Instruções para instalar as ferramentas ofensivas e forenses no seu servidor Linux.
        </p>
      </div>

      {/* Warning */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Aviso Importante</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estas ferramentas são exclusivamente para uso autorizado em pentest e defesa.
              O uso indevido pode violar leis de crimes cibernéticos. Execute apenas em ambientes que você tem permissão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Install */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Instalação Rápida — Script Completo</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => copyToClipboard(fullInstallScript, "Script completo")}
            >
              <Copy className="mr-1 h-3 w-3" />
              Copiar Script
            </Button>
          </div>
          <CardDescription className="text-xs">
            Instala todas as ferramentas de uma vez. Ubuntu/Debian. Execute como root.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-48 overflow-auto rounded-lg bg-secondary/50 p-3 text-[11px] font-mono text-muted-foreground leading-relaxed">
            {fullInstallScript}
          </pre>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Ferramentas", value: tools.length, icon: Terminal },
          { label: "Categorias", value: categories.length - 1, icon: Server },
          { label: "Instaladas", value: 0, icon: CheckCircle2 },
          { label: "Requer Go", value: 1, icon: Shield },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={selectedCategory === cat ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Tools List */}
      <div className="space-y-2">
        {filtered.map((tool) => {
          const isOpen = expandedTools[tool.id];
          return (
            <Card key={tool.id} className="border-border/50 transition-all hover:border-destructive/20">
              <button
                onClick={() => toggleTool(tool.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Terminal className="h-4 w-4 text-destructive shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{tool.name}</span>
                      <Badge variant="outline" className={cn("text-[9px]", categoryColors[tool.category])}>
                        {tool.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isOpen && (
                <CardContent className="pt-0 pb-4 space-y-3">
                  {/* Install */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Instalar</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(tool.installCmd, tool.name); }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                    <pre className="rounded-md bg-secondary/50 p-2.5 text-[11px] font-mono text-foreground whitespace-pre-wrap">
                      {tool.installCmd}
                    </pre>
                  </div>

                  {/* Verify */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Verificar</span>
                    <pre className="rounded-md bg-secondary/50 p-2.5 text-[11px] font-mono text-foreground">
                      {tool.verifyCmd}
                    </pre>
                  </div>

                  {/* Notes */}
                  {tool.notes && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {tool.notes}
                    </p>
                  )}

                  {/* Link */}
                  {tool.url && (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Documentação oficial
                    </a>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
