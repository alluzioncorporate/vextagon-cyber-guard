import { NavLink, useLocation } from "react-router-dom";
import { 
  Shield, 
  Radar, 
  AlertTriangle, 
  FileText, 
  CreditCard, 
  Users,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "WAF Dashboard" },
  { to: "/deep-scan", icon: Radar, label: "Deep Scan" },
  { to: "/data-leaks", icon: AlertTriangle, label: "Data Leaks" },
  { to: "/auditor", icon: FileText, label: "Security Auditor" },
  { to: "/pricing", icon: CreditCard, label: "Planos" },
  { to: "/admin", icon: Users, label: "Admin Panel" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              <span className="font-display text-lg font-bold tracking-wider neon-text">
                VEXTAGON
              </span>
            </div>
          )}
          {collapsed && <Shield className="mx-auto h-7 w-7 text-primary" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "glass-card neon-border text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-border p-4">
            <p className="text-mono text-[10px] text-muted-foreground">
              Powered by <span className="gold-text font-semibold">Alluzion Corporate</span>
            </p>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
