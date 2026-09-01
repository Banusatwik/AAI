import React, { useState, useEffect } from 'react';
import { Gauge, RefreshCw, AlertTriangle, ShieldCheck, HardDrive, Info } from 'lucide-react';
import { api } from '../services/api';
import { EquipmentItem, PolicyDetail } from '../types';

export const ThresholdPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [selectedCode, setSelectedCode] = useState('P-101');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // User input simulation values
  const [simValues, setSimValues] = useState<Record<string, number>>({
    vibration: 4.2,
    rpm: 2850,
    pressure: 13.8,
    bearing_temperature: 74.0,
    flow_rate: 122.0,
    power_kw: 76.0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await api.getEquipmentList();
      setEquipmentList(list);
      
      const current = list.find(e => e.code === selectedCode) || list[0];
      if (current) {
        setSelectedEquipment(current);
        // Find policy
        const policies = await api.getPolicies();
        const pol = policies.find(p => p.equipment_type === current.equipment_type);
        if (pol) {
          const detail = await api.getPolicyDetail(pol.id);
          setActivePolicy(detail);
        }
      }
    } catch (err) {
      console.error('Failed to load threshold data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCode]);

  // Active version thresholds
  const activeVersion = activePolicy?.versions.find(v => v.is_active) || activePolicy?.versions[0];
  const thresholds = activeVersion?.thresholds || [];

  const handleSimChange = (param: string, val: string) => {
    const num = parseFloat(val) || 0;
    setSimValues(prev => ({ ...prev, [param]: num }));
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-blue-400" />
            Deterministic Threshold Analysis Gauges
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Real-time operating tolerances, normal operating zones, warning thresholds, critical barriers, and calculated safety margins.
          </p>
        </div>

        {/* Equipment Selector */}
        <div className="flex items-center gap-3">
          <HardDrive className="w-4 h-4 text-industrial-400" />
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="bg-industrial-900 border border-industrial-700 rounded-lg px-3 py-1.5 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {equipmentList.map(eq => (
              <option key={eq.id} value={eq.code}>
                {eq.code} — {eq.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Policy Context Card */}
      {activePolicy && activeVersion && (
        <div className="bg-gradient-to-r from-industrial-850 to-industrial-900 border border-industrial-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-industrial-300">
              Active Policy Source: <strong className="text-blue-400">{activePolicy.code} v{activeVersion.version}</strong>
            </span>
          </div>
          <div className="text-industrial-400">
            Effective Date: <span className="text-industrial-200">{new Date(activeVersion.effective_date).toLocaleDateString()}</span> | Owner: <span className="text-industrial-200">{activePolicy.owner}</span>
          </div>
        </div>
      )}

      {/* Threshold Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-industrial-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading threshold analysis telemetry...
          </div>
        ) : thresholds.length === 0 ? (
          <div className="col-span-full py-8 text-center text-amber-400 font-mono text-xs">
            No thresholds found for this equipment's active policy version.
          </div>
        ) : (
          thresholds.map((th) => {
            const val = simValues[th.parameter] ?? (th.normal_max || 0);
            const unit = th.unit;
            const normMin = th.normal_min ?? 0;
            const normMax = th.normal_max ?? (th.max_val ? th.max_val * 0.8 : 100);
            const warn = th.warning_val ?? normMax;
            const crit = th.critical_val ?? (th.max_val || warn * 1.1);
            const maxVal = th.max_val ?? crit;
            
            const safetyMargin = maxVal !== undefined ? round3(maxVal - val) : undefined;
            const isExceeded = maxVal !== undefined && val > maxVal;
            const isCritical = crit !== undefined && val >= crit;
            const isWarning = warn !== undefined && val >= warn;

            const gaugePercent = Math.min(100, Math.max(0, (val / (maxVal * 1.2 || 100)) * 100));

            return (
              <div
                key={th.id}
                className={`bg-industrial-850 border rounded-xl p-5 shadow-lg space-y-4 transition-all ${
                  isExceeded
                    ? 'border-rose-500/50 bg-rose-950/20'
                    : isCritical
                    ? 'border-orange-500/50 bg-orange-950/20'
                    : isWarning
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-industrial-800'
                }`}
              >
                
                {/* Top Parameter Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-industrial-100 capitalize">{th.parameter}</h3>
                    <p className="text-[10px] text-industrial-400 font-mono">Ref Clause: {th.clause_reference || 'Standard Limit'}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    isExceeded
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : isCritical
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isExceeded ? 'Violation' : isCritical ? 'Critical' : isWarning ? 'Warning' : 'Normal Range'}
                  </span>
                </div>

                {/* Simulated Operating Value Input */}
                <div className="p-3 bg-industrial-900 rounded-lg border border-industrial-800 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-industrial-400 font-mono">Current Operating Value:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => handleSimChange(th.parameter, e.target.value)}
                        className="w-20 bg-industrial-800 border border-industrial-700 rounded px-1.5 py-0.5 font-mono font-bold text-xs text-right text-industrial-50 focus:outline-none focus:border-blue-500"
                      />
                      <span className="font-mono text-industrial-400 text-xs">{unit}</span>
                    </div>
                  </div>

                  {/* Visual gauge bar */}
                  <div className="h-3 w-full bg-industrial-950 rounded-full overflow-hidden p-0.5 border border-industrial-800 mt-2 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-rose-500' : isCritical ? 'bg-orange-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${gaugePercent}%` }}
                    />
                  </div>
                </div>

                {/* Boundary Specifications Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-industrial-900/60 rounded border border-industrial-800/80">
                    <span className="text-industrial-500 block text-[10px]">Normal Range</span>
                    <span className="text-emerald-400 font-semibold">{normMin} – {normMax} {unit}</span>
                  </div>

                  <div className="p-2 bg-industrial-900/60 rounded border border-industrial-800/80">
                    <span className="text-industrial-500 block text-[10px]">Warning Zone</span>
                    <span className="text-amber-400 font-semibold">&gt;= {warn} {unit}</span>
                  </div>

                  <div className="p-2 bg-industrial-900/60 rounded border border-industrial-800/80">
                    <span className="text-industrial-500 block text-[10px]">Critical Zone</span>
                    <span className="text-orange-400 font-semibold">&gt;= {crit} {unit}</span>
                  </div>

                  <div className="p-2 bg-industrial-900/60 rounded border border-industrial-800/80">
                    <span className="text-industrial-500 block text-[10px]">Policy Hard Max</span>
                    <span className="text-rose-400 font-bold">{maxVal} {unit}</span>
                  </div>
                </div>

                {/* Safety Margin Meter */}
                <div className="pt-2 border-t border-industrial-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-industrial-400 text-[11px]">Safety Margin to Hard Limit:</span>
                  <span className={`font-bold text-xs ${safetyMargin && safetyMargin < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {safetyMargin !== undefined ? (safetyMargin > 0 ? `+${safetyMargin}` : safetyMargin) : 'N/A'} {unit}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

function round3(num: number): number {
  return Math.round(num * 1000) / 1000;
}
