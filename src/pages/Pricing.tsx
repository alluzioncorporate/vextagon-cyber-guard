import { Check, Shield, Server, Skull, Zap, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { domoTiers } from "@/data/mockData";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const tierIcons: Record<string, React.ReactNode> = {
  domo1: <Shield className="h-6 w-6 text-cyan" />,
  domo2: <Server className="h-6 w-6 text-gold" />,
  domo3: <Skull className="h-6 w-6 text-destructive" />,
};

const tierAccentClass: Record<string, string> = {
  domo1: "border-cyan/30",
  domo2: "border-gold/30",
  domo3: "border-destructive/30",
};

const tierTextClass: Record<string, string> = {
  domo1: "text-cyan",
  domo2: "text-gold",
  domo3: "text-destructive",
};

const tierCheckClass: Record<string, string> = {
  domo1: "text-cyan",
  domo2: "text-gold",
  domo3: "text-destructive",
};

const tierBadge: Record<string, string> = {
  domo1: "LOW",
  domo2: "MEDIUM",
  domo3: "HIGH",
};

export default function Pricing() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const tiers = Object.values(domoTiers);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold tracking-wide text-foreground">Planos DOMO</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Escolha seu nível de proteção — como o Domo de Ferro, cada camada te protege mais.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "v-card-interactive p-5 flex flex-col",
              tierAccentClass[tier.id],
              tier.id === "domo3" && "ring-1 ring-destructive/20"
            )}
          >
            <div className="flex items-center justify-between">
              {tierIcons[tier.id]}
              <span
                className={cn(
                  "font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                  tier.id === "domo1" && "bg-cyan/10 text-cyan",
                  tier.id === "domo2" && "bg-gold/10 text-gold",
                  tier.id === "domo3" && "bg-destructive/10 text-destructive"
                )}
              >
                {tierBadge[tier.id]}
              </span>
            </div>

            <h3 className={cn("mt-3 text-sm font-semibold", tierTextClass[tier.id])}>
              {tier.name}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tier.subtitle}</p>

            <p className="font-mono text-2xl font-bold text-foreground mt-2">{tier.price}</p>

            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              {tier.description}
            </p>

            <ul className="mt-4 space-y-2 mb-5 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[11px] text-foreground">
                  <Check className={cn("mt-0.5 h-3 w-3 shrink-0", tierCheckClass[tier.id])} />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => setSelectedTier(tier.id)}
              className={cn(
                "w-full text-xs",
                tier.id === "domo3" && "bg-destructive hover:bg-destructive/90"
              )}
              variant={tier.id === "domo1" ? "outline" : "default"}
            >
              {tier.id === "domo3" ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Assinar {tier.name}
                </>
              ) : (
                `Assinar ${tier.name}`
              )}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedTier} onOpenChange={(open) => !open && setSelectedTier(null)}>
        <DialogContent className="v-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Assinar {selectedTier && domoTiers[selectedTier as keyof typeof domoTiers]?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Checkout seguro via Asaas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="rounded bg-secondary/40 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Plano</span>
                <span className={cn("font-mono font-medium", selectedTier && tierTextClass[selectedTier])}>
                  {selectedTier && domoTiers[selectedTier as keyof typeof domoTiers]?.name}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-mono font-medium text-foreground">
                  {selectedTier && domoTiers[selectedTier as keyof typeof domoTiers]?.price}
                </span>
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
