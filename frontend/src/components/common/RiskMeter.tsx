import React from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon } from 'lucide-react';

interface Props {
  score: number;
  level?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskMeter: React.FC<Props> = ({ score, level, size = 'md' }) => {
  const s = Math.min(100, Math.max(0, Number(score) || 0));

  let determinedLevel = level || 'LOW';
  if (!level) {
    if (s >= 76) determinedLevel = 'CRITICAL';
    else if (s >= 51) determinedLevel = 'HIGH';
    else if (s >= 26) determinedLevel = 'MODERATE';
    else determinedLevel = 'LOW';
  }

  let colorClass = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
  let barColor = 'bg-emerald-500';
  let icon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;

  if (determinedLevel === 'CRITICAL' || s >= 76) {
    colorClass = 'text-rose-400 bg-rose-500/20 border-rose-500/40';
    barColor = 'bg-rose-500';
    icon = <AlertOctagon className="w-4 h-4 text-rose-400" />;
  } else if (determinedLevel === 'HIGH' || s >= 51) {
    colorClass = 'text-orange-400 bg-orange-500/20 border-orange-500/40';
    barColor = 'bg-orange-500';
    icon = <ShieldAlert className="w-4 h-4 text-orange-400" />;
  } else if (determinedLevel === 'MODERATE' || s >= 26) {
    colorClass = 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    barColor = 'bg-amber-500';
    icon = <ShieldAlert className="w-4 h-4 text-amber-400" />;
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-industrial-800 rounded-full overflow-hidden border border-industrial-700">
          <div className={`h-full ${barColor}`} style={{ width: `${s}%` }} />
        </div>
        <span className="font-mono text-xs text-industrial-300">{s}/100</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold text-industrial-300 uppercase tracking-wider">
            Risk: <span className={colorClass.split(' ')[0]}>{determinedLevel}</span>
          </span>
        </div>
        <span className="font-mono text-sm font-bold text-industrial-100">{s} <span className="text-xs text-industrial-500">/ 100</span></span>
      </div>
      
      {/* 4-tier segmented bar */}
      <div className="h-2.5 w-full bg-industrial-950 rounded-full overflow-hidden p-0.5 border border-industrial-800 flex gap-0.5">
        <div className="h-full rounded-l-full flex-1 bg-industrial-800 overflow-hidden">
          <div className={`h-full bg-emerald-500 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, s * 4))}%` }} />
        </div>
        <div className="h-full flex-1 bg-industrial-800 overflow-hidden">
          <div className={`h-full bg-amber-500 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, (s - 25) * 4))}%` }} />
        </div>
        <div className="h-full flex-1 bg-industrial-800 overflow-hidden">
          <div className={`h-full bg-orange-500 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, (s - 50) * 4))}%` }} />
        </div>
        <div className="h-full rounded-r-full flex-1 bg-industrial-800 overflow-hidden">
          <div className={`h-full bg-rose-500 transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, (s - 75) * 4))}%` }} />
        </div>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-industrial-500 px-0.5">
        <span>0 LOW</span>
        <span>25 MOD</span>
        <span>50 HIGH</span>
        <span>75 CRIT</span>
        <span>100</span>
      </div>
    </div>
  );
};
