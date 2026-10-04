import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, AlertTriangle, Clock, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface EmergencyRestringingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourt?: string;
}

export const EmergencyRestringingModal: React.FC<EmergencyRestringingModalProps> = ({
  isOpen,
  onClose,
  defaultCourt = 'Court 2 (Center Hardcourt)',
}) => {
  const { user } = useAuth();
  const [courtLocation, setCourtLocation] = useState(defaultCourt);
  const [racketBrand, setRacketBrand] = useState('Wilson Blade 98 v8');
  const [tension, setTension] = useState('54 lbs');
  const [stringType, setStringType] = useState('Luxilon ALU Power 125');
  const [needLoaner, setNeedLoaner] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReqNo, setConfirmedReqNo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/public/emergency-restringing', {
        member_name: user?.name || 'Club Player',
        court_location: courtLocation,
        racket_brand: racketBrand,
        tension,
        string_type: stringType,
        need_loaner: needLoaner,
        notes,
      });

      setConfirmedReqNo(res.data?.request_no || 'REST-NOW');
      toast.success('🚨 Emergency request dispatched to Pro Shop! Technician is preparing your loaner racket.', {
        duration: 6000,
        icon: '⚡',
      });
    } catch {
      toast.error('Failed to dispatch emergency stringing. Please alert front desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedReqNo(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0F0F13] border border-[#B89047]/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {!confirmedReqNo ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Zap size={13} className="text-amber-400" />
                <span>10-Minute Match Emergency Protocol</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                Racket String Snapped Before Play?
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Problem Statement Scene 3: Our pro shop electronic restringing technician will restring your racket in 10 minutes and dispatch an immediate tournament-grade loaner directly to your court.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Your Court Location *
                </label>
                <input
                  type="text"
                  required
                  value={courtLocation}
                  onChange={(e) => setCourtLocation(e.target.value)}
                  placeholder="e.g. Court 2 or Badminton Court 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Racket Brand & Model *
                </label>
                <input
                  type="text"
                  required
                  value={racketBrand}
                  onChange={(e) => setRacketBrand(e.target.value)}
                  placeholder="e.g. Wilson Blade 98, Babolat Pure Drive"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  String Selection
                </label>
                <select
                  value={stringType}
                  onChange={(e) => setStringType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141418] text-white text-xs outline-none focus:border-[#B89047] cursor-pointer"
                >
                  <option value="Luxilon ALU Power 125">Luxilon ALU Power 125 (Pro Tour Choice)</option>
                  <option value="Babolat RPM Blast 17">Babolat RPM Blast 17 (Spin & Control)</option>
                  <option value="Yonex Poly Tour Pro">Yonex Poly Tour Pro (Soft Feel)</option>
                  <option value="Wilson Synthetic Gut">Wilson Synthetic Gut (Comfort)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  String Tension
                </label>
                <input
                  type="text"
                  value={tension}
                  onChange={(e) => setTension(e.target.value)}
                  placeholder="e.g. 54 lbs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
                />
              </div>
            </div>

            {/* Loaner Racket Toggle */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#B89047]/10 to-transparent border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-400" />
                  <span>Immediate Loaner Racket Delivery</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  A pro shop runner brings a matched racket to your court right now.
                </p>
              </div>
              <input
                type="checkbox"
                checked={needLoaner}
                onChange={(e) => setNeedLoaner(e.target.checked)}
                className="w-5 h-5 accent-[#B89047] cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#997332] text-black font-bold text-sm shadow-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              <span>{isSubmitting ? 'Dispatching Emergency Alert...' : 'Dispatch 10-Min Emergency Restringing'}</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold font-display text-white">Technician Dispatched!</h3>
            <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
              Ticket <strong className="text-amber-300 font-mono">#{confirmedReqNo}</strong> sent via WebSocket to the Pro Shop station. Your loaner racket is en route to <strong className="text-white">{courtLocation}</strong>.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 text-xs text-gray-300 font-mono">
              <Clock size={13} className="text-amber-400" />
              <span>Restringing ETA: Under 10 minutes</span>
            </div>
            <div>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
