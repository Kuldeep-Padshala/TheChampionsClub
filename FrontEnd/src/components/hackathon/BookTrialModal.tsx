import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Calendar, User, Phone, Mail, CheckCircle2, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

interface BookTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookTrialModal: React.FC<BookTrialModalProps> = ({ isOpen, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredSport, setPreferredSport] = useState('Tennis');
  const [preferredTime, setPreferredTime] = useState('Weekday Evening (6 PM - 8 PM)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      toast.error('Please provide your name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/public/book-trial', {
        full_name: fullName,
        phone,
        email: email || undefined,
        preferred_sport: preferredSport,
        preferred_time: preferredTime,
        notes,
      });

      setConfirmed(true);
      toast.success('🎉 Complimentary trial booked! Our concierge is welcoming you.', {
        duration: 5000,
        icon: '🎾',
      });
    } catch {
      toast.error('Failed to book trial session. Please try calling directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
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

        {!confirmed ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B89047]/20 border border-[#B89047]/40 text-[#EAD29A] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={13} className="text-[#EAD29A]" />
                <span>Complimentary Guest Experience</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                Book a Free Trial Session
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Problem Statement Scene 5: Experience our tour-grade courts, pro shop gear trial, and clubhouse lounge before deciding on a membership plan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Sport of Interest
                </label>
                <select
                  value={preferredSport}
                  onChange={(e) => setPreferredSport(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141418] text-white text-xs outline-none focus:border-[#B89047] cursor-pointer"
                >
                  <option value="Tennis">Tennis (Clay / Hardcourt)</option>
                  <option value="Padel">Padel (Synthetic Glass)</option>
                  <option value="Badminton">Badminton (PVC Court)</option>
                  <option value="Cricket">Cricket (Turf Nets)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141418] text-white text-xs outline-none focus:border-[#B89047] cursor-pointer"
                >
                  <option value="Weekday Morning (6 AM - 9 AM)">Weekday Morning (6 AM - 9 AM)</option>
                  <option value="Weekday Evening (6 PM - 9 PM)">Weekday Evening (6 PM - 9 PM)</option>
                  <option value="Weekend Morning (7 AM - 11 AM)">Weekend Morning (7 AM - 11 AM)</option>
                  <option value="Weekend Evening (5 PM - 9 PM)">Weekend Evening (5 PM - 9 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Any specific requirements? (Racket hire, coaching intro)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Need racket hire, looking for Gold plan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#997332] text-black font-bold text-sm shadow-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Confirming Trial Reservation...' : 'Confirm Free Trial Session'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold font-display text-white">Trial Session Reserved!</h3>
            <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
              Welcome, <strong className="text-[#EAD29A]">{fullName}</strong>! Our Front Desk concierge has received your request and will send your trial pass confirmation.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 text-xs text-[#EAD29A] font-medium">
              <Trophy size={14} />
              <span>Complimentary Equipment Hire Included</span>
            </div>
            <div>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
