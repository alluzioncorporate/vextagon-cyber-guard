import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Tier = "trial" | "domo_1" | "domo_2" | "domo_3";

interface SubscriptionRow {
  tier: Tier;
  status: string;
  expires_at: string | null;
}

interface TierAccess {
  loading: boolean;
  active: Tier[];
  hasTier: (tier: Tier) => boolean;
  /** D1 inclui trial. Hierarquia: D3 > D2 > D1 > trial */
  hasAtLeast: (tier: Tier) => boolean;
  refresh: () => Promise<void>;
}

const ORDER: Record<Tier, number> = { trial: 0, domo_1: 1, domo_2: 2, domo_3: 3 };

export function useTierAccess(): TierAccess {
  const { user } = useAuth();
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setSubs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("tier, status, expires_at")
      .eq("user_id", user.id);
    setSubs((data || []) as SubscriptionRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isActive = (s: SubscriptionRow) =>
    s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date());

  const active = subs.filter(isActive).map((s) => s.tier);

  const hasTier = (tier: Tier) => active.includes(tier);

  const hasAtLeast = (target: Tier) => {
    // trial concede acesso parcial ao domo_1 apenas
    if (target === "trial") return active.length > 0;
    if (target === "domo_1") {
      return active.some((t) => t === "trial" || ORDER[t] >= ORDER.domo_1);
    }
    return active.some((t) => ORDER[t] >= ORDER[target]);
  };

  return { loading, active, hasTier, hasAtLeast, refresh: load };
}
