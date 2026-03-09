#!/usr/bin/env python3
"""
Vextagon Kali VPS API
API REST para executar ferramentas de segurança via Vextagon Platform.

Instalação:
  pip3 install flask gunicorn
  python3 vextagon_api.py

Produção:
  gunicorn -w 2 -b 0.0.0.0:5000 vextagon_api:app

Systemd service (salve em /etc/systemd/system/vextagon-api.service):
  [Unit]
  Description=Vextagon Kali API
  After=network.target

  [Service]
  Type=simple
  User=root
  WorkingDirectory=/opt/vextagon
  ExecStart=/usr/bin/gunicorn -w 2 -b 0.0.0.0:5000 vextagon_api:app
  Restart=always

  [Install]
  WantedBy=multi-user.target

Então:
  sudo systemctl enable vextagon-api
  sudo systemctl start vextagon-api
"""

import subprocess
import json
import os
import re
import time
from flask import Flask, request, jsonify
from functools import wraps

app = Flask(__name__)

# Optional API key protection
API_KEY = os.environ.get("VEXTAGON_API_KEY", "")


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if API_KEY:
            key = request.headers.get("X-API-Key", "")
            if key != API_KEY:
                return jsonify({"error": "Invalid API key"}), 403
        return f(*args, **kwargs)
    return decorated


def run_command(cmd, timeout=120):
    """Execute a shell command with timeout and return output."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=timeout
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Command timed out", "returncode": -1}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -1}


def parse_nmap_output(raw):
    """Parse nmap output into structured data."""
    ports = []
    for line in raw.split("\n"):
        match = re.match(r"(\d+)/(tcp|udp)\s+(\S+)\s+(\S+)\s*(.*)", line)
        if match:
            ports.append({
                "port": int(match.group(1)),
                "protocol": match.group(2),
                "state": match.group(3),
                "service": match.group(4),
                "version": match.group(5).strip(),
            })
    return ports


# ── Tool Handlers ──

TOOLS = {}


def tool(name):
    def decorator(f):
        TOOLS[name] = f
        return f
    return decorator


@tool("nmap")
def run_nmap(target, options):
    flags = options.get("flags", "-sV --top-ports 100")
    # Sanitize: only allow safe nmap flags
    safe_flags = re.sub(r"[;&|`$]", "", flags)
    safe_target = re.sub(r"[;&|`$]", "", target)
    cmd = f"nmap {safe_flags} {safe_target}"
    result = run_command(cmd, timeout=180)
    ports = parse_nmap_output(result["stdout"])
    return {
        "success": result["returncode"] == 0,
        "tool": "nmap",
        "target": target,
        "ports": ports,
        "output": result["stdout"],
        "error": result["stderr"] if result["returncode"] != 0 else None,
    }


@tool("nikto")
def run_nikto(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    if not safe_target.startswith("http"):
        safe_target = f"https://{safe_target}"
    cmd = f"nikto -h {safe_target} -Format json -output /tmp/nikto_out.json -maxtime 120s 2>&1 || true"
    result = run_command(cmd, timeout=150)
    
    vulnerabilities = []
    try:
        with open("/tmp/nikto_out.json", "r") as f:
            nikto_data = json.load(f)
            for vuln in nikto_data.get("vulnerabilities", []):
                vulnerabilities.append({
                    "id": vuln.get("id", ""),
                    "severity": "medium",
                    "description": vuln.get("msg", ""),
                    "method": vuln.get("method", ""),
                    "url": vuln.get("url", ""),
                })
    except:
        pass

    return {
        "success": True,
        "tool": "nikto",
        "target": target,
        "vulnerabilities": vulnerabilities,
        "output": result["stdout"],
    }


@tool("whatweb")
def run_whatweb(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    cmd = f"whatweb -q --log-json=/tmp/whatweb_out.json {safe_target}"
    result = run_command(cmd, timeout=60)
    
    technologies = []
    try:
        with open("/tmp/whatweb_out.json", "r") as f:
            for line in f:
                data = json.loads(line)
                for plugin, details in data.get("plugins", {}).items():
                    version = details.get("version", [""])[0] if details.get("version") else ""
                    technologies.append({
                        "name": plugin,
                        "value": version,
                        "category": details.get("string", [""])[0] if details.get("string") else "",
                    })
    except:
        pass

    return {
        "success": True,
        "tool": "whatweb",
        "target": target,
        "technologies": technologies,
        "output": result["stdout"],
    }


@tool("theharvester")
def run_theharvester(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    source = options.get("source", "google,bing,crtsh")
    cmd = f"theHarvester -d {safe_target} -b {source} -l 200"
    result = run_command(cmd, timeout=120)
    
    emails = []
    hosts = []
    for line in result["stdout"].split("\n"):
        line = line.strip()
        if "@" in line and "." in line:
            emails.append(line)
        elif re.match(r"^[\w.-]+\.\w{2,}$", line):
            hosts.append(line)

    return {
        "success": result["returncode"] == 0,
        "tool": "theharvester",
        "target": target,
        "emails": emails[:50],
        "hosts": hosts[:100],
        "output": result["stdout"],
    }


@tool("sublist3r")
def run_sublist3r(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    cmd = f"sublist3r -d {safe_target} -t 10 -o /tmp/sublist3r_out.txt"
    result = run_command(cmd, timeout=120)
    
    subdomains = []
    try:
        with open("/tmp/sublist3r_out.txt", "r") as f:
            subdomains = [line.strip() for line in f if line.strip()]
    except:
        pass

    return {
        "success": True,
        "tool": "sublist3r",
        "target": target,
        "subdomains": subdomains,
        "count": len(subdomains),
        "output": result["stdout"],
    }


@tool("sqlmap")
def run_sqlmap(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    if not safe_target.startswith("http"):
        safe_target = f"https://{safe_target}"
    cmd = f"sqlmap -u '{safe_target}' --batch --crawl=2 --level=1 --risk=1 --timeout=30 --retries=1 2>&1 | tail -100"
    result = run_command(cmd, timeout=180)
    return {
        "success": result["returncode"] == 0,
        "tool": "sqlmap",
        "target": target,
        "output": result["stdout"],
    }


@tool("hydra")
def run_hydra(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    service = options.get("service", "ssh")
    userlist = options.get("userlist", "/usr/share/wordlists/metasploit/common_users.txt")
    passlist = options.get("passlist", "/usr/share/wordlists/metasploit/common_passwords.txt")
    tasks = options.get("tasks", 4)
    cmd = f"hydra -L {userlist} -P {passlist} -t {tasks} -f {safe_target} {service} 2>&1 | tail -50"
    result = run_command(cmd, timeout=300)
    return {
        "success": result["returncode"] == 0,
        "tool": "hydra",
        "target": target,
        "output": result["stdout"],
    }


@tool("whois")
def run_whois(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    result = run_command(f"whois {safe_target}", timeout=30)
    return {
        "success": result["returncode"] == 0,
        "tool": "whois",
        "target": target,
        "output": result["stdout"],
    }


@tool("dig")
def run_dig(target, options):
    safe_target = re.sub(r"[;&|`$]", "", target)
    result = run_command(f"dig {safe_target} ANY +noall +answer", timeout=30)
    return {
        "success": result["returncode"] == 0,
        "tool": "dig",
        "target": target,
        "output": result["stdout"],
    }


@tool("iptables_logs")
def get_iptables_logs(target, options):
    limit = options.get("limit", 100)
    result = run_command(f"grep -i 'iptables\\|kernel.*DROP\\|kernel.*REJECT' /var/log/syslog 2>/dev/null | tail -{limit}", timeout=15)
    
    logs = []
    for line in result["stdout"].split("\n"):
        if not line.strip():
            continue
        ip_match = re.search(r"SRC=(\d+\.\d+\.\d+\.\d+)", line)
        action = "DROP" if "DROP" in line else "REJECT" if "REJECT" in line else "LOG"
        logs.append({
            "timestamp": line[:15] if len(line) > 15 else "",
            "source_ip": ip_match.group(1) if ip_match else "",
            "action": action,
            "raw": line.strip(),
        })

    return {"success": True, "tool": "iptables_logs", "target": target, "output": logs}


@tool("fail2ban_logs")
def get_fail2ban_logs(target, options):
    limit = options.get("limit", 100)
    result = run_command(f"grep -i 'ban\\|unban' /var/log/fail2ban.log 2>/dev/null | tail -{limit}", timeout=15)
    
    logs = []
    for line in result["stdout"].split("\n"):
        if not line.strip():
            continue
        ip_match = re.search(r"(\d+\.\d+\.\d+\.\d+)", line)
        action = "Ban" if "Ban" in line else "Unban" if "Unban" in line else "Info"
        logs.append({
            "timestamp": line[:23] if len(line) > 23 else "",
            "ip": ip_match.group(1) if ip_match else "",
            "action": action,
            "raw": line.strip(),
        })

    return {"success": True, "tool": "fail2ban_logs", "target": target, "output": logs}


@tool("waf_logs")
def get_waf_logs(target, options):
    limit = options.get("limit", 100)
    # Try ModSecurity audit log
    result = run_command(f"tail -{limit} /var/log/modsec_audit.log 2>/dev/null || tail -{limit} /var/log/apache2/modsec_audit.log 2>/dev/null || echo 'No ModSecurity logs found'", timeout=15)
    return {"success": True, "tool": "waf_logs", "target": target, "output": result["stdout"]}


# ── Routes ──

@app.route("/api/run", methods=["POST"])
@require_api_key
def api_run():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    tool_name = data.get("tool")
    target = data.get("target")
    options = data.get("options", {})

    if not tool_name or not target:
        return jsonify({"error": "Missing 'tool' or 'target'"}), 400

    if tool_name not in TOOLS:
        return jsonify({"error": f"Unknown tool: {tool_name}. Available: {list(TOOLS.keys())}"}), 400

    # Sanitize target
    if re.search(r"[;&|`$]", target):
        return jsonify({"error": "Invalid target"}), 400

    start = time.time()
    result = TOOLS[tool_name](target, options)
    result["execution_time"] = round(time.time() - start, 2)

    return jsonify(result)


@app.route("/api/tools", methods=["GET"])
@require_api_key
def api_tools():
    return jsonify({"tools": list(TOOLS.keys())})


@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"status": "ok", "tools": len(TOOLS)})


if __name__ == "__main__":
    print("[Vextagon API] Starting on port 5000...")
    print(f"[Vextagon API] API Key protection: {'enabled' if API_KEY else 'disabled'}")
    print(f"[Vextagon API] Available tools: {list(TOOLS.keys())}")
    app.run(host="0.0.0.0", port=5000, debug=False)
