import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
  Youtube,
  HelpCircle,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  markdown?: string;
  quiz?: QuizQuestion[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  duration: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  color: string;
  modules: Module[];
}

const courses: Course[] = [
  {
    id: "bitwarden",
    title: "Bitwarden — Gerenciador de Senhas",
    description:
      "Aprenda a configurar e usar o Bitwarden para proteger todas as suas credenciais.",
    icon: Key,
    category: "Senhas & Credenciais",
    duration: "2h 30min",
    level: "Iniciante",
    color: "text-cyan",
    modules: [
      { id: "intro", title: "Introdução ao Bitwarden", duration: "15min", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "install", title: "Instalação e Configuração", duration: "20min", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "vault", title: "Criando seu Cofre", duration: "25min" },
      { id: "passwords", title: "Gerando Senhas Fortes", duration: "20min", quiz: [
        { question: "Qual o tamanho mínimo recomendado para uma senha forte?", options: ["8 caracteres", "12 caracteres", "16 caracteres", "20 caracteres"], correct: 2 },
        { question: "O que o Bitwarden usa para criptografar seu cofre?", options: ["MD5", "SHA-1", "AES-256", "Base64"], correct: 2 },
      ]},
      { id: "2fa", title: "Ativando 2FA no Bitwarden", duration: "15min" },
      { id: "sharing", title: "Compartilhando com Equipes", duration: "30min", quiz: [
        { question: "Qual recurso permite compartilhar senhas com equipe?", options: ["Vault Pessoal", "Organizations", "Collections", "Folders"], correct: 1 },
      ]},
    ],
  },
  {
    id: "protonmail",
    title: "Proton Mail — Email Seguro",
    description:
      "Configure o Proton Mail como seu email principal com criptografia end-to-end.",
    icon: Mail,
    category: "Comunicação Segura",
    duration: "2h",
    level: "Iniciante",
    color: "text-primary",
    modules: [
      { id: "intro", title: "Por que Proton Mail?", duration: "10min", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "setup", title: "Criando sua Conta", duration: "15min" },
      { id: "migration", title: "Migrando do Gmail/Outlook", duration: "30min" },
      { id: "aliases", title: "Usando Aliases", duration: "20min" },
      { id: "encryption", title: "Criptografia E2E na Prática", duration: "25min", quiz: [
        { question: "O que significa E2E?", options: ["End-to-End", "Email-to-Email", "Encrypt-to-Encrypt", "External-to-External"], correct: 0 },
      ]},
    ],
  },
  {
    id: "2fa",
    title: "Autenticação em Duas Etapas (2FA)",
    description:
      "Entenda os tipos de 2FA e proteja suas contas mais importantes.",
    icon: Smartphone,
    category: "Autenticação",
    duration: "1h 30min",
    level: "Iniciante",
    color: "text-gold",
    modules: [
      { id: "intro", title: "O que é 2FA e por que usar", duration: "15min", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "types", title: "TOTP vs FIDO2 vs SMS", duration: "25min", quiz: [
        { question: "Qual tipo de 2FA é mais seguro?", options: ["SMS", "Email", "TOTP", "FIDO2/Passkeys"], correct: 3 },
        { question: "Por que SMS não é recomendado?", options: ["É caro", "Pode ser interceptado via SIM swap", "É lento", "Não funciona offline"], correct: 1 },
      ]},
      { id: "apps", title: "Configurando Apps Autenticadores", duration: "20min" },
      { id: "backup", title: "Backup de Códigos 2FA", duration: "15min" },
    ],
  },
  {
    id: "vpn",
    title: "VPN & Navegação Privada",
    description:
      "Aprenda a usar VPNs corretamente e navegar sem expor seus dados.",
    icon: Globe,
    category: "Privacidade",
    duration: "2h",
    level: "Intermediário",
    color: "text-cyan",
    modules: [
      { id: "intro", title: "Como funciona uma VPN", duration: "20min", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "choosing", title: "Escolhendo uma VPN confiável", duration: "25min" },
      { id: "dns", title: "DNS-over-HTTPS", duration: "20min" },
      { id: "tor", title: "Tor Browser: quando usar", duration: "30min", quiz: [
        { question: "O Tor é mais lento que VPNs comuns porque:", options: ["Usa servidores ruins", "Passa por 3+ nós de relay", "Tem muitos anúncios", "Criptografa duas vezes"], correct: 1 },
      ]},
      { id: "fingerprint", title: "Browser Fingerprinting", duration: "25min" },
    ],
  },
  {
    id: "encryption",
    title: "Criptografia para Leigos",
    description:
      "Entenda AES, RSA, PGP e como aplicar criptografia no dia a dia.",
    icon: Lock,
    category: "Criptografia",
    duration: "3h",
    level: "Intermediário",
    color: "text-destructive",
    modules: [
      { id: "intro", title: "História da Criptografia", duration: "20min" },
      { id: "symmetric", title: "Criptografia Simétrica (AES)", duration: "30min" },
      { id: "asymmetric", title: "Criptografia Assimétrica (RSA)", duration: "35min", quiz: [
        { question: "Na criptografia assimétrica, usamos:", options: ["Uma única chave", "Duas chaves iguais", "Chave pública e privada", "Senha e PIN"], correct: 2 },
      ]},
      { id: "pgp", title: "PGP para Emails", duration: "30min" },
      { id: "files", title: "Criptografando Arquivos", duration: "25min" },
      { id: "veracrypt", title: "VeraCrypt: Volumes Ocultos", duration: "30min" },
      { id: "practice", title: "Exercício Prático", duration: "20min" },
    ],
  },
  {
    id: "hardening",
    title: "Hardening de Dispositivos",
    description:
      "Proteja seu Windows, Linux, Mac e celular com configurações avançadas.",
    icon: Shield,
    category: "Dispositivos",
    duration: "3h 30min",
    level: "Avançado",
    color: "text-gold",
    modules: [
      { id: "windows", title: "Hardening Windows", duration: "40min" },
      { id: "linux", title: "Hardening Linux", duration: "45min", quiz: [
        { question: "Qual comando verifica portas abertas no Linux?", options: ["ps aux", "netstat -tuln", "top", "cat /etc/passwd"], correct: 1 },
      ]},
      { id: "mac", title: "Hardening macOS", duration: "35min" },
      { id: "android", title: "Segurança Android", duration: "30min" },
      { id: "ios", title: "Segurança iOS", duration: "25min" },
      { id: "firewall", title: "Configurando Firewalls", duration: "30min" },
      { id: "updates", title: "Política de Atualizações", duration: "20min" },
      { id: "permissions", title: "Gerenciando Permissões", duration: "25min" },
    ],
  },
];

const levelColors: Record<string, string> = {
  Iniciante: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediário: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Avançado: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface ProgressData {
  course_id: string;
  module_id: string;
  completed: boolean;
  quiz_score: number | null;
}

export default function Academy() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [activeModule, setActiveModule] = useState<{ courseId: string; moduleId: string } | null>(null);
  const [quizState, setQuizState] = useState<{ answers: Record<number, number>; submitted: boolean }>({ answers: {}, submitted: false });
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = ["Todos", ...new Set(courses.map((c) => c.category))];

  const filtered =
    selectedCategory === "Todos"
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  // Load progress
  useEffect(() => {
    if (!user) return;
    supabase
      .from("academy_progress")
      .select("course_id, module_id, completed, quiz_score")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setProgressData(data);
      });
  }, [user]);

  const toggleCourse = (id: string) => {
    setExpandedCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getModuleProgress = (courseId: string, moduleId: string) => {
    return progressData.find((p) => p.course_id === courseId && p.module_id === moduleId);
  };

  const getCourseProgress = (course: Course) => {
    const completed = course.modules.filter((m) => getModuleProgress(course.id, m.id)?.completed).length;
    return Math.round((completed / course.modules.length) * 100);
  };

  const markModuleComplete = async (courseId: string, moduleId: string, quizScore?: number) => {
    if (!user) return;
    
    const existing = getModuleProgress(courseId, moduleId);
    if (existing?.completed) return;

    const { error } = await supabase
      .from("academy_progress")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        completed: true,
        quiz_score: quizScore ?? null,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,course_id,module_id" });

    if (!error) {
      setProgressData((prev) => [
        ...prev.filter((p) => !(p.course_id === courseId && p.module_id === moduleId)),
        { course_id: courseId, module_id: moduleId, completed: true, quiz_score: quizScore ?? null },
      ]);
      toast({ title: "Módulo concluído!", description: quizScore !== undefined ? `Pontuação: ${quizScore}%` : "Progresso salvo." });
    }
  };

  const handleQuizSubmit = (courseId: string, moduleId: string, quiz: QuizQuestion[]) => {
    const correct = quiz.filter((q, i) => quizState.answers[i] === q.correct).length;
    const score = Math.round((correct / quiz.length) * 100);
    markModuleComplete(courseId, moduleId, score);
    setQuizState((prev) => ({ ...prev, submitted: true }));
  };

  const totalModules = courses.reduce((acc, c) => acc + c.modules.length, 0);
  const completedModules = progressData.filter((p) => p.completed).length;

  const currentModule = activeModule
    ? courses.find((c) => c.id === activeModule.courseId)?.modules.find((m) => m.id === activeModule.moduleId)
    : null;

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
          { label: "Concluídos", value: completedModules, icon: CheckCircle2 },
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

      {/* Active Module Player */}
      {activeModule && currentModule && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{currentModule.title}</CardTitle>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setActiveModule(null); setQuizState({ answers: {}, submitted: false }); }}>
                <X className="h-3 w-3 mr-1" /> Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video */}
            {currentModule.videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                <iframe
                  src={currentModule.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Quiz */}
            {currentModule.quiz && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Quiz do Módulo</span>
                </div>
                {currentModule.quiz.map((q, qi) => (
                  <div key={qi} className="space-y-2 rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm font-medium">{q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => {
                        const isSelected = quizState.answers[qi] === oi;
                        const isCorrect = quizState.submitted && oi === q.correct;
                        const isWrong = quizState.submitted && isSelected && oi !== q.correct;
                        return (
                          <button
                            key={oi}
                            disabled={quizState.submitted}
                            onClick={() => setQuizState((prev) => ({ ...prev, answers: { ...prev.answers, [qi]: oi } }))}
                            className={cn(
                              "w-full text-left rounded-md px-3 py-2 text-xs transition-colors",
                              isSelected && !quizState.submitted && "bg-primary/20 border border-primary/50",
                              !isSelected && !quizState.submitted && "bg-muted hover:bg-muted/80",
                              isCorrect && "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400",
                              isWrong && "bg-red-500/20 border border-red-500/50 text-red-400"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!quizState.submitted ? (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={Object.keys(quizState.answers).length < currentModule.quiz.length}
                    onClick={() => handleQuizSubmit(activeModule.courseId, activeModule.moduleId, currentModule.quiz!)}
                  >
                    Enviar Respostas
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Quiz concluído!
                  </div>
                )}
              </div>
            )}

            {/* Complete without quiz */}
            {!currentModule.quiz && !getModuleProgress(activeModule.courseId, activeModule.moduleId)?.completed && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => markModuleComplete(activeModule.courseId, activeModule.moduleId)}
              >
                <Check className="mr-1 h-3 w-3" />
                Marcar como Concluído
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Courses Grid */}
      <div className="space-y-3">
        {filtered.map((course) => {
          const isExpanded = expandedCourses[course.id];
          const progress = getCourseProgress(course);
          return (
            <Card key={course.id} className="border-border/50 transition-all hover:border-primary/30">
              {/* Course Header */}
              <button
                onClick={() => toggleCourse(course.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg bg-secondary p-2", course.color)}>
                    <course.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{course.title}</span>
                      <Badge variant="outline" className={cn("text-[9px]", levelColors[course.level])}>
                        {course.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{course.modules.length} módulos • {course.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[11px] font-mono text-muted-foreground w-8">{progress}%</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </button>

              {/* Modules List */}
              {isExpanded && (
                <CardContent className="pt-0 pb-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3">{course.description}</p>
                  <div className="space-y-1">
                    {course.modules.map((mod, idx) => {
                      const modProgress = getModuleProgress(course.id, mod.id);
                      const isActive = activeModule?.courseId === course.id && activeModule?.moduleId === mod.id;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => { setActiveModule({ courseId: course.id, moduleId: mod.id }); setQuizState({ answers: {}, submitted: false }); }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
                            isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                              modProgress?.completed ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
                            )}>
                              {modProgress?.completed ? <Check className="h-3 w-3" /> : idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-medium text-foreground">{mod.title}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">{mod.duration}</span>
                                {mod.videoUrl && <Youtube className="h-3 w-3 text-red-400" />}
                                {mod.quiz && <HelpCircle className="h-3 w-3 text-primary" />}
                                {modProgress?.quiz_score !== undefined && modProgress?.quiz_score !== null && (
                                  <Badge variant="outline" className="text-[8px] h-4 px-1">
                                    {modProgress.quiz_score}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Play className="h-3 w-3 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
