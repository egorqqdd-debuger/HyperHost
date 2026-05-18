import { useState, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { 
  Users, 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  ShieldAlert, 
  Trash2,
  Mail,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  createdAt: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([
    { id: "1", email: "admin@hyperhost.io", role: "SUPERADMIN", createdAt: new Date().toISOString() },
    { id: "2", email: "demo.user@example.com", role: "USER", createdAt: new Date().toISOString() },
    { id: "3", email: "support@hyperhost.io", role: "ADMIN", createdAt: new Date().toISOString() },
  ]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN": return <Badge className="bg-purple-600">Super Admin</Badge>;
      case "ADMIN": return <Badge className="bg-indigo-600">Admin</Badge>;
      default: return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Учетные записи и доступ</h1>
          <p className="text-slate-400">Управление глобальными административными ролями и правами доступа к кластерам</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 px-6 h-12 rounded-xl">
          <UserPlus className="w-5 h-5 mr-2" />
          Предоставить доступ
        </Button>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest px-6 h-12">Оператор</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest h-12">Уровень доступа</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest h-12">Зарегистрирован</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest h-12">Статус сессии</TableHead>
              <TableHead className="w-[80px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 border-2 border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                       <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                       <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-200">{user.email}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">ИД: {user.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell className="text-slate-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-xs font-medium text-slate-300">Синхронизировано</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-white hover:bg-slate-800">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-indigo-400">
                        <Shield className="w-4 h-4 mr-2" /> Изменить уровень доступа
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-red-400/10 focus:text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" /> Отозвать доступ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
