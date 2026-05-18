import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { Bot, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("С возвращением, Командор.");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Доступ запрещен: неверные учетные данные");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-indigo-500/10 blur-[100px] -z-10 rounded-full" />
      
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">H</div>
          <span>HYPERHOST</span>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="space-y-3 text-center pt-10 px-8">
          <div className="mx-auto w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-700">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Системная аутентификация</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Инициализируйте сессию для доступа к кластерам
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Идентификатор (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <Input 
                  type="email" 
                  placeholder="admin@hyperhost.io" 
                  className="pl-12 h-14 bg-slate-800 border-slate-700 text-white rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600 shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Логика доступа (Пароль)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-14 bg-slate-800 border-slate-700 text-white rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20 transition-all" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Подключиться</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center bg-slate-800/30 py-6 border-t border-slate-800">
          <div className="text-slate-500 text-sm">
            Нет профиля? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">Создать идентификатор</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
