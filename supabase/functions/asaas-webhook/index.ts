// Asaas Webhook handler - PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_DELETED
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const TIER_MAPPING: Record<string, "domo_1" | "domo_2" | "domo_3"> = {
  // Map Asaas subscription/value to tier. Adjust values to match your real plans.
  "29.90": "domo_1",
  "59.90": "domo_2",
  "99.90": "domo_3",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");
    if (!expectedToken || receivedToken !== expectedToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const event = payload.event as string;
    const payment = payload.payment;
    if (!payment) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lookup user by asaas_customer_id
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, user_id, tier")
      .eq("asaas_customer_id", payment.customer)
      .maybeSingle();

    if (!sub) {
      await supabase.from("system_logs").insert({
        severity: "warning", source: "asaas-webhook",
        message: `No subscription found for customer ${payment.customer}`,
        metadata: { event, payment_id: payment.id },
      });
      return new Response(JSON.stringify({ ok: true, note: "no sub" }), { headers: corsHeaders });
    }

    // Persist payment record
    await supabase.from("payments").upsert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      asaas_payment_id: payment.id,
      amount: Number(payment.value),
      status: payment.status,
      billing_type: payment.billingType,
      due_date: payment.dueDate,
      paid_at: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : null,
      invoice_url: payment.invoiceUrl,
      raw_payload: payload,
    }, { onConflict: "asaas_payment_id" });

    // State machine
    let newStatus: string | null = null;
    let expiresAt: string | null = null;
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      newStatus = "active";
      expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
    } else if (event === "PAYMENT_OVERDUE") {
      newStatus = "overdue";
    } else if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      newStatus = "cancelled";
    }

    if (newStatus) {
      await supabase.from("subscriptions").update({
        status: newStatus,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      }).eq("id", sub.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-webhook error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
