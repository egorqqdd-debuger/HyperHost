import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { 
  LayoutDashboard, 
  Bot, 
  FileCode, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { icon: Bot, label: "Мои боты", path: "/dashboard/bots" },
  { icon: FileCode, label: "Файлы", path: "/dashboard/files" },
];

const adminItems = [
  { icon: Users, label: "Пользователи", path: "/dashboard/admin/users", role: "ADMIN" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-200">
        <Sidebar className="border-r border-slate-800 bg-slate-900/50">
          <SidebarHeader className="p-6 border-b border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-400">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">H</div>
              <span>HYPERHOST</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-4 mt-6 space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                      location.pathname === item.path 
                        ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    <Link to={item.path} className="flex items-center gap-3 w-full">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
                <>
                  <div className="mt-8 px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Админ-панель
                  </div>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.path}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                          location.pathname === item.path 
                            ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <Link to={item.path} className="flex items-center gap-3 w-full">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <Avatar className="w-8 h-8 rounded-full ring-2 ring-indigo-500/20">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user?.role}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-red-400 hover:bg-red-400/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto p-6 md:p-10">
          <SidebarTrigger className="mb-6 md:hidden text-slate-400" />
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
