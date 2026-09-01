import React, { useState } from 'react';
import { 
  Play, Sparkles, CheckCircle2, AlertOctagon, AlertTriangle, 
  HelpCircle, ArrowRight, ShieldCheck, FileText, GitBranch, RefreshCw, 
  Gauge, TrendingUp, Info, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationResponse, PolicyProvenanceItem } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { RiskMeter } from '../components/common/RiskMeter';
import { AgentWorkflowStepper } from '../components/common/AgentWorkflowStepper';
import { PolicyEvidenceModal } from '../components/common/PolicyEvidenceModal';

export const EvaluatePage: React.FC = () => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [equipmentCode, setEquipmentCode] = useState('P-101');
  const [operationType, setOperationType] = useState('Run');
  
  // Parameter form states
  const [rpm, setRpm] = useState<string>('2750');
  const [vibration, setVibration] = useState<string>('3.2');
  const [pressure, setPressure] = useState<string>('12.0');
  const [bearingTemp, setBearingTemp] = useState<string>('65.0');
  const [flowRate, setFlowRate] = useState<string>('118.0');
  const [customParamKey, setCustomParamKey] = useState<string>('');
  const [customParamVal, setCustomParamVal] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<PolicyProvenanceItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Preset scenarios
  const loadPreset = (type: 'approved' | 'denied' | 'gap' | 'high_risk') => {
    if (type === 'approved') {
      setNaturalQuery('Can I run Pump P-101 at 2700 RPM with 2.8 mm/s vibration and 11.5 bar pressure?');
      setEquipmentCode('P-101');
      setRpm('2700');
      setVibration('2.8');
      setPressure('11.5');
      setBearingTemp('62.0');
      setFlowRate('115.0');
      setCustomParamKey('');
      setCustomParamVal('');
    } else if (type === 'denied') {
      setNaturalQuery('Requesting emergency operation of Pump P-101 at 2950 RPM with 5.2 mm/s vibration and 16.0 bar pressure.');
      setEquipmentCode('P-101');
      setRpm('2950'); // Violates policy limit 2850
      setVibration('5.2'); // Violates policy limit 4.5
      setPressure('16.0'); // Violates policy limit 15.0
      setBearingTemp('84.0');
      setFlowRate('135.0');
      setCustomParamKey('');
      setCustomParamVal('');
    } else if (type === 'gap') {
      setNaturalQuery('Evaluate Pump P-101 operation with shaft misalignment of 2.4 mm.');
      setEquipmentCode('P-101');
      setRpm('2600');
      setVibration('3.0');
      setPressure('11.0');
      setBearingTemp('60.0');
      setFlowRate('110.0');
      setCustomParamKey('shaft_misalignment');
      setCustomParamVal('2.4');
    } else if (type === 'high_risk') {
      setNaturalQuery('Run Pump P-101 at 2840 RPM with elevated vibration of 4.1 mm/s and 76.0°C bearing temperature.');
      setEquipmentCode('P-101');
      setRpm('2840');
      setVibration('4.1');
      setPressure('14.2');
      setBearingTemp('76.0');
      setFlowRate('128.0');
      setCustomParamKey('');
      setCustomParamVal('');
    }
  };

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setResult(null);

    const params: Record<string, number> = {};
    if (rpm) params.rpm = parseFloat(rpm);
    if (vibration) params.vibration = parseFloat(vibration);
    if (pressure) params.pressure = parseFloat(pressure);
    if (bearingTemp) params.bearing_temperature = parseFloat(bearingTemp);
    if (flowRate) params.flow_rate = parseFloat(flowRate);
    if (customParamKey && customParamVal) {
      params[customParamKey.trim().toLowerCase()] = parseFloat(customParamVal);
    }

    try {
      const payload: any = {
        equipment_code: equipmentCode,
        operation_type: operationType,
        parameters: params,
        requested_by: 'Reliability Engineer',
      };

      if (naturalQuery.trim()) {
        payload.natural_language_request = naturalQuery.trim();
      }

      const res = await api.evaluateOperation(payload);
      setResult(res);
    } catch (err: any) {
      alert(`Evaluation failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEvidenceModal = (item: PolicyProvenanceItem) => {
    setSelectedEvidence(item);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <Play className="w-5 h-5 text-blue-400 fill-current" />
            Evaluate Mechanical Operation
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Deterministic safety analysis combining Multi-Agent NLP, active database policies, statistical Z-scores, probability curves & parameter optimization.
          </p>
        </div>

        {/* 1-Click Demo Scenarios */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPreset('approved')}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Preset: Approved
          </button>

          <button
            type="button"
            onClick={() => loadPreset('denied')}
            className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Preset: Denied (Hard Limit)
          </button>

          <button
            type="button"
            onClick={() => loadPreset('gap')}
            className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Preset: Policy Gap
          </button>

          <button
            type="button"
            onClick={() => loadPreset('high_risk')}
            className="px-3 py-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
          >
            <Zap className="w-3.5 h-3.5" />
            Preset: High Risk & Optimize
          </button>
        </div>
      </div>

      {/* Evaluation Input Form */}
      <form onSubmit={handleEvaluate} className="bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl space-y-6">
        
        {/* Natural Language Prompt Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-industrial-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Agent 1 — Natural Language Operation Request (Optional)
            </span>
            <span className="text-[11px] font-mono text-industrial-500 lowercase font-normal">
              llm extraction + regex fallback
            </span>
          </label>
          <textarea
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            placeholder="e.g. Can I run Pump P-101 at 2850 RPM with 4.2 mm/s vibration and 14 bar pressure?"
            rows={2}
            className="w-full bg-industrial-900 border border-industrial-700 rounded-lg p-3 text-xs text-industrial-100 placeholder:text-industrial-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
          />
        </div>

        {/* Structured Parameter Controls */}
        <div className="space-y-3 pt-2 border-t border-industrial-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-industrial-400">
            Mechanical Equipment & Operating Parameters
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Equipment Code */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-industrial-400">Equipment</label>
              <select
                value={equipmentCode}
                onChange={(e) => setEquipmentCode(e.target.value)}
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="P-101">Pump P-101 (Primary Feed)</option>
                <option value="P-102">Pump P-102 (Booster Pump)</option>
                <option value="C-201">Compressor C-201 (H2 Recycled)</option>
                <option value="C-202">Compressor C-202 (Syngas Train)</option>
                <option value="T-301">Turbine T-301 (Gas Turbine)</option>
              </select>
            </div>

            {/* Shaft Speed (RPM) */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-industrial-400 flex justify-between">
                <span>Speed</span>
                <span className="text-industrial-500 font-mono">RPM</span>
              </label>
              <input
                type="number"
                step="any"
                value={rpm}
                onChange={(e) => setRpm(e.target.value)}
                placeholder="2850"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Vibration */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-industrial-400 flex justify-between">
                <span>Vibration</span>
                <span className="text-industrial-500 font-mono">mm/s</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={vibration}
                onChange={(e) => setVibration(e.target.value)}
                placeholder="3.5"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Pressure */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-industrial-400 flex justify-between">
                <span>Discharge Press</span>
                <span className="text-industrial-500 font-mono">bar</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={pressure}
                onChange={(e) => setPressure(e.target.value)}
                placeholder="12.0"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Bearing Temperature */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-industrial-400 flex justify-between">
                <span>Bearing Temp</span>
                <span className="text-industrial-500 font-mono">°C</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={bearingTemp}
                onChange={(e) => setBearingTemp(e.target.value)}
                placeholder="68.0"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Flow Rate */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-industrial-400 flex justify-between">
                <span>Flow Rate</span>
                <span className="text-industrial-500 font-mono">m³/h</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={flowRate}
                onChange={(e) => setFlowRate(e.target.value)}
                placeholder="115.0"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

          </div>

          {/* Custom / Gap Parameter Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Additional / Unregulated Parameter (e.g. Test Policy Gap)
              </label>
              <input
                type="text"
                value={customParamKey}
                onChange={(e) => setCustomParamKey(e.target.value)}
                placeholder="e.g. shaft_misalignment, rotor_eccentricity"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-amber-400">Value</label>
              <input
                type="number"
                step="any"
                value={customParamVal}
                onChange={(e) => setCustomParamVal(e.target.value)}
                placeholder="e.g. 2.4"
                className="w-full bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-2 text-xs text-industrial-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-industrial-800 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-industrial-700 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Orchestrating Analytical Engines...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Full Safety Evaluation
              </>
            )}
          </button>
        </div>

      </form>

      {/* Agent Workflow Stepper */}
      <AgentWorkflowStepper currentStep={loading ? 3 : result ? 6 : 1} isComplete={!!result} />

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Decision Banner */}
          <div className={`p-6 rounded-xl border shadow-2xl space-y-4 ${
            result.final_decision === 'APPROVED'
              ? 'bg-emerald-950/40 border-emerald-500/50 glow-approved'
              : result.final_decision === 'DENIED'
              ? 'bg-rose-950/40 border-rose-500/50 glow-denied'
              : 'bg-amber-950/40 border-amber-500/50 glow-gap'
          }`}>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-industrial-800/80">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-industrial-400">
                  Operational Safety Evaluation Outcome
                </span>
                <div className="flex items-center gap-3">
                  <DecisionBadge decision={result.final_decision} size="lg" />
                  <span className="font-mono text-xs text-industrial-400">
                    Asset: <strong className="text-industrial-100">{result.equipment_name} ({result.equipment_code})</strong>
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <RiskMeter score={result.risk_score} level={result.risk_level} />
              </div>
            </div>

            <div className="text-sm font-medium text-industrial-200 leading-relaxed">
              <strong className="text-industrial-100 font-semibold uppercase text-xs tracking-wider block mb-1">
                Evaluation Decision Rationale:
              </strong>
              {result.decision_reason}
            </div>

          </div>

          {/* Detailed Analytical Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col (2 span): Thresholds & Statistics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Threshold Analysis Table */}
              <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    Agent 3 — Deterministic Threshold Analysis
                  </h3>
                  <span className="text-[11px] font-mono text-industrial-400">Dynamic DB Policies</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-industrial-900/80 text-industrial-400 border-b border-industrial-800">
                      <tr>
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Requested</th>
                        <th className="p-2.5">Warning</th>
                        <th className="p-2.5">Hard Limit</th>
                        <th className="p-2.5">Safety Margin</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-industrial-800">
                      {result.threshold_results.map((t, idx) => (
                        <tr key={idx} className="hover:bg-industrial-800/40 transition-colors">
                          <td className="p-2.5 font-semibold text-industrial-200 capitalize">
                            {t.parameter}
                            {t.clause_reference && (
                              <span className="ml-1 text-[10px] text-blue-400">[{t.clause_reference}]</span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-industrial-100">
                            {t.requested_value} <span className="text-[10px] text-industrial-500">{t.unit}</span>
                          </td>
                          <td className="p-2.5 text-industrial-400">
                            {t.warning_threshold !== null && t.warning_threshold !== undefined ? `${t.warning_threshold} ${t.unit}` : '—'}
                          </td>
                          <td className="p-2.5 font-semibold text-rose-400">
                            {t.policy_max !== null && t.policy_max !== undefined ? `${t.policy_max} ${t.unit}` : '—'}
                          </td>
                          <td className="p-2.5">
                            {t.safety_margin !== null && t.safety_margin !== undefined ? (
                              <span className={t.safety_margin < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                                {t.safety_margin > 0 ? `+${t.safety_margin}` : t.safety_margin} {t.unit}
                              </span>
                            ) : (
                              <span className="text-industrial-600">—</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              t.status === 'PASS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : t.status === 'WARNING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : t.status === 'CRITICAL'
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : t.status === 'THRESHOLD_VIOLATION'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statistics & Empirical Probability Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Statistical Z-Score Summary */}
                <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-industrial-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Statistical Baseline & Z-Scores
                  </h4>

                  <div className="space-y-2">
                    {result.statistical_summary.map((s, idx) => (
                      <div key={idx} className="p-2.5 bg-industrial-900 rounded-lg border border-industrial-800 space-y-1 text-xs font-mono">
                        <div className="flex justify-between font-semibold">
                          <span className="capitalize text-industrial-200">{s.parameter}</span>
                          <span className={s.is_abnormal ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            Z = {s.z_score}σ {s.is_abnormal ? '(Anomaly)' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-industrial-500">
                          <span>Mean: {s.historical_mean}</span>
                          <span>StdDev: {s.historical_std_dev}</span>
                          <span>P95: {s.p95}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Empirical Failure Probability */}
                <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-industrial-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-400" />
                    Historical Failure Probability
                  </h4>

                  <div className="space-y-2">
                    {result.probability_summary.map((p, idx) => (
                      <div key={idx} className="p-2.5 bg-industrial-900 rounded-lg border border-industrial-800 space-y-1 text-xs font-mono">
                        <div className="flex justify-between font-semibold">
                          <span className="capitalize text-industrial-200">{p.parameter}</span>
                          {p.is_insufficient_data ? (
                            <span className="text-industrial-500 font-bold">INSUFFICIENT DATA</span>
                          ) : (
                            <span className={Number(p.estimated_failure_probability_pct) > 10 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {p.estimated_failure_probability_pct}%
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-industrial-500">
                          <span>Sample size: {p.sample_size}</span>
                          <span>Failures: {p.historical_failures}</span>
                          <span className="text-[9px] uppercase">{p.status_label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Optimization Recommendation Card */}
              {result.optimization_recommendation && result.optimization_recommendation.recommended_point && (
                <div className="bg-gradient-to-r from-industrial-850 to-industrial-900 border border-blue-500/30 rounded-xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      Parameter Optimization Recommendation
                    </h3>
                    <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      Risk Reduction: -{result.optimization_recommendation.risk_score_reduction} pts
                    </span>
                  </div>

                  <p className="text-xs text-industrial-300 leading-relaxed font-sans">
                    {result.optimization_recommendation.rationale}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                    <div className="p-3 bg-industrial-900 rounded-lg border border-industrial-800 space-y-1">
                      <span className="text-[10px] text-industrial-500 uppercase font-semibold">Current Setpoint</span>
                      <div className="text-industrial-200">
                        {result.optimization_recommendation.current_point.rpm} RPM | {result.optimization_recommendation.current_point.flow_rate} m³/h
                      </div>
                      <div className="text-rose-400 font-bold text-[11px]">
                        Risk Score: {result.optimization_recommendation.current_point.estimated_risk_score}
                      </div>
                    </div>

                    <div className="p-3 bg-industrial-900 rounded-lg border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">Safer Recommended Setpoint</span>
                      <div className="text-emerald-300 font-bold">
                        {result.optimization_recommendation.recommended_point.rpm} RPM | {result.optimization_recommendation.recommended_point.flow_rate} m³/h
                      </div>
                      <div className="text-emerald-400 font-bold text-[11px]">
                        Risk Score: {result.optimization_recommendation.recommended_point.estimated_risk_score} (Eff: {result.optimization_recommendation.recommended_point.estimated_efficiency_pct}%)
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Col (1 span): Policy Provenance & Rules */}
            <div className="space-y-6">
              
              {/* Policy Provenance List */}
              <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Policy Provenance & Evidence
                  </h3>
                  <span className="text-[10px] font-mono text-industrial-500">Clause Trace</span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {result.policy_provenance.length > 0 ? (
                    result.policy_provenance.map((prov, idx) => (
                      <div
                        key={idx}
                        onClick={() => openEvidenceModal(prov)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                          prov.is_violated
                            ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/50'
                            : 'bg-industrial-900 border-industrial-800 hover:border-industrial-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                          <span className="font-bold text-blue-400">{prov.policy_code} v{prov.policy_version}</span>
                          <span className="text-industrial-500">Cl. {prov.clause_number}</span>
                        </div>
                        <h5 className="font-semibold text-industrial-200 truncate">{prov.clause_title}</h5>
                        <p className="text-[11px] text-industrial-400 mt-1 line-clamp-2">{prov.clause_text}</p>
                        
                        <div className="mt-2 pt-2 border-t border-industrial-800/80 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-industrial-500">{prov.parameter}: <strong className="text-industrial-300">{prov.policy_limit}</strong></span>
                          <span className="text-blue-400 hover:underline flex items-center gap-0.5">
                            View Evidence <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-industrial-500 font-mono p-3">No active policy clauses mapped.</p>
                  )}
                </div>
              </div>

              {/* Contributing Risk Rules */}
              <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Deterministic Rule Itemization
                  </h3>
                  <span className="text-[10px] font-mono text-industrial-500">DB Configured</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {result.rule_contributions.length > 0 ? (
                    result.rule_contributions.map((rule, idx) => (
                      <div key={idx} className="p-2.5 bg-industrial-900 rounded-lg border border-industrial-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-industrial-300 font-semibold">{rule.rule_code}</span>
                          <span className="font-bold text-amber-400">+{rule.score_points} pts</span>
                        </div>
                        <p className="text-[11px] text-industrial-400 font-sans">{rule.description}</p>
                        <p className="text-[10px] text-industrial-500 italic font-sans">{rule.trigger_condition}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-400 font-mono p-3">Zero risk penalty rules triggered.</p>
                  )}
                </div>
              </div>

              {/* Policy Gaps (if any) */}
              {result.policy_gaps.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 shadow-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Policy Gap Logged in Database
                  </div>
                  <div className="space-y-1.5 text-xs text-amber-200">
                    {result.policy_gaps.map((g, idx) => (
                      <div key={idx} className="p-2 bg-industrial-900/80 rounded border border-amber-500/20 font-mono text-[11px]">
                        <div>Parameter: <strong className="text-amber-300">{g.parameter}</strong></div>
                        <div className="text-[10px] text-industrial-400 mt-0.5">
                          Occurrence Count: {g.occurrence_count} | Owner: {g.gap_owner}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Agent 4 — Executive Summary Report */}
          <div className="bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-industrial-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Agent 4 — Engineering Executive Summary & Audit Narrative
            </h3>
            <div className="p-4 bg-industrial-900 rounded-lg border border-industrial-800 text-xs text-industrial-200 leading-relaxed font-mono whitespace-pre-line">
              {result.llm_explanation}
            </div>
          </div>

        </div>
      )}

      {/* Policy Evidence Modal */}
      <PolicyEvidenceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        evidence={selectedEvidence}
      />

    </div>
  );
};
