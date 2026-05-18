import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Terminal, 
  Play, 
  Square, 
  RefreshCw, 
  Search, 
  Download,
  Trash2,
  Settings,
  Circle,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

interface ILogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG';
  message: string;
}

interface IBot {
  id: string;
  name: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  createdAt: string;
  token: string;
}

export default function BotDetails() {
  const { id } = useParams();
  const [bot, setBot] = useState<IBot | null>(null);
  const [logs, setLogs] = useState<ILogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [logLevel, setLogLevel] = useState<string>("ALL");
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate fetching bot data
    const mockBot: IBot = {
      id: id || "bot-123",
      name: "ShopHelperBot",
      status: 'RUNNING',
      createdAt: new Date().toISOString(),
      token: "712345678:AAH-xX9..."
    };
    setBot(mockBot);

    // Initial logs
    const initialLogs: ILogEntry[] = [
      { id: '1', timestamp: new Date().toISOString(), level: 'INFO', message: 'System initialization started...' },
      { id: '2', timestamp: new Date().toISOString(), level: 'INFO', message: 'Connecting to Telegram API...' },
      { id: '3', timestamp: new Date().toISOString(), level: 'INFO', message: 'Connection established. Bot is online.' },
    ];
    setLogs(initialLogs);

    // Simulate real-time logs
    const interval = setInterval(() => {
      const levels: ILogEntry['level'][] = ['INFO', 'DEBUG', 'WARNING', 'ERROR'];
      const messages = [
        "Received message from user @operator",
        "Executing command /start",
        "Database query took 12ms",
        "Webhook request processed successfully",
        "Failed to fetch resource from external API",
        "Processing large media file...",
        "User transition: state_idle -> state_buying"
      ];
      
      const newLog: ILogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      };

      setLogs(prev => [...prev, newLog].slice(-200)); // Keep last 200 logs
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = logLevel === "ALL" || log.level === logLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'ERROR': return 'text-red-400';
      case 'WARNING': return 'text-amber-400';
      case 'DEBUG': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };

  const handleToggleStatus = () => {
    if (!bot) return;
    const newStatus = bot.status === 'RUNNING' ? 'STOPPED' : 'RUNNING';
    setBot({ ...bot, status: newStatus });
    toast.success(newStatus === 'RUNNING' ? "Бот запущен" : "Бот остановлен");
  };

  if (!bot) return <div className="p-8 text-white">Loading bot stats...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/bots">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{bot.name}</h1>
              <Badge variant="outline" className={cn(
                "px-2 py-0.5 font-mono text-[10px] uppercase",
                bot.status === 'RUNNING' ? "border-emerald-500/50 text-emerald-400" : "border-slate-700 text-slate-500"
              )}>
                {bot.status}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm font-mono mt-1">ID: {bot.id} • Cluster: RU-MSK-01</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleToggleStatus}
            className={cn(
              "h-11 px-6 rounded-xl font-bold shadow-lg transition-all",
              bot.status === 'RUNNING' ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
            )}
          >
            {bot.status === 'RUNNING' ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {bot.status === 'RUNNING' ? "Остановить" : "Запустить"}
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Логи в реальном времени</h2>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Поиск по логам..." 
                  className="pl-9 h-10 w-full md:w-48 bg-slate-900 border-slate-800 text-white rounded-lg focus:ring-1 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="h-10 bg-slate-900 border-slate-800 text-slate-400 rounded-lg px-3 text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500"
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <option value="ALL">Все уровни</option>
                <option value="INFO">INFO</option>
                <option value="ERROR">ERROR</option>
                <option value="WARNING">WARNING</option>
                <option value="DEBUG">DEBUG</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
             {/* Toolbar */}
             <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isAutoScroll} 
                      onChange={() => setIsAutoScroll(!isAutoScroll)} 
                    />
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      isAutoScroll ? "bg-indigo-600 border-indigo-600" : "bg-transparent border-slate-700 group-hover:border-slate-600"
                    )}>
                      {isAutoScroll && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Авто-скролл</span>
                  </label>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-800" onClick={() => setLogs([])}>
                    Очистить
                  </Button>
                </div>
             </div>

             {/* Terminal Area */}
             <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1.5 custom-scrollbar">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 group">
                    <span className="text-slate-600 shrink-0 text-xs mt-0.5">
                      [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                    </span>
                    <span className={cn("font-bold shrink-0 text-xs mt-0.5", getLevelColor(log.level))}>
                      {log.level.padEnd(7)}
                    </span>
                    <span className="text-slate-300 break-all">{log.message}</span>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Записей не обнаружено
                  </div>
                )}
                <div ref={logsEndRef} />
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden shadow-xl">
             <CardHeader className="pb-4">
               <CardTitle className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                 Состояние системы
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Нагрузка CPU</p>
                    <p className="text-xl font-bold text-white">12.4%</p>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Память</p>
                    <p className="text-xl font-bold text-white">84 MB</p>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Аптайм</p>
                    <p className="text-xl font-bold text-white">2.5d</p>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Запросы/сек</p>
                    <p className="text-xl font-bold text-white">4.2</p>
                 </div>
               </div>
               
               <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500">Здоровье кластера</span>
                    <span className="text-xs font-bold text-emerald-400">99.8%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[99.8%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  </div>
               </div>
             </CardContent>
           </Card>

           <Card className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  Конфигурация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Webhook URL</p>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[10px] text-indigo-400 break-all">
                      https://api.botstation.pro/hooks/{bot.id}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Среда</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-sm font-bold text-white">NodeJS / Python Hybrid</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg border-slate-800 text-slate-400 text-xs">
                    <Download className="w-3 h-3 mr-2" /> Схема
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg border-slate-800 text-red-400 hover:text-red-300 text-xs">
                    <Trash2 className="w-3 h-3 mr-2" /> Очистить БД
                  </Button>
                </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
