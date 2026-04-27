// Generic email sender via Resend (gateway). Falls back to logging if not connected.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: "Bem-vindo ao Vextagon",
    html: `<div style="font-family:Arial,sans-serif;background:#0A0E17;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#00F0FF">Bem-vindo, ${escape(d.name || "operador")}</h1>
      <p style="color:#cbd5e1">Sua conta Vextagon está ativa. Você tem 7 dias de trial no Domo 1.</p>
      <a href="${escape(d.appUrl || "https://vextagon.com")}" style="display:inline-block;padding:12px 24px;background:#00F0FF;color:#0A0E17;text-decoration:none;border-radius:8px;font-weight:bold">Acessar Painel</a>
    </div>`,
  }),
  critical_alert: (d) => ({
    subject: `🚨 Alerta crítico: ${d.title}`,
    html: `<div style="font-family:Arial,sans-serif;background:#0A0E17;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#ff3b3b">⚠️ ${escape(d.title)}</h1>
      <p style="color:#cbd5e1">${escape(d.description || "")}</p>
      ${d.domain ? `<p><strong>Alvo:</strong> ${escape(d.domain)}</p>` : ""}
      <a href="${escape(d.appUrl || "https://vextagon.com")}/alerts" style="display:inline-block;padding:12px 24px;background:#ff3b3b;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Ver Alerta</a>
    </div>`,
  }),
  weekly_report: (d) => ({
    subject: `Relatório Semanal Vextagon — ${d.domain || "seus domínios"}`,
    html: `<div style="font-family:Arial,sans-serif;background:#0A0E17;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#00F0FF">Relatório Semanal</h1>
      <p>Domínios monitorados: <strong>${d.domains || 0}</strong></p>
      <p>Alertas críticos: <strong style="color:#ff3b3b">${d.criticalAlerts || 0}</strong></p>
      <p>Servidores online: <strong>${d.serversOnline || 0}</strong></p>
      <p>Score médio de segurança: <strong>${d.avgScore || "N/A"}</strong></p>
    </div>`,
  }),
  broadcast: (d) => ({
    subject: `[Vextagon] ${d.title}`,
    html: `<div style="font-family:Arial,sans-serif;background:#0A0E17;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#00F0FF">${escape(d.title)}</h1>
      <p style="color:#cbd5e1;white-space:pre-wrap">${escape(d.message)}</p>
    </div>`,
  }),
};

function escape(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, template, data, from } = await req.json();
    if (!to || !template || !TEMPLATES[template]) {
      return new Response(JSON.stringify({ error: "Invalid params" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const { subject, html } = TEMPLATES[template](data || {});

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.warn("Resend not connected — skipping send", { to, template });
      return new Response(JSON.stringify({ skipped: true, reason: "resend_not_connected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: from || "Vextagon <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject, html,
      }),
    });
    const data2 = await res.json();
    if (!res.ok) {
      console.error("Resend error", data2);
      return new Response(JSON.stringify({ error: "Send failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data2.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
