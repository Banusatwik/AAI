import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, Eye, ArrowRight, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { EvaluationListItem, EvaluationResponse } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';

export const OperationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [selectedEval, setSelectedEval] = useState<EvaluationResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getEvaluationHistory(100);
      setEvaluations(res);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      const res = await api.getEvaluationDetail(id);
      setSelectedEval(res);
    } catch (err) {
      alert('Failed to load evaluation details');
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = evaluations.filter((e) => {
    const matchSearch = e.equipment_code.toLowerCase().includes(search.toLowerCase()) || String(e.id).includes(search);
    const matchDecision = decisionFilter === 'ALL' || e.final_decision === decisionFilter;
    return matchSearch && matchDecision;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            Operations Evaluation Audit Log
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Complete chronological record of all evaluated operations, safety boundaries, risk scores & policy provenance.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
          title="Refresh History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-industrial-850 border border-industrial-800 rounded-xl p-4 shadow">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-industrial-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by equipment (e.g. P-101, C-201)..."
            className="w-full bg-industrial-900 border border-industrial-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-industrial-100 placeholder:text-industrial-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-industrial-400" />
          <span className="text-xs text-industrial-400">Decision Filter:</span>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-1.5 text-xs text-industrial-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DENIED">DENIED</option>
            <option value="POLICY GAP">POLICY GAP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-industrial-850 border border-industrial-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-900 text-industrial-400 border-b border-industrial-800 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Eval ID</th>
                <th className="p-3.5">Equipment</th>
                <th className="p-3.5">Final Decision</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Evaluated At</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800 text-industrial-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-industrial-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading evaluations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-industrial-500">
                    No evaluations match the search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-industrial-800/40 transition-colors">
                    <td className="p-3.5 text-industrial-400">#{item.id}</td>
                    <td className="p-3.5 font-bold text-blue-400">{item.equipment_code}</td>
                    <td className="p-3.5">
                      <DecisionBadge decision={item.final_decision} size="sm" />
                    </td>
                    <td className="p-3.5 font-bold">{item.risk_score} / 100</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.risk_level === 'LOW' ? 'text-emerald-400 bg-emerald-500/10' :
                        item.risk_level === 'MODERATE' ? 'text-amber-400 bg-amber-500/10' :
                        item.risk_level === 'HIGH' ? 'text-orange-400 bg-orange-500/10' :
                        'text-rose-400 bg-rose-500/10'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="p-3.5 text-industrial-400">
                      {new Date(item.evaluated_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openDetails(item.id)}
                        className="px-2.5 py-1 bg-industrial-800 hover:bg-industrial-700 text-blue-400 hover:text-blue-300 rounded border border-industrial-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Details Modal */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-industrial-800 flex items-center justify-between bg-industrial-850">
              <div className="flex items-center gap-3">
                <DecisionBadge decision={selectedEval.final_decision} size="md" />
                <div>
                  <h3 className="font-bold text-sm text-industrial-100">
                    Evaluation #{selectedEval.id} — {selectedEval.equipment_name} ({selectedEval.equipment_code})
                  </h3>
                  <span className="text-[11px] font-mono text-industrial-400">
                    {new Date(selectedEval.evaluated_at).toUTCString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEval(null)}
                className="p-1 rounded text-industrial-400 hover:text-industrial-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="p-3 bg-industrial-850 rounded-lg border border-industrial-800 space-y-1">
                <span className="font-bold uppercase text-[10px] text-industrial-400">Decision Summary:</span>
                <p className="text-industrial-200">{selectedEval.decision_reason}</p>
              </div>

              <div className="p-3 bg-industrial-850 rounded-lg border border-industrial-800 space-y-2">
                <span className="font-bold uppercase text-[10px] text-industrial-400">Threshold Analysis:</span>
                <div className="space-y-1">
                  {selectedEval.threshold_results.map((t, i) => (
                    <div key={i} className="flex justify-between border-b border-industrial-800/60 pb-1">
                      <span className="capitalize text-industrial-300">{t.parameter} ({t.requested_value} {t.unit})</span>
                      <span className={t.is_mandatory_violation ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {t.status} (Limit: {t.policy_max || t.policy_min || 'N/A'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEval.llm_explanation && (
                <div className="p-3 bg-industrial-850 rounded-lg border border-industrial-800 space-y-1">
                  <span className="font-bold uppercase text-[10px] text-industrial-400">Audit Narrative:</span>
                  <p className="text-industrial-300 whitespace-pre-line text-[11px] leading-relaxed font-sans">
                    {selectedEval.llm_explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-industrial-800 bg-industrial-850 flex justify-end">
              <button
                onClick={() => setSelectedEval(null)}
                className="px-4 py-1.5 bg-industrial-700 hover:bg-industrial-600 text-industrial-100 rounded text-xs"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
