import React from 'react';
import { Cpu, Database, Gauge, GitBranch, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  currentStep?: number; // 1 to 6
  isComplete?: boolean;
}

export const AgentWorkflowStepper: React.FC<Props> = ({ currentStep = 6, isComplete = true }) => {
  const steps = [
    {
      id: 1,
      name: 'Agent 1: NLP Parser',
      description: 'Extracts mechanical parameters',
      icon: Cpu,
    },
    {
      id: 2,
      name: 'Agent 2: Policy Engine',
      description: 'Fetches active DB policies & clauses',
      icon: Database,
    },
    {
      id: 3,
      name: 'Deterministic Engine',
      description: 'Thresholds, Stats & Probabilities',
      icon: Gauge,
    },
    {
      id: 4,
      name: 'Optimization Studio',
      description: 'Safer feasible point search',
      icon: GitBranch,
    },
    {
      id: 5,
      name: 'Safety Synthesizer',
      description: 'Level 1 Hard Priority Decision',
      icon: ShieldAlert,
    },
    {
      id: 6,
      name: 'Agent 4: Explainer',
      description: 'Audit & Provenance Report',
      icon: Sparkles,
    },
  ];

  return (
    <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-industrial-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Agentic AI & Deterministic Safety Pipeline
        </span>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          Deterministic Rule Priority Enforced
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = isComplete || currentStep >= step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isDone
                  ? 'bg-industrial-900 border-industrial-700 text-industrial-200'
                  : 'bg-industrial-900/40 border-industrial-800 text-industrial-500'
              } ${isActive ? 'ring-1 ring-blue-500 border-blue-500/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-md ${isDone ? 'bg-blue-500/10 text-blue-400' : 'bg-industrial-800 text-industrial-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="font-mono text-[10px] text-industrial-600">0{step.id}</span>
                )}
              </div>
              <h4 className="font-semibold text-xs text-industrial-100 truncate">{step.name}</h4>
              <p className="text-[10px] text-industrial-400 line-clamp-1 mt-0.5">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
