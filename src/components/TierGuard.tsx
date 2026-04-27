import { ReactNode, useState } from "react";
import { useTierAccess, type Tier } from "@/hooks/useTierAccess";
import { UpgradeModal } from "./UpgradeModal";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface TierGuardProps {
  required: Tier;
  feature?: string;
  children: ReactNode;
  /** Se true, renderiza children com overlay clicável; se false, esconde e mostra CTA */
  blur?: boolean;
}

export function TierGuard({ required, feature, children, blur = true }: TierGuardProps) {
  const { hasAtLeast, loading } = useTierAccess();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="animate-pulse h-32 rounded-lg bg-muted/20" />;
  if (hasAtLeast(required)) return <>{children}</>;

  if (!blur) {
    return (
      <>
        <div className="rounded-xl border border-border/50 bg-card/40 p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-cyan-500/60" />
          <h3 className="text-lg font-semibold mb-1">Recurso Pro</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {feature ? `${feature} requer ` : "Requer "}
            <span className="text-cyan-400">{required.replace("_", " ").toUpperCase()}</span>.
          </p>
          <Button onClick={() => setOpen(true)} className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30">
            Ver planos
          </Button>
        </div>
        <UpgradeModal open={open} onOpenChange={setOpen} requiredTier={required} feature={feature} />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="pointer-events-none select-none blur-md opacity-40">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Button onClick={() => setOpen(true)} className="bg-cyan-500 text-background hover:bg-cyan-400 shadow-lg shadow-cyan-500/30">
            <Lock className="mr-2 h-4 w-4" /> Desbloquear
          </Button>
        </div>
      </div>
      <UpgradeModal open={open} onOpenChange={setOpen} requiredTier={required} feature={feature} />
    </>
  );
}
