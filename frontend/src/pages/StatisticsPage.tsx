import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, HardDrive, BarChart3, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { api } from '../services/api';
import { ParameterStats, EquipmentItem } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const StatisticsPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [selectedCode, setSelectedCode] = useState('P-101');
  const [selectedParam, setSelectedParam] = useState('vibration');
  const [stats, setStats] = useState<ParameterStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time Z-Score test input
  const [testValue, setTestValue] = useState<string>('4.8');

  const fetchEquipment = async () => {
    try {
      const list = await api.getEquipmentList();
      setEquipmentList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getStatistics(selectedCode, selectedParam);
      setStats(res);
      if (res.mean) {
        setTestValue(String(Math.round((res.p95 || res.mean * 1.3) * 10) / 10));
      }
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
    fetchStats();
  }, [selectedCode, selectedParam]);

  // Compute interactive Z-Score
  const numVal = parseFloat(testValue) || 0;
  const mean = stats?.mean || 0;
  const std = stats?.std_dev || 1;
  const zScore = std > 0 ? Math.round(((numVal - mean) / std) * 100) / 100 : 0;
  const isAnomalous = Math.abs(zScore) >= 2.0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Statistical Baseline & Historical Trend Analysis
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Empirical parametric distributions, moving averages, standard deviation intervals, and Z-score outlier detectors.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Equipment */}
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

          {/* Parameter */}
          <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-1 text-xs">
            <BarChart3 className="w-3.5 h-3.5 text-industrial-400" />
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="bg-transparent text-industrial-100 font-mono focus:outline-none"
            >
              <option value="vibration" className="bg-industrial-900">Vibration (mm/s)</option>
              <option value="rpm" className="bg-industrial-900">Shaft Speed (RPM)</option>
              <option value="pressure" className="bg-industrial-900">Discharge Pressure (bar)</option>
              <option value="bearing_temperature" className="bg-industrial-900">Bearing Temp (°C)</option>
              <option value="temperature" className="bg-industrial-900">Casing Temp (°C)</option>
              <option value="flow_rate" className="bg-industrial-900">Flow Rate (m³/h)</option>
              <option value="power_kw" className="bg-industrial-900">Motor Power (kW)</option>
              <option value="efficiency_pct" className="bg-industrial-900">Efficiency (%)</option>
            </select>
          </div>

          <button
            onClick={fetchStats}
            className="p-1.5 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg border border-industrial-700"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-industrial-500 font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          Computing parametric statistics from time series dataset...
        </div>
      ) : !stats || stats.is_insufficient_data ? (
        <div className="p-8 bg-industrial-850 border border-industrial-800 rounded-xl text-center font-mono text-xs text-amber-400">
          INSUFFICIENT DATA: Fewer than 10 historical records available for this parameter.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Statistical KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Sample Size (N)</span>
              <div className="text-base font-bold font-mono text-industrial-100">{stats.sample_size}</div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Mean (μ)</span>
              <div className="text-base font-bold font-mono text-blue-400">{stats.mean} <span className="text-[10px]">{stats.unit}</span></div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Median (p50)</span>
              <div className="text-base font-bold font-mono text-industrial-200">{stats.median} <span className="text-[10px]">{stats.unit}</span></div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Std Dev (σ)</span>
              <div className="text-base font-bold font-mono text-indigo-400">{stats.std_dev} <span className="text-[10px]">{stats.unit}</span></div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">95th Percentile</span>
              <div className="text-base font-bold font-mono text-amber-400">{stats.p95} <span className="text-[10px]">{stats.unit}</span></div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">99th Percentile</span>
              <div className="text-base font-bold font-mono text-orange-400">{stats.p99} <span className="text-[10px]">{stats.unit}</span></div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">Range [Min–Max]</span>
              <div className="text-xs font-bold font-mono text-industrial-200">{stats.min_value} – {stats.max_value}</div>
            </div>
            <div className="p-3 bg-industrial-850 border border-industrial-800 rounded-lg space-y-1">
              <span className="text-[10px] text-industrial-500 uppercase font-mono">30D Trend</span>
              <div className={`text-xs font-bold font-mono ${stats.trend === 'INCREASING' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.trend}
              </div>
            </div>
          </div>

          {/* Time Series Graph */}
          <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Historical Time-Series Telemetry & Moving Average Band
              </h3>
              <span className="text-[10px] font-mono text-industrial-400">
                {stats.time_series.length} data points (60-Day Window)
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.time_series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} unit={stats.unit} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px', fontFamily: 'monospace' }}
                    labelFormatter={(val) => val ? new Date(String(val)).toLocaleString() : ''}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={1.5} 
                    dot={false} 
                    name={`Raw ${stats.parameter} (${stats.unit})`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="moving_avg" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={false} 
                    name="Moving Avg (MA-5)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-industrial-400 pt-2 border-t border-industrial-800">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-blue-400">● Observed Telemetry</span>
                <span className="flex items-center gap-1.5 text-emerald-400">--- 5-Period Moving Average</span>
              </div>
              <span>Historical Variance: {stats.variance}</span>
            </div>
          </div>

          {/* Interactive Z-Score Outlier Calculator Widget */}
          <div className="bg-gradient-to-r from-industrial-850 to-industrial-900 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Real-time Statistical Outlier & Z-Score Analysis (Z = (x - μ) / σ)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-industrial-400">Test Operating Value ({stats.unit}):</label>
                <input
                  type="number"
                  step="any"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-2 font-mono font-bold text-sm text-industrial-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-industrial-900 rounded-lg border border-industrial-800 font-mono text-xs space-y-1">
                <div className="text-industrial-400 text-[10px]">Calculated Z-Score:</div>
                <div className={`text-lg font-bold ${isAnomalous ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Z = {zScore} σ
                </div>
                <div className="text-[10px] text-industrial-500">
                  ({numVal} - {mean}) / {std}
                </div>
              </div>

              <div className="p-3 bg-industrial-900 rounded-lg border border-industrial-800 font-mono text-xs space-y-1">
                <div className="text-industrial-400 text-[10px]">Statistical Classification:</div>
                <div className="font-semibold">
                  {isAnomalous ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> STATISTICAL ANOMALY (|Z| &ge; 2.0σ)
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Within Normal Distribution
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-industrial-500">
                  {isAnomalous ? 'Contributes +15 pts risk penalty' : 'Normal historical operation'}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
