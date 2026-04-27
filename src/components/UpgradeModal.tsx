import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tier } from "@/hooks/useTierAccess";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier: Tier;
  feature?: string;
}

const TIER_META: Record<Tier, { name: string; icon: typeof Shield; price: string; color: string }> = {
  trial: { name: "Trial", icon: Sparkles, price: "Grátis 7 dias", color: "text-muted-foreground" },
  domo_1: { name: "Domo 1 — OSINT & Academy", icon: Shield, price: "R$ 29,90/mês", color: "text-cyan-400" },
  domo_2: { name: "Domo 2 — Monitor & Senhas", icon: Zap, price: "R$ 59,90/mês", color: "text-indigo-400" },
  domo_3: { name: "Domo 3 — Kali & Forense", icon: Lock, price: "R$ 99,90/mês", color: "text-fuchsia-400" },
};

export function UpgradeModal({ open, onOpenChange, requiredTier, feature }: UpgradeModalProps) {
  const navigate = useNavigate();
  const meta = TIER_META[requiredTier];
  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-cyan-500/20 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/30">
            <Icon className={`h-7 w-7 ${meta.color}`} />
          </div>
          <DialogTitle className="text-center text-xl">
            Recurso bloqueado
          </DialogTitle>
          <DialogDescription className="text-center">
            {feature ? <><strong>{feature}</strong> requer </> : "Este recurso requer "}
            <span className={meta.color}>{meta.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-lg border border-border/50 bg-background/50 p-4 text-center">
          <div className="text-2xl font-bold tracking-tight">{meta.price}</div>
          <div className="text-xs text-muted-foreground mt-1">Cancele quando quiser</div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => { onOpenChange(false); navigate("/pricing"); }}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:from-cyan-400 hover:to-indigo-400"
          >
            Fazer upgrade para Pro
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Mais tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
