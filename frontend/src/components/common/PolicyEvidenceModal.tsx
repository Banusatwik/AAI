import React from 'react';
import { X, FileText, ShieldCheck, AlertOctagon, Calendar, User, BookOpen } from 'lucide-react';
import { PolicyProvenanceItem } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  evidence: PolicyProvenanceItem | null;
}

export const PolicyEvidenceModal: React.FC<Props> = ({ isOpen, onClose, evidence }) => {
  if (!isOpen || !evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-industrial-800 flex items-center justify-between bg-industrial-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-industrial-100 flex items-center gap-2">
                Policy Evidence Record
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-industrial-800 text-blue-400 border border-blue-500/30">
                  {evidence.policy_code} v{evidence.policy_version}
                </span>
              </h3>
              <p className="text-xs text-industrial-400">{evidence.policy_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-industrial-800 text-industrial-400 hover:text-industrial-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Status banner */}
          <div className={`p-3.5 rounded-lg border flex items-center gap-3 ${
            evidence.is_violated 
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}>
            {evidence.is_violated ? (
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs uppercase tracking-wider">
                {evidence.is_violated ? 'Mandatory Policy Boundary Violated' : 'Verified Within Policy Limit'}
              </span>
              <p className="text-xs opacity-90 mt-0.5">
                Requested: <span className="font-mono font-bold">{evidence.requested_value}</span> vs Policy Limit: <span className="font-mono font-bold">{evidence.policy_limit}</span>
              </p>
            </div>
          </div>

          {/* Clause Card */}
          <div className="bg-industrial-850 border border-industrial-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-industrial-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Clause {evidence.clause_number}: {evidence.clause_title}
            </div>
            <div className="p-3 bg-industrial-900 rounded border border-industrial-800 font-serif text-industrial-200 leading-relaxed text-xs">
              "{evidence.clause_text}"
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-industrial-850 rounded-lg border border-industrial-800 space-y-1">
              <div className="flex items-center gap-1.5 text-industrial-400 font-medium">
                <User className="w-3.5 h-3.5" />
                Policy Owner
              </div>
              <p className="font-semibold text-industrial-200">{evidence.owner}</p>
            </div>

            <div className="p-3 bg-industrial-850 rounded-lg border border-industrial-800 space-y-1">
              <div className="flex items-center gap-1.5 text-industrial-400 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Effective Date
              </div>
              <p className="font-mono font-semibold text-industrial-200">{evidence.effective_date}</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-industrial-800 bg-industrial-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-industrial-700 hover:bg-industrial-600 text-industrial-100 rounded-lg font-medium text-xs transition-colors"
          >
            Close Evidence
          </button>
        </div>

      </div>
    </div>
  );
};
