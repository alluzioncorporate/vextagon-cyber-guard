// Mock data for Vextagon platform

export const mockWafData = {
  totalRequests: 1_284_392,
  blockedRequests: 23_847,
  blockedPercentage: 1.86,
  threats: {
    sqlInjection: 8_421,
    xss: 6_932,
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
  recentThreats: [
    { id: "t1", type: "SQL Injection", ip: "192.168.1.45", path: "/api/users?id=1 OR 1=1", timestamp: "2026-03-08 14:32:01", severity: "critical" },
    { id: "t2", type: "XSS", ip: "10.0.0.23", path: "/search?q=<script>alert(1)</script>", timestamp: "2026-03-08 14:31:48", severity: "high" },
    { id: "t3", type: "DDoS", ip: "203.0.113.0/24", path: "/api/health", timestamp: "2026-03-08 14:30:12", severity: "critical" },
    { id: "t4", type: "SQL Injection", ip: "172.16.0.8", path: "/login' UNION SELECT--", timestamp: "2026-03-08 14:29:55", severity: "high" },
    { id: "t5", type: "XSS", ip: "192.168.2.100", path: "/comment?body=<img onerror=...>", timestamp: "2026-03-08 14:28:30", severity: "medium" },
  ],
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
      { type: "NS", value: "ns1.example.com, ns2.example.com" },
    ],
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
    { port: 3306, service: "MySQL", status: "open", risk: "critical" },
    { port: 8080, service: "HTTP-Alt", status: "open", risk: "high" },
  ],
  vulnerabilities: [
    { id: "CVE-2024-1234", severity: "critical", title: "Remote Code Execution in Apache 2.4.49", description: "Path traversal vulnerability allowing RCE", affected: "Apache HTTP Server" },
    { id: "CVE-2024-5678", severity: "high", title: "SQL Injection in WordPress Plugin", description: "Unsanitized input in contact form plugin", affected: "ContactForm v3.2" },
    { id: "CVE-2024-9012", severity: "medium", title: "Information Disclosure via Headers", description: "Server version exposed in response headers", affected: "Nginx" },
    { id: "CVE-2024-3456", severity: "low", title: "Missing Security Headers", description: "X-Frame-Options and CSP headers not configured", affected: "Web Server Config" },
  ],
};

export const mockLeakedCredentials = [
  { id: "lc1", email: "admin@alluzion.com", source: "BreachDB 2025", date: "2025-11-15", status: "leaked", passwordHash: "sha256:a1b2c3..." },
  { id: "lc2", email: "dev@alluzion.com", source: "DarkWeb Forum", date: "2025-09-22", status: "leaked", passwordHash: "md5:d4e5f6..." },
  { id: "lc3", email: "ceo@alluzion.com", source: "N/A", date: "N/A", status: "protected", passwordHash: "N/A" },
  { id: "lc4", email: "finance@alluzion.com", source: "PasteDB", date: "2026-01-03", status: "leaked", passwordHash: "bcrypt:$2b$10$..." },
  { id: "lc5", email: "hr@alluzion.com", source: "N/A", date: "N/A", status: "protected", passwordHash: "N/A" },
  { id: "lc6", email: "support@alluzion.com", source: "ComboList v8", date: "2025-12-20", status: "leaked", passwordHash: "sha1:7g8h9i..." },
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
