import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Savings from "@/pages/Savings";
import Transactions from "@/pages/Transactions";
import Support from "@/pages/Support";
import History from "@/pages/History";
import NotFound from "./pages/NotFound";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";

const queryClient = new QueryClient();

function AppRoutes() {
  const { currentUser, maintenanceMode } = useApp();
  const showMaintenance = maintenanceMode && currentUser && currentUser.role === "user";

  return (
    <>
      <Navbar />
      {showMaintenance && <MaintenanceOverlay />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/support" element={<Support />} />
        <Route path="/history" element={<History />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
