import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert, Clock, User, Filter, FileText } from 'lucide-react';
import { api } from '../services/api';
import { PolicyGapItem } from '../types';

export const PolicyGapsPage: React.FC = () => {
  const [gaps, setGaps] = useState<PolicyGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedGap, setSelectedGap] = useState<PolicyGapItem | null>(null);
  const [newStatus, setNewStatus] = useState('OPEN');
  const [notes, setNotes] = useState('');

  const fetchGaps = async () => {
    try {
      setLoading(true);
      const res = await api.getGaps(statusFilter === 'ALL' ? undefined : statusFilter);
      setGaps(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [statusFilter]);

  const handleUpdate = async () => {
    if (!selectedGap) return;
    try {
      await api.updateGap(selectedGap.id, {
        status: newStatus,
        resolution_notes: notes,
      });
      alert('Policy gap updated successfully.');
      setSelectedGap(null);
      fetchGaps();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Safety Policy Gap Registry & Governance
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Tracks un-regulated parameters encountered during operational requests. Ensures the system never invents or guesses missing limits.
          </p>
        </div>

        <button
          onClick={fetchGaps}
          className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
          title="Refresh Gaps"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Policy Gap Core Principle Card */}
      <div className="bg-gradient-to-r from-amber-950/30 to-industrial-850 border border-amber-500/40 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold text-xs uppercase tracking-wider block">
            Core Safety Rule 14: Never Assume or Hallucinate Safety Boundaries
          </span>
          <p className="text-[11px] text-industrial-300 opacity-90 mt-0.5 font-sans">
            When an operational evaluation involves a parameter without an approved policy threshold (e.g. shaft misalignment), the system strictly returns <strong className="text-amber-400">POLICY GAP</strong>, automatically logs it to this registry, and increments occurrence counters to prioritize safety committee reviews.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-industrial-850 border border-industrial-800 rounded-xl p-3.5 shadow">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-industrial-400" />
          <span className="text-industrial-400">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-1 text-xs text-industrial-200 font-mono"
          >
            <option value="ALL">All Gaps</option>
            <option value="OPEN">OPEN (Unresolved)</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <span className="text-xs font-mono text-industrial-400">
          Showing {gaps.length} Registered Gaps
        </span>
      </div>

      {/* Gaps Table */}
      <div className="bg-industrial-850 border border-industrial-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-900 text-industrial-400 border-b border-industrial-800 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Missing Parameter</th>
                <th className="p-3.5">Equipment / Type</th>
                <th className="p-3.5">Occurrence Count</th>
                <th className="p-3.5">Review Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Gap Owner</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800 text-industrial-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-industrial-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading policy gap registry...
                  </td>
                </tr>
              ) : gaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-emerald-400">
                    No open policy gaps detected. All operational parameters are governed by active policies.
                  </td>
                </tr>
              ) : (
                gaps.map((g) => {
                  const isHighPriority = g.occurrence_count >= 3;
                  return (
                    <tr key={g.id} className="hover:bg-industrial-800/40">
                      <td className="p-3.5 font-bold text-amber-300 capitalize">
                        {g.parameter.replace('_', ' ')}
                      </td>
                      <td className="p-3.5 text-industrial-300">
                        {g.equipment_code ? `${g.equipment_code} — ` : ''}{g.equipment_type || 'Industrial Machinery'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isHighPriority ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-industrial-900 text-industrial-300'
                        }`}>
                          {g.occurrence_count} requests
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isHighPriority ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                        }`}>
                          {isHighPriority ? 'HIGH PRIORITY' : 'MODERATE'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          g.status === 'OPEN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                          g.status === 'UNDER_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-industrial-400">{g.owner}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedGap(g);
                            setNewStatus(g.status);
                            setNotes(g.resolution_notes || '');
                          }}
                          className="px-2.5 py-1 bg-industrial-800 hover:bg-industrial-700 text-blue-400 rounded border border-industrial-700 transition-colors text-[11px]"
                        >
                          Manage Gap
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Gap Modal */}
      {selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-industrial-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Manage Policy Gap: <span className="capitalize text-amber-300">{selectedGap.parameter}</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-industrial-850 rounded-lg border border-industrial-800 space-y-1">
                <div>Occurrence Frequency: <strong>{selectedGap.occurrence_count} requests</strong></div>
                <div>First Encountered: <strong>{new Date(selectedGap.first_detected_at).toLocaleString()}</strong></div>
                <div>Owner Section: <strong>{selectedGap.owner}</strong></div>
              </div>

              <div>
                <label className="text-industrial-400 block mb-1">Status Workflow:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-mono"
                >
                  <option value="OPEN">OPEN (Requires Standard Policy Definition)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Engineering Committee)</option>
                  <option value="RESOLVED">RESOLVED (Integrated into Policy Version)</option>
                </select>
              </div>

              <div>
                <label className="text-industrial-400 block mb-1">Safety Engineering Resolution Notes:</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Setting up laser alignment tolerance limits in accordance with ISO 10816."
                  className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-industrial-800">
              <button
                type="button"
                onClick={() => setSelectedGap(null)}
                className="px-3 py-1.5 bg-industrial-800 text-industrial-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded"
              >
                Update Gap
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
