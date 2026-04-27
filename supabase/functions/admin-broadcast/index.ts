// Admin-only mass notification: cria security_alerts + opcional email
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return err(401, "Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err(401, "Invalid session");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleCheck } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleCheck) return err(403, "Forbidden");

    const { title, message, severity = "info", audience = "all", sendEmail = false } = await req.json();
    if (!title || !message || title.length > 200 || message.length > 5000) {
      return err(400, "Invalid payload");
    }

    // Resolve audience -> user_ids
    let userQuery = admin.from("profiles").select("id, recovery_email");
    if (audience === "trial") {
      const { data: trials } = await admin.from("subscriptions")
        .select("user_id").eq("tier", "trial").eq("status", "active");
      userQuery = userQuery.in("id", (trials || []).map((t) => t.user_id));
    } else if (audience === "paid") {
      const { data: paid } = await admin.from("subscriptions")
        .select("user_id").in("tier", ["domo_1", "domo_2", "domo_3"]).eq("status", "active");
      userQuery = userQuery.in("id", [...new Set((paid || []).map((p) => p.user_id))]);
    }
    const { data: targets } = await userQuery;
    const recipients = targets || [];

    // Insert in-app alerts
    if (recipients.length > 0) {
      const alerts = recipients.map((r) => ({
        user_id: r.id, alert_type: "broadcast", severity,
        title, description: message,
      }));
      await admin.from("security_alerts").insert(alerts);
    }

    // Log broadcast
    await admin.from("broadcasts").insert({
      sent_by: user.id, title, message, severity, audience,
      recipients_count: recipients.length, send_email: sendEmail,
    });

    // Optional emails
    if (sendEmail) {
      const emails = recipients.map((r) => r.recovery_email).filter(Boolean) as string[];
      for (const to of emails) {
        await admin.functions.invoke("send-email", {
          body: { to, template: "broadcast", data: { title, message } },
        }).catch((e) => console.error("email broadcast fail", e));
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("broadcast error", e);
    return err(500, "Internal error");
  }
});

function err(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
