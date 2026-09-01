import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, RefreshCw, Edit2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { RiskRule } from '../types';

export const RiskScoringPage: React.FC = () => {
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRules();
      setRules(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Configurable Database Risk Scoring Rules
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Deterministic risk engine rules stored in database. Never allows arbitrary LLM hallucination of scores.
          </p>
        </div>

        <button
          onClick={fetchRules}
          className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
          title="Refresh Rules"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Risk Tiers Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1">
          <div className="text-emerald-400 font-bold">0 – 25 LOW RISK</div>
          <p className="text-[11px] text-industrial-400 font-sans">Normal operations within all established safety envelopes.</p>
        </div>
        <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1">
          <div className="text-amber-400 font-bold">26 – 50 MODERATE RISK</div>
          <p className="text-[11px] text-industrial-400 font-sans">Warning boundaries approached; advisory monitoring recommended.</p>
        </div>
        <div className="p-3 bg-orange-950/30 border border-orange-500/40 rounded-xl space-y-1">
          <div className="text-orange-400 font-bold">51 – 75 HIGH RISK</div>
          <p className="text-[11px] text-industrial-400 font-sans">Elevated failure probability or multiple parameter alerts triggered.</p>
        </div>
        <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl space-y-1">
          <div className="text-rose-400 font-bold">76 – 100 CRITICAL RISK</div>
          <p className="text-[11px] text-industrial-400 font-sans">Severe risk score automatically triggering operational denial.</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-industrial-850 border border-industrial-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-industrial-800 flex justify-between items-center bg-industrial-900/60">
          <span className="text-xs font-bold uppercase text-industrial-200">
            Active Deterministic Rules ({rules.length} Registered)
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            Source: PostgreSQL `risk_scoring_rules` Table
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-900 text-industrial-400 border-b border-industrial-800">
              <tr>
                <th className="p-3.5">Rule Code</th>
                <th className="p-3.5">Parameter</th>
                <th className="p-3.5">Condition Trigger</th>
                <th className="p-3.5">Threshold Value</th>
                <th className="p-3.5">Penalty Points</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800 text-industrial-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-industrial-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading rules from database...
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-industrial-800/40">
                    <td className="p-3.5 font-bold text-amber-400">{rule.rule_code}</td>
                    <td className="p-3.5 font-semibold text-industrial-100 capitalize">{rule.parameter}</td>
                    <td className="p-3.5 text-industrial-300">{rule.condition}</td>
                    <td className="p-3.5 text-industrial-400">{rule.threshold_value !== null ? rule.threshold_value : 'Dynamic'}</td>
                    <td className="p-3.5 font-bold text-rose-400 text-sm">+{rule.score_points} pts</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-industrial-900 border border-industrial-700 text-[10px] text-industrial-300">
                        {rule.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-industrial-300 text-[11px]">{rule.description}</td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
