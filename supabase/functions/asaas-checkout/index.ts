// Cria customer + subscription no Asaas e retorna invoice URL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS = {
  domo_1: { value: 29.90, name: "Vextagon Domo 1 — OSINT & Academy" },
  domo_2: { value: 59.90, name: "Vextagon Domo 2 — Monitor & Senhas" },
  domo_3: { value: 99.90, name: "Vextagon Domo 3 — Kali & Forense" },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return jsonErr(401, "Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonErr(401, "Invalid session");

    const body = await req.json();
    const tier = body.tier as keyof typeof PLANS;
    if (!PLANS[tier]) return jsonErr(400, "Invalid tier");

    const { data: profile } = await supabase
      .from("profiles").select("full_name, cpf, recovery_email").eq("id", user.id).maybeSingle();
    if (!profile?.cpf) return jsonErr(400, "Profile incomplete");

    const apiKey = Deno.env.get("ASAAS_API_KEY")!;
    const env = Deno.env.get("ASAAS_ENV") || "sandbox";
    const baseUrl = env === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";

    // 1) Reuse or create customer
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: existing } = await admin
      .from("subscriptions").select("asaas_customer_id")
      .eq("user_id", user.id).not("asaas_customer_id", "is", null).limit(1).maybeSingle();

    let customerId = existing?.asaas_customer_id;
    if (!customerId) {
      const cRes = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "access_token": apiKey },
        body: JSON.stringify({
          name: profile.full_name || "Vextagon User",
          cpfCnpj: profile.cpf,
          email: profile.recovery_email || `${profile.cpf}@vextagon.local`,
        }),
      });
      const cData = await cRes.json();
      if (!cRes.ok) {
        console.error("Asaas customer error", cData);
        return jsonErr(502, "Payment provider error");
      }
      customerId = cData.id;
    }

    // 2) Create payment (single charge - pix/boleto/credit)
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pRes = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({
        customer: customerId,
        billingType: body.billingType || "UNDEFINED",
        value: PLANS[tier].value,
        dueDate,
        description: PLANS[tier].name,
        externalReference: `${user.id}:${tier}`,
      }),
    });
    const pData = await pRes.json();
    if (!pRes.ok) {
      console.error("Asaas payment error", pData);
      return jsonErr(502, "Payment provider error");
    }

    // 3) Upsert pending subscription
    await admin.from("subscriptions").upsert({
      user_id: user.id, tier, status: "pending",
      asaas_customer_id: customerId,
    }, { onConflict: "user_id,tier" });

    return new Response(JSON.stringify({
      invoiceUrl: pData.invoiceUrl,
      bankSlipUrl: pData.bankSlipUrl,
      paymentId: pData.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("checkout error", err);
    return jsonErr(500, "Internal error");
  }
});

function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
