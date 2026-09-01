import React from 'react';
import {
  LayoutDashboard, PlayCircle, History, HardDrive, Gauge,
  TrendingUp, BarChart2, ShieldAlert, GitBranch, ShieldCheck,
  AlertTriangle, ClipboardList
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'evaluate'
  | 'operations'
  | 'equipment'
  | 'thresholds'
  | 'statistics'
  | 'probability'
  | 'risk_scoring'
  | 'optimization'
  | 'policies'
  | 'gaps'
  | 'audit';

interface Props {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  gapCount?: number;
}

export const Sidebar: React.FC<Props> = ({ activePage, onSelectPage, gapCount = 0 }) => {
  const navSections = [
    {
      title: 'OPERATIONAL SAFETY',
      items: [
        { id: 'dashboard' as PageId, name: 'Dashboard', icon: LayoutDashboard },
        { id: 'evaluate' as PageId, name: 'Evaluate Operation', icon: PlayCircle, highlight: true },
        { id: 'operations' as PageId, name: 'Operations Log', icon: History },
        { id: 'equipment' as PageId, name: 'Equipment Roster', icon: HardDrive },
      ],
    },
    {
      title: 'DETERMINISTIC ANALYTICS',
      items: [
        { id: 'thresholds' as PageId, name: 'Threshold Analysis', icon: Gauge },
        { id: 'statistics' as PageId, name: 'Statistical Baseline', icon: TrendingUp },
        { id: 'probability' as PageId, name: 'Failure Probability', icon: BarChart2 },
        { id: 'risk_scoring' as PageId, name: 'Risk Scoring Rules', icon: ShieldAlert },
        { id: 'optimization' as PageId, name: 'Optimization Studio', icon: GitBranch },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'policies' as PageId, name: 'Policy Management', icon: ShieldCheck },
        { id: 'gaps' as PageId, name: 'Policy Gaps', icon: AlertTriangle, badge: gapCount },
        { id: 'audit' as PageId, name: 'Audit Logs', icon: ClipboardList },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-industrial-900 border-r border-industrial-800 flex flex-col shrink-0 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-industrial-500 font-mono">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-industrial-300 hover:bg-industrial-800 hover:text-industrial-100'
                    } ${item.highlight && !isActive ? 'ring-1 ring-emerald-500/20 text-emerald-300' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : item.highlight ? 'text-emerald-400' : 'text-industrial-400'}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-industrial-800/80 bg-industrial-950/40">
        <div className="text-[11px] text-industrial-400 space-y-1">
          <div className="flex justify-between">
            <span>Core Priority:</span>
            <span className="font-mono text-industrial-200">Level 1 Hard</span>
          </div>
          <div className="flex justify-between">
            <span>Limits Source:</span>
            <span className="font-mono text-industrial-200">Database DB</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
