import React, { useState, useEffect } from 'react';
import { HardDrive, Plus, RefreshCw, Activity, ShieldCheck, Gauge, Play, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { EquipmentItem } from '../types';
import { PageId } from '../components/layout/Sidebar';

interface Props {
  onNavigate: (page: PageId, extraData?: any) => void;
}

export const EquipmentPage: React.FC<Props> = ({ onNavigate }) => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New Equipment Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Centrifugal Pump');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [power, setPower] = useState('');
  const [speed, setSpeed] = useState('');

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.getEquipmentList();
      setEquipment(res);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment({
        code: code.trim().toUpperCase(),
        name,
        equipment_type: type,
        model_number: model,
        location,
        power_kw: power ? parseFloat(power) : undefined,
        rated_speed_rpm: speed ? parseFloat(speed) : undefined,
        status: 'OPERATIONAL',
      });
      setModalOpen(false);
      fetchEquipment();
    } catch (err: any) {
      alert(`Failed to create equipment: ${err?.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-blue-400" />
            Mechanical Asset Fleet & Telemetry
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Monitored industrial rotating machinery, rated parameters, live telemetry & active safety policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEquipment}
            className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
            title="Refresh Equipment"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Register Equipment
          </button>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-industrial-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading machinery roster...
          </div>
        ) : (
          equipment.map((eq) => (
            <div
              key={eq.id}
              className="bg-industrial-850 border border-industrial-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-industrial-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Card Title & Code */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {eq.code}
                    </span>
                    <h3 className="font-bold text-sm text-industrial-100 mt-1.5">{eq.name}</h3>
                    <p className="text-xs text-industrial-400">{eq.equipment_type}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    eq.status === 'OPERATIONAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {eq.status}
                  </span>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-industrial-900/70 p-3 rounded-lg border border-industrial-800">
                  <div>
                    <span className="text-industrial-500 block text-[10px]">Rated Power</span>
                    <span className="text-industrial-200 font-semibold">{eq.power_kw ? `${eq.power_kw} kW` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-industrial-500 block text-[10px]">Rated Speed</span>
                    <span className="text-industrial-200 font-semibold">{eq.rated_speed_rpm ? `${eq.rated_speed_rpm} RPM` : 'N/A'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-industrial-800/80">
                    <span className="text-industrial-500 block text-[10px]">Location</span>
                    <span className="text-industrial-300 truncate block font-sans">{eq.location || 'Main Plant'}</span>
                  </div>
                </div>

                {/* Latest Telemetry Snapshot */}
                {eq.latest_measurements && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-industrial-500 tracking-wider">
                      Latest Historical Telemetry ({eq.measurement_count} records)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-center">
                      <div className="p-1.5 bg-industrial-900 rounded border border-industrial-800">
                        <div className="text-[9px] text-industrial-500">Vib</div>
                        <div className="text-emerald-400 font-bold">{eq.latest_measurements.vibration ?? '—'} <span className="text-[8px]">mm/s</span></div>
                      </div>
                      <div className="p-1.5 bg-industrial-900 rounded border border-industrial-800">
                        <div className="text-[9px] text-industrial-500">Press</div>
                        <div className="text-industrial-200 font-bold">{eq.latest_measurements.pressure ?? '—'} <span className="text-[8px]">bar</span></div>
                      </div>
                      <div className="p-1.5 bg-industrial-900 rounded border border-industrial-800">
                        <div className="text-[9px] text-industrial-500">Speed</div>
                        <div className="text-industrial-200 font-bold">{eq.latest_measurements.rpm ?? '—'} <span className="text-[8px]">RPM</span></div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-industrial-800 flex items-center justify-between">
                <div className="text-[11px] font-mono text-industrial-400">
                  Policy: <span className="text-blue-400 font-bold">{eq.active_policy_code || 'NONE'}</span> v{eq.active_policy_version || '1.0'}
                </div>

                <button
                  onClick={() => onNavigate('evaluate', { equipmentCode: eq.code })}
                  className="px-3 py-1 bg-industrial-800 hover:bg-industrial-700 text-industrial-200 rounded text-xs font-semibold flex items-center gap-1.5 border border-industrial-700 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current text-blue-400" />
                  Evaluate
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-industrial-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Register New Machinery Asset
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-industrial-400 block mb-1">Equipment Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. P-103"
                    className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-industrial-400 block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-mono"
                  >
                    <option value="Centrifugal Pump">Centrifugal Pump</option>
                    <option value="Reciprocating Compressor">Reciprocating Compressor</option>
                    <option value="Gas Turbine">Gas Turbine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-industrial-400 block mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Auxiliary Cooling Water Pump"
                  className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-industrial-400 block mb-1">Rated Power (kW)</label>
                  <input
                    type="number"
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                    placeholder="75.0"
                    className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-industrial-400 block mb-1">Rated Speed (RPM)</label>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="2950"
                    className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-industrial-400 block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Utility Block Section C"
                  className="w-full bg-industrial-850 border border-industrial-700 rounded p-2 text-industrial-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-industrial-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 bg-industrial-800 text-industrial-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded text-xs"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
