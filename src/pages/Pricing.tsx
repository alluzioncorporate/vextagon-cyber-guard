import { motion } from "framer-motion";
import { Check, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tiers } from "@/data/mockData";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Pricing() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-wide neon-text">Planos Vextagon</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha o nível de proteção ideal para sua operação</p>
      </motion.div>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Free */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="mb-4">
            <Zap className="h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-bold text-foreground">{tiers.free.name}</h3>
            <p className="font-mono text-3xl font-bold text-foreground mt-1">{tiers.free.price}</p>
          </div>
          <ul className="space-y-2 mb-6">
            {tiers.free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full font-display text-xs tracking-wider" disabled>
            Plano Atual
          </Button>
        </motion.div>

        {/* Premium */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card-hover relative overflow-hidden p-6 neon-border">
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase gold-text">
              <Crown className="h-3 w-3" /> Recomendado
            </span>
          </div>
          <div className="mb-4">
            <Crown className="h-8 w-8 text-accent" />
            <h3 className="mt-3 font-display text-lg font-bold gold-text">{tiers.premium.name}</h3>
            <p className="font-mono text-3xl font-bold text-foreground mt-1">{tiers.premium.price}</p>
          </div>
          <ul className="space-y-2 mb-6">
            {tiers.premium.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button onClick={() => setShowModal(true)} className="w-full font-display text-xs tracking-wider bg-accent text-accent-foreground hover:bg-accent/90">
            <Crown className="mr-2 h-4 w-4" /> Assinar Premium
          </Button>
        </motion.div>
      </div>

      {/* Subscribe Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg neon-text">Assinar Premium</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Você será redirecionado para o checkout seguro via Asaas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary/30 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plano</span>
                <span className="font-mono text-sm font-bold gold-text">Premium</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="font-mono text-sm font-bold text-foreground">R$ 197,00/mês</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Integração com Asaas será ativada na Fase 2 (Backend).
            </p>
            <Button className="w-full font-display text-xs tracking-wider bg-accent text-accent-foreground hover:bg-accent/90">
              Confirmar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
