import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import Banned from "@/pages/Banned";
import NotFound from "./pages/NotFound";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";

const queryClient = new QueryClient();

// Redirect logged-in users away from login/register
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, currentUser, loading } = useApp();
  if (loading) return null;
  if (isLoggedIn && currentUser?.isBanned) return <Navigate to="/banned" replace />;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Require login — redirect to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, currentUser, loading } = useApp();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (currentUser?.isBanned) return <Navigate to="/banned" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser, maintenanceMode, isLoggedIn, loading } = useApp();
  const showMaintenance = maintenanceMode && currentUser && currentUser.role === "user";

  // Redirect banned user away from all pages except /banned
  if (!loading && isLoggedIn && currentUser?.isBanned) {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/banned" element={<Banned />} />
          <Route path="*" element={<Navigate to="/banned" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {showMaintenance && <MaintenanceOverlay />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/banned" element={<Banned />} />
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
