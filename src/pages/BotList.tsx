import { useState, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Play, 
  Square, 
  Trash2, 
  ExternalLink,
  MoreVertical,
  Terminal,
  Activity,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IBot {
  id: string;
  name: string;
  token: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  webhookUrl: string;
  createdAt: string;
}

export default function BotList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState<IBot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBot, setNewBot] = useState({ name: "", token: "", scriptPath: "" });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBots = async () => {
    try {
      const response = await fetch(`/api/bots?userId=${user?.id}`);
      const data = await response.json();
      setBots(data);
    } catch (err) {
      toast.error("Не удалось загрузить список ботов");
    }
  };

  useEffect(() => {
    fetchBots();
  }, [user]);

  const handleCreateBot = async () => {
    if (!newBot.name || !newBot.token) {
      toast.error("Заполните имя и токен бота");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBot, ownerId: user?.id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка создания бота");
      }
      toast.success("Бот успешно создан и вебхук настроен");
      setIsCreateOpen(false);
      setNewBot({ name: "", token: "", scriptPath: "" });
      fetchBots();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBotStatus = async (bot: IBot) => {
    const action = bot.status === "RUNNING" ? "stop" : "start";
    try {
      const response = await fetch(`/api/bots/${bot.id}/${action}`, { method: "POST" });
      if (!response.ok) throw new Error("Ошибка переключения статуса");
      toast.success(bot.status === "RUNNING" ? "Бот остановлен" : "Бот запущен");
      fetchBots();
    } catch (err) {
      toast.error("Не удалось изменить статус бота");
    }
  };

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Обзор инфраструктуры</h1>
          <p className="text-slate-400">Мониторинг активных кластеров ботов и точек интеграции</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 px-6 h-12 rounded-xl">
              <Plus className="w-5 h-5 mr-2" />
              Создать нового бота
            </Button>
          } />
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Развернуть новый экземпляр</DialogTitle>
              <DialogDescription className="text-slate-400">
                Настройте параметры инфраструктуры вашего Telegram-бота
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Имя экземпляра</label>
                <Input 
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="например, ShopHelperBot" 
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Токен бота</label>
                <Input 
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Токен API от @BotFather" 
                  type="password"
                  value={newBot.token}
                  onChange={(e) => setNewBot({ ...newBot, token: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Путь к скрипту</label>
                <Input 
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="uploads/main.py" 
                  value={newBot.scriptPath}
                  onChange={(e) => setNewBot({ ...newBot, scriptPath: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
              <Button 
                onClick={handleCreateBot} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Развертывание..." : "Запустить бота"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">Стабильно</span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{bots.filter(b => b.status === 'RUNNING').length} Активно</p>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Развернутые кластеры</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
               <Terminal className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">Python 3.12</p>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Среда выполнения</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 col-span-1 md:col-span-2 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Нагрузка системы (симуляция)</p>
             <span className="text-indigo-400 text-xs font-mono">Edge: Глобально</span>
          </div>
          <div className="flex items-end gap-1.5 h-16 mt-4">
            {[20, 45, 30, 60, 85, 40, 55, 70, 90, 65].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-sm transition-all hover:bg-indigo-500" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input 
          placeholder="Поиск по названию инфраструктуры..." 
          className="pl-12 h-14 bg-slate-900 border-slate-800 text-white rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500 shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-white">Список активных ботов</h3>
          <div className="flex gap-2">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border border-slate-800 bg-slate-800/50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">Сортировка: Статус</div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredBots.map(bot => (
            <div key={bot.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/dashboard/bots/${bot.id}`)}>
                <div className={cn(
                  "p-3 rounded-lg flex items-center justify-center transition-colors",
                  bot.status === "RUNNING" ? "bg-indigo-600/20 text-indigo-400" : "bg-slate-700/50 text-slate-500"
                )}>
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">{bot.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">v1.0.0 • {bot.id} • {new Date(bot.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="hidden md:block text-right">
                  <p className={cn(
                    "text-xs font-mono font-bold uppercase tracking-wider",
                    bot.status === "RUNNING" ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {bot.status === "RUNNING" ? "● Запущен" : "○ Остановлен"}
                  </p>
                  <p className="text-[10px] text-slate-500">Стабильность: Высокая</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "w-10 h-10 p-0 rounded-lg bg-slate-800 border border-slate-700",
                      bot.status === "RUNNING" ? "text-amber-400 hover:text-amber-500" : "text-emerald-400 hover:text-emerald-500"
                    )}
                    onClick={() => toggleBotStatus(bot)}
                  >
                    {bot.status === "RUNNING" ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-indigo-400" onClick={() => navigate(`/dashboard/bots/${bot.id}`)}>
                        <Terminal className="w-4 h-4 mr-2" /> Просмотр логов
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-indigo-400">
                        <ExternalLink className="w-4 h-4 mr-2" /> Открыть в Telegram
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-red-400/10 focus:text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" /> Удалить экземпляр
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}

          {filteredBots.length === 0 && (
            <div className="py-20 text-center opacity-40">
              <Bot className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Список пуст. Разверните свой первый кластер.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
