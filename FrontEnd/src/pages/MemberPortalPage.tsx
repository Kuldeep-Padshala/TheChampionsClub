import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import {
  memberService,
  MemberProfile,
  ActiveMembership,
  MemberCourtBooking,
  MemberInvoice,
  MemberShopProduct,
  MemberShopOrder,
} from '../services/memberService';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MemberPortalPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'pass' | 'courts' | 'billing' | 'shop'>('pass');
  const [isLoading, setIsLoading] = useState(true);

  // Member Dashboard Data
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [membership, setMembership] = useState<ActiveMembership | null>(null);
  const [totalDues, setTotalDues] = useState(0);
  const [invoices, setInvoices] = useState<MemberInvoice[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Array<{ id: number; method: string; checked_in_at: string }>>([]);

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

  // Shop Data
  const [products, setProducts] = useState<MemberShopProduct[]>([]);
  const [myOrders, setMyOrders] = useState<MemberShopOrder[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState<number | null>(null);

  // ─── Fetch Member Data ─────────────────────────────────────
  const loadMemberData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await memberService.getProfile();
      setProfile(data.profile);
      setMembership(data.active_membership);
      setTotalDues(data.total_dues);
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
        memberService.getMyBookings(),
        memberService.getMyInvoices(),
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

  // Load court availability when tab is 'courts' or date/sport changes
  useEffect(() => {
    if (activeTab === 'courts') {
      memberService.getCourtAvailability(selectedDate, selectedSportId).then((data) => {
        setAvailableCourts(data.courts || []);
        setCourtReservations(data.reservations || []);
      }).catch(console.error);
    }
  }, [activeTab, selectedDate, selectedSportId]);

  // Load shop products when tab is 'shop'
  useEffect(() => {
    if (activeTab === 'shop') {
      Promise.all([memberService.getShopProducts(), memberService.getMyOrders()]).then(([prods, orders]) => {
        setProducts(prods || []);
        setMyOrders(orders || []);
      }).catch(console.error);
    }
  }, [activeTab]);

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
      toast.success('Your sanctuary profile has been updated!');
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Court Booking ──────────────────────────────────────────
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
    try {
      const res = await memberService.createBooking({
        court_id: selectedCourt.id,
        starts_at: selectedTimeSlot.start,
        ends_at: selectedTimeSlot.end,
        reservation_type: 'exclusive',
      });
      toast.success(res.message || 'Court booked successfully!');
      setIsBookingModalOpen(false);
      // Reload bookings and schedule
      const [bookings, avail] = await Promise.all([
        memberService.getMyBookings(),
        memberService.getCourtAvailability(selectedDate, selectedSportId),
      ]);
      setMyBookings(bookings);
      setAvailableCourts(avail.courts || []);
      setCourtReservations(avail.reservations || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to book court slot';
      toast.error(msg);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this court reservation? Cancellations must be made at least 2 hours in advance.')) return;
    try {
      const res = await memberService.cancelBooking(bookingId);
      toast.success(res.message || 'Booking cancelled');
      const bookings = await memberService.getMyBookings();
      setMyBookings(bookings);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not cancel booking');
    }
  };

  // ─── Online Payment ─────────────────────────────────────────
  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
      const res = await memberService.payOnline({
        invoice_id: selectedInvoice.id,
        amount: Number(selectedInvoice.balance_due),
        method: paymentMethod,
      });
      toast.success(`Payment verified! Receipt: ${res.receipt_no}`);
      setSelectedInvoice(null);
      // Refresh member billing
      const [data, invData] = await Promise.all([
        memberService.getProfile(),
        memberService.getMyInvoices(),
      ]);
      setTotalDues(data.total_dues);
      setInvoices(invData);
    } catch (err: any) {
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  // ─── Place Shop Order ───────────────────────────────────────
  const handleOrderProduct = async (product: MemberShopProduct) => {
    setIsPlacingOrder(product.id);
    try {
      const res = await memberService.placeOrder({
        items: [
          {
            product_name: product.name,
            quantity: 1,
            unit_price: Number(product.base_price),
          },
        ],
        notes: 'Member Portal Click & Collect',
      });
      toast.success(`Order placed! Reference: ${res.order_no}`);
      const orders = await memberService.getMyOrders();
      setMyOrders(orders);
    } catch (err: any) {
      toast.error('Failed to place order');
    } finally {
      setIsPlacingOrder(null);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center pt-24 pb-16">
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
  const memberPlan = membership?.plan_name || 'Gold Member';
  const memberCode = profile?.member_code || 'CC-2026-VIP';

  // Hours for court grid: 06:00 to 22:00
  const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

  return (
    <PageLayout>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* ─── Hero Sanctuary Header ───────────────────────────────── */}
        <div className="relative rounded-3xl p-6 sm:p-10 mb-8 overflow-hidden bg-gradient-to-br from-[#121216] via-[#1C1C24] to-[#0E0E12] border border-[#B89047]/30 shadow-2xl">
          {/* Subtle Golden Glow Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B89047]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#B89047]/20 text-[#EAD29A] border border-[#B89047]/30 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#EAD29A]" />
                  {memberPlan} Tier
                </span>
                <span className="text-xs text-gray-400 font-mono tracking-wider">
                  Member ID: <strong className="text-white">{memberCode}</strong>
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Sanctuary Portal • {memberName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                Self-service privilege hub for court reservations, contactless digital QR check-in, pro shop ordering, and balance management.
              </p>
            </div>

            {/* Quick Status Cards */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[110px]">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Active Plan</div>
                <div className="text-sm font-bold text-[#EAD29A] mt-0.5">{memberPlan}</div>
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

          {/* Tab Navigation */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'pass', label: 'Digital VIP Pass', icon: QrCode },
              { id: 'courts', label: 'Court Reservations', icon: Calendar },
              { id: 'billing', label: 'Dues & Invoices', icon: CreditCard },
              { id: 'shop', label: 'Club Pro Shop', icon: ShoppingBag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B89047] to-[#D4AF37] text-black shadow-lg shadow-[#B89047]/20 font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── TAB 1: DIGITAL VIP PASS & PROFILE ─────────────────────── */}
        {activeTab === 'pass' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Luxury Digital Membership Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="relative rounded-3xl p-7 text-white overflow-hidden bg-gradient-to-br from-[#1B1917] via-[#2A241C] to-[#121214] border border-[#B89047]/40 shadow-2xl group hover:border-[#B89047] transition-all duration-300">
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
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B89047] text-black shadow-md">
                    {memberPlan}
                  </span>
                </div>

                {/* Simulated Chip & QR Scan */}
                <div className="flex items-center justify-between my-4 px-2">
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#FFF3B0] border border-[#7D5A1E]/50 shadow-inner flex items-center justify-center opacity-85">
                    <div className="w-8 h-5 border border-[#8C6826]/40 rounded-sm" />
                  </div>
                  {/* Contactless Icon */}
                  <div className="flex items-center gap-1 text-[#EAD29A]/80">
                    <span className="text-[10px] uppercase font-mono tracking-widest">NFC / QR ACTIVE</span>
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
                        {membership?.end_date ? new Date(membership.end_date).toLocaleDateString() : 'Active Member'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Scanner QR Code Box */}
              <div className="rounded-3xl p-6 bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <QrCode size={18} className="text-[#B89047]" />
                  <span className="text-xs uppercase font-bold tracking-wider text-[#1D1D1F] dark:text-white font-display">
                    Contactless Reception Check-In Token
                  </span>
                </div>
                <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl border-2 border-[#B89047]/40 shadow-inner flex flex-col items-center justify-center gap-2">
                  {/* High visual fidelity QR simulation */}
                  <div className="font-mono text-xs text-gray-800 break-all p-2 bg-gray-50 rounded-lg border border-gray-200 text-center font-bold">
                    {profile?.qr_token || memberCode}
                  </div>
                  <div className="text-[10px] text-gray-400 tracking-widest font-mono uppercase">
                    Scan At Front Desk
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 max-w-xs mx-auto leading-relaxed">
                  Present this QR token to the concierge laser scanner or physical reception station for immediate gate clearance.
                </p>
              </div>
            </div>

            {/* Right: Profile Details Form */}
            <div className="lg:col-span-7">
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
                      className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#141416] to-[#24242A] dark:from-[#B89047] dark:to-[#8C6826] hover:opacity-95 shadow-md border border-[#B89047]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

                {/* Recent Check-In History */}
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
                  <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-3">
                    Recent Check-Ins at Sanctuary Gate
                  </h4>
                  {recentCheckins.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">No recent gate check-ins recorded yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {recentCheckins.map((ci) => (
                        <div key={ci.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="font-medium text-[#1D1D1F] dark:text-white">Method: {ci.method}</span>
                          </div>
                          <span className="text-gray-400 font-mono">
                            {new Date(ci.checked_in_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: COURT RESERVATIONS & CALENDAR ─────────────────── */}
        {activeTab === 'courts' && (
          <div className="space-y-8">
            {/* Filter Bar */}
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

                        // Check if occupied
                        const isOccupied = courtReservations.some((r) => {
                          if (r.court_id !== court.id) return false;
                          const rStart = r.starts_at.replace('T', ' ').split('.')[0];
                          const rEnd = r.ends_at.replace('T', ' ').split('.')[0];
                          return (rStart < slotEnd && rEnd > slotStart);
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
              {products.map((p) => (
                <div key={p.id} className="p-5 rounded-3xl bg-white dark:bg-[#0A0A0D] border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-between hover:border-[#B89047]/40 transition-all">
                  <div>
                    <span className="text-[10px] text-[#B89047] font-bold uppercase tracking-wider">
                      {p.brand} • {p.category_name || 'Gear'}
                    </span>
                    <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white mt-1 leading-snug">
                      {p.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {p.description || 'Club approved competition grade equipment.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                    <span className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">
                      ₹{Number(p.base_price).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleOrderProduct(p)}
                      disabled={isPlacingOrder === p.id}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#B89047]/10 hover:bg-[#B89047] text-[#B89047] hover:text-black border border-[#B89047]/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isPlacingOrder === p.id ? 'Ordering...' : 'Order'}
                    </button>
                  </div>
                </div>
              ))}
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

        {/* ─── BOOKING MODAL ───────────────────────────────────────── */}
        {isBookingModalOpen && selectedCourt && selectedTimeSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                    <span className="text-[#B89047] font-bold">{memberPlan} Included</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed">
                  By confirming, this slot will be reserved exclusively in your name. You may cancel up to 2 hours before the session.
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
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#D4AF37] hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isBookingSubmitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ONLINE PAYMENT MODAL ─────────────────────────────────── */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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

              {/* Payment Methods */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs uppercase font-semibold text-gray-500 font-display">
                  Select Gateway / Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                    { id: 'card', label: 'Debit/Card', icon: CreditCard },
                    { id: 'online', label: 'Netbanking', icon: ShieldCheck },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSel
                            ? 'border-[#B89047] bg-[#B89047]/20 text-[#B89047] font-bold'
                            : 'border-black/10 dark:border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} className="mx-auto mb-1" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 text-center text-xs text-gray-400 mb-4">
                  <div className="font-mono text-sm font-bold text-[#1D1D1F] dark:text-white mb-1">
                    championsclub@okaxis
                  </div>
                  <span>Instant UPI QR code generated. Tap below to simulate instant gateway settlement.</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 text-gray-500 hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handlePayInvoice}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#D4AF37] hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPaying ? 'Processing...' : `Authorize ₹${Number(selectedInvoice.balance_due).toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
};

export default MemberPortalPage;
