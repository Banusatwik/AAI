import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, XCircle, AlertTriangle, Activity, 
  ArrowUpRight, HardDrive, Play, RefreshCw, Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardResponse, EquipmentHealthCard } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { RiskMeter } from '../components/common/RiskMeter';
import { PageId } from '../components/layout/Sidebar';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  onNavigate: (page: PageId, extraData?: any) => void;
}

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-mono text-industrial-400">Loading Operational Intelligence Telemetry...</p>
        </div>
      </div>
    );
  }

  const { kpis, risk_distribution, decision_distribution, equipment_health } = data;

  const decisionChartData = [
    { name: 'Approved', value: decision_distribution.approved, color: '#10b981' },
    { name: 'Denied', value: decision_distribution.denied, color: '#ef4444' },
    { name: 'Policy Gap', value: decision_distribution.policy_gap, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const riskBarData = [
    { name: 'Low (0-25)', count: risk_distribution.low, color: '#10b981' },
    { name: 'Moderate (26-50)', count: risk_distribution.moderate, color: '#f59e0b' },
    { name: 'High (51-75)', count: risk_distribution.high, color: '#f97316' },
    { name: 'Critical (76-100)', count: risk_distribution.critical, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-industrial-850 to-industrial-900 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-400" />
            Mechanical Safety & Operations Overview
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Real-time mechanical evaluation against database-driven safety policies, risk scoring rules & statistical baselines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('evaluate')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Evaluate New Operation
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider">Total Evaluations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-industrial-50">{kpis.total_evaluations}</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-[10px] text-industrial-500">Full audit trail records</p>
        </div>

        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Approved</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">{kpis.approved_count}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-industrial-500">Within policy limits</p>
        </div>

        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Denied</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-rose-400">{kpis.denied_count}</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-[10px] text-industrial-500">Mandatory limits violated</p>
        </div>

        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Policy Gaps</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-400">{kpis.policy_gaps_count}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-[10px] text-industrial-500">Missing policy parameters</p>
        </div>

        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider">Average Risk</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-industrial-50">{kpis.average_risk_score}</span>
            <span className="font-mono text-xs text-industrial-500">/ 100</span>
          </div>
          <p className="text-[10px] text-industrial-500">Deterministic scoring</p>
        </div>

        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">High Risk Ops</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-orange-400">{kpis.high_risk_operations_count}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono">Tier 3-4</span>
          </div>
          <p className="text-[10px] text-industrial-500">Score &gt; 50</p>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Distribution Chart */}
        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Risk Level Distribution
            </h3>
            <span className="text-[11px] font-mono text-industrial-400">Score Bands</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Breakdown */}
        <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Safety Decision Breakdown
            </h3>
            <span className="text-[11px] font-mono text-industrial-400">Level 1 - 3 Outcomes</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {decisionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {decisionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-industrial-500 font-mono">No evaluations recorded yet.</p>
            )}
          </div>
          
          <div className="flex justify-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">● Approved ({decision_distribution.approved})</span>
            <span className="flex items-center gap-1 text-rose-400">● Denied ({decision_distribution.denied})</span>
            <span className="flex items-center gap-1 text-amber-400">● Policy Gap ({decision_distribution.policy_gap})</span>
          </div>
        </div>

      </div>

      {/* Equipment Health Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-industrial-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            Monitored Rotating Machinery Assets
          </h3>
          <button
            onClick={() => onNavigate('equipment')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
          >
            View All Equipment <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment_health.map((eq: EquipmentHealthCard) => (
            <div 
              key={eq.id}
              onClick={() => onNavigate('equipment')}
              className="bg-industrial-850 hover:bg-industrial-800/80 border border-industrial-800 hover:border-industrial-700 rounded-xl p-5 transition-all cursor-pointer shadow-md space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {eq.code}
                    </span>
                    <span className="text-xs font-semibold text-industrial-200">{eq.equipment_type}</span>
                  </div>
                  <h4 className="text-xs text-industrial-400 mt-1">{eq.name}</h4>
                </div>
                <DecisionBadge decision={eq.latest_decision} size="sm" />
              </div>

              {/* Parameter Status Pills */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-industrial-800 text-[11px]">
                <div className="bg-industrial-900/60 p-2 rounded border border-industrial-800/60 text-center">
                  <div className="text-industrial-500 text-[10px]">Vibration</div>
                  <div className={`font-semibold ${eq.vibration_status === 'Normal' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {eq.vibration_status}
                  </div>
                </div>
                <div className="bg-industrial-900/60 p-2 rounded border border-industrial-800/60 text-center">
                  <div className="text-industrial-500 text-[10px]">Thermal</div>
                  <div className={`font-semibold ${eq.temperature_status === 'Normal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {eq.temperature_status}
                  </div>
                </div>
                <div className="bg-industrial-900/60 p-2 rounded border border-industrial-800/60 text-center">
                  <div className="text-industrial-500 text-[10px]">Pressure</div>
                  <div className={`font-semibold ${eq.pressure_status === 'Normal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {eq.pressure_status}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-industrial-500 font-mono pt-1">
                <span>Policy: <span className="text-industrial-300">{eq.active_policy_code}</span></span>
                <span>Risk: <span className="text-industrial-300 font-bold">{eq.latest_risk_level}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
