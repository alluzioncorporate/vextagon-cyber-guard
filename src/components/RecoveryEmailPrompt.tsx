import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Mail } from "lucide-react";

export default function RecoveryEmailPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user || checked) return;

    const checkRecoveryEmail = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("recovery_email")
        .eq("id", user.id)
        .maybeSingle();

      if (data && !data.recovery_email) {
        setOpen(true);
      }
      setChecked(true);
    };

    checkRecoveryEmail();
  }, [user, checked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !user) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail válido.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ recovery_email: email })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o e-mail.", variant: "destructive" });
    } else {
      toast({ title: "E-mail salvo!", description: "Seu e-mail de recuperação foi cadastrado com sucesso." });
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-destructive/30">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg">Ação de Segurança Necessária</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Você ainda não cadastrou um <strong className="text-foreground">e-mail de recuperação</strong>. 
            Sem ele, caso perca acesso à sua conta, não será possível recuperá-la. 
            Cadastre agora para proteger seus dados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="recovery-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              E-mail de recuperação
            </Label>
            <Input
              id="recovery-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar e-mail"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">
              Depois
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Este aviso aparecerá em todo login até que você cadastre um e-mail de recuperação.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
