import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ACTIONS = ["list_users", "update_plan", "delete_user", "save_setting", "get_setting"];
const ALLOWED_PLANS = ["free", "domo1", "domo2", "domo3"];
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 2000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && action === "list_users") {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
      if (listError) throw listError;

      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");

      const users = (authUsers?.users || []).map((u: any) => {
        const profile = profiles?.find((p: any) => p.id === u.id);
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
        return {
          id: u.id, email: u.email,
          full_name: profile?.full_name || u.user_metadata?.full_name || "",
          cpf: profile?.cpf || "",
          subscription_tier: profile?.subscription_tier || "free",
          whatsapp_enabled: profile?.whatsapp_enabled || false,
          created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
          roles: userRoles,
        };
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "update_plan") {
        const { user_id, plan } = body;
        if (!user_id || typeof user_id !== 'string') return new Response(JSON.stringify({ error: "Invalid user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (!plan || !ALLOWED_PLANS.includes(plan)) return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { error } = await supabaseAdmin.from("profiles")
          .update({ subscription_tier: plan, updated_at: new Date().toISOString() }).eq("id", user_id);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "delete_user") {
        const { user_id } = body;
        if (!user_id || typeof user_id !== 'string') return new Response(JSON.stringify({ error: "Invalid user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        // Prevent self-deletion
        if (user_id === user.id) return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "save_setting") {
        const { key, value } = body;
        if (!key || typeof key !== 'string' || key.length > MAX_KEY_LENGTH) return new Response(JSON.stringify({ error: "Invalid key" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (value && typeof value === 'string' && value.length > MAX_VALUE_LENGTH) return new Response(JSON.stringify({ error: "Value too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        // Sanitize key: alphanumeric + underscore only
        if (!/^[a-zA-Z0-9_]+$/.test(key)) return new Response(JSON.stringify({ error: "Invalid key format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: existing } = await supabaseAdmin.from("app_settings").select("id").eq("key", key).maybeSingle();
        if (existing) {
          await supabaseAdmin.from("app_settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("app_settings").insert({ key, value });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "get_setting") {
        const { key } = body;
        if (!key || typeof key !== 'string' || !/^[a-zA-Z0-9_]+$/.test(key)) return new Response(JSON.stringify({ error: "Invalid key" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", key).maybeSingle();
        return new Response(JSON.stringify({ value: data?.value || "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Operation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
