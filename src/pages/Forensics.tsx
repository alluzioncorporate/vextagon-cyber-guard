import { useState } from "react";
import { Microscope, Search, Loader2, FileText, Cpu, HardDrive, Bug, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVpsTool } from "@/hooks/useVpsTool";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const forensicTools = [
  { id: "volatility", name: "Volatility", description: "Análise de memória RAM - processos, conexões, malware em memória", icon: Cpu },
  { id: "rkhunter", name: "rkhunter", description: "Detecção de rootkits em sistemas Linux", icon: Bug },
  { id: "chkrootkit", name: "chkrootkit", description: "Scanner secundário de rootkits", icon: Shield },
  { id: "yara", name: "YARA", description: "Detecção de malware baseada em regras/patterns", icon: FileText },
];

const mockYaraMatches = [
  { rule: "Emotet_Banking_Trojan", file: "/tmp/suspicious.exe", severity: "critical", description: "Emotet dropper detected" },
  { rule: "Cobalt_Strike_Beacon", file: "/var/www/beacon.dll", severity: "critical", description: "Cobalt Strike payload" },
  { rule: "Webshell_PHP", file: "/var/www/html/shell.php", severity: "high", description: "PHP webshell detected" },
];

const mockRootkitResults = {
  rkhunter: {
    warnings: 2,
    items: [
      { name: "Hidden process detected", status: "warning", path: "/proc/1234" },
      { name: "Suspicious file permissions", status: "warning", path: "/usr/bin/sudo" },
      { name: "System binary check", status: "ok", path: "/bin/ls" },
      { name: "Kernel module check", status: "ok", path: "kernel" },
    ],
  },
};

export default function Forensics() {
  const [activeTab, setActiveTab] = useState("yara");
  const [target, setTarget] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { runTool } = useVpsTool();

  const handleRun = async (tool: string) => {
    setLoading(true);
    // Simulate forensic analysis
    await new Promise((r) => setTimeout(r, 3000));
    
    if (tool === "yara") {
      setResults({ type: "yara", matches: mockYaraMatches });
    } else if (tool === "rkhunter" || tool === "chkrootkit") {
      setResults({ type: "rootkit", data: mockRootkitResults.rkhunter });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-foreground flex items-center gap-2">
          <Microscope className="h-5 w-5 text-destructive" />
          Análise Forense
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ferramentas de forense digital, detecção de malware e análise de memória
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="yara" className="text-xs">YARA Rules</TabsTrigger>
          <TabsTrigger value="rootkit" className="text-xs">Rootkit Detection</TabsTrigger>
          <TabsTrigger value="memory" className="text-xs">Memory Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="yara" className="space-y-4">
          <div className="v-card p-4">
            <p className="v-section-title mb-3">Scan com YARA Rules</p>
            <p className="text-[10px] text-muted-foreground mb-3">
              Escaneia arquivos e diretórios usando 5.000+ regras YARA para detectar malware, webshells, backdoors e mais.
            </p>
            <div className="flex gap-2">
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="/var/www ou /home/user"
                className="bg-secondary/50 font-mono text-xs border-border flex-1"
              />
              <Button onClick={() => handleRun("yara")} disabled={loading} className="bg-destructive hover:bg-destructive/90 text-xs">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
                Escanear
              </Button>
            </div>
          </div>

          {results?.type === "yara" && (
            <div className="v-card overflow-hidden">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <p className="v-section-title">Malware Detectado</p>
                <span className="font-mono text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                  {results.matches.length} MATCHES
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {results.matches.map((match: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <Bug className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono font-medium text-foreground">{match.rule}</p>
                        <span className={cn(
                          "font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                          match.severity === "critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                        )}>
                          {match.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{match.description}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{match.file}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] text-destructive">
                      Quarentena
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rootkit" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {forensicTools.filter(t => t.id === "rkhunter" || t.id === "chkrootkit").map((tool) => (
              <div key={tool.id} className="v-card p-4">
                <tool.icon className="h-5 w-5 text-destructive mb-2" />
                <p className="text-xs font-semibold text-foreground">{tool.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{tool.description}</p>
                <Button onClick={() => handleRun(tool.id)} disabled={loading} size="sm" className="mt-3 text-[10px] w-full bg-destructive hover:bg-destructive/90">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Executar"}
                </Button>
              </div>
            ))}
          </div>

          {results?.type === "rootkit" && (
            <div className="v-card overflow-hidden">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <p className="v-section-title">Resultado do Scan</p>
                {results.data.warnings > 0 ? (
                  <span className="font-mono text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded">
                    {results.data.warnings} WARNINGS
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                    CLEAN
                  </span>
                )}
              </div>
              <div className="divide-y divide-border/40">
                {results.data.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {item.status === "warning" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <Shield className="h-3.5 w-3.5 text-success" />
                      )}
                      <span className="text-xs text-foreground">{item.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{item.path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="v-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-4 w-4 text-destructive" />
              <p className="v-section-title">Volatility - Análise de Memória</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
              Analisa dumps de memória RAM para encontrar processos ocultos, conexões de rede maliciosas, código injetado e artefatos de malware.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["pslist (Processos)", "netscan (Conexões)", "malfind (Malware)", "cmdline (Comandos)"].map((cmd) => (
                <Button key={cmd} variant="outline" size="sm" className="text-[10px] justify-start">
                  {cmd}
                </Button>
              ))}
            </div>
          </div>

          <div className="v-card p-6 text-center">
            <HardDrive className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-xs text-muted-foreground">
              Faça upload de um dump de memória ou capture do servidor monitorado
            </p>
            <Button variant="outline" size="sm" className="mt-3 text-xs">
              Capturar Memória do Servidor
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
