import React, { useState, useEffect } from 'react';
import { GitBranch, Play, RefreshCw, HardDrive, ShieldCheck, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { OptimizationResponse, EquipmentItem } from '../types';

export const OptimizationPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [equipmentCode, setEquipmentCode] = useState('P-101');
  
  // Operating parameters input
  const [rpm, setRpm] = useState('2900');
  const [flow, setFlow] = useState('125.0');
  const [pressure, setPressure] = useState('14.0');
  const [bearingTemp, setBearingTemp] = useState('78.0');
  const [vibration, setVibration] = useState('4.2');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResponse | null>(null);

  const fetchEquipment = async () => {
    try {
      const list = await api.getEquipmentList();
      setEquipmentList(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.runOptimization({
        equipment_code: equipmentCode,
        current_rpm: parseFloat(rpm),
        target_flow_rate: parseFloat(flow),
        current_pressure: parseFloat(pressure),
        current_bearing_temperature: parseFloat(bearingTemp),
        current_vibration: parseFloat(vibration),
      });
      setResult(res);
    } catch (err: any) {
      alert(`Optimization failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Parameter Optimization Studio
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Constrained multi-objective search for safer feasible operating points minimizing risk score and maximizing hydraulic efficiency.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleOptimize} className="bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-industrial-300">
          Target Operating State & Demands
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-industrial-400">Target Asset</label>
            <select
              value={equipmentCode}
              onChange={(e) => setEquipmentCode(e.target.value)}
              className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono"
            >
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.code}>{eq.code} ({eq.name})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-industrial-400">Current Speed (RPM)</label>
            <input
              type="number"
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
              className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-2 text-xs text-industrial-100 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-industrial-400">Required Flow (m³/h)</label>
            <input
              type="number"
              value={flow}
              onChange={(e) => setFlow(e.target.value)}
              className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-2 text-xs text-industrial-100 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-industrial-400">Current Pressure (bar)</label>
            <input
              type="number"
              value={pressure}
              onChange={(e) => setPressure(e.target.value)}
              className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-2 text-xs text-industrial-100 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-industrial-400">Bearing Temp (°C)</label>
            <input
              type="number"
              value={bearingTemp}
              onChange={(e) => setBearingTemp(e.target.value)}
              className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-2 text-xs text-industrial-100 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-industrial-400">Current Vib (mm/s)</label>
            <input
              type="number"
              value={vibration}
              onChange={(e) => setVibration(e.target.value)}
              className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-2 text-xs text-industrial-100 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Execute Optimization Solver
          </button>
        </div>
      </form>

      {/* Results Card */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          <div className={`p-6 rounded-xl border shadow-xl space-y-4 ${
            result.feasible 
              ? 'bg-gradient-to-r from-industrial-850 to-industrial-900 border-blue-500/40' 
              : 'bg-rose-950/30 border-rose-500/50'
          }`}>
            
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded font-mono font-bold text-xs uppercase tracking-wider ${
                result.feasible 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {result.status_message}
              </span>

              {result.feasible && (
                <div className="flex gap-4 font-mono text-xs">
                  <span className="text-emerald-400 font-bold">
                    Risk Score: -{result.risk_score_reduction} pts
                  </span>
                  <span className="text-blue-400 font-bold">
                    Efficiency: +{result.efficiency_gain_pct}%
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-industrial-200 leading-relaxed font-sans">
              {result.rationale}
            </p>

            {result.recommended_point && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Current Point */}
                <div className="p-4 bg-industrial-900 rounded-xl border border-industrial-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-industrial-500 font-mono">Current Point</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>Speed: <strong className="text-industrial-200">{result.current_point.rpm} RPM</strong></div>
                    <div>Flow: <strong className="text-industrial-200">{result.current_point.flow_rate} m³/h</strong></div>
                    <div>Vibration: <strong className="text-rose-400">{result.current_point.vibration} mm/s</strong></div>
                    <div>Bearing: <strong className="text-amber-400">{result.current_point.bearing_temperature}°C</strong></div>
                  </div>
                  <div className="pt-2 border-t border-industrial-800/80 flex justify-between text-xs font-mono">
                    <span>Risk Score: <strong className="text-rose-400">{result.current_point.estimated_risk_score}</strong></span>
                    <span>Efficiency: <strong className="text-industrial-300">{result.current_point.estimated_efficiency_pct}%</strong></span>
                  </div>
                </div>

                {/* Recommended Point */}
                <div className="p-4 bg-industrial-900 rounded-xl border border-emerald-500/40 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">Recommended Safer Point</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>Speed: <strong className="text-emerald-400">{result.recommended_point.rpm} RPM</strong></div>
                    <div>Flow: <strong className="text-emerald-400">{result.recommended_point.flow_rate} m³/h</strong></div>
                    <div>Vibration: <strong className="text-emerald-400">{result.recommended_point.vibration} mm/s</strong></div>
                    <div>Bearing: <strong className="text-emerald-400">{result.recommended_point.bearing_temperature}°C</strong></div>
                  </div>
                  <div className="pt-2 border-t border-industrial-800/80 flex justify-between text-xs font-mono">
                    <span>Risk Score: <strong className="text-emerald-400">{result.recommended_point.estimated_risk_score}</strong></span>
                    <span>Efficiency: <strong className="text-emerald-400">{result.recommended_point.estimated_efficiency_pct}%</strong></span>
                  </div>
                </div>

              </div>
            )}

            {result.constrained_by_policies.length > 0 && (
              <div className="text-[11px] font-mono text-industrial-400 pt-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Active Policy Constraints Enforced: {result.constrained_by_policies.join(', ')}</span>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
