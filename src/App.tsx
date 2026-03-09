import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import WafDashboard from "@/pages/WafDashboard";
import EasmScanner from "@/pages/EasmScanner";
import DataLeaks from "@/pages/DataLeaks";
import AlertsCenter from "@/pages/AlertsCenter";
import WhatsAppConfig from "@/pages/WhatsAppConfig";
import SecurityAuditor from "@/pages/SecurityAuditor";
import Pricing from "@/pages/Pricing";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<WafDashboard />} />
            <Route path="/easm" element={<EasmScanner />} />
            <Route path="/data-leaks" element={<DataLeaks />} />
            <Route path="/alerts" element={<AlertsCenter />} />
            <Route path="/whatsapp" element={<WhatsAppConfig />} />
            <Route path="/auditor" element={<SecurityAuditor />} />
            <Route path="/subdomain-finder" element={<SubdomainFinder />} />
            <Route path="/cloud-leak-scanner" element={<CloudLeakScanner />} />
            <Route path="/tech-stack-profiler" element={<TechStackProfiler />} />
            <Route path="/phishing-simulator" element={<PhishingSimulator />} />
            <Route path="/honey-token-generator" element={<HoneyTokenGenerator />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/diagnostics" element={<AdminDiagnostics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
