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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
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
    <Route path="/pricing" element={<ProtectedRoute><AppLayout><Pricing /></AppLayout></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPanel /></AppLayout></ProtectedRoute>} />
    <Route path="/admin/diagnostics" element={<ProtectedRoute><AppLayout><AdminDiagnostics /></AppLayout></ProtectedRoute>} />
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
