import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import LandingPage from "@/src/pages/LandingPage";
import LoginPage from "@/src/pages/LoginPage";
import RegisterPage from "@/src/pages/RegisterPage";
import DashboardLayout from "@/src/components/DashboardLayout";
import BotList from "@/src/pages/BotList";
import BotDetails from "@/src/pages/BotDetails";
import FileManager from "@/src/pages/FileManager";
import AdminUsers from "@/src/pages/AdminUsers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== "SUPERADMIN") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="bots" replace />} />
              <Route path="bots" element={<BotList />} />
              <Route path="bots/:id" element={<BotDetails />} />
              <Route path="files" element={<FileManager />} />
              <Route path="admin/users" element={
                <ProtectedRoute role="ADMIN">
                  <AdminUsers />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
}
