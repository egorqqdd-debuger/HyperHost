import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Database, Globe, Server } from "lucide-react";

interface Diagnostics {
  status: string;
  timestamp: string;
  supabaseConfigured: boolean;
  env: {
    NODE_ENV: string;
    PORT: string;
    HAS_SUPABASE_URL: boolean;
    HAS_SUPABASE_ANON_KEY: boolean;
    HAS_SUPABASE_SERVICE_ROLE_KEY: boolean;
  };
  databaseConnection?: string;
  databaseError?: string;
}

export default function StatusPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 50)}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Diagnostics</h1>
            <p className="text-slate-400 text-sm">Real-time environment & connectivity status</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
            />
            <p className="text-slate-500 font-medium">Analyzing environment...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
            <XCircle className="w-12 h-12 text-red-500" />
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Diagnose Failed</h2>
              <p className="text-red-400 text-sm max-w-sm mx-auto">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Status */}
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${data?.status === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-4">
                {data?.status === 'ok' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    {data?.status === 'ok' ? 'System Operational' : 'Critical Issues'}
                  </h2>
                  <p className="text-slate-400 text-sm">Server Time: {new Date(data?.timestamp || '').toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Database Status */}
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">Supabase Connection</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Environment Config</span>
                    <span className={data?.supabaseConfigured ? "text-emerald-400" : "text-amber-400"}>
                      {data?.supabaseConfigured ? "Complete" : "Incomplete"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Database Link</span>
                    <span className={data?.databaseConnection === 'connected' ? "text-emerald-400" : "text-red-400"}>
                      {data?.databaseConnection === 'connected' ? "Connected" : "Failed"}
                    </span>
                  </div>
                  {data?.databaseError && (
                    <div className="mt-2 p-3 bg-red-500/10 rounded-lg text-[10px] font-mono text-red-400 break-all leading-relaxed border border-red-500/10">
                      ERR: {data.databaseError}
                    </div>
                  )}
                </div>
              </div>

              {/* Server Status */}
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">Runtime Environment</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Node Env</span>
                    <span className="text-blue-400 uppercase font-mono text-xs">{data?.env.NODE_ENV}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Port</span>
                    <span className="text-slate-300 font-mono text-xs">{data?.env.PORT || '3000'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Variables Checklist */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white">Secret Availability Check</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <EnvCheckItem label="SUPABASE_URL" checked={data?.env.HAS_SUPABASE_URL} />
                <EnvCheckItem label="SUPABASE_ANON_KEY" checked={data?.env.HAS_SUPABASE_ANON_KEY} />
                <EnvCheckItem label="SUPABASE_SERVICE_ROLE" checked={data?.env.HAS_SUPABASE_SERVICE_ROLE_KEY} />
                <EnvCheckItem label="SERVERLESS_MODE" checked={!!process.env.VERCEL || !!process.env.FUNCTIONS_EMULATOR} />
              </div>
            </div>

            <div className="text-center pt-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Back to Application
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EnvCheckItem({ label, checked }: { label: string, checked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-xs font-mono text-slate-500 uppercase">{label}</span>
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-sm shadow-emerald-500/20" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-amber-500" />
      )}
    </div>
  );
}
