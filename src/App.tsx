import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ScrollManager } from "./components/ScrollManager";
import { MaintenanceMode } from "./components/MaintenanceMode";
import Home from "./pages/Home";
import Tools from "./pages/Tools";
import Website from "./pages/Website";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import ToolDetail from "./pages/ToolDetail";
import Download from "./pages/Download";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Docs from "./pages/Docs";
import Support from "./pages/Support";
import Report from "./pages/Report";
import VPSConsole from "./pages/VPSConsole";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTools from "./pages/admin/Tools";
import AdminApps from "./pages/admin/Apps";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollManager />
        <AuthProvider>
          <MaintenanceMode>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/website" element={<Website />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/apps/:slug" element={<AppDetail />} />
            <Route path="/tools/:slug" element={<ToolDetail />} />
            <Route path="/download/:id" element={<Download />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/support" element={<Support />} />
            <Route path="/report" element={<Report />} />
            <Route path="/vps-console" element={<VPSConsole />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/tools" element={<AdminTools />} />
            <Route path="/admin/apps" element={<AdminApps />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceMode>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
