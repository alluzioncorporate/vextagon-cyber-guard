import { Check, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tiers } from "@/data/mockData";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Pricing() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Planos</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Escolha o nível de proteção</p>
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="v-card p-5">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">{tiers.free.name}</h3>
          <p className="font-mono text-2xl font-bold text-foreground mt-1">{tiers.free.price}</p>
          <ul className="mt-4 space-y-2 mb-5">
            {tiers.free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full text-xs" disabled>
            Plano Atual
          </Button>
        </div>

        {/* Premium */}
        <div className="v-card-interactive p-5 border-primary/20">
          <Crown className="h-5 w-5 text-gold" />
          <h3 className="mt-3 text-sm font-semibold text-gold">{tiers.premium.name}</h3>
          <p className="font-mono text-2xl font-bold text-foreground mt-1">{tiers.premium.price}</p>
          <ul className="mt-4 space-y-2 mb-5">
            {tiers.premium.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[11px] text-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button onClick={() => setShowModal(true)} className="w-full text-xs">
            Assinar Premium
          </Button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="v-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Assinar Premium</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Checkout seguro via Asaas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="rounded bg-secondary/40 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-mono font-medium text-gold">Premium</span>
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-mono font-medium text-foreground">R$ 197,00/mês</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Integração Asaas será ativada na Fase 2.
            </p>
            <Button className="w-full text-xs">
              Confirmar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
