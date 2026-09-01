import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  decision: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const DecisionBadge: React.FC<Props> = ({ decision, size = 'md', showIcon = true }) => {
  const d = (decision || '').toUpperCase();

  let bg = 'bg-industrial-800 text-industrial-300 border-industrial-700';
  let icon = <HelpCircle className="w-4 h-4" />;
  let glow = '';

  if (d === 'APPROVED') {
    bg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    glow = 'glow-approved';
  } else if (d === 'DENIED') {
    bg = 'bg-rose-950/80 text-rose-300 border-rose-500/50';
    icon = <XCircle className="w-4 h-4 text-rose-400" />;
    glow = 'glow-denied';
  } else if (d === 'POLICY GAP') {
    bg = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
    icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
    glow = 'glow-gap';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-semibold',
    lg: 'text-base px-4 py-1.5 font-bold tracking-wide',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono uppercase tracking-wider ${bg} ${sizeClasses[size]} ${glow}`}>
      {showIcon && icon}
      {d}
    </span>
  );
};
