import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, RefreshCw, CheckCircle2, Edit2, BookOpen, AlertOctagon, Calendar, User, Save } from 'lucide-react';
import { api } from '../services/api';
import { PolicySummary, PolicyDetail, PolicyVersion, PolicyThreshold } from '../types';

export const PolicyManagementPage: React.FC = () => {
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingThreshold, setEditingThreshold] = useState<PolicyThreshold | null>(null);
  const [editMaxVal, setEditMaxVal] = useState<string>('');

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const list = await api.getPolicies();
      setPolicies(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyDetail = async (id: number) => {
    try {
      const detail = await api.getPolicyDetail(id);
      setSelectedPolicy(detail);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchPolicyDetail(selectedId);
    }
  }, [selectedId]);

  const handleActivateVersion = async (policyId: number, versionId: number) => {
    try {
      await api.activatePolicyVersion(policyId, versionId);
      alert('Policy version activated successfully! System will immediately use these limits.');
      fetchPolicyDetail(policyId);
      fetchPolicies();
    } catch (err: any) {
      alert(`Activation failed: ${err.message}`);
    }
  };

  const handleSaveThreshold = async () => {
    if (!editingThreshold) return;
    try {
      await api.updateThreshold(editingThreshold.id, {
        ...editingThreshold,
        max_val: parseFloat(editMaxVal),
      });
      alert(`Updated threshold for ${editingThreshold.parameter} to ${editMaxVal} ${editingThreshold.unit}. All subsequent evaluations will dynamically use this limit.`);
      setEditingThreshold(null);
      if (selectedId) fetchPolicyDetail(selectedId);
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
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Safety Policy & Version Governance
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Dynamic database policy lifecycle, multi-version management, clause citations & runtime threshold adjustments.
          </p>
        </div>

        <button
          onClick={fetchPolicies}
          className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
          title="Refresh Policies"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Layout: Policy List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Policies Roster */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-industrial-400 font-mono tracking-wider block">
            Approved Policy Standards ({policies.length})
          </span>

          <div className="space-y-2.5">
            {policies.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-industrial-800 border-blue-500 shadow-lg'
                      : 'bg-industrial-850 border-industrial-800 hover:border-industrial-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-blue-400">{p.code}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                      v{p.active_version || '1.0'} Active
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-industrial-100">{p.name}</h3>
                  <p className="text-[11px] text-industrial-400 mt-1">Applicability: {p.equipment_type}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Policy Versions, Clauses & Thresholds */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPolicy ? (
            <div className="space-y-6">
              
              {/* Policy Header Detail */}
              <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {selectedPolicy.code}
                    </span>
                    <h3 className="text-base font-bold text-industrial-50 mt-1.5">{selectedPolicy.name}</h3>
                    <p className="text-xs text-industrial-400">{selectedPolicy.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-industrial-800">
                  <div>Owner: <span className="text-industrial-200">{selectedPolicy.owner}</span></div>
                  <div>Equipment Type: <span className="text-industrial-200">{selectedPolicy.equipment_type}</span></div>
                </div>
              </div>

              {/* Version History & Activation Switcher */}
              <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-industrial-200 uppercase tracking-wider font-mono">
                    Version History & Active Switcher
                  </h4>
                  <span className="text-[10px] font-mono text-industrial-500">
                    Switch active version to dynamically update limits
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedPolicy.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition-all ${
                        ver.is_active
                          ? 'bg-industrial-900 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-industrial-900/60 border-industrial-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-industrial-100">Version {ver.version}</span>
                          {ver.is_active ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> CURRENT ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-industrial-800 text-industrial-500 text-[10px] font-mono">
                              INACTIVE / LEGACY
                            </span>
                          )}
                        </div>

                        {!ver.is_active && (
                          <button
                            onClick={() => handleActivateVersion(selectedPolicy.id, ver.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold font-mono transition-colors shadow"
                          >
                            Activate Version {ver.version}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-industrial-300 font-sans">{ver.change_summary || 'Baseline policy release.'}</p>
                      
                      <div className="flex gap-4 text-[10px] font-mono text-industrial-500 mt-2 pt-2 border-t border-industrial-800/80">
                        <span>Effective: {new Date(ver.effective_date).toLocaleDateString()}</span>
                        <span>Clauses: {ver.clauses.length}</span>
                        <span>Thresholds: {ver.thresholds.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thresholds Table with Live Edit Button */}
              {selectedPolicy.versions.find(v => v.is_active) && (
                <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-industrial-200 uppercase tracking-wider font-mono">
                      Active Version Operating Limits (No Hardcoded Safety Limits)
                    </h4>
                    <span className="text-[10px] font-mono text-blue-400">Live Database Values</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-industrial-900 text-industrial-400 border-b border-industrial-800">
                        <tr>
                          <th className="p-2.5">Parameter</th>
                          <th className="p-2.5">Normal Max</th>
                          <th className="p-2.5">Warning</th>
                          <th className="p-2.5">Policy Hard Max</th>
                          <th className="p-2.5 text-right">Edit Limit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-industrial-800 text-industrial-200">
                        {selectedPolicy.versions.find(v => v.is_active)?.thresholds.map((t) => (
                          <tr key={t.id} className="hover:bg-industrial-800/40">
                            <td className="p-2.5 font-semibold capitalize text-industrial-100">
                              {t.parameter} <span className="text-[10px] text-industrial-500">[{t.clause_reference}]</span>
                            </td>
                            <td className="p-2.5 text-emerald-400">{t.normal_max ?? '—'} {t.unit}</td>
                            <td className="p-2.5 text-amber-400">{t.warning_val ?? '—'} {t.unit}</td>
                            <td className="p-2.5 font-bold text-rose-400">{t.max_val ?? '—'} {t.unit}</td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => {
                                  setEditingThreshold(t);
                                  setEditMaxVal(String(t.max_val || ''));
                                }}
                                className="px-2 py-0.5 bg-industrial-800 hover:bg-industrial-700 text-blue-400 rounded text-[11px] border border-industrial-700 transition-colors"
                              >
                                Edit Max
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-16 text-center text-industrial-500 font-mono text-xs">
              Select a policy to view versions and clauses.
            </div>
          )}
        </div>

      </div>

      {/* Edit Threshold Modal */}
      {editingThreshold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-industrial-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              Edit Policy Hard Threshold
            </h3>

            <p className="text-industrial-400 text-[11px] font-sans">
              Modifying this parameter limit updates the PostgreSQL database record directly. All subsequent evaluations will immediately evaluate against this value without restarting or modifying code.
            </p>

            <div className="space-y-2">
              <label className="text-industrial-300 block">Parameter: <strong className="capitalize text-industrial-100">{editingThreshold.parameter}</strong></label>
              <label className="text-industrial-300 block">Unit: <strong className="text-industrial-100">{editingThreshold.unit}</strong></label>
              <div>
                <label className="text-industrial-400 block mb-1">New Policy Maximum Limit:</label>
                <input
                  type="number"
                  step="any"
                  value={editMaxVal}
                  onChange={(e) => setEditMaxVal(e.target.value)}
                  className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-bold text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-industrial-800">
              <button
                type="button"
                onClick={() => setEditingThreshold(null)}
                className="px-3 py-1.5 bg-industrial-800 text-industrial-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveThreshold}
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Limit to DB
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
