import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import {
  memberService,
  MemberProfile,
  ActiveMembership,
  MembershipPlan,
  MemberCourtBooking,
  MemberInvoice,
  MemberShopProduct,
  MemberShopOrder,
} from '../services/memberService';
import { paymentService } from '../services/paymentService';
import {
  Trophy,
  CreditCard,
  Calendar,
  ShoppingBag,
  QrCode,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Phone,
  MapPin,
  ShieldCheck,
  User,
  ArrowRight,
  X,
  Plus,
  Receipt,
  Sparkles,
  ChevronRight,
  Smartphone,
  Maximize2,
  Settings,
  Crown,
  Zap,
  Check,
  ArrowUpRight,
  RefreshCw,
  HelpCircle,
  Minus,
  CheckCircle2,
  ZoomIn,
} from 'lucide-react';
import { cn } from '../utils/cn';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { websocketService } from '../services/websocketService';

export const MemberPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = ['pass', 'courts', 'billing', 'shop', 'settings'] as const;
  type TabType = typeof validTabs[number];

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(
    initialTab && validTabs.includes(initialTab as TabType) ? (initialTab as TabType) : 'pass'
  );

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType);
    }
    if (searchParams.get('qr') === 'true') {
      setIsQrModalOpen(true);
    }
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(true);

  // Member Dashboard Data
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [membership, setMembership] = useState<ActiveMembership | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [totalDues, setTotalDues] = useState(0);
  const [invoices, setInvoices] = useState<MemberInvoice[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Array<{ id: number; method: string; checked_in_at: string }>>([]);

  // QR Modal Zoom State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Plan Activation Loading State
  const [isSubscribingPlan, setIsSubscribingPlan] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Court Bookings Data
  const [myBookings, setMyBookings] = useState<MemberCourtBooking[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableCourts, setAvailableCourts] = useState<any[]>([]);
  const [courtReservations, setCourtReservations] = useState<any[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Profile Edit Data
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Billing / Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState<MemberInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'online'>('upi');
  const [isPaying, setIsPaying] = useState(false);

  // Shop Data & Checkout Modal
  const [products, setProducts] = useState<MemberShopProduct[]>([]);
  const [myOrders, setMyOrders] = useState<MemberShopOrder[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState<number | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<MemberShopProduct | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);
  const [checkoutFulfillment, setCheckoutFulfillment] = useState<'Counter Pickup' | 'Locker Delivery'>('Counter Pickup');
  const [checkoutAddress, setCheckoutAddress] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<MemberShopProduct | null>(null);

  // ─── Fetch Member Data ─────────────────────────────────────
  const loadMemberData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, plansData] = await Promise.all([
        memberService.getProfile(),
        memberService.getMembershipPlans().catch(() => []),
      ]);
      setProfile(data.profile);
      setMembership(data.active_membership);
      setPlans(plansData || []);
      setTotalDues(data.total_dues || 0);
      setInvoices(data.unpaid_invoices || []);
      setRecentCheckins(data.recent_checkins || []);

      if (data.profile) {
        setEditPhone(data.profile.phone || '');
        setEditAddress(data.profile.address_line1 || '');
        setEditCity(data.profile.city || '');
        setEditEmergencyName(data.profile.emergency_contact_name || '');
        setEditEmergencyPhone(data.profile.emergency_contact_phone || '');
      }

      // Load bookings & invoices
      const [bookingsData, invData] = await Promise.all([
        memberService.getMyBookings().catch(() => []),
        memberService.getMyInvoices().catch(() => []),
      ]);
      setMyBookings(bookingsData);
      setInvoices(invData);
    } catch (err: any) {
      console.error('[MemberPortal] Error loading data:', err);
      toast.error('Could not load member profile details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  // Reload court schedule and my bookings
  const reloadCourtSchedule = useCallback(async () => {
    try {
      const [avail, bookings] = await Promise.all([
        memberService.getCourtAvailability(selectedDate, selectedSportId),
        memberService.getMyBookings(),
      ]);
      setAvailableCourts(avail.courts || []);
      setCourtReservations(avail.reservations || []);
      setMyBookings(bookings || []);
    } catch (err) {
      console.error('[reloadCourtSchedule] Error:', err);
    }
  }, [selectedDate, selectedSportId]);

  // Load court availability when tab is 'courts' or date/sport changes
  useEffect(() => {
    if (activeTab === 'courts') {
      reloadCourtSchedule();
    }
  }, [activeTab, reloadCourtSchedule]);

  // Real-time synchronization via WebSocket & local events
  useEffect(() => {
    const unsubCourt = websocketService.on('court_slot_change', () => {
      reloadCourtSchedule();
    });
    const unsubNotif = websocketService.on('notification', () => {
      reloadCourtSchedule();
    });

    const handleLocalSuccess = () => {
      reloadCourtSchedule();
    };
    window.addEventListener('court_booking_success', handleLocalSuccess);

    return () => {
      unsubCourt();
      unsubNotif();
      window.removeEventListener('court_booking_success', handleLocalSuccess);
    };
  }, [reloadCourtSchedule]);

  // Load shop products when tab is 'shop'
  useEffect(() => {
    if (activeTab === 'shop') {
      Promise.all([memberService.getShopProducts(), memberService.getMyOrders()]).then(([prods, orders]) => {
        setProducts(prods || []);
        setMyOrders(orders || []);
      }).catch(console.error);
    }
  }, [activeTab]);

  // ─── Membership Calculations ───────────────────────────────
  const hasActiveMembership = !!membership && membership.status === 'active';
  const memberPlan = hasActiveMembership ? (membership.plan_name || 'Active Member') : 'No Active Pass';
  const isGoldMember = hasActiveMembership && (
    (membership.plan_code || '').toLowerCase() === 'gold' ||
    (membership.plan_name || '').toLowerCase().includes('gold')
  );

  let daysUntilExpiry: number | null = null;
  if (membership?.end_date) {
    const expDate = new Date(membership.end_date).getTime();
    const now = Date.now();
    daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  }

  const isExpiringSoon = hasActiveMembership && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 5;
  const isExpired = !!membership && daysUntilExpiry !== null && daysUntilExpiry < 0;

  // ─── Subscribe / Activate Plan with Razorpay ───────────────
  const handleSubscribePlan = async (planId: number) => {
    setIsSubscribingPlan(planId);
    const targetPlan = plans.find((p) => p.id === planId);
    const planFee = targetPlan ? Number(targetPlan.fee) : 3999;
    const planName = targetPlan?.name || 'Sanctuary';

    try {
      if (planFee > 0) {
        await paymentService.openCheckout({
          amount: planFee,
          productName: `${planName} Sanctuary Membership Pass`,
          customerName: user?.name || profile?.full_name || 'Club Member',
          customerEmail: user?.email || '',
          customerPhone: profile?.phone || '',
          onSuccess: async ({ payment_id }) => {
            try {
              const res = await memberService.subscribeMembershipPlan({
                plan_id: planId,
                razorpay_payment_id: payment_id,
              });
              toast.success(`Payment of ₹${planFee.toLocaleString('en-IN')} verified (Txn: ${payment_id})! ${res.message || 'Membership pass activated!'}`);
              await loadMemberData();
            } catch (err: any) {
              toast.error(err?.response?.data?.message || 'Payment verified, but failed to activate plan. Please contact concierge.');
            } finally {
              setIsSubscribingPlan(null);
            }
          },
          onError: (err) => {
            setIsSubscribingPlan(null);
            const msg = err?.message || 'Membership payment was cancelled or failed.';
            toast.error(msg);
          },
        });
      } else {
        const res = await memberService.subscribeMembershipPlan({ plan_id: planId });
        toast.success(res.message || 'Membership plan activated successfully!');
        await loadMemberData();
        setIsSubscribingPlan(null);
      }
    } catch (err: any) {
      setIsSubscribingPlan(null);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to initialize payment');
    }
  };

  // ─── Test Simulation Helper ─────────────────────────────────
  const handleSimulateStatus = async (status: 'gold' | 'expiring_soon' | 'inactive') => {
    setIsSimulating(true);
    try {
      const res = await memberService.simulateStatus(status);
      toast.success(res.message);
      await loadMemberData();
    } catch (err: any) {
      toast.error('Simulation error: ' + (err?.message || ''));
    } finally {
      setIsSimulating(false);
    }
  };

  // ─── Profile Update ─────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await memberService.updateProfile({
        phone: editPhone,
        address_line1: editAddress,
        city: editCity,
        emergency_contact_name: editEmergencyName,
        emergency_contact_phone: editEmergencyPhone,
      });
      setProfile(res.profile);
      toast.success('Your sanctuary profile & emergency records have been updated!');
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Court Booking with Razorpay ────────────────────────────
  const getCourtBookingFee = (court: any) => {
    if (!court) return 500;
    if (isGoldMember) return 150; // nominal concierge court reservation fee
    if (membership?.plan_code === 'silver') return 350;
    if (membership?.plan_code === 'junior') return 250;
    return Number(court.base_hourly_rate || court.hourly_rate || 500);
  };

  const handleOpenBooking = (court: any, hour: number) => {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const start = `${selectedDate} ${pad(hour)}:00:00`;
    const end = `${selectedDate} ${pad(hour + 1)}:00:00`;
    setSelectedCourt(court);
    setSelectedTimeSlot({ start, end });
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedCourt || !selectedTimeSlot) return;
    setIsBookingSubmitting(true);
    const courtFee = getCourtBookingFee(selectedCourt);

    const recordBooking = async (paymentId?: string) => {
      try {
        const res = await memberService.createBooking({
          court_id: selectedCourt.id,
          starts_at: selectedTimeSlot.start,
          ends_at: selectedTimeSlot.end,
          reservation_type: 'exclusive',
          razorpay_payment_id: paymentId,
          amount_charged: courtFee,
          notes: paymentId ? `Razorpay Txn: ${paymentId}` : 'Complimentary Membership Slot',
        });

        toast.success(res.message || 'Court booked successfully!');
        setIsBookingModalOpen(false);

        // Optimistically update visual grid
        setCourtReservations((prev) => [
          ...prev,
          {
            reservation_id: res.reservationId || Date.now(),
            court_id: selectedCourt.id,
            starts_at: selectedTimeSlot.start,
            ends_at: selectedTimeSlot.end,
            reservation_type: 'exclusive',
            reservation_status: 'active',
          },
        ]);

        await reloadCourtSchedule();
        window.dispatchEvent(new CustomEvent('court_booking_success', {
          detail: { courtId: selectedCourt.id, startsAt: selectedTimeSlot.start, endsAt: selectedTimeSlot.end }
        }));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to record court reservation';
        toast.error(msg);
      } finally {
        setIsBookingSubmitting(false);
      }
    };

    try {
      if (courtFee > 0) {
        await paymentService.openCheckout({
          amount: courtFee,
          productName: `Court Reservation: ${selectedCourt.name} (${selectedDate})`,
          customerName: user?.name || profile?.full_name || 'Club Member',
          customerEmail: user?.email || '',
          customerPhone: profile?.phone || '',
          onSuccess: async ({ payment_id }) => {
            await recordBooking(payment_id);
          },
          onError: (err) => {
            setIsBookingSubmitting(false);
            const msg = err?.message || 'Court booking payment cancelled.';
            toast.error(msg);
          },
        });
      } else {
        await recordBooking();
      }
    } catch (err: any) {
      setIsBookingSubmitting(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to initialize court payment';
      toast.error(msg);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this court reservation? Cancellations must be made at least 2 hours in advance.')) return;
    try {
      const res = await memberService.cancelBooking(bookingId);
      toast.success(res.message || 'Booking cancelled');
      setMyBookings((prev) => prev.filter((b) => b.id !== bookingId));
      await reloadCourtSchedule();
      window.dispatchEvent(new CustomEvent('court_booking_success', {
        detail: { bookingId, action: 'cancel' }
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not cancel booking');
    }
  };

  // ─── Online Payment via Razorpay ─────────────────────────────
  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
      await paymentService.openCheckout({
        amount: Number(selectedInvoice.balance_due),
        productName: `Settlement for Invoice #${selectedInvoice.invoice_no}`,
        invoice_id: selectedInvoice.id,
        customerName: profile?.full_name || user?.name || 'Club Member',
        customerEmail: profile?.email || user?.email || '',
        customerPhone: profile?.phone || '',
        onSuccess: async (payResp) => {
          toast.success(`Payment verified via Razorpay! ID: ${payResp.payment_id}`, { duration: 5000 });
          setSelectedInvoice(null);
          setIsPaying(false);
          const [data, invData] = await Promise.all([
            memberService.getProfile(),
            memberService.getMyInvoices(),
          ]);
          setTotalDues(data.total_dues);
          setInvoices(invData);
        },
        onError: (err) => {
          setIsPaying(false);
          if (err?.message !== 'Payment modal closed by user') {
            toast.error(err?.message || 'Razorpay payment could not be completed');
          }
        },
      });
    } catch (err: any) {
      toast.error(err?.message || 'Payment processing failed. Please try again.');
      setIsPaying(false);
    }
  };

  // ─── Pro Shop Checkout Modal Handlers ─────────────────────────
  const handleOpenCheckout = (product: MemberShopProduct) => {
    setCheckoutProduct(product);
    setCheckoutQuantity(1);
    setCheckoutAddress(editAddress || profile?.address_line1 || 'Club Sanctuary Residence, Koramangala');
    setCheckoutNotes('');
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutProduct) return;

    setIsSubmittingCheckout(true);
    try {
      const isGold = (membership?.plan_code || '').toLowerCase().includes('gold') || (membership?.plan_name || '').toLowerCase().includes('gold');
      const discountMult = isGold ? 0.85 : 0.90;
      const unitPrice = Math.round(Number(checkoutProduct.base_price) * discountMult);
      const subtotal = unitPrice * checkoutQuantity;
      const gst = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + gst;

      const res = await memberService.placeOrder({
        items: [
          {
            product_name: checkoutProduct.name,
            quantity: checkoutQuantity,
            unit_price: unitPrice,
          },
        ],
        notes: `[Fulfillment: ${checkoutFulfillment}] Address: ${checkoutAddress}. Notes: ${checkoutNotes || 'None'}`,
      });

      toast.success(`Order placed successfully! Reference: #${res.order_no}`, { duration: 5000 });
      setCheckoutProduct(null);
      const orders = await memberService.getMyOrders();
      setMyOrders(orders);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to place shop order');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center pb-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-[#B89047]/30 border-t-[#B89047] rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-widest text-[#B89047] font-semibold">
              Opening Private Sanctuary Portal...
            </span>
          </div>
        </div>
      </PageLayout>
    );
  }

  const memberName = profile?.full_name || user?.name || 'Club Member';
  const memberCode = profile?.member_code || 'CC-2026-VIP';
  const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

  return (
    <PageLayout>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* ─── Hero Sanctuary Header ───────────────────────────────── */}
        <div className="relative rounded-3xl p-6 sm:p-10 mb-6 overflow-hidden bg-gradient-to-br from-[#121216] via-[#1C1C24] to-[#0E0E12] border border-[#B89047]/30 shadow-2xl">
          {/* Subtle Golden Glow Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B89047]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                  hasActiveMembership
                    ? 'bg-[#B89047]/20 text-[#EAD29A] border-[#B89047]/40'
                    : 'bg-white/10 text-gray-300 border-white/20'
                }`}>
                  <Sparkles size={13} className={hasActiveMembership ? 'text-[#EAD29A]' : 'text-gray-400'} />
                  {hasActiveMembership ? `${memberPlan} Tier` : 'Pass Inactive'}
                </span>
                <span className="text-xs text-gray-400 font-mono tracking-wider">
                  Member ID: <strong className="text-white">{memberCode}</strong>
                </span>
                {hasActiveMembership && membership?.end_date && (
                  <span className="text-xs text-gray-400">
                    • Valid until: <strong className="text-gray-200">{new Date(membership.end_date).toLocaleDateString()}</strong>
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Sanctuary Portal • {memberName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                Executive member lounge for court reservations, contactless QR turnstile clearance, pro shop orders, and billing.
              </p>
            </div>

            {/* Quick Status Cards in Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[110px]">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Active Tier</div>
                <div className="text-sm font-bold text-[#EAD29A] mt-0.5 truncate max-w-[130px]">{memberPlan}</div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[110px]">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Total Dues</div>
                <div className={`text-sm font-bold mt-0.5 ${totalDues > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{totalDues.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[110px]">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Bookings</div>
                <div className="text-sm font-bold text-white mt-0.5">{myBookings.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── EXPIRY / STATUS WARNING BANNER (1 to 5 days) ─────────── */}
        {isExpiringSoon && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#B89047]/20 to-amber-600/10 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Membership Expiration Warning</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-black">
                    {daysUntilExpiry === 0 ? 'Expires Today' : `${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'Day' : 'Days'} Remaining`}
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                  Your <strong>{membership?.plan_name}</strong> pass expires on <strong>{new Date(membership!.end_date).toLocaleDateString()}</strong>. Renew your plan now to prevent interruption of contactless gate clearance and priority booking access.
                </p>
              </div>
            </div>
            <button
              onClick={() => switchTab('pass')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-110 shadow-md cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              Renew Membership
            </button>
          </div>
        )}

        {isExpired && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-red-500/15 border-2 border-red-500/50 shadow-lg shadow-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 text-red-400">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Sanctuary Membership Expired</span>
                </div>
                <p className="text-xs text-red-200/90 mt-0.5">
                  Your membership expired on {new Date(membership!.end_date).toLocaleDateString()}. Please select an active plan below to restore your court reservations and gate privileges.
                </p>
              </div>
            </div>
            <button
              onClick={() => switchTab('pass')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-red-400 hover:bg-red-300 shadow-md cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              Select Active Plan
            </button>
          </div>
        )}

        {/* ─── EXECUTIVE DASHBOARD NAVIGATION CARDS GRID ─────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
          {[
            {
              id: 'pass',
              title: 'Digital VIP Pass',
              desc: 'Gate token & credentials',
              icon: QrCode,
              badge: hasActiveMembership ? `${membership.plan_name} Pass` : 'Pass Inactive',
              badgeColor: hasActiveMembership ? 'text-[#EAD29A] bg-[#B89047]/20 border-[#B89047]/30' : 'text-gray-400 bg-white/5 border-white/10',
            },
            {
              id: 'courts',
              title: 'Court Bookings',
              desc: 'Reserve indoor & outdoor slots',
              icon: Calendar,
              badge: `${myBookings.length} Active`,
              badgeColor: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
            },
            {
              id: 'billing',
              title: 'Dues & Invoices',
              desc: 'Statements & online checkout',
              badge: totalDues > 0 ? `₹${totalDues} Due` : 'Settled',
              icon: CreditCard,
              badgeColor: totalDues > 0 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
            },
            {
              id: 'shop',
              title: 'Club Pro Shop',
              desc: 'Exclusive equipment & apparel',
              icon: ShoppingBag,
              badge: `${products.length || 8} Items`,
              badgeColor: 'text-[#EAD29A] bg-[#B89047]/20 border-[#B89047]/30',
            },
            {
              id: 'settings',
              title: 'Profile Settings',
              desc: 'Contact records & emergency',
              icon: ShieldCheck,
              badge: 'Security',
              badgeColor: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id as any)}
                className={`group relative p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden border ${
                  isActive
                    ? 'bg-gradient-to-b from-[#221F1A] via-[#1A1815] to-[#121214] border-[#B89047] shadow-[0_12px_28px_-6px_rgba(184,144,71,0.35)] scale-[1.02]'
                    : 'bg-white dark:bg-[#121216] border-black/10 dark:border-white/10 hover:border-[#B89047]/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] shadow-sm'
                }`}
              >
                {/* Active Gold Indicator Bar on Top */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B89047] via-[#EAD29A] to-[#8C6826]" />
                )}

                <div className="flex items-start justify-between w-full mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#B89047] text-black shadow-md shadow-[#B89047]/30'
                      : 'bg-black/5 dark:bg-white/5 text-[#B89047] group-hover:bg-[#B89047]/10'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                </div>

                <div>
                  <h3 className={`font-display text-sm font-bold transition-colors ${
                    isActive ? 'text-[#EAD29A]' : 'text-[#1D1D1F] dark:text-white group-hover:text-[#B89047]'
                  }`}>
                    {tab.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: DIGITAL VIP PASS ──────────────────────────────── */}
        {activeTab === 'pass' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Luxury Digital Membership Card (CLICK TO ZOOM QR) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div
                onClick={() => setIsQrModalOpen(true)}
                className="relative rounded-3xl p-7 text-white overflow-hidden bg-gradient-to-br from-[#1B1917] via-[#2A241C] to-[#121214] border border-[#B89047]/40 shadow-2xl group hover:border-[#B89047] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer"
                title="Click card to zoom high-resolution QR pass"
              >
                {/* Gold Card Accents */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#EAD29A]/20 via-[#B89047]/10 to-transparent rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#8C6826] p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#141416] flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#EAD29A]" />
                      </div>
                    </div>
                    <div>
                      <div className="font-display font-bold text-base tracking-wider uppercase text-[#EAD29A]">The Champions Club</div>
                      <div className="text-[10px] tracking-widest uppercase text-gray-400">Exclusive Sanctuary Member</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md ${
                    hasActiveMembership ? 'bg-[#B89047] text-black' : 'bg-gray-700 text-gray-200'
                  }`}>
                    {memberPlan}
                  </span>
                </div>

                {/* Simulated Chip & QR Scan */}
                <div className="flex items-start justify-between my-4 px-2">
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#FFF3B0] border border-[#7D5A1E]/50 shadow-inner flex items-center justify-center opacity-85 mt-2">
                    <div className="w-8 h-5 border border-[#8C6826]/40 rounded-sm" />
                  </div>
                  {/* View QR Code Action */}
                  <div className="flex flex-col items-end gap-1.5 text-[#EAD29A]/80 pt-2">
                    <div className="w-12 h-12 rounded-full bg-[#121214] border border-[#B89047]/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#B89047]/20 transition-all shadow-md">
                      <QrCode size={20} className="text-[#EAD29A]" />
                    </div>
                    <span className="text-[9px] uppercase font-mono tracking-widest flex items-center gap-1">
                      <Maximize2 size={9} /> VIEW QR PASS
                    </span>
                  </div>
                </div>

                {/* Member Identity Details */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">Cardholder Name</div>
                    <div className="font-display text-xl font-bold text-white tracking-wide">{memberName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-400">Member Pass Code</div>
                      <div className="font-mono text-sm font-semibold text-[#EAD29A]">{memberCode}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-400">Valid Through</div>
                      <div className="font-mono text-sm text-gray-200">
                        {membership?.end_date ? new Date(membership.end_date).toLocaleDateString() : (hasActiveMembership ? 'Active' : 'Unactivated')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clickable Card Footer Hint */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-[#EAD29A] font-semibold bg-white/5 py-2.5 rounded-xl group-hover:bg-[#B89047]/20 transition-all">
                  <Maximize2 size={13} />
                  <span>Click card to zoom high-resolution QR pass</span>
                </div>
              </div>

              {/* Quick Sanctuary Action Shortcuts */}
              <div className="rounded-3xl p-6 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 font-display">
                  Sanctuary Hub Quick Actions
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => switchTab('courts')}
                    className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#B89047] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#B89047]/10 flex items-center justify-between text-xs font-semibold text-[#1D1D1F] dark:text-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar size={16} className="text-[#B89047]" />
                      <span>Reserve Court Slot (Badminton, Tennis, Squash)</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-[#B89047] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => switchTab('billing')}
                    className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#B89047] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#B89047]/10 flex items-center justify-between text-xs font-semibold text-[#1D1D1F] dark:text-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={16} className="text-[#B89047]" />
                      <span>Review Dues & Pay Online</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-[#B89047] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => switchTab('settings')}
                    className="p-3.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#B89047] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#B89047]/10 flex items-center justify-between text-xs font-semibold text-[#1D1D1F] dark:text-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={16} className="text-[#B89047]" />
                      <span>Update Sanctuary Profile & Emergency Records</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-[#B89047] group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Membership Content */}
            <div className="lg:col-span-7 space-y-6">

              {/* ────────────────────────────────────────────────────────
                  SCENARIO 1: MEMBER HAS NO ACTIVE PASS OR EXPIRED
                  Prominently show "Choose Your Membership Tier"
                  ──────────────────────────────────────────────────────── */}
              {(!hasActiveMembership || isExpired) && (
                <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                    <div>
                      <span className="text-[11px] font-bold text-[#B89047] uppercase tracking-wider flex items-center gap-1.5">
                        <Crown size={14} /> Pass Activation Required
                      </span>
                      <h3 className="font-display text-xl font-bold text-[#1D1D1F] dark:text-white mt-1">
                        Select Your Sanctuary Membership Plan
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Choose your membership tier to activate unlimited court access, Pro Shop member pricing, and 24/7 gate token clearance.
                      </p>
                    </div>
                  </div>

                  {/* Plan Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((p) => {
                      const isGold = p.code === 'gold' || p.name.toLowerCase().includes('gold');
                      return (
                        <div
                          key={p.id}
                          className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all border ${
                            isGold
                              ? 'bg-gradient-to-b from-[#1F1B14] to-[#121214] border-[#B89047] text-white shadow-xl shadow-[#B89047]/10'
                              : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white'
                          }`}
                        >
                          {isGold && (
                            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-gradient-to-r from-[#B89047] to-[#EAD29A] text-black shadow-md">
                              Recommended
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-display font-bold text-base">{p.name}</h4>
                              {isGold && <Crown size={16} className="text-[#EAD29A]" />}
                            </div>

                            <div className="mb-4">
                              <span className="font-mono text-2xl font-bold">
                                ₹{Number(p.fee).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">/ {p.duration_months} mos</span>
                            </div>

                            <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                              {p.description}
                            </p>

                            <ul className="space-y-2 text-[11px] text-gray-300 mb-6">
                              <li className="flex items-center gap-2">
                                <Check size={13} className="text-[#B89047]" />
                                <span>{isGold ? 'Unlimited 100% Free Court Access' : 'Discounted Court Booking Rates'}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check size={13} className="text-[#B89047]" />
                                <span>{Number(p.shop_discount_pct)}% Pro Shop Member Discount</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check size={13} className="text-[#B89047]" />
                                <span>{Number(p.bar_discount_pct)}% Cafe Lounge Hospitality</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check size={13} className="text-[#B89047]" />
                                <span>Contactless Turnstile QR Access</span>
                              </li>
                            </ul>
                          </div>

                          <button
                            onClick={() => handleSubscribePlan(p.id)}
                            disabled={isSubscribingPlan === p.id}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                              isGold
                                ? 'bg-gradient-to-r from-[#B89047] to-[#EAD29A] text-black hover:opacity-95 shadow-md shadow-[#B89047]/30'
                                : 'bg-black/10 dark:bg-white/10 hover:bg-[#B89047] hover:text-black text-inherit'
                            }`}
                          >
                            {isSubscribingPlan === p.id ? 'Activating...' : `Activate ${p.name} Pass`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  SCENARIO 2: MEMBER HAS ACTIVE GOLD PASS
                  Hide redundant membership plans!
                  Show executive privileges, perks, and check-in history.
                  ──────────────────────────────────────────────────────── */}
              {hasActiveMembership && isGoldMember && !isExpiringSoon && (
                <>
                  <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-[#B89047] uppercase tracking-wider">
                            Pinnacle VIP Status Active
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-bold text-[#1D1D1F] dark:text-white mt-1">
                          Gold Sanctuary Tier Privileges
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          You are currently enjoying the highest privilege tier at The Champions Club.
                        </p>
                      </div>
                      <Crown className="w-8 h-8 text-[#B89047]" />
                    </div>

                    {/* Privilege Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                      <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Zero Court Booking Fees</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Unlimited complimentary access to badminton, tennis, and squash courts.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#B89047]/10 border border-[#B89047]/20 text-[#B89047] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ShoppingBag size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">15% Pro Shop Discount</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Applied automatically across all competition racquets, apparel, and shuttlecocks.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#B89047]/10 border border-[#B89047]/20 text-[#B89047] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">10% Lounge Hospitality</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Priority seating and member rates at the Sanctuary Cafe & Espresso Bar.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <QrCode size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Contactless 24/7 Gate Access</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Present your VIP QR pass at reception turnstiles for 1-second optical clearance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gate Check-In History */}
                  <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                        Recent Sanctuary Gate Check-Ins
                      </h4>
                      <span className="text-[10px] text-gray-400 font-mono">Live Turnstile Records</span>
                    </div>

                    {recentCheckins.length === 0 ? (
                      <div className="text-xs text-gray-400 italic py-4 text-center">
                        No recent gate check-ins recorded yet. Tap your digital QR pass at reception on your next visit!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentCheckins.map((ci) => (
                          <div key={ci.id} className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 dark:bg-white/[0.02] text-xs">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle size={15} className="text-emerald-500" />
                              <span className="font-medium text-[#1D1D1F] dark:text-white">
                                Reception Verification ({ci.method})
                              </span>
                            </div>
                            <span className="text-gray-400 font-mono text-[11px]">
                              {new Date(ci.checked_in_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ────────────────────────────────────────────────────────
                  SCENARIO 3: MEMBER HAS LOWER TIER (SILVER / JUNIOR)
                  Offer upgrade to Gold!
                  ──────────────────────────────────────────────────────── */}
              {hasActiveMembership && !isGoldMember && !isExpiringSoon && (
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1F1B14] via-[#2A241C] to-[#141416] border border-[#B89047]/50 shadow-xl text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B89047] text-black">
                      Tier Upgrade Available
                    </span>
                    <Crown size={22} className="text-[#EAD29A]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Upgrade to Gold Sanctuary Tier
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 max-w-lg leading-relaxed">
                    Level up to Gold to unlock 100% complimentary zero-fee court bookings, 15% Pro Shop discounts, and 7-day advance booking priority.
                  </p>
                  <div className="mt-5 flex items-center gap-4">
                    <button
                      onClick={() => {
                        const goldPlan = plans.find((p) => p.code === 'gold' || p.name.toLowerCase().includes('gold'));
                        if (goldPlan) handleSubscribePlan(goldPlan.id);
                      }}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#EAD29A] hover:opacity-95 shadow-md cursor-pointer"
                    >
                      Upgrade to Gold Pass
                    </button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  SCENARIO 4: EXPIRING IN 1-5 DAYS
                  Show quick 1-click renewal!
                  ──────────────────────────────────────────────────────── */}
              {isExpiringSoon && (
                <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border-2 border-amber-500/50 shadow-sm">
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white mb-2">
                    Renew Your Sanctuary Membership
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Extend your membership validity for another full term to preserve your current member rates, VIP privileges, and gate clearance.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plans.map((p) => (
                      <div key={p.id} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{p.name} Pass</div>
                          <div className="font-mono text-base font-bold text-[#B89047] mt-1">₹{Number(p.fee).toLocaleString('en-IN')}</div>
                          <div className="text-[11px] text-gray-400 mt-1">{p.duration_months} Months Extension</div>
                        </div>
                        <button
                          onClick={() => handleSubscribePlan(p.id)}
                          disabled={isSubscribingPlan === p.id}
                          className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-[#B89047] text-black hover:opacity-95 cursor-pointer disabled:opacity-50"
                        >
                          {isSubscribingPlan === p.id ? 'Renewing...' : `Renew with ${p.name}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ─── TAB 2: COURT RESERVATIONS & CALENDAR ─────────────────── */}
        {activeTab === 'courts' && (
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Court Schedule & Online Slot Booking
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members enjoy priority booking privileges with exclusive member pricing. Daily limit: 2 bookings.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#1D1D1F] dark:text-white outline-none cursor-pointer"
                />
                <select
                  value={selectedSportId}
                  onChange={(e) => setSelectedSportId(e.target.value ? Number(e.target.value) : '')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#1D1D1F] dark:text-white outline-none cursor-pointer"
                >
                  <option value="">All Sports</option>
                  <option value="1">Badminton</option>
                  <option value="2">Tennis</option>
                  <option value="3">Squash</option>
                  <option value="4">Padel</option>
                </select>
              </div>
            </div>

            {/* Visual Timeline Grid */}
            <div className="rounded-3xl p-6 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-[11px] uppercase tracking-wider text-gray-400 font-display">
                    <th className="pb-3 pr-4">Court</th>
                    {OPERATING_HOURS.map((hr) => (
                      <th key={hr} className="pb-3 text-center px-1 font-mono text-[10px]">
                        {hr}:00
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {availableCourts.map((court) => (
                    <tr key={court.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.01]">
                      <td className="py-3 pr-4 font-semibold text-[#1D1D1F] dark:text-white whitespace-nowrap">
                        <div>{court.name}</div>
                        <span className="text-[10px] text-[#B89047] font-normal">{court.sport_name || court.surface}</span>
                      </td>
                      {OPERATING_HOURS.map((hr) => {
                        const pad = (n: number) => (n < 10 ? '0' + n : String(n));
                        const slotStart = `${selectedDate} ${pad(hr)}:00:00`;
                        const slotEnd = `${selectedDate} ${pad(hr + 1)}:00:00`;

                        const isOccupied = courtReservations.some((r) => {
                          if (String(r.court_id) !== String(court.id)) return false;
                          const rStart = String(r.starts_at || '').replace('T', ' ').split('.')[0];
                          const rEnd = String(r.ends_at || '').replace('T', ' ').split('.')[0];
                          if (rStart < slotEnd && rEnd > slotStart) return true;
                          const rStartMs = new Date(String(r.starts_at)).getTime();
                          const rEndMs = new Date(String(r.ends_at)).getTime();
                          const sStartMs = new Date(slotStart.replace(' ', 'T')).getTime();
                          const sEndMs = new Date(slotEnd.replace(' ', 'T')).getTime();
                          return (!isNaN(rStartMs) && !isNaN(rEndMs) && rStartMs < sEndMs && rEndMs > sStartMs);
                        });

                        return (
                          <td key={hr} className="py-3 px-1 text-center">
                            {isOccupied ? (
                              <div className="w-full h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center text-[10px] font-bold">
                                Reserved
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenBooking(court, hr)}
                                className="w-full h-8 rounded-lg bg-[#B89047]/10 hover:bg-[#B89047] text-[#B89047] hover:text-black border border-[#B89047]/30 text-[10px] font-bold transition-all duration-150 cursor-pointer flex items-center justify-center"
                              >
                                Book
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* My Active & Past Reservations */}
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
              <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white mb-4">
                My Court Reservations
              </h3>
              {myBookings.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  You have not booked any court slots yet. Click "Book" on any available time slot above.
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {myBookings.map((b) => {
                    const isUpcoming = new Date(b.starts_at) > new Date() && b.status !== 'cancelled';
                    return (
                      <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#B89047]/10 border border-[#B89047]/30 flex items-center justify-center text-[#B89047]">
                            <Trophy size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                              <span>{b.court_name}</span>
                              <span className="text-xs font-normal text-gray-400">({b.sport_name})</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                b.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                              <span className="font-mono">
                                {new Date(b.starts_at).toLocaleDateString()} • {new Date(b.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>•</span>
                              <span>Fee: ₹{Number(b.amount_charged).toFixed(0)}</span>
                              <span>•</span>
                              <span className="font-mono text-gray-400">Ref: {b.booking_ref}</span>
                            </div>
                          </div>
                        </div>

                        {isUpcoming && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer self-start sm:self-center"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: DUES & INVOICES ───────────────────────────────── */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                  My Dues, Membership Fees & Statements
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Review outstanding subscription invoices and complete instant online payment via UPI, Credit Card, or Netbanking.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Current Outstanding Balance:</span>
                <span className={`text-xl font-bold font-mono ${totalDues > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{totalDues.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
              {invoices.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
                  Your account has zero outstanding dues. All invoices are settled!
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 font-mono font-bold text-sm text-[#1D1D1F] dark:text-white">
                          <span>{inv.invoice_no}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                          <span>Issued: {new Date(inv.issue_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Total: ₹{Number(inv.total_amount).toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <strong className="text-amber-400">Balance: ₹{Number(inv.balance_due).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>

                      {Number(inv.balance_due) > 0 && (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#B89047] to-[#D4AF37] text-black hover:opacity-95 shadow-md transition-all cursor-pointer self-start sm:self-center"
                        >
                          Pay Online • ₹{Number(inv.balance_due).toLocaleString('en-IN')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: CLUB PRO SHOP ─────────────────────────────────── */}
        {activeTab === 'shop' && (
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
              <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                The Champions Club Official Pro Shop
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Exclusive member rates on competition-grade racquets, official match balls, shuttlecocks, and apparel. Ready for club pickup.
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => {
                const retailPrice = Number(p.base_price);
                const isGold = (membership?.plan_code || '').toLowerCase().includes('gold') || (membership?.plan_name || '').toLowerCase().includes('gold');
                const memberDiscountedPrice = Math.round(retailPrice * (isGold ? 0.85 : 0.90));

                return (
                  <div key={p.id} className="p-5 rounded-3xl bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-between hover:border-[#B89047]/40 transition-all group">
                    <div>
                      {/* Product Preview Image Pedestal with Click to Zoom */}
                      <div
                        onClick={() => setPreviewProduct(p)}
                        className="h-48 w-full mb-3 rounded-2xl overflow-hidden bg-gradient-to-b from-stone-100 to-stone-50 dark:from-white/[0.02] dark:to-white/[0.05] flex items-center justify-center p-3 relative border border-black/5 dark:border-white/5 cursor-pointer group/img transition-all hover:border-[#B89047]/40 shadow-inner"
                        title="Click to view high-resolution preview"
                      >
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop'}
                          alt={p.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop';
                          }}
                          className="max-h-full max-w-full object-contain group-hover/img:scale-108 transition-transform duration-300 drop-shadow-sm"
                        />
                        <span className="absolute top-2.5 left-2.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-sm border border-white/10">
                          {p.brand}
                        </span>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
                          <ZoomIn size={16} className="text-[#EAD29A]" />
                          <span>Inspect Gear</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#B89047] font-bold uppercase tracking-wider">
                        {p.category_name || 'Pro Equipment'}
                      </span>
                      <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white mt-0.5 leading-snug group-hover:text-[#B89047] transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {p.description || 'Club approved competition grade equipment.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                          <span>MSRP:</span>
                          <span className="line-through decoration-rose-500/70 font-semibold">
                            ₹{retailPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="font-display font-bold text-base text-[#B89047] dark:text-[#EAD29A]">
                            ₹{memberDiscountedPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                            {isGold ? '15% VIP OFF' : '10% OFF'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenCheckout(p)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Past Orders */}
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
              <h4 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white mb-4">
                My Order History
              </h4>
              {myOrders.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No shop orders placed yet.</div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {myOrders.map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold font-mono text-[#1D1D1F] dark:text-white">{o.order_no}</div>
                        <div className="text-gray-400 text-[11px]">
                          {new Date(o.placed_at).toLocaleDateString()} • {o.fulfillment_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">₹{Number(o.total_amount).toLocaleString('en-IN')}</div>
                        <span className="text-[10px] text-emerald-500 uppercase font-semibold">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: PROFILE & SETTINGS (MOVED FROM MAIN PASS TAB) ───── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Sanctuary Profile & Contact Records
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Keep your records up-to-date for court booking confirmations and concierge emergency notifications.
                    </p>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-[#B89047]" />
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        Registered Full Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={memberName}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-400 text-sm cursor-not-allowed outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profile?.email || user?.email || ''}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-400 text-sm cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white text-sm outline-none focus:border-[#B89047]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        City of Residence
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white text-sm outline-none focus:border-[#B89047]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                      Address Details
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Flat 402, Royal Palms, Koramangala"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white text-sm outline-none focus:border-[#B89047]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={editEmergencyName}
                        onChange={(e) => setEditEmergencyName(e.target.value)}
                        placeholder="Family Member / Guardian"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white text-sm outline-none focus:border-[#B89047]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={editEmergencyPhone}
                        onChange={(e) => setEditEmergencyPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white text-sm outline-none focus:border-[#B89047]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-black bg-gradient-to-r from-[#B89047] to-[#EAD29A] hover:opacity-95 shadow-md border border-[#B89047]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <RotateCw size={14} className="animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={15} />
                          <span>Update Profile Records</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Security & Test Simulation Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-3xl p-6 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm space-y-4">
                <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                  Sanctuary Account Security
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                    <span className="text-gray-400">Account Type:</span>
                    <strong className="text-[#1D1D1F] dark:text-white">Registered Member</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                    <span className="text-gray-400">Member ID:</span>
                    <span className="font-mono text-[#EAD29A] font-bold">{memberCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                    <span className="text-gray-400">Gate QR Token:</span>
                    <span className="font-mono text-gray-400 truncate max-w-[120px]">{profile?.qr_token || 'Generated'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500">
                      {profile?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Developer / Evaluation Status Simulation Bar */}
              <div className="rounded-3xl p-6 bg-white dark:bg-[#141418] border border-black/10 dark:border-[#B89047]/30 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-[#997332] dark:text-[#EAD29A]">
                  <Zap size={16} className="text-[#B89047]" />
                  <span className="text-xs uppercase font-bold tracking-wider text-[#1D1D1F] dark:text-[#EAD29A]">
                    Member Tier Simulation Tools
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  Evaluate real-time member portal states with instantaneous 1-click test simulation presets:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleSimulateStatus('expiring_soon')}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-stone-50 dark:bg-white/[0.03] hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/10 border border-black/10 dark:border-white/10 hover:border-amber-500/40 text-[#1D1D1F] dark:text-white text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                        Simulate: Expiring in 3 Days (Renewal Warning)
                      </span>
                    </div>
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => handleSimulateStatus('inactive')}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-stone-50 dark:bg-white/[0.03] hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/10 border border-black/10 dark:border-white/10 hover:border-rose-500/40 text-[#1D1D1F] dark:text-white text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                        Simulate: No Active Pass (Unactivated Member)
                      </span>
                    </div>
                    <X size={14} className="text-rose-500 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => handleSimulateStatus('gold')}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-stone-50 dark:bg-white/[0.03] hover:bg-[#B89047]/10 border border-black/10 dark:border-white/10 hover:border-[#B89047]/40 text-[#1D1D1F] dark:text-white text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#B89047] ring-4 ring-[#B89047]/20" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#B89047] dark:group-hover:text-[#EAD29A] transition-colors">
                        Simulate: Active Gold Pass (Full VIP Access)
                      </span>
                    </div>
                    <Crown size={14} className="text-[#B89047] flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── FULL-SCREEN HIGH-RES QR PASS MODAL (ZOOM ON CARD CLICK) ── */}
        {isQrModalOpen &&
          createPortal(
            <div
              data-lenis-prevent
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            >
              <div className="relative w-full max-w-sm bg-gradient-to-br from-[#1C1A17] via-[#24201A] to-[#121214] border-2 border-[#B89047] rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white">
                {/* Close Button */}
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                {/* Club Monogram Header */}
                <div className="flex flex-col items-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#8C6826] p-[2px] mb-2 shadow-lg shadow-[#B89047]/30">
                    <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-[#EAD29A]" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#EAD29A] tracking-wider uppercase">
                    The Champions Club
                  </h3>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                    VIP Sanctuary Pass • Gate Clearance Token
                  </span>
                </div>

                {/* Member Details Pill */}
                <div className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 mb-5 flex items-center justify-between text-xs">
                  <div className="text-left">
                    <div className="font-display font-bold text-sm text-white">{memberName}</div>
                    <div className="text-[10px] text-gray-400">ID: {memberCode}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    hasActiveMembership ? 'bg-[#B89047] text-black' : 'bg-gray-700 text-gray-200'
                  }`}>
                    {memberPlan}
                  </span>
                </div>

                {/* Large High-Contrast Scannable QR Code */}
                <div className="w-64 h-64 mx-auto p-4 bg-white rounded-2xl border-4 border-[#B89047]/60 shadow-[0_0_40px_rgba(184,144,71,0.25)] flex flex-col items-center justify-center">
                  <QRCode
                    value={profile?.qr_token || memberCode}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>

                <div className="mt-3 font-mono text-sm font-bold tracking-widest text-[#EAD29A]">
                  {memberCode}
                </div>

                <p className="text-xs text-gray-300 mt-4 leading-relaxed max-w-xs mx-auto">
                  Present this screen under the gate optical scanner or to the concierge reception desk for 1-second contactless verification.
                </p>

                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#EAD29A] hover:brightness-110 shadow-md cursor-pointer"
                >
                  Dismiss QR Pass
                </button>
              </div>
            </div>,
            document.body
          )}

        {/* ─── BOOKING MODAL ───────────────────────────────────────── */}
        {isBookingModalOpen && selectedCourt && selectedTimeSlot &&
          createPortal(
            <div
              data-lenis-prevent
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/10">
                  <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">
                    Confirm Court Booking
                  </h3>
                  <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Court:</span>
                      <strong className="text-[#1D1D1F] dark:text-white">{selectedCourt.name} ({selectedCourt.sport_name})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="font-mono text-[#1D1D1F] dark:text-white">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Slot:</span>
                      <span className="font-mono text-[#1D1D1F] dark:text-white">
                        {selectedTimeSlot.start.split(' ')[1]} – {selectedTimeSlot.end.split(' ')[1]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Privilege Tier:</span>
                      <span className="text-[#B89047] font-bold">{memberPlan} Rate</span>
                    </div>
                    <div className="flex justify-between border-t border-black/10 dark:border-white/10 pt-1.5">
                      <span className="text-gray-400">Court Booking Fee:</span>
                      <span className="font-mono text-sm font-bold text-[#B89047]">
                        ₹{getCourtBookingFee(selectedCourt).toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-emerald-500 font-sans font-semibold">Razorpay Verified</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    By proceeding, you will pay via the official Razorpay test gateway. This slot will be reserved exclusively in your name upon payment verification.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 text-gray-500 hover:bg-black/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isBookingSubmitting}
                    onClick={handleConfirmBooking}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#D4AF37] hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>
                      {isBookingSubmitting
                        ? 'Opening Gateway...'
                        : `Pay ₹${getCourtBookingFee(selectedCourt)} & Reserve`}
                    </span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* ─── ONLINE PAYMENT MODAL ─────────────────────────────────── */}
        {selectedInvoice &&
          createPortal(
            <div
              data-lenis-prevent
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-[#B89047]" />
                    <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">
                      Instant Online Settlement
                    </h3>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#B89047]/10 border border-[#B89047]/30 text-center mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-[#B89047] font-semibold">Total Amount Due</div>
                  <div className="text-2xl font-bold font-mono text-[#1D1D1F] dark:text-white mt-1">
                    ₹{Number(selectedInvoice.balance_due).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 font-mono">Invoice Ref: {selectedInvoice.invoice_no}</div>
                </div>

                {/* Payment Gateway Info */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#B89047]/10 via-[#B89047]/5 to-transparent border border-[#B89047]/30 text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1.5 text-xs font-bold text-[#B89047] uppercase tracking-wider">
                    <ShieldCheck size={16} />
                    <span>Razorpay Secure Gateway</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Supports instant UPI (GPay, PhonePe, Paytm), All Major Debit & Credit Cards, and Netbanking.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1 py-3 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 text-gray-500 hover:bg-black/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPaying}
                    onClick={handlePayInvoice}
                    className="flex-2 py-3 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] via-[#B89047] to-[#A67C38] hover:brightness-105 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <CreditCard size={15} />
                    <span>{isPaying ? 'Connecting...' : `Pay ₹${Number(selectedInvoice.balance_due).toLocaleString('en-IN')} with Razorpay`}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* ─── PRO SHOP CHECKOUT & ORDER CONFIRMATION MODAL ─────────── */}
        {checkoutProduct &&
          createPortal(
            <div
              data-lenis-prevent
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            >
              <div className="relative w-full max-w-lg bg-white dark:bg-[#121216] border border-black/10 dark:border-[#B89047]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#1D1D1F] dark:text-white">
              <button
                onClick={() => setCheckoutProduct(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#B89047]/15 border border-[#B89047]/30 flex items-center justify-center text-[#B89047]">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1D1D1F] dark:text-white">
                    Pro Shop Order Checkout
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Review gear selection, member rate, and fulfillment details
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmCheckout} className="space-y-4">
                {/* Product Dossier Card with Image */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 flex items-center justify-center p-1.5 flex-shrink-0">
                    <img
                      src={checkoutProduct.image_url || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop'}
                      alt={checkoutProduct.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop';
                      }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#B89047] block">
                      {checkoutProduct.brand} • {checkoutProduct.category_name || 'Pro Gear'}
                    </span>
                    <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white truncate mt-0.5">
                      {checkoutProduct.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display font-bold text-sm text-[#1D1D1F] dark:text-white">
                        ₹{Math.round(Number(checkoutProduct.base_price) * 0.85).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-400 line-through font-mono">
                        ₹{Number(checkoutProduct.base_price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        15% Member Rate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/10">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Order Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutQuantity(Math.max(1, checkoutQuantity - 1))}
                      className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm font-mono w-6 text-center">{checkoutQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setCheckoutQuantity(checkoutQuantity + 1)}
                      className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Fulfillment Selection */}
                <div>
                  <label className="block text-xs uppercase font-semibold text-gray-500 font-display mb-1.5">
                    Fulfillment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'Counter Pickup', label: 'Pro Shop Pickup', desc: 'Ready in 15 mins at counter' },
                      { id: 'Locker Delivery', label: 'Locker / Sanctuary', desc: 'Placed in member locker' },
                    ].map((opt) => {
                      const isSel = checkoutFulfillment === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCheckoutFulfillment(opt.id as any)}
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                            isSel
                              ? 'border-[#B89047] bg-[#B89047]/15 ring-1 ring-[#B89047]'
                              : 'border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]'
                          )}
                        >
                          <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">{opt.label}</div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Address / Locker Confirmation */}
                <div>
                  <label className="block text-xs uppercase font-semibold text-gray-500 font-display mb-1">
                    {checkoutFulfillment === 'Locker Delivery' ? 'Locker / Sanctuary Unit Address *' : 'Pickup Verification Contact *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    placeholder="e.g. Member Locker #24, Sanctuary Wing A..."
                    className="w-full px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs outline-none focus:border-[#B89047]"
                  />
                </div>

                {/* Customization Notes */}
                <div>
                  <label className="block text-xs uppercase font-semibold text-gray-500 font-display mb-1">
                    Special Equipment Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder="e.g. String tension 26 lbs, gift wrapping..."
                    className="w-full px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs outline-none focus:border-[#B89047]"
                  />
                </div>

                {/* Price Breakdown Calculation */}
                {(() => {
                  const unitPrice = Math.round(Number(checkoutProduct.base_price) * 0.85);
                  const subtotal = unitPrice * checkoutQuantity;
                  const gst = Math.round(subtotal * 0.18);
                  const total = subtotal + gst;
                  return (
                    <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Items Subtotal ({checkoutQuantity}x):</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>GST @ 18% (Sports Equipment):</span>
                        <span>₹{gst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-black/5 dark:border-white/10 font-bold text-[#1D1D1F] dark:text-white text-sm">
                        <span>Total Charged:</span>
                        <span className="text-[#B89047] font-mono">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  disabled={isSubmittingCheckout}
                  className="w-full py-3 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#D4AF37] hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#B89047]/20 active:scale-98"
                >
                  {isSubmittingCheckout ? (
                    <>
                      <RotateCw size={15} className="animate-spin" />
                      <span>Transmitting Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Place Order</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL: PRODUCT DETAIL & HIGH-RES PREVIEW LIGHTBOX ─────── */}
      {previewProduct &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-lenis-prevent="true"
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          >
            <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#B89047]/15 text-[#B89047] dark:text-[#EAD29A] border border-[#B89047]/30">
                      {previewProduct.brand}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {previewProduct.category_name || 'Equipment'}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1D1D1F] dark:text-white">
                    {previewProduct.name}
                  </h3>
                </div>

                <button
                  onClick={() => setPreviewProduct(null)}
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Large Product Image Showcase */}
              <div className="w-full h-72 sm:h-80 rounded-2xl bg-gradient-to-b from-stone-100 to-stone-50 dark:from-white/[0.02] dark:to-white/[0.05] border border-black/5 dark:border-white/5 flex items-center justify-center p-6 shadow-inner relative">
                <img
                  src={previewProduct.image_url || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop'}
                  alt={previewProduct.name}
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop';
                  }}
                />
              </div>

              {/* Description & Specifications */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Product Overview & Specifications
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {previewProduct.description || 'Competition-grade sports equipment certified and endorsed by The Champions Club. Available for express pickup at the club counter or direct delivery to your private member sanctuary locker.'}
                </p>
              </div>

              {/* Pricing & Order Actions */}
              {(() => {
                const retailPrice = Number(previewProduct.base_price);
                const isGold = (membership?.plan_code || '').toLowerCase().includes('gold') || (membership?.plan_name || '').toLowerCase().includes('gold');
                const memberPrice = Math.round(retailPrice * (isGold ? 0.85 : 0.90));
                const savings = retailPrice - memberPrice;

                return (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <span>Original Retail Price:</span>
                        <span className="line-through decoration-rose-500/70 font-semibold text-sm">
                          ₹{retailPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs text-gray-500 font-medium">Member Privilege Price:</span>
                        <span className="font-display font-bold text-2xl text-[#B89047] dark:text-[#EAD29A]">
                          ₹{memberPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          Save ₹{savings.toLocaleString('en-IN')} ({isGold ? '15% VIP OFF' : '10% OFF'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const p = previewProduct;
                          setPreviewProduct(null);
                          handleOpenCheckout(p);
                        }}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#B89047]/20 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        <span>Order This Gear</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}

      </div>
    </PageLayout>
  );
};

export default MemberPortalPage;
