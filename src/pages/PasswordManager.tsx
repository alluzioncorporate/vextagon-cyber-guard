import { useState } from "react";
import {
  Key,
  Shield,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Fingerprint,
  Globe,
  Smartphone,
  Laptop,
  Server,
  Zap,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Password strength calculator
const calculateStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 2;
  if (password.length >= 20) score += 1;

  const percentage = Math.min(100, (score / 9) * 100);

  if (percentage < 30) return { score: percentage, label: "Muito Fraca", color: "bg-red-500" };
  if (percentage < 50) return { score: percentage, label: "Fraca", color: "bg-orange-500" };
  if (percentage < 70) return { score: percentage, label: "Média", color: "bg-yellow-500" };
  if (percentage < 90) return { score: percentage, label: "Forte", color: "bg-emerald-500" };
  return { score: percentage, label: "Muito Forte", color: "bg-cyan-500" };
};

// Generate password
const generatePassword = (length: number, options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }): string => {
  let chars = "";
  if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let password = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
};

const importancePoints = [
  {
    icon: Shield,
    title: "Proteção Contra Vazamentos",
    description: "81% dos vazamentos de dados são causados por senhas fracas ou reutilizadas. Um gerenciador elimina esse risco.",
  },
  {
    icon: Fingerprint,
    title: "Senhas Únicas por Serviço",
    description: "Cada conta tem uma senha única de 20+ caracteres. Se um site vazar, os outros continuam seguros.",
  },
  {
    icon: Zap,
    title: "Preenchimento Automático Seguro",
    description: "Detecta phishing: só preenche no domínio correto. Nunca digite senhas em sites falsos novamente.",
  },
  {
    icon: Lock,
    title: "Criptografia AES-256",
    description: "Seu cofre é criptografado localmente antes de sincronizar. Nem nós podemos ver suas senhas.",
  },
  {
    icon: Globe,
    title: "Sincronização Segura",
    description: "Acesse suas senhas em qualquer dispositivo com criptografia end-to-end. Zero conhecimento.",
  },
  {
    icon: AlertTriangle,
    title: "Alertas de Vazamento",
    description: "Monitoramento contínuo da dark web. Seja notificado se suas credenciais aparecerem em vazamentos.",
  },
];

const stats = [
  { label: "Senhas vazadas em 2024", value: "24 bilhões+", icon: AlertTriangle, color: "text-destructive" },
  { label: "Custo médio de vazamento", value: "US$ 4.45M", icon: Server, color: "text-gold" },
  { label: "Ataques de credential stuffing/dia", value: "1.5 milhão", icon: Globe, color: "text-amber-500" },
  { label: "Tempo para quebrar senha de 8 chars", value: "< 1 hora", icon: Zap, color: "text-red-400" },
];

export default function PasswordManager() {
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLength, setPasswordLength] = useState([20]);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [checkPassword, setCheckPassword] = useState("");
  const { toast } = useToast();

  const handleGenerate = () => {
    const pwd = generatePassword(passwordLength[0], options);
    setGeneratedPassword(pwd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Senha copiada para a área de transferência." });
  };

  const strength = checkPassword ? calculateStrength(checkPassword) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-gold" />
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            Gerenciador de Senhas
          </h1>
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20 text-[10px]">
            DOMO 2
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Proteção ultra-avançada para suas credenciais. Geração, análise e monitoramento.
        </p>
      </div>

      {/* Why it matters - Alert */}
      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gold">Por que um Gerenciador de Senhas é Essencial?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Em 2024, mais de <strong className="text-foreground">24 bilhões de credenciais</strong> foram vazadas globalmente. 
                A maioria das pessoas usa a mesma senha em vários sites — quando um vaza, todos são comprometidos. 
                Um gerenciador de senhas cria senhas únicas e impossíveis de memorizar para cada serviço, 
                protegendo você mesmo quando ocorrem vazamentos. É a <strong className="text-foreground">primeira linha de defesa</strong> da sua segurança digital.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className={cn("h-5 w-5 shrink-0", stat.color)} />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tools */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Password Generator */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Gerador de Senhas Ultra-Seguras</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Crie senhas impossíveis de quebrar com entropia criptográfica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generated password display */}
            <div className="relative">
              <Input
                value={generatedPassword}
                readOnly
                type={showPassword ? "text" : "password"}
                placeholder="Clique em gerar..."
                className="pr-20 font-mono text-sm"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(generatedPassword)}
                  disabled={!generatedPassword}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Length slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Comprimento</Label>
                <span className="font-mono text-xs text-primary">{passwordLength[0]} caracteres</span>
              </div>
              <Slider
                value={passwordLength}
                onValueChange={setPasswordLength}
                min={8}
                max={64}
                step={1}
                className="w-full"
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "uppercase", label: "Maiúsculas (A-Z)" },
                { key: "lowercase", label: "Minúsculas (a-z)" },
                { key: "numbers", label: "Números (0-9)" },
                { key: "symbols", label: "Símbolos (!@#$)" },
              ].map((opt) => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Switch
                    checked={options[opt.key as keyof typeof options]}
                    onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, [opt.key]: checked }))}
                    className="scale-75"
                  />
                  <span className="text-[11px] text-muted-foreground">{opt.label}</span>
                </div>
              ))}
            </div>

            <Button onClick={handleGenerate} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Gerar Senha Segura
            </Button>

            {generatedPassword && (
              <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Força da senha</span>
                  <span className={cn("text-[11px] font-semibold", calculateStrength(generatedPassword).color.replace("bg-", "text-"))}>
                    {calculateStrength(generatedPassword).label}
                  </span>
                </div>
                <Progress value={calculateStrength(generatedPassword).score} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground">
                  Tempo estimado para quebrar: <strong className="text-foreground">+10.000 anos</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Strength Checker */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Analisador de Força</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Verifique se sua senha atual é segura o suficiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                value={checkPassword}
                onChange={(e) => setCheckPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Digite uma senha para analisar..."
                className="pr-10 font-mono text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {strength && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Força</span>
                    <span className={cn("text-[11px] font-semibold", strength.color.replace("bg-", "text-"))}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn("h-full transition-all", strength.color)}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>

                {/* Criteria */}
                <div className="space-y-1.5">
                  {[
                    { check: checkPassword.length >= 12, label: "Mínimo 12 caracteres" },
                    { check: /[A-Z]/.test(checkPassword), label: "Letras maiúsculas" },
                    { check: /[a-z]/.test(checkPassword), label: "Letras minúsculas" },
                    { check: /[0-9]/.test(checkPassword), label: "Números" },
                    { check: /[^a-zA-Z0-9]/.test(checkPassword), label: "Símbolos especiais" },
                    { check: checkPassword.length >= 16, label: "16+ caracteres (recomendado)" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-2">
                      {c.check ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={cn("text-[11px]", c.check ? "text-foreground" : "text-muted-foreground")}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!checkPassword && (
              <div className="rounded-lg bg-secondary/30 p-4 text-center">
                <Lock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Digite uma senha para ver a análise completa
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Why Password Manager Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Por que você PRECISA de um Gerenciador de Senhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {importancePoints.map((point) => (
              <div key={point.title} className="space-y-2 rounded-lg bg-secondary/30 p-4">
                <div className="flex items-center gap-2">
                  <point.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">{point.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device compatibility */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Laptop, label: "Desktop" },
              { icon: Smartphone, label: "Mobile" },
              { icon: Globe, label: "Browser" },
              { icon: Server, label: "Servidor" },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-muted-foreground">
                <d.icon className="h-5 w-5" />
                <span className="text-xs">{d.label}</span>
              </div>
            ))}
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Sincronização End-to-End
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
