// Vextagon — DOMO tiers & real tool definitions

export const domoTiers = {
  domo1: {
    id: "domo1",
    name: "DOMO 1",
    subtitle: "LOW — Inteligência de Domínio",
    price: "R$ 97/mês",
    priceValue: 97,
    color: "cyan",
    icon: "Shield",
    description: "Monitoramento completo do seu domínio, site e IP. Detecção de vulnerabilidades, vazamentos e análise de superfície de ataque.",
    features: [
      "EASM Scanner completo (nmap, dig, whois)",
      "Descoberta de subdomínios (Sublist3r)",
      "Scanner de Cloud Leaks",
      "Tech Stack Profiler (WhatWeb)",
      "OSINT & Data Leak Monitor (theHarvester)",
      "Security Auditor com relatório",
      "WAF Dashboard (logs iptables/fail2ban)",
      "Alertas por email",
      "Monitoramento de certificado SSL",
      "Detecção de portas expostas",
    ],
  },
  domo2: {
    id: "domo2",
    name: "DOMO 2",
    subtitle: "MEDIUM — Fortaleza de Servidor",
    price: "R$ 197/mês",
    priceValue: 197,
    color: "gold",
    icon: "Server",
    description: "Monitoramento profundo de servidores Linux. CPU, RAM, disco, portas, processos, logs, updates e recomendações de IA para cada vulnerabilidade.",
    features: [
      "Tudo do DOMO 1",
      "Insight Agent completo (CPU, RAM, disco, rede)",
      "Monitoramento de portas abertas com IA",
      "Recomendações inteligentes por vulnerabilidade",
      "Processos em execução em tempo real",
      "Logs de autenticação (SSH, sudo)",
      "Atualizações de segurança pendentes",
      "Alertas WhatsApp em tempo real",
      "Phishing Simulator (campanhas internas)",
      "🔐 Gerenciador de Senhas Ultra-Avançado",
      "Gerador de senhas criptográficas",
      "Análise de força de senhas",
      "Treinamento de Engenharia Social",
      "Suporte a múltiplos servidores",
    ],
  },
  domo3: {
    id: "domo3",
    name: "DOMO 3",
    subtitle: "HIGH — Arsenal Kali Linux",
    price: "R$ 497/mês",
    priceValue: 497,
    color: "destructive",
    icon: "Skull",
    description: "Nível ELITE. Ferramentas ofensivas do Kali, Dark Web monitoring, Threat Intelligence, forense digital, detecção de malware e playbooks automáticos de resposta a incidentes.",
    features: [
      // Base
      "Tudo do DOMO 1 + DOMO 2",
      // Pentest Ofensivo
      "Nuclei (scanner com 10k+ templates)",
      "Masscan (scan de portas ultrarrápido)",
      "Gobuster (brute force de diretórios)",
      "Wfuzz (fuzzing de parâmetros web)",
      "SQLMap (SQL Injection automatizado)",
      "Hydra (brute force controlado)",
      "Nikto (scanner de vulnerabilidades web)",
      // Honey Tokens
      "Honey Token Generator & Monitor",
      // Lynis
      "Lynis Audit Score diário",
      // Dark Web
      "🕵️ Dark Web Monitor (vazamentos em fóruns)",
      "Monitoramento de credenciais na dark web",
      "Alertas de documentos vazados",
      // Threat Intel
      "🧠 Threat Intelligence em tempo real",
      "Feed de IOCs (Indicators of Compromise)",
      "Correlação com CVEs sendo explorados",
      // Forense & Malware
      "🔬 Análise forense com Volatility",
      "YARA rules para detecção de malware",
      "rkhunter & chkrootkit (rootkit detection)",
      "Análise de memória de servidores",
      // Incident Response
      "⚡ Playbooks automáticos de resposta",
      "Isolamento automático de ameaças",
      "Quarentena de arquivos suspeitos",
      "Bloqueio automático de IPs maliciosos",
      // Reports
      "Relatórios PDF executivos",
      "Dashboard tipo Wazuh/Velociraptor",
      "Suporte prioritário 24/7",
    ],
  },
};

// Legacy export for compatibility
export const tiers = {
  free: { name: "Free", price: "R$ 0", features: ["Acesso limitado"], limited: true },
  premium: { name: "Premium", price: "R$ 197/mês", features: [], limited: false },
};

// Sidebar navigation grouped by DOMO level
export const domoNavGroups = [
  {
    domo: "DOMO 1",
    level: "LOW",
    color: "cyan",
    requiredTier: "domo1",
    items: [
      { to: "/", icon: "LayoutDashboard", label: "WAF & Defesa" },
      { to: "/easm", icon: "Radar", label: "EASM Scanner" },
      { to: "/subdomain-finder", icon: "Search", label: "Subdomínios" },
      { to: "/cloud-leak-scanner", icon: "Cloud", label: "Cloud Leaks" },
      { to: "/tech-stack-profiler", icon: "Code2", label: "Tech Stack" },
      { to: "/data-leaks", icon: "AlertTriangle", label: "OSINT & Leaks" },
      { to: "/auditor", icon: "FileText", label: "Auditor" },
      { to: "/alerts", icon: "Bell", label: "Alertas" },
    ],
  },
  {
    domo: "DOMO 2",
    level: "MEDIUM",
    color: "gold",
    requiredTier: "domo2",
    items: [
      { to: "/dashboard/servers", icon: "Server", label: "Insight Agent" },
      { to: "/phishing-simulator", icon: "Mail", label: "Phishing Sim" },
    ],
  },
  {
    domo: "DOMO 3",
    level: "HIGH",
    color: "destructive",
    requiredTier: "domo3",
    items: [
      { to: "/pentest-arsenal", icon: "Crosshair", label: "Pentest Arsenal" },
      { to: "/dark-web-monitor", icon: "Ghost", label: "Dark Web" },
      { to: "/threat-intel", icon: "Brain", label: "Threat Intel" },
      { to: "/forensics", icon: "Microscope", label: "Forense" },
      { to: "/playbooks", icon: "Zap", label: "Playbooks" },
      { to: "/honey-token-generator", icon: "Eye", label: "Honey Tokens" },
    ],
  },
];
