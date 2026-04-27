// Vextagon Domo Engine — 3-level offensive analysis orchestrator
// L1 Surface  → DNS, SSL, HTTP Headers (rápido)
// L2 Deep     → Subdomínios, Tech Stack (Wappalyzer-like), CVEs conhecidas
// L3 Core     → Dark Web leaks (mock realista) + agente instalado
//
// Cada nível é assíncrono e emite progresso (0..100) via callback,
// permitindo barras de progresso por etapa na UI.

import { generateScanResults, type ScanResult } from "./scanEngine";

export type DomoLevel = 1 | 2 | 3;

export interface DomoStep {
  id: string;
  label: string;
  weight: number; // soma dos pesos = 100 por nível
}

export interface DomoProgress {
  step: string;
  label: string;
  percent: number; // 0..100 do nível
  message?: string;
}

export interface L1Report {
  domain: string;
  startedAt: string;
  finishedAt: string;
  dns: ScanResult["dns"];
  ssl: ScanResult["ssl"];
  headers: ScanResult["securityHeaders"];
  headersScore: number; // 0..100
  sslGrade: string;
  summary: string;
}

export interface Subdomain {
  name: string;
  ip: string;
  status: "active" | "parked" | "dead";
  tech?: string;
}

export interface TechFingerprint {
  category: string;
  name: string;
  version?: string;
  confidence: number; // 0..100
}

export interface CveFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affected: string;
}

export interface L2Report {
  domain: string;
  startedAt: string;
  finishedAt: string;
  subdomains: Subdomain[];
  technologies: TechFingerprint[];
  cves: CveFinding[];
  exposureScore: number; // 0..100
  summary: string;
}

export interface DarkLeak {
  source: string;
  date: string;
  recordCount: number;
  exposed: string[]; // tipos: email, password_hash, phone, cpf...
  severity: "critical" | "high" | "medium" | "low";
  marketplace?: string;
  priceUSD?: number;
}

export interface AgentSnapshot {
  hostname: string;
  ip: string;
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  openPorts: number;
  pendingUpdates: number;
  lastSeen: string;
}

export interface L3Report {
  domain: string;
  startedAt: string;
  finishedAt: string;
  leaks: DarkLeak[];
  totalRecordsExposed: number;
  agent: AgentSnapshot | null;
  coreRiskScore: number; // 0..100 (quanto maior, pior)
  summary: string;
}

// ── helpers ──

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed || 1; }
  next() { this.s = (this.s * 16807) % 2147483647; return this.s / 2147483647; }
  int(a: number, b: number) { return Math.floor(this.next() * (b - a + 1)) + a; }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
  bool(p = 0.5) { return this.next() < p; }
}

// ── L1: SURFACE ──

const L1_STEPS: DomoStep[] = [
  { id: "dns", label: "Resolvendo DNS", weight: 30 },
  { id: "ssl", label: "Inspecionando certificado SSL/TLS", weight: 30 },
  { id: "headers", label: "Auditando headers HTTP", weight: 30 },
  { id: "summary", label: "Compilando relatório", weight: 10 },
];

export async function runLevel1(
  domain: string,
  onProgress?: (p: DomoProgress) => void
): Promise<L1Report> {
  const startedAt = new Date().toISOString();
  const data = generateScanResults(domain);
  let acc = 0;

  for (const step of L1_STEPS) {
    onProgress?.({ step: step.id, label: step.label, percent: acc });
    await sleep(350 + Math.random() * 250);
    acc += step.weight;
    onProgress?.({ step: step.id, label: step.label, percent: Math.min(acc, 100) });
  }

  const headersList = Object.values(data.securityHeaders);
  const present = headersList.filter((h) => h.present).length;
  const headersScore = Math.round((present / headersList.length) * 100);

  const summary = `DNS resolvido (${data.dns.records.length} registros). SSL ${data.ssl.valid ? "válido" : "inválido"} (grade ${data.ssl.grade}). ${present}/${headersList.length} headers de segurança presentes.`;

  return {
    domain,
    startedAt,
    finishedAt: new Date().toISOString(),
    dns: data.dns,
    ssl: data.ssl,
    headers: data.securityHeaders,
    headersScore,
    sslGrade: data.ssl.grade,
    summary,
  };
}

// ── L2: DEEP ──

const L2_STEPS: DomoStep[] = [
  { id: "subdomains", label: "Enumerando subdomínios", weight: 40 },
  { id: "tech", label: "Fingerprinting de tecnologias", weight: 30 },
  { id: "cve", label: "Cruzando bases de CVE", weight: 25 },
  { id: "summary", label: "Calculando exposição", weight: 5 },
];

const COMMON_SUBS = ["www", "mail", "api", "admin", "dev", "staging", "vpn", "ftp", "smtp", "ns1", "blog", "shop", "portal", "auth", "cdn", "static", "secure", "old", "backup", "test"];

const TECH_CATALOG: Record<string, string[]> = {
  "Web Server": ["nginx", "Apache", "LiteSpeed", "Caddy"],
  "JS Framework": ["React", "Vue.js", "Angular", "Next.js", "Svelte"],
  "CMS": ["WordPress", "Drupal", "Joomla", "Ghost"],
  "Analytics": ["Google Analytics", "Plausible", "Matomo", "Hotjar"],
  "CDN": ["Cloudflare", "Fastly", "Akamai", "AWS CloudFront"],
  "Language": ["PHP", "Node.js", "Python", "Ruby", "Go"],
  "Database": ["MySQL", "PostgreSQL", "MongoDB", "Redis"],
};

export async function runLevel2(
  domain: string,
  onProgress?: (p: DomoProgress) => void
): Promise<L2Report> {
  const startedAt = new Date().toISOString();
  const rng = new Rng(hash(domain + "L2"));
  let acc = 0;

  // subdomains
  onProgress?.({ step: "subdomains", label: L2_STEPS[0].label, percent: acc });
  const subCount = rng.int(6, 14);
  const picked = new Set<string>();
  const subdomains: Subdomain[] = [];
  for (let i = 0; i < subCount; i++) {
    const name = rng.pick(COMMON_SUBS);
    if (picked.has(name)) continue;
    picked.add(name);
    await sleep(120);
    subdomains.push({
      name: `${name}.${domain}`,
      ip: `${rng.int(1, 223)}.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`,
      status: rng.bool(0.8) ? "active" : rng.bool(0.5) ? "parked" : "dead",
      tech: rng.bool(0.6) ? rng.pick(TECH_CATALOG["Web Server"]) : undefined,
    });
    const pct = Math.round(((i + 1) / subCount) * L2_STEPS[0].weight);
    onProgress?.({ step: "subdomains", label: L2_STEPS[0].label, percent: pct, message: `${subdomains.length} subdomínios` });
  }
  acc = L2_STEPS[0].weight;

  // tech
  onProgress?.({ step: "tech", label: L2_STEPS[1].label, percent: acc });
  const technologies: TechFingerprint[] = [];
  const cats = Object.keys(TECH_CATALOG);
  for (const cat of cats) {
    if (!rng.bool(0.7)) continue;
    await sleep(140);
    const name = rng.pick(TECH_CATALOG[cat]);
    technologies.push({
      category: cat,
      name,
      version: `${rng.int(1, 9)}.${rng.int(0, 30)}.${rng.int(0, 9)}`,
      confidence: rng.int(70, 99),
    });
    onProgress?.({ step: "tech", label: L2_STEPS[1].label, percent: acc + Math.round((technologies.length / cats.length) * L2_STEPS[1].weight) });
  }
  acc += L2_STEPS[1].weight;

  // cves (reusa scanEngine para coerência)
  onProgress?.({ step: "cve", label: L2_STEPS[2].label, percent: acc });
  await sleep(500);
  const base = generateScanResults(domain);
  const cves: CveFinding[] = base.vulnerabilities.map((v) => ({
    id: v.id,
    severity: v.severity as CveFinding["severity"],
    title: v.title,
    description: v.description,
    affected: v.affected,
  }));
  acc += L2_STEPS[2].weight;
  onProgress?.({ step: "cve", label: L2_STEPS[2].label, percent: acc, message: `${cves.length} CVEs` });

  await sleep(200);
  acc = 100;

  const critical = cves.filter((c) => c.severity === "critical").length;
  const high = cves.filter((c) => c.severity === "high").length;
  const exposureScore = Math.min(100, subdomains.length * 4 + critical * 15 + high * 8);

  onProgress?.({ step: "summary", label: L2_STEPS[3].label, percent: 100 });

  return {
    domain,
    startedAt,
    finishedAt: new Date().toISOString(),
    subdomains,
    technologies,
    cves,
    exposureScore,
    summary: `${subdomains.length} subdomínios mapeados, ${technologies.length} tecnologias identificadas, ${cves.length} CVEs (${critical} críticas / ${high} altas).`,
  };
}

// ── L3: CORE ──

const L3_STEPS: DomoStep[] = [
  { id: "darkweb", label: "Varredura em mercados Dark Web", weight: 50 },
  { id: "agent", label: "Sincronizando com Vextagon Insight Agent", weight: 35 },
  { id: "risk", label: "Cálculo de risco do núcleo", weight: 15 },
];

const LEAK_SOURCES = [
  "BreachForums Dump 2024-Q3",
  "RaidForums Mirror",
  "Combolist Telegram (RU)",
  "ALPHV Leak Site",
  "LockBit Affiliate Drop",
  "Genesis Market Bot",
  "RussianMarket Logs",
  "2easy.shop Stealer",
];
const LEAK_FIELDS = ["email", "password_hash", "plain_password", "phone", "cpf", "credit_card", "session_cookie", "internal_token"];
const MARKETPLACES = ["BreachForums", "Exploit.in", "XSS.is", "Genesis Market", "Russian Market"];

export interface L3Options {
  agent?: AgentSnapshot | null;
}

export async function runLevel3(
  domain: string,
  onProgress?: (p: DomoProgress) => void,
  opts: L3Options = {}
): Promise<L3Report> {
  const startedAt = new Date().toISOString();
  const rng = new Rng(hash(domain + "L3"));
  let acc = 0;

  // darkweb
  onProgress?.({ step: "darkweb", label: L3_STEPS[0].label, percent: acc });
  const leakCount = rng.int(2, 6);
  const leaks: DarkLeak[] = [];
  for (let i = 0; i < leakCount; i++) {
    await sleep(300);
    const records = rng.int(120, 480_000);
    const sev = records > 100_000 ? "critical" : records > 20_000 ? "high" : records > 2_000 ? "medium" : "low";
    const fieldCount = rng.int(2, 5);
    const exposed: string[] = [];
    while (exposed.length < fieldCount) {
      const f = rng.pick(LEAK_FIELDS);
      if (!exposed.includes(f)) exposed.push(f);
    }
    leaks.push({
      source: rng.pick(LEAK_SOURCES),
      date: new Date(Date.now() - rng.int(7, 720) * 86400000).toISOString().slice(0, 10),
      recordCount: records,
      exposed,
      severity: sev as DarkLeak["severity"],
      marketplace: rng.pick(MARKETPLACES),
      priceUSD: rng.bool(0.6) ? rng.int(50, 4500) : undefined,
    });
    const pct = Math.round(((i + 1) / leakCount) * L3_STEPS[0].weight);
    onProgress?.({ step: "darkweb", label: L3_STEPS[0].label, percent: pct, message: `${leaks.length} dumps encontrados` });
  }
  acc = L3_STEPS[0].weight;

  // agent integration
  onProgress?.({ step: "agent", label: L3_STEPS[1].label, percent: acc });
  await sleep(400);
  const agent = opts.agent ?? null;
  acc += L3_STEPS[1].weight;
  onProgress?.({
    step: "agent",
    label: L3_STEPS[1].label,
    percent: acc,
    message: agent ? `Agente ${agent.hostname} sincronizado` : "Nenhum agente instalado",
  });

  // risk
  await sleep(250);
  const totalRecords = leaks.reduce((s, l) => s + l.recordCount, 0);
  const critical = leaks.filter((l) => l.severity === "critical").length;
  let coreRiskScore = Math.min(100, Math.round(critical * 25 + totalRecords / 12_000));
  if (agent) {
    coreRiskScore += Math.min(20, Math.round((agent.pendingUpdates || 0) * 1.5));
    if (agent.cpu > 90 || agent.ram > 90) coreRiskScore += 5;
  }
  coreRiskScore = Math.min(100, coreRiskScore);

  onProgress?.({ step: "risk", label: L3_STEPS[2].label, percent: 100 });

  return {
    domain,
    startedAt,
    finishedAt: new Date().toISOString(),
    leaks,
    totalRecordsExposed: totalRecords,
    agent,
    coreRiskScore,
    summary: `${leaks.length} dumps na Dark Web (${totalRecords.toLocaleString("pt-BR")} registros). ${agent ? `Agente ${agent.hostname} ativo.` : "Nenhum agente Vextagon Insight instalado."}`,
  };
}

export const domoSteps = { L1: L1_STEPS, L2: L2_STEPS, L3: L3_STEPS };
