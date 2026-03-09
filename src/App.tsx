import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import WafDashboard from "@/pages/WafDashboard";
import EasmScanner from "@/pages/EasmScanner";
import DataLeaks from "@/pages/DataLeaks";
import AlertsCenter from "@/pages/AlertsCenter";
import WhatsAppConfig from "@/pages/WhatsAppConfig";
import SecurityAuditor from "@/pages/SecurityAuditor";
import Pricing from "@/pages/Pricing";
import About from "@/pages/About";
import Support from "@/pages/Support";
import AdminPanel from "@/pages/AdminPanel";
import AdminDiagnostics from "@/pages/AdminDiagnostics";
import SubdomainFinder from "@/pages/SubdomainFinder";
import CloudLeakScanner from "@/pages/CloudLeakScanner";
import TechStackProfiler from "@/pages/TechStackProfiler";
import PhishingSimulator from "@/pages/PhishingSimulator";
import HoneyTokenGenerator from "@/pages/HoneyTokenGenerator";
import ServerMonitoring from "@/pages/ServerMonitoring";
import PentestArsenal from "@/pages/PentestArsenal";
import DarkWebMonitor from "@/pages/DarkWebMonitor";
import ThreatIntel from "@/pages/ThreatIntel";
import Forensics from "@/pages/Forensics";
import Playbooks from "@/pages/Playbooks";
import Academy from "@/pages/Academy";
import SocialEngineering from "@/pages/SocialEngineering";
import Domo3Setup from "@/pages/Domo3Setup";
import PasswordManager from "@/pages/PasswordManager";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><AppLayout><WafDashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/easm" element={<ProtectedRoute><AppLayout><EasmScanner /></AppLayout></ProtectedRoute>} />
    <Route path="/data-leaks" element={<ProtectedRoute><AppLayout><DataLeaks /></AppLayout></ProtectedRoute>} />
    <Route path="/alerts" element={<ProtectedRoute><AppLayout><AlertsCenter /></AppLayout></ProtectedRoute>} />
    <Route path="/whatsapp" element={<ProtectedRoute><AppLayout><WhatsAppConfig /></AppLayout></ProtectedRoute>} />
    <Route path="/auditor" element={<ProtectedRoute><AppLayout><SecurityAuditor /></AppLayout></ProtectedRoute>} />
    <Route path="/subdomain-finder" element={<ProtectedRoute><AppLayout><SubdomainFinder /></AppLayout></ProtectedRoute>} />
    <Route path="/cloud-leak-scanner" element={<ProtectedRoute><AppLayout><CloudLeakScanner /></AppLayout></ProtectedRoute>} />
    <Route path="/tech-stack-profiler" element={<ProtectedRoute><AppLayout><TechStackProfiler /></AppLayout></ProtectedRoute>} />
    <Route path="/phishing-simulator" element={<ProtectedRoute><AppLayout><PhishingSimulator /></AppLayout></ProtectedRoute>} />
    <Route path="/honey-token-generator" element={<ProtectedRoute><AppLayout><HoneyTokenGenerator /></AppLayout></ProtectedRoute>} />
    <Route path="/dashboard/servers" element={<ProtectedRoute><AppLayout><ServerMonitoring /></AppLayout></ProtectedRoute>} />
    <Route path="/social-engineering" element={<ProtectedRoute><AppLayout><SocialEngineering /></AppLayout></ProtectedRoute>} />
    <Route path="/password-manager" element={<ProtectedRoute><AppLayout><PasswordManager /></AppLayout></ProtectedRoute>} />
    {/* DOMO 3 - Elite */}
    <Route path="/domo3-setup" element={<AdminRoute><AppLayout><Domo3Setup /></AppLayout></AdminRoute>} />
    <Route path="/pentest-arsenal" element={<ProtectedRoute><AppLayout><PentestArsenal /></AppLayout></ProtectedRoute>} />
    <Route path="/dark-web-monitor" element={<ProtectedRoute><AppLayout><DarkWebMonitor /></AppLayout></ProtectedRoute>} />
    <Route path="/threat-intel" element={<ProtectedRoute><AppLayout><ThreatIntel /></AppLayout></ProtectedRoute>} />
    <Route path="/forensics" element={<ProtectedRoute><AppLayout><Forensics /></AppLayout></ProtectedRoute>} />
    <Route path="/playbooks" element={<ProtectedRoute><AppLayout><Playbooks /></AppLayout></ProtectedRoute>} />
    {/* System */}
    <Route path="/pricing" element={<ProtectedRoute><AppLayout><Pricing /></AppLayout></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPanel /></AppLayout></ProtectedRoute>} />
    <Route path="/admin/diagnostics" element={<ProtectedRoute><AppLayout><AdminDiagnostics /></AppLayout></ProtectedRoute>} />
    <Route path="/support" element={<ProtectedRoute><AppLayout><Support /></AppLayout></ProtectedRoute>} />
    <Route path="/about" element={<ProtectedRoute><AppLayout><About /></AppLayout></ProtectedRoute>} />
    <Route path="/academy" element={<ProtectedRoute><AppLayout><Academy /></AppLayout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
