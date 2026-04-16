import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email)) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail válido.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
        setMode("login");
        return;
      }

      if (password.length < 12) {
        toast({ title: "Senha fraca", description: "A senha deve ter no mínimo 12 caracteres.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
        setMode("login");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      toast({
        title: "Erro",
        description:
          msg === "Invalid login credentials"
            ? "E-mail ou senha incorretos."
            : msg === "User already registered"
            ? "Este e-mail já está cadastrado."
            : msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login" ? "Acesse sua conta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">VEXTAGON</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 12 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={12}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Aguarde..."
                : mode === "login"
                ? "Entrar"
                : mode === "signup"
                ? "Criar conta"
                : "Enviar link de recuperação"}
            </Button>
          </form>
          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Não tem conta? Cadastre-se
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Já tem conta? Faça login
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
