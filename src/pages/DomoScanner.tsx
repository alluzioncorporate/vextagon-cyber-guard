import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Radar,
  Layers,
  Skull,
  Globe,
  Lock,
  ShieldAlert,
  Server,
  Network,
  Cpu,
  Database,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { validateDomain } from "@/lib/scanEngine";
import {
  runLevel1,
  runLevel2,
  runLevel3,
  type DomoProgress,
  type L1Report,
  type L2Report,
  type L3Report,
  type AgentSnapshot,
} from "@/lib/domoEngine";
import { supabase } from "@/integrations/supabase/client";

type LevelKey = "L1" | "L2" | "L3";

const LEVEL_META: Record<LevelKey, { title: string; subtitle: string; icon: any; tint: string; ring: string }> = {
  L1: {
    title: "Nível 1 — Superfície",
    subtitle: "DNS, SSL/TLS e Headers HTTP. Reconhecimento rápido.",
    icon: Radar,
    tint: "text-cyan",
    ring: "from-cyan/40 to-transparent",
  },
  L2: {
    title: "Nível 2 — Profundo",
    subtitle: "Subdomínios, Tech Stack (Wappalyzer logic) e CVEs conhecidas.",
    icon: Layers,
    tint: "text-gold",
    ring: "from-gold/40 to-transparent",
  },
  L3: {
    title: "Nível 3 — Núcleo",
    subtitle: "Vazamentos na Dark Web e integração com o Agente instalado.",
    icon: Skull,
    tint: "text-destructive",
    ring: "from-destructive/40 to-transparent",
  },
};

const SEVERITY_CLASS: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-gold/15 text-gold border-gold/30",
  low: "bg-cyan/10 text-cyan border-cyan/30",
};

function ProgressBar({ progress }: { progress: DomoProgress | null }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-muted-foreground truncate flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          {progress?.label || "Aguardando..."}
          {progress?.message && <span className="text-foreground/70">· {progress.message}</span>}
        </span>
        <span className="text-primary">{Math.round(progress?.percent ?? 0)}%</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-glass shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)] transition-all duration-500"
          style={{ width: `${progress?.percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ score, label, invert = false }: { score: number; label: string; invert?: boolean }) {
  const good = invert ? 100 - score : score;
  const color = good >= 75 ? "text-success" : good >= 45 ? "text-warning" : "text-destructive";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-glass p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
      <div className={cn("font-mono text-3xl font-bold", color)}>{score}</div>
      <div className="v-label mt-1">{label}</div>
    </div>
  );
}

export default function DomoScanner() {
  const [domain, setDomain] = useState("");
  const [active, setActive] = useState<LevelKey>("L1");
  const { toast } = useToast();

  const [running, setRunning] = useState<Record<LevelKey, boolean>>({ L1: false, L2: false, L3: false });
  const [progress, setProgress] = useState<Record<LevelKey, DomoProgress | null>>({ L1: null, L2: null, L3: null });
  const [l1, setL1] = useState<L1Report | null>(null);
  const [l2, setL2] = useState<L2Report | null>(null);
  const [l3, setL3] = useState<L3Report | null>(null);
  const [agent, setAgent] = useState<AgentSnapshot | null>(null);

  // Carrega último agente instalado (para L3)
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("server_monitoring")
          .select("hostname, ip_address, os_info, cpu_usage, ram_usage, disk_usage, open_ports, security_updates, last_seen")
          .eq("user_id", user.id)
          .order("last_seen", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!data) return;
        setAgent({
          hostname: data.hostname,
          ip: data.ip_address,
          os: (data.os_info as any)?.name || "Linux",
          cpu: Number(data.cpu_usage ?? 0),
          ram: Number(data.ram_usage ?? 0),
          disk: Number(data.disk_usage ?? 0),
          openPorts: Array.isArray(data.open_ports) ? data.open_ports.length : 0,
          pendingUpdates: Array.isArray(data.security_updates) ? data.security_updates.length : 0,
          lastSeen: data.last_seen,
        });
      } catch {
        // Erro silencioso — agente é opcional
      }
    })();
  }, []);

  const ensureDomain = (): string | null => {
    const trimmed = domain.trim().toLowerCase();
    const v = validateDomain(trimmed);
    if (!v.valid) {
      toast({ title: "Domínio inválido", description: v.reason, variant: "destructive" });
      return null;
    }
    return trimmed;
  };

  const runL1 = async () => {
    const d = ensureDomain(); if (!d) return;
    setRunning((r) => ({ ...r, L1: true })); setL1(null);
    setProgress((p) => ({ ...p, L1: { step: "init", label: "Iniciando varredura de superfície", percent: 0 } }));
    try {
      const rep = await runLevel1(d, (p) => setProgress((s) => ({ ...s, L1: p })));
      setL1(rep);
    } finally {
      setRunning((r) => ({ ...r, L1: false }));
    }
  };

  const runL2 = async () => {
    const d = ensureDomain(); if (!d) return;
    setRunning((r) => ({ ...r, L2: true })); setL2(null);
    setProgress((p) => ({ ...p, L2: { step: "init", label: "Iniciando varredura profunda", percent: 0 } }));
    try {
      const rep = await runLevel2(d, (p) => setProgress((s) => ({ ...s, L2: p })));
      setL2(rep);
    } finally {
      setRunning((r) => ({ ...r, L2: false }));
    }
  };

  const runL3 = async () => {
    const d = ensureDomain(); if (!d) return;
    setRunning((r) => ({ ...r, L3: true })); setL3(null);
    setProgress((p) => ({ ...p, L3: { step: "init", label: "Iniciando análise do núcleo", percent: 0 } }));
    try {
      const rep = await runLevel3(d, (p) => setProgress((s) => ({ ...s, L3: p })), { agent });
      setL3(rep);
    } finally {
      setRunning((r) => ({ ...r, L3: false }));
    }
  };

  const runAll = async () => {
    if (!ensureDomain()) return;
    await runL1();
    await runL2();
    await runL3();
  };

  const meta = LEVEL_META[active];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
            O Domo — Análise em 3 Níveis
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cobertura progressiva: superfície → profundidade → núcleo. Cada nível gera um relatório técnico.
          </p>
        </div>
      </div>

      {/* Domain bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Alvo</Label>
              <Input
                placeholder="exemplo.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAll()}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActive("L1")} disabled={running.L1 || running.L2 || running.L3}>
                <Radar className="h-4 w-4" /> L1
              </Button>
              <Button variant="outline" onClick={() => setActive("L2")} disabled={running.L1 || running.L2 || running.L3}>
                <Layers className="h-4 w-4" /> L2
              </Button>
              <Button variant="outline" onClick={() => setActive("L3")} disabled={running.L1 || running.L2 || running.L3}>
                <Skull className="h-4 w-4" /> L3
              </Button>
              <Button onClick={runAll} disabled={running.L1 || running.L2 || running.L3}>
                <Sparkles className="h-4 w-4" /> Cobertura completa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={active} onValueChange={(v) => setActive(v as LevelKey)} className="space-y-4">
        <TabsList className="bg-white/[0.04] border border-white/10 backdrop-blur-glass p-1">
          <TabsTrigger value="L1" className="data-[state=active]:bg-cyan/15 data-[state=active]:text-cyan">
            <Radar className="h-3.5 w-3.5 mr-1" /> Superfície
          </TabsTrigger>
          <TabsTrigger value="L2" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold">
            <Layers className="h-3.5 w-3.5 mr-1" /> Profundo
          </TabsTrigger>
          <TabsTrigger value="L3" className="data-[state=active]:bg-destructive/15 data-[state=active]:text-destructive">
            <Skull className="h-3.5 w-3.5 mr-1" /> Núcleo
          </TabsTrigger>
        </TabsList>

        {/* L1 */}
        <TabsContent value="L1" className="space-y-4">
          <LevelHeader meta={LEVEL_META.L1} onRun={runL1} running={running.L1} progress={progress.L1} />
          {l1 && <L1View report={l1} />}
        </TabsContent>

        {/* L2 */}
        <TabsContent value="L2" className="space-y-4">
          <LevelHeader meta={LEVEL_META.L2} onRun={runL2} running={running.L2} progress={progress.L2} />
          {l2 && <L2View report={l2} />}
        </TabsContent>

        {/* L3 */}
        <TabsContent value="L3" className="space-y-4">
          <LevelHeader meta={LEVEL_META.L3} onRun={runL3} running={running.L3} progress={progress.L3} agent={agent} />
          {l3 && <L3View report={l3} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LevelHeader({
  meta,
  onRun,
  running,
  progress,
  agent,
}: {
  meta: typeof LEVEL_META["L1"];
  onRun: () => void;
  running: boolean;
  progress: DomoProgress | null;
  agent?: AgentSnapshot | null;
}) {
  const Icon = meta.icon;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl border border-white/10 flex items-center justify-center bg-gradient-to-br", meta.ring, "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15)]")}>
              <Icon strokeWidth={1.6} className={cn("h-5 w-5", meta.tint)} />
            </div>
            <div>
              <CardTitle className={cn("text-sm font-semibold", meta.tint)}>{meta.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
            </div>
          </div>
          <Button onClick={onRun} disabled={running}>
            {running ? <><Clock className="h-4 w-4 animate-pulse" /> Executando...</> : <>Executar nível</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(running || progress) && <ProgressBar progress={progress} />}
        {agent !== undefined && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <Server className="h-3 w-3" />
            {agent ? (
              <span>Agente sincronizado: <span className="text-foreground">{agent.hostname}</span> ({agent.ip})</span>
            ) : (
              <span>Nenhum Vextagon Insight Agent instalado — instale para enriquecer o L3.</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── L1 View ──
function L1View({ report }: { report: L1Report }) {
  const presentHeaders = Object.entries(report.headers).filter(([, v]) => v.present);
  const missingHeaders = Object.entries(report.headers).filter(([, v]) => !v.present);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ScoreRing score={report.headersScore} label="Headers Score" />
      <ScoreRing score={report.ssl.valid ? 90 : 30} label={`SSL · ${report.sslGrade}`} />
      <ScoreRing score={report.dns.records.length * 18 > 100 ? 100 : report.dns.records.length * 18} label="DNS Coverage" />

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-cyan" /> Registros DNS</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {report.dns.records.map((r, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 font-mono text-xs">
                <span className="text-cyan">{r.type}</span> <span className="text-foreground/80">{r.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-cyan" /> SSL/TLS</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-xs font-mono">
          <Row k="Emissor" v={report.ssl.issuer} />
          <Row k="Protocolo" v={report.ssl.protocol} />
          <Row k="Expira em" v={report.ssl.expiresAt} />
          <Row k="Grade" v={report.ssl.grade} />
          <Row k="Válido" v={report.ssl.valid ? "Sim" : "Não"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-cyan" /> Headers</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-xs">
          <p className="text-success flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> {presentHeaders.length} presentes</p>
          <p className="text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> {missingHeaders.length} ausentes</p>
          {missingHeaders.slice(0, 4).map(([h]) => (
            <p key={h} className="font-mono text-[10px] text-muted-foreground">– {h}</p>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Sumário Técnico</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-foreground/90">{report.summary}</p></CardContent>
      </Card>
    </div>
  );
}

// ── L2 View ──
function L2View({ report }: { report: L2Report }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ScoreRing score={report.exposureScore} label="Exposição" invert />
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Network className="h-4 w-4 text-gold" /> Subdomínios ({report.subdomains.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-auto">
            {report.subdomains.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs font-mono">
                <span className="text-foreground/90 truncate">{s.name}</span>
                <Badge variant="outline" className={cn("text-[9px]", s.status === "active" ? "text-success border-success/30" : "text-muted-foreground")}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4 text-gold" /> Tech Stack</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {report.technologies.map((t, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t.category}</span>
              <span className="font-mono text-foreground">{t.name}{t.version ? ` ${t.version}` : ""}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-gold" /> CVEs ({report.cves.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-72 overflow-auto">
          {report.cves.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-cyan">{c.id}</span>
                <Badge className={cn("text-[10px] border", SEVERITY_CLASS[c.severity])}>{c.severity.toUpperCase()}</Badge>
              </div>
              <p className="text-xs font-medium text-foreground">{c.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{c.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Afeta: {c.affected}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Sumário Técnico</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-foreground/90">{report.summary}</p></CardContent>
      </Card>
    </div>
  );
}

// ── L3 View ──
function L3View({ report }: { report: L3Report }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ScoreRing score={report.coreRiskScore} label="Risco do Núcleo" invert />
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-destructive" /> Vazamentos na Dark Web</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-auto">
          {report.leaks.map((l, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-foreground">{l.source}</span>
                <Badge className={cn("text-[10px] border", SEVERITY_CLASS[l.severity])}>{l.severity.toUpperCase()}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 font-mono">
                <span>📅 {l.date}</span>
                <span>📊 {l.recordCount.toLocaleString("pt-BR")} registros</span>
                {l.marketplace && <span>🏴 {l.marketplace}</span>}
                {l.priceUSD && <span>💰 ${l.priceUSD}</span>}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {l.exposed.map((e) => <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4 text-destructive" /> Vextagon Insight Agent</CardTitle></CardHeader>
        <CardContent>
          {report.agent ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Stat icon={Server} label="Hostname" value={report.agent.hostname} />
              <Stat icon={Network} label="IP" value={report.agent.ip} />
              <Stat icon={Cpu} label="CPU" value={`${report.agent.cpu.toFixed(1)}%`} />
              <Stat icon={Database} label="RAM" value={`${report.agent.ram.toFixed(1)}%`} />
              <Stat icon={Database} label="Disco" value={`${report.agent.disk.toFixed(1)}%`} />
              <Stat icon={Network} label="Portas abertas" value={String(report.agent.openPorts)} />
              <Stat icon={AlertTriangle} label="Updates pendentes" value={String(report.agent.pendingUpdates)} />
              <Stat icon={Clock} label="OS" value={report.agent.os} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum agente instalado. Vá em <span className="text-primary">Insight Agent</span> e instale o Vextagon Master Agent para correlacionar dados internos.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Sumário Técnico</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-foreground/90">{report.summary}</p></CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5 v-label"><Icon className="h-3 w-3" /> {label}</div>
      <p className="font-mono text-sm text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}
