import { useState } from "react";
import {
  GraduationCap,
  Shield,
  Mail,
  Key,
  Lock,
  Smartphone,
  Globe,
  CheckCircle2,
  Clock,
  Play,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  modules: number;
  duration: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  progress: number;
  color: string;
}

const courses: Course[] = [
  {
    id: "bitwarden",
    title: "Bitwarden — Gerenciador de Senhas",
    description:
      "Aprenda a configurar e usar o Bitwarden para proteger todas as suas credenciais. Crie senhas fortes, compartilhe cofres com equipes e ative 2FA.",
    icon: Key,
    category: "Senhas & Credenciais",
    modules: 6,
    duration: "2h 30min",
    level: "Iniciante",
    progress: 0,
    color: "text-cyan",
  },
  {
    id: "protonmail",
    title: "Proton Mail — Email Seguro",
    description:
      "Configure o Proton Mail como seu email principal. Aprenda criptografia end-to-end, aliases, filtros e como migrar do Gmail/Outlook.",
    icon: Mail,
    category: "Comunicação Segura",
    modules: 5,
    duration: "2h",
    level: "Iniciante",
    progress: 0,
    color: "text-primary",
  },
  {
    id: "2fa",
    title: "Autenticação em Duas Etapas (2FA)",
    description:
      "Entenda os tipos de 2FA (TOTP, FIDO2, SMS), configure aplicativos autenticadores e proteja suas contas mais importantes.",
    icon: Smartphone,
    category: "Autenticação",
    modules: 4,
    duration: "1h 30min",
    level: "Iniciante",
    progress: 0,
    color: "text-gold",
  },
  {
    id: "vpn",
    title: "VPN & Navegação Privada",
    description:
      "Aprenda a usar VPNs corretamente, entenda DNS-over-HTTPS, Tor Browser e como navegar sem expor seus dados.",
    icon: Globe,
    category: "Privacidade",
    modules: 5,
    duration: "2h",
    level: "Intermediário",
    progress: 0,
    color: "text-cyan",
  },
  {
    id: "encryption",
    title: "Criptografia para Leigos",
    description:
      "Entenda AES, RSA, PGP e como aplicar criptografia em arquivos, emails e comunicações do dia a dia.",
    icon: Lock,
    category: "Criptografia",
    modules: 7,
    duration: "3h",
    level: "Intermediário",
    progress: 0,
    color: "text-destructive",
  },
  {
    id: "hardening",
    title: "Hardening de Dispositivos",
    description:
      "Proteja seu Windows, Linux, Mac e celular. Configurações de firewall, atualizações, permissões e boas práticas de segurança.",
    icon: Shield,
    category: "Dispositivos",
    modules: 8,
    duration: "3h 30min",
    level: "Avançado",
    progress: 0,
    color: "text-gold",
  },
];

const levelColors: Record<string, string> = {
  Iniciante: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediário: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Avançado: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Academy() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const categories = ["Todos", ...new Set(courses.map((c) => c.category))];

  const filtered =
    selectedCategory === "Todos"
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  const totalModules = courses.reduce((acc, c) => acc + c.modules, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            Vextagon Academy
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Treinamentos internos de segurança digital. Proteja você, sua equipe e sua família.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Cursos", value: courses.length, icon: BookOpen },
          { label: "Módulos", value: totalModules, icon: Play },
          { label: "Concluídos", value: 0, icon: CheckCircle2 },
          { label: "Horas totais", value: "16h+", icon: Clock },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
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

      {/* Courses Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <Card
            key={course.id}
            className="group border-border/50 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={cn("rounded-lg bg-secondary p-2", course.color)}>
                  <course.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={cn("text-[10px]", levelColors[course.level])}>
                  {course.level}
                </Badge>
              </div>
              <CardTitle className="mt-3 text-sm font-semibold">{course.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{course.modules} módulos</span>
                <span>{course.duration}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-mono text-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-1.5" />
              </div>
              <Button size="sm" className="w-full h-8 text-xs" variant="outline">
                <Play className="mr-1 h-3 w-3" />
                Iniciar Curso
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
