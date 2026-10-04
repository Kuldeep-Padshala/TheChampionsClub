import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Trophy,
  Users,
  Calendar,
  ShoppingBag,
  Coffee,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Globe,
  FileText
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

interface HackathonStoryTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerEmergencyRestring?: () => void;
  onTriggerTrialModal?: () => void;
}

export const HackathonStoryTourModal: React.FC<HackathonStoryTourModalProps> = ({
  isOpen,
  onClose,
  onTriggerEmergencyRestring,
  onTriggerTrialModal,
}) => {
  const navigate = useNavigate();
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  if (!isOpen) return null;

  const scenes = [
    {
      id: 'scene-1',
      number: 'Scene 1',
      title: 'A New Member Walks In',
      subtitle: 'From WhatsApp & Excel chaos to Instant QR Passes & Tier Entitlements',
      icon: Users,
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      story:
        'Someone signs up at the front desk. The club needs to know who they are, which plan they are on (Gold, Silver or Junior), and what that plan entitles them to, from court rates to discounts at the shop and the bar. Their membership will run out one day, and nobody should have to remember when. Whenever they turn up, any staff should recognise them quickly and see their history.',
      solutionHighlights: [
        'Instant Digital Member Pass with animated QR Token & Member Code',
        'Automatic plan benefit calculation (Court pricing, 20% shop discount, 15% cafe discount)',
        'Membership expiry countdown warning with 1-click renewal',
        'Front Desk instant QR / Camera / Phone search with check-in history & dues overview',
      ],
      actionLabel: 'Launch Front Desk Station',
      actionPath: ROUTES.RECEPTIONIST,
    },
    {
      id: 'scene-2',
      number: 'Scene 2',
      title: 'Booking a Court on a Busy Evening',
      subtitle: '6 PM Rush: Multi-Client Real-Time Sync & Double-Booking Prevention',
      icon: Calendar,
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      story:
        'It is 6 pm. Members are messaging the front desk, a walk-in is standing at the counter, and someone is on the phone asking what is free. Sessions last an hour, a new slot opens every half hour, and each member can play at most twice a day. Members pay less than walk-ins or nothing. Two people must never end up on the same court at the same time.',
      solutionHighlights: [
        'Live WebSocket synchronization: when Court 2 is booked, it instantly locks across all connected screens',
        'Atomic database reservation concurrency prevents overlapping double-bookings',
        'Enforces plan rates (Gold = Free, Silver = ₹350, Walk-in = ₹600-₹800)',
        'Support for Exclusive singles/doubles bookings & Friday night Social Play capacity',
      ],
      actionLabel: 'Open Live Court Matrix',
      actionPath: ROUTES.COURTS,
    },
    {
      id: 'scene-3',
      number: 'Scene 3',
      title: 'Gearing Up Before a Match',
      subtitle: '10-Min Snapped String Emergency & Unified Shelf Inventory',
      icon: ShoppingBag,
      badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      story:
        'A member’s racket string snaps ten minutes before play. Another wants new shoes and would rather order them from home and collect them at the club, or have them delivered. The club sells rackets, balls, shoes and accessories, and should always know what is in stock. What a member buys at the counter and what they order from their sofa come from the same shelf.',
      solutionHighlights: [
        '⚡ 10-Minute Emergency Electronic Restringing Dispatch with Court Loaner Delivery',
        'Unified shelf inventory: online click-and-collect orders immediately decrement in-store stock',
        'Member checkout with live Razorpay gateway & VIP locker fulfillment',
        'Pro Shop Staff station with barcode/SKU scanning and return management',
      ],
      actionLabel: 'Test Emergency String Dispatch',
      actionType: 'EMERGENCY_RESTRING',
    },
    {
      id: 'scene-4',
      number: 'Scene 4',
      title: 'After the Match, at the Bar',
      subtitle: '20-Person Rush: KDS Station, Running Bar Tabs & 1-Click Z-Report',
      icon: Coffee,
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      story:
        'Twenty people arrive at once. Orders are scribbled on paper, tabs get lost, and the kitchen keeps asking who ordered what. Members expect their discount without having to ask, and some would rather run a tab and settle up before they leave. Guests pay by cash, card or UPI. Tables need to be tracked, and at closing time the owner wants to know what the bar actually earned.',
      solutionHighlights: [
        'Live Kitchen Display System (KDS) routing orders to bar & kitchen prep stations',
        'Running Member Bar Tabs allowing open balances settled before leaving',
        'Automatic 15% tier discount applied instantly without customer having to ask',
        'Interactive Dining Tables grid (indoor, terrace, lounge) and End-of-Day register closing',
      ],
      actionLabel: 'Open Bar & Kitchen Station',
      actionPath: ROUTES.BAR,
    },
    {
      id: 'scene-5',
      number: 'Scene 5',
      title: 'A Stranger Finds the Club Online',
      subtitle: 'Modern Digital Presence, Free Trial Booking & Lead-to-Quote Pipeline',
      icon: Globe,
      badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
      story:
        'Someone searches for a place to play near them. Today the club has no website, so they never find it. If they could see the club, its plans and prices, what is free this week, and what the shop sells, they might book a trial session on the spot. When a visitor reaches out, that enquiry should not vanish. Someone should hear about it, follow up, send a quote and welcome a new member.',
      solutionHighlights: [
        'Haute-horlogerie editorial web portal showcasing courts, membership tiers, and pro shop',
        'Complimentary Trial Session booking on the spot with instant confirmation',
        'Front Desk Enquiries CRM with real-time WebSocket alerts and Lead pipeline',
        'Generate customized quotes and 1-click convert prospective leads into active members',
      ],
      actionLabel: 'Book Complimentary Trial',
      actionType: 'BOOK_TRIAL',
    },
    {
      id: 'scene-6',
      number: 'Scene 6',
      title: 'The Owner, at the End of the Month',
      subtitle: 'Unified Financial Control: Courts, Shop & Bar P&L, Payroll & GST',
      icon: DollarSign,
      badgeColor: 'text-gold-primary border-[#B89047]/30 bg-[#B89047]/10',
      story:
        'The owner sits down and asks: how much did we earn, from where, and what do we owe? Money arrives from courts, the shop and the bar, by card, cash and online, and today none of it is in one place. There are memberships and business clients to invoice, employees to pay, leave to approve, and taxes to report. The owner wants to see how the club is doing today, this week and this month.',
      solutionHighlights: [
        'Centralized Executive Overview combining courts, pro shop, and bar revenues',
        'Payment channel visibility: Cash in till, POS Card terminals, and Razorpay Online gateway',
        'Membership recurring billing & Corporate business client invoicing',
        'Full operational payroll runs, employee shift management, and GST tax reporting',
      ],
      actionLabel: 'Open Owner Executive Suite',
      actionPath: ROUTES.OWNER,
    },
  ];

  const current = scenes[activeSceneIndex];
  const Icon = current.icon;

  const handleAction = () => {
    onClose();
    if (current.actionType === 'EMERGENCY_RESTRING' && onTriggerEmergencyRestring) {
      onTriggerEmergencyRestring();
    } else if (current.actionType === 'BOOK_TRIAL' && onTriggerTrialModal) {
      onTriggerTrialModal();
    } else if (current.actionPath) {
      navigate(current.actionPath);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0D0D11] border border-[#B89047]/45 rounded-[32px] p-6 sm:p-10 text-white shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B89047]/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89047]/15 border border-[#B89047]/30 text-[#EAD29A] text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy size={13} className="text-[#EAD29A]" />
            <span>Hackathon Problem Statement Masterclass</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            A Week at The Champions Club
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Browse through each of the 6 real-world operational scenes described in the hackathon challenge and see how our unified digital platform solves them.
          </p>
        </div>

        {/* Scene Tabs Carousel Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide border-b border-white/10">
          {scenes.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSceneIndex(idx)}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2',
                activeSceneIndex === idx
                  ? 'bg-gradient-to-r from-[#B89047] to-[#EAD29A] text-black font-bold shadow-md shadow-[#B89047]/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              )}
            >
              <span>{s.number}</span>
            </button>
          ))}
        </div>

        {/* Scene Content Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Problem Narrative */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#EAD29A]">
                <Icon size={20} />
              </div>
              <div>
                <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', current.badgeColor)}>
                  {current.number}
                </span>
                <h3 className="text-xl font-display font-bold text-white mt-1">
                  {current.title}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block mb-1">
                The Operational Headache (From PDF)
              </span>
              <p className="text-xs text-gray-300 leading-relaxed italic">
                "{current.story}"
              </p>
            </div>
          </div>

          {/* Right Column: Platform Solution & Live Jump */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121216] to-[#1A1A22] border border-[#B89047]/30 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EAD29A] block">
                How The Champions Club Solves It
              </span>

              <ul className="space-y-2">
                {current.solutionHighlights.map((highlight, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2 text-xs text-gray-200">
                    <CheckCircle2 size={14} className="text-[#EAD29A] flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Interactive Live Demonstration</span>
                <button
                  type="button"
                  onClick={handleAction}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#997332] text-black font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{current.actionLabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Carousel navigation controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={activeSceneIndex === 0}
                onClick={() => setActiveSceneIndex(prev => prev - 1)}
                className="text-xs text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                ← Previous Scene
              </button>
              <span className="text-xs text-[#EAD29A] font-mono">
                {activeSceneIndex + 1} of {scenes.length}
              </span>
              <button
                type="button"
                disabled={activeSceneIndex === scenes.length - 1}
                onClick={() => setActiveSceneIndex(prev => prev + 1)}
                className="text-xs text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                Next Scene →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
