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
  MessageSquare,
  Search,
  Cloud,
  Code2,
  Mail,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "WAF & Defesa" },
  { to: "/easm", icon: Radar, label: "EASM Scanner" },
  { to: "/subdomain-finder", icon: Search, label: "Subdomínios" },
  { to: "/cloud-leak-scanner", icon: Cloud, label: "Cloud Leaks" },
  { to: "/tech-stack-profiler", icon: Code2, label: "Tech Stack" },
  { to: "/phishing-simulator", icon: Mail, label: "Phishing" },
  { to: "/honey-token-generator", icon: Eye, label: "Honey Tokens" },
  { to: "/data-leaks", icon: AlertTriangle, label: "Vazamentos" },
  { to: "/alerts", icon: Bell, label: "Alertas" },
  { to: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { to: "/auditor", icon: FileText, label: "Auditor" },
  { to: "/pricing", icon: CreditCard, label: "Planos" },
  { to: "/admin", icon: Users, label: "Admin" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
              <span className="text-sm font-semibold tracking-widest text-foreground">
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
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors duration-150",
                  isActive
                    ? "bg-secondary text-cyan"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-border px-3 py-3">
            <p className="font-mono text-[10px] text-muted-foreground">
              Alluzion Corporate
            </p>
          </div>
        )}
      </aside>

      <main className={cn("flex-1 transition-all duration-200", collapsed ? "ml-14" : "ml-56")}>
        <div className="p-6 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
