import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildScript(token: string, reportUrl: string, modules: string[]): string {
  const moduleFlags = modules.map(m => `"${m}"`).join(" ");

  return `#!/bin/bash
set -e

TOKEN="${token}"
REPORT_URL="${reportUrl}"
MODULES=(${moduleFlags})

echo "[Vextagon Insight] Instalando agente..."

HOSTNAME_VAL=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me)
OS_NAME=$(uname -s)
OS_VERSION=$(uname -r)
OS_ARCH=$(uname -m)

# ── Collection functions ──

get_cpu() {
  top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' || echo "0"
}

get_ram() {
  free 2>/dev/null | awk '/Mem:/ {printf("%.1f", $3/$2*100)}' || echo "0"
}

get_disk() {
  df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}' || echo "0"
}

get_updates() {
  if command -v apt-get &>/dev/null; then
    local items=""
    while IFS= read -r line; do
      local pkg
      pkg=$(echo "$line" | awk '{print $2}')
      [ -n "$items" ] && items="$items,"
      items="$items{\"package\":\"$pkg\",\"priority\":\"normal\"}"
    done < <(apt-get -s upgrade 2>/dev/null | grep "^Inst" | head -20)
    echo "[$items]"
  else
    echo "[]"
  fi
}

has_module() {
  local mod="$1"
  for m in "\${MODULES[@]}"; do
    [ "$m" = "$mod" ] && return 0
  done
  return 1
}

get_ports() {
  local items=""
  while IFS= read -r line; do
    local port
    port=$(echo "$line" | awk '{split($4,a,":"); print a[length(a)]}')
    local svc
    svc=$(echo "$line" | awk '{print $NF}' | sed 's/.*://;s/"//g')
    [ -z "$svc" ] && svc="unknown"
    [ -n "$items" ] && items="$items,"
    items="$items{\"port\":$port,\"service\":\"$svc\"}"
  done < <(ss -tlnp 2>/dev/null | awk 'NR>1' | head -30)
  echo "[$items]"
}

get_services() {
  local items=""
  if command -v systemctl &>/dev/null; then
    while IFS= read -r line; do
      local name state
      name=$(echo "$line" | awk '{print $1}' | sed 's/.service//')
      state=$(echo "$line" | awk '{print $4}')
      [ -n "$items" ] && items="$items,"
      items="$items{\"name\":\"$name\",\"status\":\"$state\"}"
    done < <(systemctl list-units --type=service --no-pager --no-legend 2>/dev/null | head -50)
  fi
  echo "[$items]"
}

get_processes() {
  local items=""
  while IFS= read -r line; do
    local user pid cpu mem cmd
    user=$(echo "$line" | awk '{print $1}')
    pid=$(echo "$line" | awk '{print $2}')
    cpu=$(echo "$line" | awk '{print $3}')
    mem=$(echo "$line" | awk '{print $4}')
    cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i}' | sed 's/["\\\\]//g' | head -c 80)
    [ -n "$items" ] && items="$items,"
    items="$items{\"pid\":$pid,\"user\":\"$user\",\"cpu\":$cpu,\"mem\":$mem,\"cmd\":\"$cmd\"}"
  done < <(ps aux --sort=-%cpu 2>/dev/null | awk 'NR>1' | head -20)
  echo "[$items]"
}

get_logged_users() {
  local items=""
  while IFS= read -r line; do
    local user tty from login_at
    user=$(echo "$line" | awk '{print $1}')
    tty=$(echo "$line" | awk '{print $2}')
    from=$(echo "$line" | awk '{print $3}')
    login_at=$(echo "$line" | awk '{print $4, $5}')
    [ -n "$items" ] && items="$items,"
    items="$items{\"user\":\"$user\",\"tty\":\"$tty\",\"from\":\"$from\",\"login_at\":\"$login_at\"}"
  done < <(who 2>/dev/null)
  echo "[$items]"
}

get_net_conns() {
  local items=""
  while IFS= read -r line; do
    local state local_addr remote_addr
    state=$(echo "$line" | awk '{print $1}')
    local_addr=$(echo "$line" | awk '{print $4}')
    remote_addr=$(echo "$line" | awk '{print $5}')
    [ -n "$items" ] && items="$items,"
    items="$items{\"state\":\"$state\",\"local\":\"$local_addr\",\"remote\":\"$remote_addr\"}"
  done < <(ss -tnp 2>/dev/null | awk 'NR>1' | head -30)
  echo "[$items]"
}

get_docker() {
  local items=""
  if command -v docker &>/dev/null; then
    while IFS='|' read -r id name image status; do
      [ -n "$items" ] && items="$items,"
      items="$items{\"id\":\"$id\",\"name\":\"$name\",\"image\":\"$image\",\"status\":\"$status\"}"
    done < <(docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}' 2>/dev/null | head -30)
  fi
  echo "[$items]"
}

get_auth_logs() {
  local items=""
  local logfile="/var/log/auth.log"
  [ ! -f "$logfile" ] && logfile="/var/log/secure"
  if [ -f "$logfile" ]; then
    while IFS= read -r line; do
      local escaped
      escaped=$(echo "$line" | sed 's/["\\\\]//g' | head -c 200)
      [ -n "$items" ] && items="$items,"
      items="$items\"$escaped\""
    done < <(tail -50 "$logfile" 2>/dev/null)
  fi
  echo "[$items]"
}

# ── Send report ──

send_report() {
  local CPU RAM DISK UPDATES
  CPU=$(get_cpu)
  RAM=$(get_ram)
  DISK=$(get_disk)
  UPDATES=$(get_updates)
  [ -z "$UPDATES" ] && UPDATES="[]"

  # Build extra_data based on enabled modules
  local EXTRA="{"
  local first=true

  if has_module "open_ports"; then
    local val
    val=$(get_ports)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"open_ports\":$val"
  fi
  if has_module "installed_services"; then
    local val
    val=$(get_services)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"installed_services\":$val"
  fi
  if has_module "running_processes"; then
    local val
    val=$(get_processes)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"running_processes\":$val"
  fi
  if has_module "logged_users"; then
    local val
    val=$(get_logged_users)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"logged_users\":$val"
  fi
  if has_module "network_connections"; then
    local val
    val=$(get_net_conns)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"network_connections\":$val"
  fi
  if has_module "docker_containers"; then
    local val
    val=$(get_docker)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"docker_containers\":$val"
  fi
  if has_module "auth_logs"; then
    local val
    val=$(get_auth_logs)
    [ "$first" = true ] && first=false || EXTRA="$EXTRA,"
    EXTRA="$EXTRA\"auth_logs\":$val"
  fi

  EXTRA="$EXTRA}"

  local PAYLOAD
  PAYLOAD=$(cat <<EOJSON
{
  "agent_token": "$TOKEN",
  "hostname": "$HOSTNAME_VAL",
  "ip_address": "$IP_ADDR",
  "os_info": {"name": "$OS_NAME", "version": "$OS_VERSION", "arch": "$OS_ARCH"},
  "cpu_usage": $CPU,
  "ram_usage": $RAM,
  "disk_usage": $DISK,
  "security_updates": $UPDATES,
  "extra_data": $EXTRA
}
EOJSON
  )

  curl -s -X POST "$REPORT_URL" \\
    -H "Content-Type: application/json" \\
    -d "$PAYLOAD" > /dev/null 2>&1
}

# ── Install persistent agent ──

mkdir -p /opt/vextagon

# Write the agent script
cat > /opt/vextagon/agent.sh << 'VEXT_EOF'
PLACEHOLDER_SCRIPT
VEXT_EOF

# Replace placeholder with this entire script's content
cp "$0" /opt/vextagon/agent.sh 2>/dev/null || true

# If cp didn't work (piped from curl), write it directly
if [ ! -s /opt/vextagon/agent.sh ] || grep -q "PLACEHOLDER_SCRIPT" /opt/vextagon/agent.sh 2>/dev/null; then
  # Save current script from /dev/stdin
  cat > /opt/vextagon/agent.sh << 'AGENT_EOF'
#!/bin/bash
TOKEN="${token}"
REPORT_URL="${reportUrl}"
MODULES=(${moduleFlags})

HOSTNAME_VAL=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me)
OS_NAME=$(uname -s)
OS_VERSION=$(uname -r)
OS_ARCH=$(uname -m)

has_module() {
  local mod="$1"
  for m in "\${MODULES[@]}"; do
    [ "$m" = "$mod" ] && return 0
  done
  return 1
}

get_cpu() { top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' || echo "0"; }
get_ram() { free 2>/dev/null | awk '/Mem:/ {printf("%.1f", $3/$2*100)}' || echo "0"; }
get_disk() { df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}' || echo "0"; }

get_updates() {
  if command -v apt-get &>/dev/null; then
    local items=""
    while IFS= read -r line; do
      local pkg; pkg=$(echo "$line" | awk '{print $2}')
      [ -n "$items" ] && items="$items,"
      items="$items{\"package\":\"$pkg\",\"priority\":\"normal\"}"
    done < <(apt-get -s upgrade 2>/dev/null | grep "^Inst" | head -20)
    echo "[$items]"
  else echo "[]"; fi
}

get_ports() {
  local items=""
  while IFS= read -r line; do
    local port; port=$(echo "$line" | awk '{split($4,a,":"); print a[length(a)]}')
    local svc; svc=$(echo "$line" | awk '{print $NF}' | sed 's/.*://;s/"//g')
    [ -z "$svc" ] && svc="unknown"
    [ -n "$items" ] && items="$items,"
    items="$items{\"port\":$port,\"service\":\"$svc\"}"
  done < <(ss -tlnp 2>/dev/null | awk 'NR>1' | head -30)
  echo "[$items]"
}

get_services() {
  local items=""
  if command -v systemctl &>/dev/null; then
    while IFS= read -r line; do
      local name state
      name=$(echo "$line" | awk '{print $1}' | sed 's/.service//')
      state=$(echo "$line" | awk '{print $4}')
      [ -n "$items" ] && items="$items,"
      items="$items{\"name\":\"$name\",\"status\":\"$state\"}"
    done < <(systemctl list-units --type=service --no-pager --no-legend 2>/dev/null | head -50)
  fi
  echo "[$items]"
}

get_processes() {
  local items=""
  while IFS= read -r line; do
    local user pid cpu mem cmd
    user=$(echo "$line" | awk '{print $1}')
    pid=$(echo "$line" | awk '{print $2}')
    cpu=$(echo "$line" | awk '{print $3}')
    mem=$(echo "$line" | awk '{print $4}')
    cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i}' | head -c 80)
    [ -n "$items" ] && items="$items,"
    items="$items{\"pid\":$pid,\"user\":\"$user\",\"cpu\":$cpu,\"mem\":$mem,\"cmd\":\"$cmd\"}"
  done < <(ps aux --sort=-%cpu 2>/dev/null | awk 'NR>1' | head -20)
  echo "[$items]"
}

get_logged_users() {
  local items=""
  while IFS= read -r line; do
    local user tty from login_at
    user=$(echo "$line" | awk '{print $1}')
    tty=$(echo "$line" | awk '{print $2}')
    from=$(echo "$line" | awk '{print $3}')
    login_at=$(echo "$line" | awk '{print $4, $5}')
    [ -n "$items" ] && items="$items,"
    items="$items{\"user\":\"$user\",\"tty\":\"$tty\",\"from\":\"$from\",\"login_at\":\"$login_at\"}"
  done < <(who 2>/dev/null)
  echo "[$items]"
}

get_net_conns() {
  local items=""
  while IFS= read -r line; do
    local state local_addr remote_addr
    state=$(echo "$line" | awk '{print $1}')
    local_addr=$(echo "$line" | awk '{print $4}')
    remote_addr=$(echo "$line" | awk '{print $5}')
    [ -n "$items" ] && items="$items,"
    items="$items{\"state\":\"$state\",\"local\":\"$local_addr\",\"remote\":\"$remote_addr\"}"
  done < <(ss -tnp 2>/dev/null | awk 'NR>1' | head -30)
  echo "[$items]"
}

get_docker() {
  local items=""
  if command -v docker &>/dev/null; then
    while IFS='|' read -r id name image status; do
      [ -n "$items" ] && items="$items,"
      items="$items{\"id\":\"$id\",\"name\":\"$name\",\"image\":\"$image\",\"status\":\"$status\"}"
    done < <(docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}' 2>/dev/null | head -30)
  fi
  echo "[$items]"
}

get_auth_logs() {
  local items=""
  local logfile="/var/log/auth.log"
  [ ! -f "$logfile" ] && logfile="/var/log/secure"
  if [ -f "$logfile" ]; then
    while IFS= read -r line; do
      local escaped; escaped=$(echo "$line" | sed 's/["\\\\]//g' | head -c 200)
      [ -n "$items" ] && items="$items,"
      items="$items\"$escaped\""
    done < <(tail -50 "$logfile" 2>/dev/null)
  fi
  echo "[$items]"
}

CPU=$(get_cpu); RAM=$(get_ram); DISK=$(get_disk)
UPDATES=$(get_updates); [ -z "$UPDATES" ] && UPDATES="[]"

EXTRA="{"
first=true
if has_module "open_ports"; then val=$(get_ports); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"open_ports\":$val"; fi
if has_module "installed_services"; then val=$(get_services); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"installed_services\":$val"; fi
if has_module "running_processes"; then val=$(get_processes); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"running_processes\":$val"; fi
if has_module "logged_users"; then val=$(get_logged_users); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"logged_users\":$val"; fi
if has_module "network_connections"; then val=$(get_net_conns); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"network_connections\":$val"; fi
if has_module "docker_containers"; then val=$(get_docker); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"docker_containers\":$val"; fi
if has_module "auth_logs"; then val=$(get_auth_logs); [ "$first" = true ] && first=false || EXTRA="$EXTRA,"; EXTRA="$EXTRA\"auth_logs\":$val"; fi
EXTRA="$EXTRA}"

PAYLOAD=$(cat <<EOJSON
{
  "agent_token": "$TOKEN",
  "hostname": "$HOSTNAME_VAL",
  "ip_address": "$IP_ADDR",
  "os_info": {"name": "$OS_NAME", "version": "$OS_VERSION", "arch": "$OS_ARCH"},
  "cpu_usage": $CPU,
  "ram_usage": $RAM,
  "disk_usage": $DISK,
  "security_updates": $UPDATES,
  "extra_data": $EXTRA
}
EOJSON
)

curl -s -X POST "$REPORT_URL" -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1
AGENT_EOF
fi

chmod +x /opt/vextagon/agent.sh

# Setup cron every 20 minutes
(crontab -l 2>/dev/null | grep -v vextagon; echo "*/20 * * * * /opt/vextagon/agent.sh") | crontab -

# Send first report
send_report

echo "[Vextagon Insight] Agente instalado com sucesso!"
echo "[Vextagon Insight] Modulos ativos: ${modules.length > 0 ? modules.join(", ") : "base"}"
echo "[Vextagon Insight] Relatorios a cada 20 minutos."
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
      return new Response("#!/bin/bash\necho 'Erro: token ausente'\nexit 1", {
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
      return new Response("#!/bin/bash\necho 'Erro: token invalido'\nexit 1", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    if (server.install_expires_at) {
      const expiresAt = new Date(server.install_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return new Response("#!/bin/bash\necho 'Erro: link expirado. Gere um novo token no painel.'\nexit 1", {
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
  } catch (_e) {
    return new Response("#!/bin/bash\necho 'Erro interno'\nexit 1", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
