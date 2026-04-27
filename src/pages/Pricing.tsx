import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Shield, Zap, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTierAccess, type Tier } from "@/hooks/useTierAccess";
import { toast } from "@/hooks/use-toast";

const PLANS: Array<{
  tier: Tier;
  name: string;
  price: string;
  icon: typeof Shield;
  color: string;
  features: string[];
}> = [
  {
    tier: "domo_1", name: "Domo 1", price: "R$ 29,90",
    icon: Shield, color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
    features: ["OSINT completo", "Vextagon Academy", "Domo Scanner Nível 1", "Honeytokens", "5 domínios monitorados"],
  },
  {
    tier: "domo_2", name: "Domo 2", price: "R$ 59,90",
    icon: Zap, color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30",
    features: ["Tudo do Domo 1", "Server Monitoring", "Alerts Center + WhatsApp", "Password Manager", "Social Engineering", "Domo Scanner Nível 2"],
  },
  {
    tier: "domo_3", name: "Domo 3", price: "R$ 99,90",
    icon: Lock, color: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30",
    features: ["Tudo do Domo 2", "Pentest Arsenal (Kali VPS)", "Forensics", "Dark Web Monitor", "Threat Intel", "Domo Scanner Nível 3"],
  },
];

export default function Pricing() {
  const { active, loading, refresh } = useTierAccess();
  const [busy, setBusy] = useState<Tier | null>(null);

  const checkout = async (tier: Tier) => {
    setBusy(tier);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-checkout", { body: { tier } });
      if (error) throw error;
      if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
        toast({ title: "Cobrança gerada", description: "Após o pagamento, o acesso é liberado automaticamente." });
        refresh();
      } else {
        throw new Error(data?.error || "Falha ao gerar cobrança");
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Tente novamente", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-400 ring-1 ring-cyan-500/30 mb-4">
          <Sparkles className="h-3.5 w-3.5" /> Iron Dome Tiers
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Escolha sua proteção</h1>
        <p className="mt-3 text-muted-foreground">Cada Domo é independente. Combine os que precisar.</p>
        {!loading && active.length > 0 && (
          <p className="mt-2 text-xs text-cyan-400">
            Ativos: {active.map((t) => t.replace("_", " ").toUpperCase()).join(" · ")}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isActive = active.includes(plan.tier);
          return (
            <Card key={plan.tier} className={`relative bg-gradient-to-b ${plan.color} backdrop-blur-xl p-6 border`}>
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-background">
                  ATIVO
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-background/50">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
              <ul className="space-y-2 mb-6 min-h-[200px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => checkout(plan.tier)}
                disabled={isActive || busy !== null}
                className="w-full bg-cyan-500 text-background hover:bg-cyan-400 disabled:opacity-50"
              >
                {busy === plan.tier ? <Loader2 className="h-4 w-4 animate-spin" /> : isActive ? "Já assinou" : "Assinar agora"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
