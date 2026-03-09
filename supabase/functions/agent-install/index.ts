import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Module script blocks ──
// Each module is a self-contained bash snippet that outputs a JSON value

const MODULE_SCRIPTS: Record<string, { collect: string; varName: string }> = {
  open_ports: {
    varName: "PORTS_JSON",
    collect: `
get_ports() {
  local result=""
  while IFS= read -r line; do
    local port=$(echo "$line" | awk '{split($4,a,":"); print a[length(a)]}')
    local pid_prog=$(echo "$line" | awk '{print $NF}')
    local service=$(echo "$pid_prog" | sed 's/.*://;s/"//g')
    [ -z "$service" ] && service="unknown"
    [ -n "$result" ] && result="$result,"
    result="$result{\\\"port\\\":$port,\\\"service\\\":\\\"$service\\\"}"
  done < <(ss -tlnp 2>/dev/null | awk 'NR>1' | head -30)
  echo "[$result]"
}
PORTS_JSON=$(get_ports)
[ -z "$PORTS_JSON" ] && PORTS_JSON="[]"
`,
  },
  installed_services: {
    varName: "SERVICES_JSON",
    collect: `
get_services() {
  local result=""
  if command -v systemctl &>/dev/null; then
    while IFS= read -r line; do
      local name=$(echo "$line" | awk '{print $1}' | sed 's/.service//')
      local state=$(echo "$line" | awk '{print $4}')
      [ -n "$result" ] && result="$result,"
      result="$result{\\\"name\\\":\\\"$name\\\",\\\"status\\\":\\\"$state\\\"}"
    done < <(systemctl list-units --type=service --no-pager --no-legend 2>/dev/null | head -50)
  fi
  echo "[$result]"
}
SERVICES_JSON=$(get_services)
[ -z "$SERVICES_JSON" ] && SERVICES_JSON="[]"
`,
  },
  running_processes: {
    varName: "PROCS_JSON",
    collect: `
get_procs() {
  local result=""
  while IFS= read -r line; do
    local user=$(echo "$line" | awk '{print $1}')
    local pid=$(echo "$line" | awk '{print $2}')
    local cpu=$(echo "$line" | awk '{print $3}')
    local mem=$(echo "$line" | awk '{print $4}')
    local cmd=$(echo "$line" | awk '{for(i=5;i<=NF;i++) printf "%s ", $i}' | sed 's/[\"\\\\]//g' | head -c 80)
    [ -n "$result" ] && result="$result,"
    result="$result{\\\"pid\\\":$pid,\\\"user\\\":\\\"$user\\\",\\\"cpu\\\":$cpu,\\\"mem\\\":$mem,\\\"cmd\\\":\\\"$cmd\\\"}"
  done < <(ps aux --sort=-%cpu 2>/dev/null | awk 'NR>1' | head -20)
  echo "[$result]"
}
PROCS_JSON=$(get_procs)
[ -z "$PROCS_JSON" ] && PROCS_JSON="[]"
`,
  },
  logged_users: {
    varName: "USERS_JSON",
    collect: `
get_logged_users() {
  local result=""
  while IFS= read -r line; do
    local user=$(echo "$line" | awk '{print $1}')
    local tty=$(echo "$line" | awk '{print $2}')
    local from=$(echo "$line" | awk '{print $3}')
    local login_at=$(echo "$line" | awk '{print $4, $5}')
    [ -n "$result" ] && result="$result,"
    result="$result{\\\"user\\\":\\\"$user\\\",\\\"tty\\\":\\\"$tty\\\",\\\"from\\\":\\\"$from\\\",\\\"login_at\\\":\\\"$login_at\\\"}"
  done < <(who 2>/dev/null)
  echo "[$result]"
}
USERS_JSON=$(get_logged_users)
[ -z "$USERS_JSON" ] && USERS_JSON="[]"
`,
  },
  network_connections: {
    varName: "NETCONN_JSON",
    collect: `
get_net_conns() {
  local result=""
  while IFS= read -r line; do
    local state=$(echo "$line" | awk '{print $1}')
    local local_addr=$(echo "$line" | awk '{print $4}')
    local remote_addr=$(echo "$line" | awk '{print $5}')
    [ -n "$result" ] && result="$result,"
    result="$result{\\\"state\\\":\\\"$state\\\",\\\"local\\\":\\\"$local_addr\\\",\\\"remote\\\":\\\"$remote_addr\\\"}"
  done < <(ss -tnp 2>/dev/null | awk 'NR>1' | head -30)
  echo "[$result]"
}
NETCONN_JSON=$(get_net_conns)
[ -z "$NETCONN_JSON" ] && NETCONN_JSON="[]"
`,
  },
  docker_containers: {
    varName: "DOCKER_JSON",
    collect: `
get_docker() {
  local result=""
  if command -v docker &>/dev/null; then
    while IFS='|' read -r id name image status; do
      [ -n "$result" ] && result="$result,"
      result="$result{\\\"id\\\":\\\"$id\\\",\\\"name\\\":\\\"$name\\\",\\\"image\\\":\\\"$image\\\",\\\"status\\\":\\\"$status\\\"}"
    done < <(docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}' 2>/dev/null | head -30)
  fi
  echo "[$result]"
}
DOCKER_JSON=$(get_docker)
[ -z "$DOCKER_JSON" ] && DOCKER_JSON="[]"
`,
  },
  auth_logs: {
    varName: "AUTHLOG_JSON",
    collect: `
get_auth_logs() {
  local result=""
  local logfile="/var/log/auth.log"
  [ ! -f "$logfile" ] && logfile="/var/log/secure"
  if [ -f "$logfile" ]; then
    while IFS= read -r line; do
      local escaped=$(echo "$line" | sed 's/[\"\\\\]//g' | head -c 200)
      [ -n "$result" ] && result="$result,"
      result="$result\\\"$escaped\\\""
    done < <(tail -50 "$logfile" 2>/dev/null)
  fi
  echo "[$result]"
}
AUTHLOG_JSON=$(get_auth_logs)
[ -z "$AUTHLOG_JSON" ] && AUTHLOG_JSON="[]"
`,
  },
};

function buildScript(token: string, reportUrl: string, modules: string[]): string {
  // Build module collection code for both inline and cron
  let moduleCollectCode = "";
  let modulePayloadFields = "";

  for (const mod of modules) {
    const m = MODULE_SCRIPTS[mod];
    if (!m) continue;
    moduleCollectCode += m.collect + "\n";
    modulePayloadFields += `,"${mod}": $\{${m.varName}}`;
  }

  return `#!/bin/bash
set -e

TOKEN="${token}"
REPORT_URL="${reportUrl}"

echo "[Vextagon Insight] Instalando agente..."

# ── Base telemetry ──
HOSTNAME_VAL=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print \\$1}' || curl -s ifconfig.me)
OS_NAME=$(uname -s)
OS_VERSION=$(uname -r)
OS_ARCH=$(uname -m)

get_cpu() { top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print \\$2}' || echo "0"; }
get_ram() { free 2>/dev/null | awk '/Mem:/ {printf("%.1f", \\$3/\\$2*100)}' || echo "0"; }
get_disk() { df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print \\$5}' || echo "0"; }

get_updates() {
  if command -v apt-get &>/dev/null; then
    local result=""
    while IFS= read -r line; do
      local pkg=$(echo "\\$line" | awk '{print \\$2}')
      [ -n "\\$result" ] && result="\\$result,"
      result="\\$result{\\"package\\": \\"\\$pkg\\", \\"priority\\": \\"normal\\"}"
    done < <(apt-get -s upgrade 2>/dev/null | grep "^Inst" | head -20)
    echo "[\\$result]"
  else
    echo "[]"
  fi
}

# ── Persistent agent script ──
SCRIPT_PATH="/opt/vextagon/agent.sh"
mkdir -p /opt/vextagon

cat > "\\$SCRIPT_PATH" << 'AGENT_SCRIPT_EOF'
#!/bin/bash
TOKEN="__TOKEN__"
REPORT_URL="__REPORT_URL__"

HOSTNAME_VAL=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me)

get_cpu() { top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' || echo "0"; }
get_ram() { free 2>/dev/null | awk '/Mem:/ {printf("%.1f", $3/$2*100)}' || echo "0"; }
get_disk() { df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}' || echo "0"; }
get_updates() {
  if command -v apt-get &>/dev/null; then
    local result=""
    while IFS= read -r line; do
      local pkg=$(echo "$line" | awk '{print $2}')
      [ -n "$result" ] && result="$result,"
      result="$result{\\"package\\": \\"$pkg\\", \\"priority\\": \\"normal\\"}"
    done < <(apt-get -s upgrade 2>/dev/null | grep "^Inst" | head -20)
    echo "[$result]"
  else echo "[]"; fi
}

${moduleCollectCode.replace(/\\\\/g, '\\')}

CPU=$(get_cpu); RAM=$(get_ram); DISK=$(get_disk)
UPDATES=$(get_updates); [ -z "$UPDATES" ] && UPDATES="[]"

EXTRA_DATA="{${modules.map(mod => {
    const m = MODULE_SCRIPTS[mod];
    return m ? `\\"${mod}\\": $\{${m.varName.replace(/\\\\/g, '\\')}}` : '';
  }).filter(Boolean).join(',')}}"

curl -s -X POST "$REPORT_URL" \\
  -H "Content-Type: application/json" \\
  -d "{\\"agent_token\\":\\"$TOKEN\\",\\"hostname\\":\\"$HOSTNAME_VAL\\",\\"ip_address\\":\\"$IP_ADDR\\",\\"os_info\\":{\\"name\\":\\"$(uname -s)\\",\\"version\\":\\"$(uname -r)\\",\\"arch\\":\\"$(uname -m)\\"},\\"cpu_usage\\":$CPU,\\"ram_usage\\":$RAM,\\"disk_usage\\":$DISK,\\"security_updates\\":$UPDATES,\\"extra_data\\":$EXTRA_DATA}" > /dev/null 2>&1
AGENT_SCRIPT_EOF

sed -i "s|__TOKEN__|\\$TOKEN|g" "\\$SCRIPT_PATH"
sed -i "s|__REPORT_URL__|\\$REPORT_URL|g" "\\$SCRIPT_PATH"
chmod +x "\\$SCRIPT_PATH"

# Setup cron every 20 minutes
(crontab -l 2>/dev/null | grep -v vextagon; echo "*/20 * * * * /opt/vextagon/agent.sh") | crontab -

# First report
bash "\\$SCRIPT_PATH"

echo "[Vextagon Insight] Agente instalado com sucesso!"
echo "[Vextagon Insight] Módulos ativos: ${modules.length > 0 ? modules.join(', ') : 'base'}"
echo "[Vextagon Insight] Relatórios a cada 20 minutos."
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("# Erro: token ausente\nexit 1", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: server, error } = await supabaseAdmin
      .from("server_monitoring")
      .select("id, agent_token, install_expires_at, modules")
      .eq("agent_token", token)
      .single();

    if (error || !server) {
      return new Response("# Erro: token inválido\nexit 1", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    if (server.install_expires_at) {
      const expiresAt = new Date(server.install_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return new Response("# Erro: link expirado. Gere um novo token no painel.\nexit 1", {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }
    }

    // Invalidate after first use
    await supabaseAdmin
      .from("server_monitoring")
      .update({ install_expires_at: new Date(0).toISOString() })
      .eq("id", server.id);

    const reportUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/agent-report`;
    const modules: string[] = Array.isArray(server.modules) ? server.modules : [];
    const script = buildScript(token, reportUrl, modules);

    return new Response(script, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return new Response("# Erro interno\nexit 1", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
