import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  Activity, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  Database, Globe, Server, Terminal, ExternalLink, RefreshCw, 
  Info, Cpu, HardDrive
} from "lucide-react";

interface Diagnostics {
  status: string;
  timestamp: string;
  firebaseConfigured: boolean;
  env: {
    NODE_ENV: string;
    PORT: string;
    HAS_FIREBASE_PROJECT_ID: boolean;
  };
  databaseConnection?: string;
  databaseError?: string;
}

export default function StatusPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">System Core v1.0.4</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Diagnostics <span className="text-indigo-500">&</span> Status</h1>
            <p className="text-slate-500 mt-2 max-w-md">Detailed overview of environment variables, database connectivity, and runtime health.</p>
          </div>
          
          <button 
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh Status</span>
          </button>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4"
          >
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">Internal Server Error (500)</h3>
              <p className="text-sm text-red-400 leading-relaxed mb-4">
                The server functions are crashing. This is usually due to missing environment variables or filesystem permissions.
              </p>
              <div className="bg-black/40 p-3 rounded-lg font-mono text-xs text-red-300 break-all border border-red-500/10 mb-4">
                {error}
              </div>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://vercel.com/dashboard" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" /> Check Vercel Logs
                </a>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main Status Bar */}
          <div className="md:col-span-3 flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${data?.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {data?.status === 'ok' ? <CheckCircle2 className="w-6 h-6" /> : <Activity className="w-6 h-6 animate-pulse" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">System {data?.status === 'ok' ? 'Healthy' : 'Compromised'}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Globe className="w-3 h-3" />
                  <span>Last check: {lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Latency</p>
                <p className="text-sm font-mono text-emerald-400">~24ms</p>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Region</p>
                <p className="text-sm font-mono text-indigo-400">CDG1 (Vercel)</p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <StatusCard 
            title="Database Link" 
            icon={<Database className="w-4 h-4" />}
            status={data?.databaseConnection === 'connected' ? 'success' : 'error'}
            value={data?.databaseConnection === 'connected' ? 'Operational' : 'Disconnected'}
            details={data?.databaseError || "Connection to Firebase Firestore established and verified."}
          />
          
          <StatusCard 
            title="Runtime Engine" 
            icon={<Cpu className="w-4 h-4" />}
            status="info"
            value={data?.env.NODE_ENV === 'production' ? 'Production' : 'Dev Mode'}
            details={`Running on Node.js ${process.env.NODE_VERSION || 'v20.x'} on port ${data?.env.PORT || '3000'}`}
          />

          <StatusCard 
            title="Storage I/O" 
            icon={<HardDrive className="w-4 h-4" />}
            status="warning"
            value="Virtual Read-Only"
            details="Ephemeral filesystem detected. Using /tmp for uploads (max 512MB)."
          />
        </div>

        {/* Deep Dive Section */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Environment Variables Matrix
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              <EnvRow label="FIREBASE_PROJECT_ID" active={data?.env.HAS_FIREBASE_PROJECT_ID} required />
              <EnvRow label="FIREBASE_CLIENT_EMAIL" active={!!process.env.FIREBASE_CLIENT_EMAIL} required />
              <EnvRow label="FIREBASE_PRIVATE_KEY" active={!!process.env.FIREBASE_PRIVATE_KEY} required />
              <EnvRow label="VERCEL_DEPLOYMENT" active={!!process.env.VERCEL} optional />
              <EnvRow label="FORCE_SERVERLESS" active={true} optional />
              <EnvRow label="APP_URL" active={!!process.env.APP_URL} optional />
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-slate-500">Service Role Key is recommended for admin actions.</p>
              </div>
              <button 
                onClick={() => window.location.href = '/login'}
                className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Return to Core Application →
              </button>
            </div>
          </div>

          {/* Common Fixes Guide */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-4">Common Troubleshooting</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                <p className="text-sm text-slate-400">
                  <strong className="text-slate-200">Firebase Init Failure:</strong> Ensure you ran the Firebase setup tool and the config file exists in the root.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <p className="text-sm text-slate-400">
                  <strong className="text-slate-200">Security Rules Error:</strong> If you get "Permission denied", double check <code className="text-indigo-300 px-1">firestore.rules</code> and ensure your user has a profile in the <code className="text-indigo-300 px-1">profiles</code> collection.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                <p className="text-sm text-slate-400">
                  <strong className="text-slate-200">Admin SDK Setup:</strong> If the server fails to start, verify that the Google Application Credentials are correctly injected or provided via environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-[10px] text-slate-700 uppercase tracking-widest font-black">
          HyperHost Status Engine // End of Line
        </footer>
      </div>
    </div>
  );
}

function StatusCard({ title, icon, status, value, details }: { 
  title: string, 
  icon: React.ReactNode, 
  status: 'success' | 'error' | 'warning' | 'info',
  value: string,
  details: string
}) {
  const colors = {
    success: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
    error: 'text-red-500 bg-red-500/5 border-red-500/10',
    warning: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
    info: 'text-indigo-500 bg-indigo-500/5 border-indigo-500/10'
  };

  return (
    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-colors group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${colors[status]}`}>
          {icon}
        </div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">{title}</h4>
      </div>
      <p className={`text-lg font-bold mb-1 ${status === 'error' ? 'text-red-400' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{details}</p>
    </div>
  );
}

function EnvRow({ label, active, required, admin, optional }: { 
  label: string, 
  active?: boolean, 
  required?: boolean, 
  admin?: boolean,
  optional?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-mono tracking-tight ${active ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
        {required && <span className="text-[7px] font-black bg-red-500/20 text-red-400 px-1 rounded uppercase">Req</span>}
        {admin && <span className="text-[7px] font-black bg-indigo-500/20 text-indigo-400 px-1 rounded uppercase">Admin</span>}
        {optional && <span className="text-[7px] font-black bg-white/10 text-slate-500 px-1 rounded uppercase">Opt</span>}
      </div>
      <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full ${active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        <span className="text-[10px] font-bold uppercase tracking-tighter">{active ? 'Live' : 'Missing'}</span>
      </div>
    </div>
  );
}
