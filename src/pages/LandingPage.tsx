import { Link } from "react-router-dom";
import { 
  Bot, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Cloud, 
  ArrowRight,
  Github,
  CheckCircle2,
  Cpu,
  Activity,
  FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">H</div>
            <span>HYPERHOST</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Инфраструктура</a>
            <a href="#pricing" className="hover:text-white transition-colors">Масштабируемость</a>
            <a href="#docs" className="hover:text-white transition-colors">Стек</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">Войти</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6">Развернуть</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 lg:py-40 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-indigo-600/10 blur-[120px] -z-10 rounded-full" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-10 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-8">
                🚀 Оптимизированная среда v3.12
              </Badge>
              <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter text-white leading-[1] mb-8">
                Операционная система для <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Telegram Ботов</span>
              </h1>
              <p className="mt-8 text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Развертывайте инфраструктуру за секунды. Автоматические вебхуки, телеметрия в реальном времени 
                и оптимизированные кластеры Python.
              </p>
            </motion.div>
            
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/login">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 h-16 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/20">
                  Создать проект <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-bold border-slate-800 text-slate-300 hover:bg-slate-900 rounded-2xl">
                <Terminal className="mr-2 w-6 h-6" /> Характеристики
              </Button>
            </motion.div>

            <div className="pt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 grayscale opacity-30">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> <span className="font-bold tracking-tighter">AIOGRAM</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> <span className="font-bold tracking-tighter">FASTAPI</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> <span className="font-bold tracking-tighter">PYTHON-TELEGRAM-BOT</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> <span className="font-bold tracking-tighter">SQLITE</span></div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid - Bento Style */}
      <section id="features" className="py-32 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-white">Полнофункциональные возможности</h2>
            <p className="text-slate-500 max-w-xl text-lg">Масштабируемый, безопасный и ориентированный на разработчиков хостинг для профессиональных ботов.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-full md:h-[600px]">
             <BentoCard 
               className="md:col-span-2 md:row-span-1"
               icon={Zap} 
               title="Edge Развертывание" 
               description="Мгновенная подготовка скриптов в глобальных средах исполнения с автоматической изоляцией."
               color="indigo"
             />
             <BentoCard 
               className="md:col-span-1 md:row-span-1"
               icon={Cloud} 
               title="Вебхуки" 
               description="Защищенные SSL-точки для всех кластеров."
               color="emerald"
             />
             <BentoCard 
                className="md:col-span-1 md:row-span-2"
                icon={ShieldCheck} 
                title="Сейф для данных" 
                description="Шифрованное хранение API-токенов и переменных окружения по стандарту AES-256."
                color="pink"
             />
             <BentoCard 
               className="md:col-span-1 md:row-span-1"
               icon={Cpu} 
               title="Производительность" 
               description="Максимальная скорость выполнения Python кода."
               color="amber"
             />
             <BentoCard 
               className="md:col-span-2 md:row-span-1"
               icon={FileCode} 
               title="Объектное хранилище" 
               description="Интегрированное хранилище для ресурсов, баз данных и файлов с синхронизацией в реальном времени."
               color="blue"
             />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3 font-bold text-slate-700">
            <Bot className="w-8 h-8" />
            <span className="tracking-widest uppercase text-xs font-black">Инфраструктура HyperHost © 2026</span>
          </div>
          <div className="flex gap-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-indigo-400 transition-colors">Профиль</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Приватность</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Безопасность</a>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-white hover:bg-slate-900 rounded-full border border-slate-900 w-12 h-12">
              <Github className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({ icon: Icon, title, description, className, color }: { icon: any, title: string, description: string, className?: string, color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    pink: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className={cn("bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-600 transition-all group flex flex-col justify-between", className)}>
      <div>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-inner transition-transform group-hover:scale-110", colorMap[color])}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
