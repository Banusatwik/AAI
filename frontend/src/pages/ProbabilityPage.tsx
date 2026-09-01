import React, { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, HardDrive, AlertTriangle, ShieldCheck, Info, BarChart3 } from 'lucide-react';
import { api } from '../services/api';
import { ParameterProbability, EquipmentItem } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export const ProbabilityPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [selectedCode, setSelectedCode] = useState('P-101');
  const [selectedParam, setSelectedParam] = useState('vibration');
  const [probData, setProbData] = useState<ParameterProbability | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEquipment = async () => {
    try {
      const list = await api.getEquipmentList();
      setEquipmentList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProbability = async () => {
    try {
      setLoading(true);
      const res = await api.getProbability(selectedCode, selectedParam);
      setProbData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    fetchProbability();
  }, [selectedCode, selectedParam]);

  const chartData = probData?.bins.map((b) => ({
    name: b.range_label,
    probability: b.failure_probability_pct,
    observations: b.total_observations,
    failures: b.failure_events,
    status: b.status,
  })) || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            Empirical Failure Probability Modeling
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Historical failure probabilities P(Failure | Operating Band) based on verified machine records & sample sufficiency.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-1 text-xs">
            <HardDrive className="w-3.5 h-3.5 text-industrial-400" />
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="bg-transparent text-industrial-100 font-mono focus:outline-none"
            >
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.code} className="bg-industrial-900">{eq.code} ({eq.name})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-1 text-xs">
            <BarChart3 className="w-3.5 h-3.5 text-industrial-400" />
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="bg-transparent text-industrial-100 font-mono focus:outline-none"
            >
              <option value="vibration" className="bg-industrial-900">Vibration (mm/s)</option>
              <option value="bearing_temperature" className="bg-industrial-900">Bearing Temp (°C)</option>
              <option value="rpm" className="bg-industrial-900">Shaft Speed (RPM)</option>
              <option value="pressure" className="bg-industrial-900">Discharge Pressure (bar)</option>
              <option value="temperature" className="bg-industrial-900">Fluid Temp (°C)</option>
            </select>
          </div>

          <button
            onClick={fetchProbability}
            className="p-1.5 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg border border-industrial-700"
            title="Refresh Probability Model"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Probability Disclaimer Card */}
      <div className="bg-gradient-to-r from-blue-950/30 to-industrial-850 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3 text-xs text-blue-200">
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <span className="font-bold text-xs uppercase tracking-wider block">
            Core Probabilistic Principle: Historical / Estimated Probability
          </span>
          <p className="text-[11px] text-industrial-300 opacity-90 mt-0.5">
            Probabilities are empirical frequencies computed from recorded operations. They represent historical likelihood rather than absolute certainty. Bins with insufficient observations are explicitly marked as <strong className="text-amber-400">INSUFFICIENT DATA</strong>.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-industrial-500 font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          Computing empirical failure rates across operational regimes...
        </div>
      ) : !probData || probData.is_insufficient_data ? (
        <div className="p-8 bg-industrial-850 border border-industrial-800 rounded-xl text-center font-mono text-xs text-amber-400">
          INSUFFICIENT DATA: Fewer than 10 historical records available for {selectedCode} / {selectedParam}.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-industrial-850 border border-industrial-800 rounded-xl space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Total Historical Observations</span>
              <div className="text-xl font-bold font-mono text-industrial-100">{probData.total_observations} records</div>
              <p className="text-[10px] text-industrial-500">Verified sensor readings</p>
            </div>

            <div className="p-4 bg-industrial-850 border border-industrial-800 rounded-xl space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Documented Historical Failures</span>
              <div className="text-xl font-bold font-mono text-rose-400">{probData.total_failures} trips / events</div>
              <p className="text-[10px] text-industrial-500">Bearing seizure, vibration trips, thermal excursions</p>
            </div>

            <div className="p-4 bg-industrial-850 border border-industrial-800 rounded-xl space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Fleet Baseline Failure Rate</span>
              <div className="text-xl font-bold font-mono text-amber-400">{probData.overall_failure_rate_pct}%</div>
              <p className="text-[10px] text-industrial-500">Unconditional failure probability</p>
            </div>
          </div>

          {/* Probability Bar Chart by Operating Band */}
          <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Empirical Conditional Failure Rate by Operating Band
              </h3>
              <span className="text-[10px] font-mono text-industrial-400">P(Failure | Band)</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`${val}% Failure Probability`, 'Rate']}
                  />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => {
                      let color = '#10b981';
                      if (entry.probability > 20) color = '#ef4444';
                      else if (entry.probability > 10) color = '#f97316';
                      else if (entry.probability > 4) color = '#f59e0b';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-industrial-850 border border-industrial-800 rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-industrial-800 text-xs font-bold uppercase text-industrial-300">
              Parametric Regimes & Sample Validation Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-industrial-900 text-industrial-400 border-b border-industrial-800">
                  <tr>
                    <th className="p-3">Operating Regime Band</th>
                    <th className="p-3">Sample Count (N)</th>
                    <th className="p-3">Failure Events</th>
                    <th className="p-3">Empirical Failure Probability</th>
                    <th className="p-3">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-800 text-industrial-200">
                  {probData.bins.map((bin, idx) => (
                    <tr key={idx} className="hover:bg-industrial-800/40">
                      <td className="p-3 font-semibold text-industrial-100">{bin.range_label}</td>
                      <td className="p-3 text-industrial-300">{bin.total_observations} records</td>
                      <td className="p-3 text-rose-400 font-bold">{bin.failure_events}</td>
                      <td className="p-3 font-bold text-sm">
                        {bin.total_observations < 3 ? (
                          <span className="text-industrial-500 text-xs">INSUFFICIENT DATA</span>
                        ) : (
                          <span className={bin.failure_probability_pct > 15 ? 'text-rose-400' : bin.failure_probability_pct > 5 ? 'text-amber-400' : 'text-emerald-400'}>
                            {bin.failure_probability_pct}%
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          bin.status === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          bin.status === 'ELEVATED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          bin.status === 'HIGH_RISK' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          bin.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                          'bg-industrial-800 text-industrial-400'
                        }`}>
                          {bin.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
