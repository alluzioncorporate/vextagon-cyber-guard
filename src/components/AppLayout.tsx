import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Radar,
  AlertTriangle,
  FileText,
  CreditCard,
  Users,
  LayoutDashboard,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Search,
  Cloud,
  Code2,
  Mail,
  Eye,
  Server,
  LogOut,
  Info,
  HeadphonesIcon,
  Skull,
  Crosshair,
  Ghost,
  Brain,
  Microscope,
  Zap,
  GraduationCap,
  Terminal,
  Key,
  BookOpen,
  PlayCircle,
  Library,
  Trophy,
  Sparkles,
  ShieldCheck,
  Wrench,
  Sliders,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type Pillar = "shield" | "academy";

const shieldGroups = [
  {
    domo: "DOMO 1",
    level: "LOW",
    colorClass: "text-cyan",
    bgClass: "bg-cyan/5",
    icon: Shield,
    items: [
      { to: "/", icon: LayoutDashboard, label: "WAF & Defesa" },
      { to: "/easm", icon: Radar, label: "EASM Scanner" },
      { to: "/subdomain-finder", icon: Search, label: "Subdomínios" },
      { to: "/cloud-leak-scanner", icon: Cloud, label: "Cloud Leaks" },
      { to: "/tech-stack-profiler", icon: Code2, label: "Tech Stack" },
      { to: "/data-leaks", icon: AlertTriangle, label: "OSINT & Leaks" },
      { to: "/auditor", icon: FileText, label: "Auditor" },
    ],
  },
  {
    domo: "DOMO 2",
    level: "MEDIUM",
    colorClass: "text-gold",
    bgClass: "bg-gold/5",
    icon: Server,
    items: [
      { to: "/dashboard/servers", icon: Server, label: "Insight Agent" },
      { to: "/alerts", icon: Bell, label: "Central Alertas" },
      { to: "/phishing-simulator", icon: Mail, label: "Phishing Sim" },
      { to: "/social-engineering", icon: Users, label: "Eng. Social" },
      { to: "/password-manager", icon: Key, label: "Senhas" },
    ],
  },
  {
    domo: "DOMO 3",
    level: "HIGH",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/5",
    icon: Skull,
    items: [
      { to: "/pentest-arsenal", icon: Crosshair, label: "Pentest Arsenal" },
      { to: "/dark-web-monitor", icon: Ghost, label: "Dark Web" },
      { to: "/threat-intel", icon: Brain, label: "Threat Intel" },
      { to: "/forensics", icon: Microscope, label: "Forense" },
      { to: "/playbooks", icon: Zap, label: "Playbooks" },
      { to: "/honey-token-generator", icon: Eye, label: "Honey Tokens" },
    ],
  },
] as const;

const shieldSystem = [
  { to: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { to: "/pricing", icon: CreditCard, label: "Planos" },
  { to: "/support", icon: HeadphonesIcon, label: "Suporte" },
  { to: "/about", icon: Info, label: "Sobre" },
];

// Vextagon Academy — foco em leitura e vídeo
const academyGroups = [
  {
    domo: "TRILHAS",
    level: "FUNDAMENTOS",
    colorClass: "text-cyan",
    bgClass: "bg-cyan/5",
    icon: GraduationCap,
    items: [
      { to: "/academy", icon: BookOpen, label: "Visão Geral" },
      { to: "/academy?tab=courses", icon: PlayCircle, label: "Cursos em Vídeo" },
      { to: "/academy?tab=library", icon: Library, label: "Biblioteca" },
      { to: "/academy?tab=achievements", icon: Trophy, label: "Conquistas" },
    ],
  },
] as const;

const academySystem = [
  { to: "/support", icon: HeadphonesIcon, label: "Suporte" },
  { to: "/about", icon: Info, label: "Sobre" },
];

// Páginas administrativas — somente para admins
const adminItems = [
  { to: "/admin", icon: Sliders, label: "Painel Admin" },
  { to: "/admin/diagnostics", icon: ShieldCheck, label: "Diagnóstico" },
  { to: "/domo3-setup", icon: Wrench, label: "Setup Arsenal" },
];

// Rotas que pertencem ao pilar Academy (para auto-detectar pilar atual)
const academyRoutes = ["/academy"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const detectedPillar: Pillar = useMemo(
    () => (academyRoutes.some((r) => location.pathname.startsWith(r)) ? "academy" : "shield"),
    [location.pathname]
  );
  const [pillar, setPillar] = useState<Pillar>(detectedPillar);
  // sync if user navigates externally
  if (pillar !== detectedPillar) setPillar(detectedPillar);

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "DOMO 1": true,
    "DOMO 2": true,
    "DOMO 3": true,
    TRILHAS: true,
  });
  const [adminOpen, setAdminOpen] = useState(true);

  const displayName = user?.user_metadata?.full_name || "Usuário";

  const toggleGroup = (k: string) => setOpenGroups((p) => ({ ...p, [k]: !p[k] }));

  const switchPillar = (p: Pillar) => {
    setPillar(p);
    if (p === "academy" && !location.pathname.startsWith("/academy")) {
      navigate("/academy");
    } else if (p === "shield" && location.pathname.startsWith("/academy")) {
      navigate("/");
    }
  };

  const groups = pillar === "shield" ? shieldGroups : academyGroups;
  const systemItems = pillar === "shield" ? shieldSystem : academySystem;

  const renderNavItem = (
    item: { to: string; icon: any; label: string },
    activeColorClass?: string
  ) => {
    const isActive =
      item.to.includes("?")
        ? location.pathname + location.search === item.to
        : location.pathname === item.to;
    return (
      <NavLink
        key={item.to + item.label}
        to={item.to}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-200",
          isActive
            ? cn(
                "bg-gradient-to-r from-white/[0.10] via-white/[0.06] to-transparent",
                activeColorClass || "text-cyan",
                "border border-white/10 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.10),0_0_18px_-6px_hsl(var(--primary)/0.55)]"
              )
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.9)]" />
        )}
        <item.icon
          strokeWidth={1.6}
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-all",
            isActive
              ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.7)]"
              : "group-hover:text-foreground/90"
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  };

  const PillarSwitcher = () => (
    <div
      className={cn(
        "mx-3 mt-3 mb-2 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-glass shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]",
        collapsed && "hidden"
      )}
    >
      {([
        { id: "shield" as const, label: "Shield", Icon: Shield },
        { id: "academy" as const, label: "Academy", Icon: GraduationCap },
      ]).map(({ id, label, Icon }) => {
        const active = pillar === id;
        return (
          <button
            key={id}
            onClick={() => switchPillar(id)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-300",
              active
                ? "bg-gradient-to-b from-primary/30 to-primary/10 text-primary border border-primary/30 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.20),0_0_14px_-4px_hsl(var(--primary)/0.6)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            )}
          >
            <Icon strokeWidth={1.7} className={cn("h-3.5 w-3.5", active && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]")} />
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-sidebar/60 backdrop-blur-glass shadow-[inset_-1px_0_0_hsl(0_0%_100%/0.04)] transition-all duration-300",
          collapsed ? "w-14" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-3">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Shield className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
                <Sparkles className="absolute -top-1 -right-1.5 h-2.5 w-2.5 text-accent/80" strokeWidth={2} />
              </div>
              <span className="font-mono text-sm font-semibold tracking-widest text-foreground">
                {pillar === "shield" ? "VEXTAGON" : "VEXTAGON ACADEMY"}
              </span>
            </div>
          )}
          {collapsed && <Shield className="mx-auto h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Pillar Switcher */}
        <PillarSwitcher />
        {!collapsed && (
          <p className="px-4 -mt-1 mb-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {pillar === "shield" ? "Painel de Ferramentas" : "Educação & Treinamento"}
          </p>
        )}

        {/* Nav (com transição suave entre pilares) */}
        <nav
          key={pillar}
          className="flex-1 space-y-1 overflow-y-auto p-2 animate-fade-in"
        >
          {groups.map((group) => (
            <div key={group.domo}>
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.domo)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                    group.bgClass,
                    group.colorClass,
                    "hover:bg-white/[0.05]"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <group.icon strokeWidth={1.8} className="h-3 w-3" />
                    {group.domo}
                    <span className="text-[8px] opacity-60">— {group.level}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      !openGroups[group.domo] && "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div
                  className={cn(
                    "mx-auto my-1 h-px w-6",
                    group.colorClass === "text-cyan" && "bg-cyan/30",
                    group.colorClass === "text-gold" && "bg-gold/30",
                    group.colorClass === "text-destructive" && "bg-destructive/30"
                  )}
                />
              )}

              {(collapsed || openGroups[group.domo]) && (
                <div className={cn("space-y-0.5", !collapsed && "mt-1 mb-2 ml-1")}>
                  {group.items.map((item) => renderNavItem(item, group.colorClass))}
                </div>
              )}
            </div>
          ))}

          {/* Sistema */}
          {!collapsed && (
            <div className="mt-3 pt-2 border-t border-white/10">
              <span className="px-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                Sistema
              </span>
            </div>
          )}
          {collapsed && <div className="mx-auto my-1 h-px w-6 bg-white/10" />}
          <div className="space-y-0.5 mt-1">
            {systemItems.map((item) => renderNavItem(item))}
          </div>

          {/* Administração — apenas admins */}
          {isAdmin && (
            <>
              {!collapsed ? (
                <div className="mt-3 pt-2 border-t border-primary/20">
                  <button
                    onClick={() => setAdminOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck strokeWidth={1.8} className="h-3 w-3 drop-shadow-[0_0_5px_hsl(var(--primary)/0.7)]" />
                      Administração
                    </span>
                    <ChevronDown
                      className={cn("h-3 w-3 transition-transform duration-200", !adminOpen && "-rotate-90")}
                    />
                  </button>
                </div>
              ) : (
                <div className="mx-auto my-1 h-px w-6 bg-primary/40" />
              )}

              {(collapsed || adminOpen) && (
                <div className={cn("space-y-0.5", !collapsed && "mt-1 ml-1")}>
                  {adminItems.map((item) => renderNavItem(item, "text-primary"))}
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-3 py-3">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-medium text-foreground truncate">{displayName}</p>
                <p className="font-mono text-[9px] text-muted-foreground">
                  {isAdmin ? "Administrador" : "Alluzion Corporate"}
                </p>
              </div>
              <button
                onClick={signOut}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signOut}
              className="mx-auto flex rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </aside>

      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-14" : "ml-60",
          // Academy: leitura confortável (mais respiro, largura menor)
          pillar === "academy" ? "" : ""
        )}
      >
        <div
          key={pillar + location.pathname}
          className={cn(
            "animate-fade-in",
            pillar === "academy"
              ? "p-8 max-w-[980px] mx-auto leading-relaxed"
              : "p-6 max-w-[1400px]"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
