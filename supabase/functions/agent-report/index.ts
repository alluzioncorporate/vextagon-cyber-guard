import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { agent_token, hostname, ip_address, os_info, cpu_usage, ram_usage, disk_usage, open_ports, security_updates } = body;

    if (!agent_token) {
      return new Response(JSON.stringify({ error: "Missing agent_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token exists
    const { data: server, error: findError } = await supabaseAdmin
      .from("server_monitoring")
      .select("id, user_id")
      .eq("agent_token", agent_token)
      .single();

    if (findError || !server) {
      return new Response(JSON.stringify({ error: "Invalid agent token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update server data
    const updateData: Record<string, unknown> = {
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (hostname !== undefined) updateData.hostname = hostname;
    if (ip_address !== undefined) updateData.ip_address = ip_address;
    if (os_info !== undefined) updateData.os_info = os_info;
    if (cpu_usage !== undefined) updateData.cpu_usage = cpu_usage;
    if (ram_usage !== undefined) updateData.ram_usage = ram_usage;
    if (disk_usage !== undefined) updateData.disk_usage = disk_usage;
    if (open_ports !== undefined) updateData.open_ports = open_ports;
    if (security_updates !== undefined) updateData.security_updates = security_updates;

    const { error: updateError } = await supabaseAdmin
      .from("server_monitoring")
      .update(updateData)
      .eq("id", server.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create alerts for critical resource usage
    const alerts = [];
    if (cpu_usage && cpu_usage > 90) {
      alerts.push({ user_id: server.user_id, alert_type: "server_cpu", severity: "high", title: `CPU crítico em ${hostname || "servidor"}`, description: `Uso de CPU em ${cpu_usage}%`, domain: ip_address || null });
    }
    if (ram_usage && ram_usage > 90) {
      alerts.push({ user_id: server.user_id, alert_type: "server_ram", severity: "high", title: `RAM crítica em ${hostname || "servidor"}`, description: `Uso de RAM em ${ram_usage}%`, domain: ip_address || null });
    }
    if (security_updates && Array.isArray(security_updates) && security_updates.some((u: { priority?: string }) => u.priority === "critical")) {
      alerts.push({ user_id: server.user_id, alert_type: "server_updates", severity: "critical", title: `Atualizações críticas em ${hostname || "servidor"}`, description: `Existem atualizações de segurança críticas pendentes`, domain: ip_address || null });
    }

    if (alerts.length > 0) {
      await supabaseAdmin.from("security_alerts").insert(alerts);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
