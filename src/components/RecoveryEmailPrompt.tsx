import { useState, useEffect } from "react";
import { Mail, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RecoveryEmailPrompt() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || checked) return;
    setChecked(true);

    supabase
      .from("profiles")
      .select("recovery_email")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data && !data.recovery_email) {
          // Small delay so it doesn't flash immediately on load
          setTimeout(() => setOpen(true), 1500);
        }
      });
  }, [user, checked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Email inválido", description: "Por favor, insira um email válido.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ recovery_email: email })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar. Tente novamente.", variant: "destructive" });
    } else {
      toast({ title: "Email salvo!", description: "Seu email de recuperação foi cadastrado com sucesso." });
      setOpen(false);
    }
    setLoading(false);
  };

  const handleSkip = () => {
    setOpen(false);
    toast({
      title: "⚠️ Atenção",
      description: "Sem email de recuperação, você não poderá redefinir sua senha. O TeiaBrass vai cobrar isso de novo!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gold/10 p-2">
              <ShieldAlert className="h-5 w-5 text-gold" />
            </div>
            <div>
              <DialogTitle className="text-base">TeiaBrass — Alerta de Segurança</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Sua conta não possui email de recuperação cadastrado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-destructive">Risco detectado:</strong> Sem um email de recuperação,
              se você esquecer sua senha, <strong className="text-foreground">perderá o acesso à sua conta permanentemente</strong>.
              Cadastre um email válido agora para garantir que possa redefinir sua senha a qualquer momento.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-xs">
                Email de recuperação
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Este email será usado apenas para recuperação de senha. Não será compartilhado.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading || !email}>
                {loading ? "Salvando..." : "Cadastrar Email"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleSkip} className="text-xs text-muted-foreground">
                Depois
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
