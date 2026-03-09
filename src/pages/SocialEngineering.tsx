import { useState } from "react";
import {
  Users,
  ShieldAlert,
  Phone,
  Mail,
  MessageSquare,
  Link2,
  FileWarning,
  UserCheck,
  Baby,
  Briefcase,
  CheckCircle2,
  Play,
  AlertTriangle,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  audience: "Funcionários" | "Família" | "Todos";
  scenarios: number;
  duration: string;
  difficulty: "Básico" | "Intermediário" | "Avançado";
  progress: number;
  attacks: string[];
}

const modules: TrainingModule[] = [
  {
    id: "phishing-email",
    title: "Phishing por Email",
    description:
      "Identifique emails falsos, links maliciosos e anexos perigosos. Simulações realistas com templates de bancos, governo e redes sociais.",
    icon: Mail,
    audience: "Todos",
    scenarios: 12,
    duration: "1h 30min",
    difficulty: "Básico",
    progress: 0,
    attacks: ["Spear Phishing", "Clone Phishing", "BEC"],
  },
  {
    id: "vishing",
    title: "Vishing — Golpes por Telefone",
    description:
      "Reconheça golpes por ligação: falso suporte técnico, sequestro relâmpago, falsas centrais de banco. Aprenda a reagir e denunciar.",
    icon: Phone,
    audience: "Família",
    scenarios: 8,
    duration: "1h",
    difficulty: "Básico",
    progress: 0,
    attacks: ["Falso Suporte", "Falso Sequestro", "Central Falsa"],
  },
  {
    id: "smishing",
    title: "Smishing — Golpes por SMS/WhatsApp",
    description:
      "Mensagens falsas de entregas, promoções e bancos. Aprenda a identificar links encurtados maliciosos e proteger o WhatsApp.",
    icon: MessageSquare,
    audience: "Família",
    scenarios: 10,
    duration: "45min",
    difficulty: "Básico",
    progress: 0,
    attacks: ["SMS Falso", "WhatsApp Clonado", "Link Encurtado"],
  },
  {
    id: "pretexting",
    title: "Pretexting & Manipulação",
    description:
      "Técnicas de manipulação psicológica usadas por atacantes: urgência, autoridade, reciprocidade. Como funcionários devem reagir.",
    icon: UserCheck,
    audience: "Funcionários",
    scenarios: 6,
    duration: "1h 15min",
    difficulty: "Intermediário",
    progress: 0,
    attacks: ["Autoridade Falsa", "Urgência", "Reciprocidade"],
  },
  {
    id: "baiting",
    title: "Baiting & USB Drops",
    description:
      "Pendrives abandonados, QR codes falsos, carregadores comprometidos. Como dispositivos físicos são usados para invadir.",
    icon: Link2,
    audience: "Funcionários",
    scenarios: 5,
    duration: "40min",
    difficulty: "Intermediário",
    progress: 0,
    attacks: ["USB Drop", "QR Code Falso", "Carregador Malicioso"],
  },
  {
    id: "kids-safety",
    title: "Segurança para Crianças e Idosos",
    description:
      "Proteção de parentes vulneráveis: golpes do Pix, falsos prêmios, redes sociais perigosas, cyberbullying e exposição online.",
    icon: Baby,
    audience: "Família",
    scenarios: 8,
    duration: "1h",
    difficulty: "Básico",
    progress: 0,
    attacks: ["Golpe do Pix", "Falso Prêmio", "Cyberbullying"],
  },
  {
    id: "corporate-social",
    title: "Engenharia Social Corporativa",
    description:
      "Ataques direcionados a empresas: CEO Fraud, tailgating, impersonation, shoulder surfing. Políticas de segurança e resposta.",
    icon: Briefcase,
    audience: "Funcionários",
    scenarios: 7,
    duration: "1h 30min",
    difficulty: "Avançado",
    progress: 0,
    attacks: ["CEO Fraud", "Tailgating", "Shoulder Surfing"],
  },
  {
    id: "data-exposure",
    title: "Exposição de Dados Pessoais",
    description:
      "Como atacantes coletam dados públicos para criar ataques personalizados. Proteção de redes sociais e presença digital.",
    icon: FileWarning,
    audience: "Todos",
    scenarios: 6,
    duration: "50min",
    difficulty: "Intermediário",
    progress: 0,
    attacks: ["OSINT Social", "Doxing", "Fake Profile"],
  },
];

const audienceColors: Record<string, string> = {
  Funcionários: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Família: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Todos: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const difficultyColors: Record<string, string> = {
  Básico: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediário: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Avançado: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function SocialEngineering() {
  const [selectedAudience, setSelectedAudience] = useState<string>("Todos");

  const audiences = ["Todos", "Funcionários", "Família"];

  const filtered =
    selectedAudience === "Todos"
      ? modules
      : modules.filter((m) => m.audience === selectedAudience || m.audience === "Todos");

  const totalScenarios = modules.reduce((acc, m) => acc + m.scenarios, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-gold" />
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            Engenharia Social
          </h1>
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20 text-[10px]">
            DOMO 2
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Treinamento contra ataques de engenharia social. Proteja funcionários e familiares.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Módulos", value: modules.length, icon: Target },
          { label: "Cenários", value: totalScenarios, icon: AlertTriangle },
          { label: "Concluídos", value: 0, icon: CheckCircle2 },
          { label: "Pessoas treinadas", value: 0, icon: Users },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className="h-5 w-5 text-gold shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Audience filter */}
      <div className="flex flex-wrap gap-2">
        {audiences.map((aud) => (
          <Button
            key={aud}
            size="sm"
            variant={selectedAudience === aud ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setSelectedAudience(aud)}
          >
            {aud === "Funcionários" && <Briefcase className="mr-1 h-3 w-3" />}
            {aud === "Família" && <Baby className="mr-1 h-3 w-3" />}
            {aud === "Todos" && <Users className="mr-1 h-3 w-3" />}
            {aud}
          </Button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mod) => (
          <Card
            key={mod.id}
            className="group border-border/50 transition-all hover:border-gold/30 hover:shadow-md hover:shadow-gold/5"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-secondary p-2 text-gold">
                  <mod.icon className="h-5 w-5" />
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className={cn("text-[9px]", audienceColors[mod.audience])}>
                    {mod.audience}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[9px]", difficultyColors[mod.difficulty])}>
                    {mod.difficulty}
                  </Badge>
                </div>
              </div>
              <CardTitle className="mt-3 text-sm font-semibold">{mod.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {mod.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Attack types */}
              <div className="flex flex-wrap gap-1">
                {mod.attacks.map((atk) => (
                  <span
                    key={atk}
                    className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground"
                  >
                    {atk}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{mod.scenarios} cenários</span>
                <span>{mod.duration}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-mono text-foreground">{mod.progress}%</span>
                </div>
                <Progress value={mod.progress} className="h-1.5" />
              </div>

              <Button size="sm" className="w-full h-8 text-xs" variant="outline">
                <Play className="mr-1 h-3 w-3" />
                Iniciar Treinamento
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
