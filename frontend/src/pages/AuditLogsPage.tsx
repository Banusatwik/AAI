import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, Filter, ShieldCheck, Eye, Clock, User } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(100, eventFilter === 'ALL' ? undefined : eventFilter);
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventFilter]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-industrial-850 border border-industrial-800 rounded-xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-industrial-50 flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            System-Wide Immutable Audit Trail
          </h2>
          <p className="text-xs text-industrial-400 mt-1">
            Complete compliance ledger of all evaluated operations, threshold changes, version activations & governance actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-industrial-800 hover:bg-industrial-700 text-industrial-300 rounded-lg transition-colors border border-industrial-700"
          title="Refresh Audit Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between bg-industrial-850 border border-industrial-800 rounded-xl p-3.5 shadow">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-industrial-400" />
          <span className="text-industrial-400">Event Type:</span>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-industrial-900 border border-industrial-700 rounded-lg px-2.5 py-1 text-xs text-industrial-200 font-mono"
          >
            <option value="ALL">All Events</option>
            <option value="EVALUATION">EVALUATION</option>
            <option value="VERSION_ACTIVATED">VERSION ACTIVATED</option>
            <option value="THRESHOLD_UPDATED">THRESHOLD UPDATED</option>
            <option value="POLICY_CREATED">POLICY CREATED</option>
            <option value="GAP_UPDATED">GAP UPDATED</option>
          </select>
        </div>

        <span className="text-xs font-mono text-industrial-400">
          Showing {logs.length} Audit Entries
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-industrial-850 border border-industrial-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-900 text-industrial-400 border-b border-industrial-800 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Log ID</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Action Summary</th>
                <th className="p-3.5">Actor / Operator</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800 text-industrial-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-industrial-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading audit trail entries...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-industrial-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-industrial-800/40">
                    <td className="p-3.5 text-industrial-500">#{log.id}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.event_type === 'EVALUATION' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        log.event_type === 'VERSION_ACTIVATED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        log.event_type === 'THRESHOLD_UPDATED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-industrial-800 text-industrial-300'
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-industrial-100 font-sans">{log.action_summary}</td>
                    <td className="p-3.5 text-industrial-400">{log.actor}</td>
                    <td className="p-3.5 text-industrial-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-industrial-800 hover:bg-industrial-700 text-blue-400 rounded border border-industrial-700 transition-colors text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Snapshot
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-industrial-800 pb-3">
              <h3 className="text-sm font-bold text-industrial-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                Audit Snapshot #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-industrial-400 hover:text-industrial-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div>Event: <strong className="text-blue-400">{selectedLog.event_type}</strong></div>
              <div>Actor: <strong className="text-industrial-200">{selectedLog.actor}</strong></div>
              <div>Timestamp: <strong className="text-industrial-200">{new Date(selectedLog.timestamp).toUTCString()}</strong></div>
              <div>Summary: <span className="text-industrial-300 font-sans">{selectedLog.action_summary}</span></div>
              
              <div className="pt-2">
                <span className="text-industrial-500 block mb-1">Payload JSON Snapshot:</span>
                <pre className="p-3 bg-industrial-950 rounded border border-industrial-800 text-[11px] text-emerald-400 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.payload_snapshot, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-industrial-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-industrial-700 hover:bg-industrial-600 text-industrial-100 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
