import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NexusModeProvider, useNexusMode } from "./contexts/NexusModeContext";
import { ScrollManager } from "./components/ScrollManager";
import { MaintenanceMode } from "./components/MaintenanceMode";
import { Loader2 } from "lucide-react";

import Home from "./pages/Home";
import Tools from "./pages/Tools";
import Website from "./pages/Website";
import Apps from "./pages/Apps";
import Courses from "./pages/Courses";
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
import GDriveScanner from "./pages/GDriveScanner";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTools from "./pages/admin/Tools";
import AdminApps from "./pages/admin/Apps";
import AdminCourses from "./pages/admin/Courses";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminNexusProducts from "./pages/admin/NexusProducts";
import AdminNexusCategories from "./pages/admin/NexusCategories";
import AdminNexusOrders from "./pages/admin/NexusOrders";
import NotFound from "./pages/NotFound";

import NexusLanding from "./pages/nexus/Landing";
import NexusProducts from "./pages/nexus/Products";
import NexusProductDetail from "./pages/nexus/ProductDetail";
import NexusCheckout from "./pages/nexus/Checkout";
import NexusOrders from "./pages/nexus/Orders";

const queryClient = new QueryClient();

const OriginalRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/tools" element={<Tools />} />
    <Route path="/website" element={<Website />} />
    <Route path="/apps" element={<Apps />} />
    <Route path="/courses" element={<Courses />} />
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
    <Route path="/gdrive-scanner" element={<GDriveScanner />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/tools" element={<AdminTools />} />
    <Route path="/admin/apps" element={<AdminApps />} />
    <Route path="/admin/courses" element={<AdminCourses />} />
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/reports" element={<AdminReports />} />
    <Route path="/admin/settings" element={<AdminSettings />} />
    <Route path="/admin/nexus/products" element={<AdminNexusProducts />} />
    <Route path="/admin/nexus/categories" element={<AdminNexusCategories />} />
    <Route path="/admin/nexus/orders" element={<AdminNexusOrders />} />
    {/* Nexus preview cho admin khi tắt flag */}
    <Route path="/nexus" element={<NexusLanding />} />
    <Route path="/nexus/products" element={<NexusProducts />} />
    <Route path="/nexus/products/:slug" element={<NexusProductDetail />} />
    <Route path="/nexus/checkout" element={<NexusCheckout />} />
    <Route path="/nexus/orders" element={<NexusOrders />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const NexusRoutes = () => (
  <Routes>
    <Route path="/" element={<NexusLanding />} />
    <Route path="/products" element={<NexusProducts />} />
    <Route path="/products/:slug" element={<NexusProductDetail />} />
    <Route path="/checkout" element={<NexusCheckout />} />
    <Route path="/orders" element={<NexusOrders />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/account" element={<Account />} />
    <Route path="*" element={<NexusLanding />} />
  </Routes>
);

const RouteSwitcher = () => {
  const { nexusEnabled, isAdmin, loading } = useNexusMode();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return nexusEnabled && !isAdmin ? <NexusRoutes /> : <OriginalRoutes />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <ScrollManager />
          <AuthProvider>
            <NexusModeProvider>
              <MaintenanceMode>
                <RouteSwitcher />
              </MaintenanceMode>
            </NexusModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
