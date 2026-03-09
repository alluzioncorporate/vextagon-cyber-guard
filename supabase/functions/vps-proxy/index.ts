import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get VPS config from app_settings
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: vpsUrlSetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "vps_url")
      .maybeSingle();

    const { data: vpsKeySetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "vps_api_key")
      .maybeSingle();

    const vpsUrl = vpsUrlSetting?.value;
    const vpsApiKey = vpsKeySetting?.value;

    if (!vpsUrl) {
      return new Response(JSON.stringify({ error: "VPS não configurada. Acesse Admin > VPS para configurar." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tool, target, options } = body;

    if (!tool || !target) {
      return new Response(JSON.stringify({ error: "Missing tool or target" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Whitelist of allowed tools
    const allowedTools = [
      "nmap", "nikto", "whatweb", "theharvester", "sublist3r",
      "sqlmap", "hydra", "whois", "dig", "waf_logs", "fail2ban_logs",
      "iptables_logs",
    ];

    if (!allowedTools.includes(tool)) {
      return new Response(JSON.stringify({ error: `Tool "${tool}" not allowed` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward request to VPS API
    const vpsHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (vpsApiKey) {
      vpsHeaders["X-API-Key"] = vpsApiKey;
    }

    const vpsResponse = await fetch(`${vpsUrl.replace(/\/$/, "")}/api/run`, {
      method: "POST",
      headers: vpsHeaders,
      body: JSON.stringify({ tool, target, options: options || {} }),
    });

    if (!vpsResponse.ok) {
      const errText = await vpsResponse.text();
      return new Response(JSON.stringify({ error: `VPS error (${vpsResponse.status}): ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await vpsResponse.json();

    // Optionally save scan to database
    if (tool === "nmap" || tool === "nikto" || tool === "whatweb") {
      // Get or create domain
      const { data: domainRow } = await supabaseAdmin
        .from("user_domains")
        .select("id")
        .eq("user_id", user.id)
        .eq("domain", target)
        .maybeSingle();

      let domainId = domainRow?.id;
      if (!domainId) {
        const { data: newDomain } = await supabaseAdmin
          .from("user_domains")
          .insert({ user_id: user.id, domain: target })
          .select("id")
          .single();
        domainId = newDomain?.id;
      }

      if (domainId) {
        await supabaseAdmin.from("security_scans").insert({
          user_id: user.id,
          domain_id: domainId,
          domain: target,
          scan_type: tool,
          vulnerabilities: result.vulnerabilities || null,
          ports_data: result.ports || null,
          headers_data: result.headers || null,
          dns_data: result.dns || null,
          score: result.score || null,
        });

        await supabaseAdmin
          .from("user_domains")
          .update({ last_scanned_at: new Date().toISOString(), status: "scanned" })
          .eq("id", domainId);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
