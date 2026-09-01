import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Activity, Clock, Terminal, User } from 'lucide-react';

interface Props {
  onQuickEvaluate?: () => void;
}

export const Navbar: React.FC<Props> = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-industrial-900 border-b border-industrial-800 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-industrial-50">
              MECH-AI DECISION SYSTEM
            </h1>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              v1.0.0 ONLINE
            </span>
          </div>
          <p className="text-[11px] text-industrial-400">Mechanical Engineering Safety & Policy Intelligence</p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-industrial-850 border border-industrial-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-industrial-400">Safety Core:</span>
          <span className="font-mono font-bold text-emerald-400">DETERMINISTIC ACTIVE</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-industrial-850 border border-industrial-800 font-mono text-industrial-400 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-industrial-850 border border-industrial-800 text-xs">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
            OP
          </div>
          <div className="hidden sm:block text-left">
            <div className="font-semibold text-industrial-200">John Doe</div>
            <div className="text-[10px] text-industrial-400">Lead Reliability Operator</div>
          </div>
        </div>
      </div>

    </header>
  );
};
