import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const domoGroups = [
  {
    domo: "DOMO 1",
    level: "LOW",
    colorClass: "text-cyan",
    bgClass: "bg-cyan/5",
    borderClass: "border-l-cyan",
    items: [
      { to: "/", icon: LayoutDashboard, label: "WAF & Defesa" },
      { to: "/easm", icon: Radar, label: "EASM Scanner" },
      { to: "/subdomain-finder", icon: Search, label: "Subdomínios" },
      { to: "/cloud-leak-scanner", icon: Cloud, label: "Cloud Leaks" },
      { to: "/tech-stack-profiler", icon: Code2, label: "Tech Stack" },
      { to: "/data-leaks", icon: AlertTriangle, label: "OSINT & Leaks" },
      { to: "/auditor", icon: FileText, label: "Auditor" },
      { to: "/alerts", icon: Bell, label: "Alertas" },
    ],
  },
  {
    domo: "DOMO 2",
    level: "MEDIUM",
    colorClass: "text-gold",
    bgClass: "bg-gold/5",
    borderClass: "border-l-gold",
    items: [
      { to: "/dashboard/servers", icon: Server, label: "Insight Agent" },
      { to: "/phishing-simulator", icon: Mail, label: "Phishing Sim" },
    ],
  },
  {
    domo: "DOMO 3",
    level: "HIGH",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/5",
    borderClass: "border-l-destructive",
    items: [
      { to: "/pentest-arsenal", icon: Crosshair, label: "Pentest Arsenal" },
      { to: "/dark-web-monitor", icon: Ghost, label: "Dark Web" },
      { to: "/threat-intel", icon: Brain, label: "Threat Intel" },
      { to: "/forensics", icon: Microscope, label: "Forense" },
      { to: "/playbooks", icon: Zap, label: "Playbooks" },
      { to: "/honey-token-generator", icon: Eye, label: "Honey Tokens" },
    ],
  },
];

const systemItems = [
  { to: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { to: "/pricing", icon: CreditCard, label: "Planos" },
  { to: "/admin", icon: Users, label: "Admin" },
  { to: "/academy", icon: GraduationCap, label: "Academy" },
  { to: "/support", icon: HeadphonesIcon, label: "Suporte" },
  { to: "/about", icon: Info, label: "Sobre" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "DOMO 1": true,
    "DOMO 2": true,
    "DOMO 3": true,
  });
  const location = useLocation();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || "Usuário";

  const toggleGroup = (domo: string) => {
    setOpenGroups((prev) => ({ ...prev, [domo]: !prev[domo] }));
  };

  const renderNavItem = (item: typeof domoGroups[0]["items"][0], activeColorClass?: string) => {
    const isActive = location.pathname === item.to;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition-colors duration-150",
          isActive
            ? `bg-primary/10 ${activeColorClass || "text-cyan"} border-l-2 border-l-primary`
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        )}
      >
        <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-primary")} />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-mono text-sm font-semibold tracking-widest text-foreground">
                VEXTAGON
              </span>
            </div>
          )}
          {collapsed && <Shield className="mx-auto h-5 w-5 text-primary" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {domoGroups.map((group) => (
            <div key={group.domo}>
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.domo)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                    group.bgClass,
                    group.colorClass
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {group.domo === "DOMO 3" ? <Skull className="h-3 w-3" /> : group.domo === "DOMO 2" ? <Server className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {group.domo}
                    <span className="text-[8px] opacity-60">— {group.level}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      !openGroups[group.domo] && "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className={cn("mx-auto my-1 h-px w-6", group.domo === "DOMO 1" ? "bg-cyan/30" : group.domo === "DOMO 2" ? "bg-gold/30" : "bg-destructive/30")} />
              )}

              {(collapsed || openGroups[group.domo]) && (
                <div className={cn("space-y-0.5", !collapsed && "mt-1 mb-2 ml-1")}>
                  {group.items.map((item) => renderNavItem(item, group.colorClass))}
                </div>
              )}
            </div>
          ))}

          {/* System items */}
          {!collapsed && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <span className="px-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Sistema
              </span>
            </div>
          )}
          {collapsed && <div className="mx-auto my-1 h-px w-6 bg-border" />}
          <div className="space-y-0.5 mt-1">
            {systemItems.map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-3">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-medium text-foreground truncate">{displayName}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">Alluzion Corporate</p>
                </div>
                <button
                  onClick={signOut}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={signOut}
              className="mx-auto flex rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </aside>

      <main className={cn("flex-1 transition-all duration-200", collapsed ? "ml-14" : "ml-56")}>
        <div className="p-6 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
