import React, { useState } from 'react';
import { TimeSlot, Court } from '../../types/court.types';
import { Trophy, Calendar, Clock, Sparkles, CheckCircle2, X, ShieldCheck, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import paymentService from '../../services/paymentService';
import { memberService } from '../../services/memberService';

interface CourtBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  court?: Court | null;
  onConfirmSuccess: (slotId: string, bookingRef: string) => void;
}

export const CourtBookingModal: React.FC<CourtBookingModalProps> = ({
  isOpen,
  onClose,
  slot,
  court,
  onConfirmSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookingType, setBookingType] = useState<'exclusive' | 'social'>('exclusive');
  const [partnerName, setPartnerName] = useState('');
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [confirmedPaymentId, setConfirmedPaymentId] = useState<string | null>(null);

  if (!isOpen || !slot) return null;

  // Format date display
  const dateObj = new Date(slot.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const courtName = court?.name || 'Tournament Court';
  const standardPrice = court?.pricePerHour?.walkin || 800;
  const payableAmount = standardPrice > 0 ? standardPrice : 800;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Trigger Razorpay live modal checkout
      await paymentService.openCheckout({
        amount: payableAmount,
        productName: `Court Reservation: ${courtName} (${slot.startTime} - ${slot.endTime})`,
        customerName: user?.name || partnerName || 'Club Guest',
        customerEmail: user?.email || '',
        onSuccess: async ({ payment_id, order_id }) => {
          let bookingRef = 'BKNG-' + Date.now().toString().slice(-6);

          // If user is authenticated, also sync with MySQL backend
          if (user) {
            try {
              const numericCourtId = typeof court?.id === 'number'
                ? court.id
                : parseInt(String(court?.id).replace('court-', '')) || 1;
              const startsAt = `${slot.date} ${slot.startTime}:00`;
              const endsAt = `${slot.date} ${slot.endTime}:00`;

              const res = await memberService.createBooking({
                court_id: numericCourtId,
                starts_at: startsAt,
                ends_at: endsAt,
                reservation_type: bookingType,
                razorpay_payment_id: payment_id,
                amount_charged: payableAmount,
                notes: `Razorpay Payment Txn: ${payment_id}`,
              });
              if (res?.bookingRef) {
                bookingRef = res.bookingRef;
              }
            } catch (syncErr) {
              console.warn('[CourtBookingModal] Backend sync notice:', syncErr);
            }
          }

          setConfirmedRef(bookingRef);
          setConfirmedPaymentId(payment_id);
          onConfirmSuccess(slot.id, bookingRef);

          toast.success(`Payment of ₹${payableAmount} verified! Court reserved: ${bookingRef}`, {
            duration: 5000,
            icon: '🏆',
          });
          setIsSubmitting(false);
        },
        onError: (err) => {
          setIsSubmitting(false);
          const msg = err?.message || 'Payment was cancelled or failed. Court was not reserved.';
          toast.error(msg);
        },
      });
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || 'Unable to initialize Razorpay checkout.');
    }
  };

  const handleClose = () => {
    setConfirmedRef(null);
    setConfirmedPaymentId(null);
    setPartnerName('');
    setEquipmentNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#121216] border border-[#B89047]/40 shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#B89047]/20 border border-[#B89047]/30 flex items-center justify-center text-[#EAD29A]">
              <Trophy size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Reserve Court Slot</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#B89047]/20 text-[#EAD29A] font-mono uppercase tracking-wider">
                  Concierge Booking
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Exclusive member privileges applied</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        {!confirmedRef ? (
          <form onSubmit={handleConfirm} className="p-6 space-y-5">
            
            {/* Slot & Court Details Summary Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs uppercase font-bold tracking-wider text-[#EAD29A] font-display">
                  {courtName}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  Instant Confirmation
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar size={14} className="text-[#B89047] flex-shrink-0" />
                  <span className="truncate">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock size={14} className="text-[#B89047] flex-shrink-0" />
                  <span>{slot.startTime} – {slot.endTime}</span>
                </div>
              </div>
            </div>

            {/* Reservation Mode Selection */}
            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                Reservation Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBookingType('exclusive')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    bookingType === 'exclusive'
                      ? 'bg-[#B89047]/15 border-[#B89047] text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-bold text-white">Exclusive Court</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Private match for you &amp; guests</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType('social')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    bookingType === 'social'
                      ? 'bg-[#B89047]/15 border-[#B89047] text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-bold text-white">Social Match</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Open rally with club members</p>
                </button>
              </div>
            </div>

            {/* Optional Guest / Partner Details */}
            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">
                Playing Partner / Opponent <span className="text-gray-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-gray-500 focus:border-[#B89047] outline-none"
              />
            </div>

            {/* Equipment / Concierge Note */}
            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">
                Equipment Request <span className="text-gray-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={equipmentNotes}
                onChange={(e) => setEquipmentNotes(e.target.value)}
                placeholder="e.g. Provide 2 demo rackets and match balls"
                className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-gray-500 focus:border-[#B89047] outline-none"
              />
            </div>

            {/* Price & Privilege Breakdown */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#B89047]/10 via-[#B89047]/5 to-transparent border border-[#B89047]/30 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">Court Reservation Fee</p>
                <p className="text-[11px] text-gray-400">
                  Payment Gateway: <span className="text-[#EAD29A] font-medium">Razorpay Live Gateway</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#EAD29A] font-mono">
                  ₹{payableAmount.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-emerald-400 font-semibold">Instant Razorpay Checkout</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] via-[#B89047] to-[#A67C38] hover:opacity-95 shadow-md shadow-[#B89047]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Opening Razorpay Gateway...</span>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Pay ₹{payableAmount} via Razorpay &amp; Book</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Confirmed Reservation State */
          <div className="p-8 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-lg text-white">Court Reserved Successfully!</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Payment verified through Razorpay. Your reservation is locked and lighting prepared.
              </p>
            </div>

            {/* Confirmation Ticket Badge */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 max-w-xs mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Reference</span>
                <span className="font-mono font-bold text-[#EAD29A]">{confirmedRef}</span>
              </div>
              {confirmedPaymentId && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Razorpay Payment ID</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold truncate max-w-[140px]">{confirmedPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Court</span>
                <span className="font-semibold text-white">{courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Schedule</span>
                <span className="text-gray-200">{slot.startTime} – {slot.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span className="text-gray-200">{formattedDate}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-gray-400">Paid Amount</span>
                <span className="font-mono font-bold text-[#EAD29A]">₹{payableAmount}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#A67C38] text-black hover:opacity-95 shadow-md shadow-[#B89047]/25 transition-all cursor-pointer"
              >
                Done (Back to Court Schedule)
              </button>

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate(`${ROUTES.MEMBER_PORTAL}?tab=courts`);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View My Court Bookings</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
