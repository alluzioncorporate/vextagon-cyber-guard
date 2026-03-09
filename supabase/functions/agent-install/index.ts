import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AGENT_SCRIPT = (token: string, reportUrl: string) => `#!/bin/bash
set -e

TOKEN="${token}"
REPORT_URL="${reportUrl}"

echo "[Vextagon Insight] Instalando agente..."

# Detect OS
OS_NAME=$(uname -s)
OS_VERSION=$(uname -r)
OS_ARCH=$(uname -m)
HOSTNAME_VAL=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me)

# Collect CPU usage
get_cpu() {
  top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' || echo "0"
}

# Collect RAM usage
get_ram() {
  free 2>/dev/null | awk '/Mem:/ {printf("%.1f", $3/$2*100)}' || echo "0"
}

# Collect Disk usage
get_disk() {
  df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}' || echo "0"
}

# Collect open ports
get_ports() {
  ss -tlnp 2>/dev/null | awk 'NR>1 {split($4,a,":"); print a[length(a)]}' | sort -un | head -20 | while read port; do
    echo "{\\"port\\": $port}"
  done | paste -sd ',' | sed 's/^/[/' | sed 's/$/]/'
}

# Collect pending security updates
get_updates() {
  if command -v apt-get &>/dev/null; then
    apt-get -s upgrade 2>/dev/null | grep "^Inst" | head -20 | while read _ pkg _; do
      echo "{\\"package\\": \\"$pkg\\", \\"priority\\": \\"normal\\"}"
    done | paste -sd ',' | sed 's/^/[/' | sed 's/$/]/'
  else
    echo "[]"
  fi
}

# Send report function
send_report() {
  CPU=$(get_cpu)
  RAM=$(get_ram)
  DISK=$(get_disk)
  PORTS=$(get_ports)
  [ -z "$PORTS" ] && PORTS="[]"
  UPDATES=$(get_updates)
  [ -z "$UPDATES" ] && UPDATES="[]"

  PAYLOAD=$(cat <<EOJSON
{
  "agent_token": "$TOKEN",
  "hostname": "$HOSTNAME_VAL",
  "ip_address": "$IP_ADDR",
  "os_info": {"name": "$OS_NAME", "version": "$OS_VERSION", "arch": "$OS_ARCH"},
  "cpu_usage": $CPU,
  "ram_usage": $RAM,
  "disk_usage": $DISK,
  "open_ports": $PORTS,
  "security_updates": $UPDATES
}
EOJSON
  )

  curl -s -X POST "$REPORT_URL" \\
    -H "Content-Type: application/json" \\
    -d "$PAYLOAD" > /dev/null 2>&1
}

# Create systemd service for periodic reports
SCRIPT_PATH="/opt/vextagon/agent.sh"
mkdir -p /opt/vextagon

cat > "$SCRIPT_PATH" << 'AGENT_INNER'
#!/bin/bash
TOKEN="__TOKEN__"
REPORT_URL="__REPORT_URL__"
HOSTNAME_VAL=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me)

get_cpu() { top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' || echo "0"; }
get_ram() { free 2>/dev/null | awk '/Mem:/ {printf("%.1f", $3/$2*100)}' || echo "0"; }
get_disk() { df / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}' || echo "0"; }
get_ports() {
  ss -tlnp 2>/dev/null | awk 'NR>1 {split($4,a,":"); print a[length(a)]}' | sort -un | head -20 | while read port; do
    echo "{\"port\": $port}"
  done | paste -sd ',' | sed 's/^/[/' | sed 's/$/]/'
}
get_updates() {
  if command -v apt-get &>/dev/null; then
    apt-get -s upgrade 2>/dev/null | grep "^Inst" | head -20 | while read _ pkg _; do
      echo "{\"package\": \"$pkg\", \"priority\": \"normal\"}"
    done | paste -sd ',' | sed 's/^/[/' | sed 's/$/]/'
  else echo "[]"; fi
}

CPU=$(get_cpu); RAM=$(get_ram); DISK=$(get_disk)
PORTS=$(get_ports); [ -z "$PORTS" ] && PORTS="[]"
UPDATES=$(get_updates); [ -z "$UPDATES" ] && UPDATES="[]"

curl -s -X POST "$REPORT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"agent_token\":\"$TOKEN\",\"hostname\":\"$HOSTNAME_VAL\",\"ip_address\":\"$IP_ADDR\",\"os_info\":{\"name\":\"$(uname -s)\",\"version\":\"$(uname -r)\",\"arch\":\"$(uname -m)\"},\"cpu_usage\":$CPU,\"ram_usage\":$RAM,\"disk_usage\":$DISK,\"open_ports\":$PORTS,\"security_updates\":$UPDATES}" > /dev/null 2>&1
AGENT_INNER

sed -i "s|__TOKEN__|$TOKEN|g" "$SCRIPT_PATH"
sed -i "s|__REPORT_URL__|$REPORT_URL|g" "$SCRIPT_PATH"
chmod +x "$SCRIPT_PATH"

# Setup cron every 20 minutes
(crontab -l 2>/dev/null | grep -v vextagon; echo "*/20 * * * * /opt/vextagon/agent.sh") | crontab -

# Send first report immediately
send_report

echo "[Vextagon Insight] Agente instalado com sucesso!"
echo "[Vextagon Insight] Relatórios serão enviados a cada 20 minutos."
`;

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

    // Find server by token
    const { data: server, error } = await supabaseAdmin
      .from("server_monitoring")
      .select("id, agent_token, install_expires_at")
      .eq("agent_token", token)
      .single();

    if (error || !server) {
      return new Response("# Erro: token inválido\nexit 1", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Check expiry
    if (server.install_expires_at) {
      const expiresAt = new Date(server.install_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return new Response("# Erro: link expirado. Gere um novo token no painel.\nexit 1", {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }
    }

    // Invalidate the install URL after first use (one-time use)
    await supabaseAdmin
      .from("server_monitoring")
      .update({ install_expires_at: new Date(0).toISOString() })
      .eq("id", server.id);

    const reportUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/agent-report`;
    const script = AGENT_SCRIPT(token, reportUrl);

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
