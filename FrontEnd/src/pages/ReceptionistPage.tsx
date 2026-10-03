import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';

const formatLocalDate = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
import { ROUTES } from '../constants/routes';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { receptionistService } from '../services/receptionistService';
import {
  Member,
  MemberDetail,
  Court,
  Reservation,
  Invoice,
  Enquiry,
  CheckInResult,
  Sport,
  MembershipPlan,
} from '../types/receptionist.types';
import {
  QrCode,
  Calendar,
  Users,
  CreditCard,
  PhoneCall,
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  FileText,
  Printer,
  RotateCw,
  Eye,
  Trash2,
  ChevronRight,
  Filter,
  DollarSign,
  UserCheck,
  Send,
  Zap,
  Moon,
  Sun,
  LogOut,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { CameraQrScannerModal } from '../components/common/CameraQrScannerModal';

export const ReceptionistPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === 'night';
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'checkin' | 'calendar' | 'members' | 'billing' | 'enquiries' | null;

  // Active Main Tab - synchronized with URL tab parameter
  const [activeTab, setActiveTab] = useState<'checkin' | 'calendar' | 'members' | 'billing' | 'enquiries'>(
    urlTab && ['checkin', 'calendar', 'members', 'billing', 'enquiries'].includes(urlTab) ? urlTab : 'checkin'
  );

  useEffect(() => {
    if (urlTab && ['checkin', 'calendar', 'members', 'billing', 'enquiries'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  const handleTabSelect = (tabId: 'checkin' | 'calendar' | 'members' | 'billing' | 'enquiries') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Global Member Search
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // General Shared Data
  const [sports, setSports] = useState<Sport[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // ── Tab 1: Check-in state ──────────────────────────────────────────
  const [scannerInput, setScannerInput] = useState('');
  const [lastCheckInResult, setLastCheckInResult] = useState<CheckInResult | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);

  // ── Tab 2: Court Calendar state ───────────────────────────────────
  const [calendarDate, setCalendarDate] = useState<string>(() => formatLocalDate());
  const [selectedSportId, setSelectedSportId] = useState<number | undefined>(undefined);
  const [courts, setCourts] = useState<Court[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingCourtId, setBookingCourtId] = useState<number | null>(null);
  const [bookingStartsAt, setBookingStartsAt] = useState('');
  const [bookingEndsAt, setBookingEndsAt] = useState('');
  const [bookingMemberId, setBookingMemberId] = useState<number | null>(null);
  const [bookingMemberSearch, setBookingMemberSearch] = useState('');
  const [bookingMemberOptions, setBookingMemberOptions] = useState<Member[]>([]);
  const [bookingGuestName, setBookingGuestName] = useState('');
  const [bookingGuestPhone, setBookingGuestPhone] = useState('');
  const [bookingType, setBookingType] = useState<'exclusive' | 'social'>('exclusive');
  const [bookingAmount, setBookingAmount] = useState('800');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // View / Cancel Booking Modal
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // ── Tab 3: Member Directory state ─────────────────────────────────
  const [members, setMembers] = useState<Member[]>([]);
  const [memberFilterSearch, setMemberFilterSearch] = useState('');
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Member Detail View Modal
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [isMemberDetailLoading, setIsMemberDetailLoading] = useState(false);

  // Register New Member Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberDob, setNewMemberDob] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [newMemberPlanId, setNewMemberPlanId] = useState<number | undefined>(undefined);
  const [isRegistering, setIsRegistering] = useState(false);

  // Assign/Renew Plan Modal
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);
  const [assignPlanMemberId, setAssignPlanMemberId] = useState<number | null>(null);
  const [assignPlanMemberName, setAssignPlanMemberName] = useState('');
  const [assignPlanSelectedId, setAssignPlanSelectedId] = useState<number | null>(null);
  const [assignPlanFee, setAssignPlanFee] = useState('');
  const [isAssigningPlan, setIsAssigningPlan] = useState(false);

  // ── Tab 4: Billing state ──────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);

  // Collect Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Online'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // ── Tab 5: Enquiries state ────────────────────────────────────────
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isEnquiriesLoading, setIsEnquiriesLoading] = useState(false);

  // Log New Enquiry Modal
  const [isNewEnquiryModalOpen, setIsNewEnquiryModalOpen] = useState(false);
  const [enqName, setEnqName] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqSource, setEnqSource] = useState('Walk-in');
  const [enqType, setEnqType] = useState('Membership');
  const [enqSportId, setEnqSportId] = useState<number | undefined>(undefined);
  const [enqMessage, setEnqMessage] = useState('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // Follow-Up Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [enqStatus, setEnqStatus] = useState('Open');
  const [enqNoteSummary, setEnqNoteSummary] = useState('');
  const [enqFollowUpDate, setEnqFollowUpDate] = useState('');
  const [isUpdatingEnquiry, setIsUpdatingEnquiry] = useState(false);

  // ── Load Shared Helpers ───────────────────────────────────────────
  useEffect(() => {
    receptionistService.getSports().then(setSports).catch(console.error);
    receptionistService.getMembershipPlans().then(setPlans).catch(console.error);
  }, []);

  // ── Global Search Debounce ────────────────────────────────────────
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setIsSearching(true);
      receptionistService
        .getMembers(globalSearch.trim())
        .then(setSearchResults)
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [globalSearch]);

  // Click outside search dropdown to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Preload Badges & Auto-Poll Leads ─────────────────────────────
  useEffect(() => {
    loadMembersData();
    loadInvoicesData();
    loadEnquiriesData();

    // Auto-poll enquiries every 20 seconds so public leads show up without manual reload
    const interval = setInterval(() => {
      loadEnquiriesData();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // ── Load Active Tab Data ──────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendarData();
    } else if (activeTab === 'members') {
      loadMembersData();
    } else if (activeTab === 'billing') {
      loadInvoicesData();
    } else if (activeTab === 'enquiries') {
      loadEnquiriesData();
    }
  }, [activeTab, calendarDate, selectedSportId]);

  const loadCalendarData = async () => {
    setIsCalendarLoading(true);
    try {
      const data = await receptionistService.getCourtAvailability(calendarDate, selectedSportId);
      setCourts(data.courts);
      setReservations(data.reservations);
    } catch (err: any) {
      toast.error('Failed to load court calendar');
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const loadMembersData = async () => {
    setIsMembersLoading(true);
    try {
      const data = await receptionistService.getMembers(memberFilterSearch);
      setMembers(data);
    } catch (err: any) {
      toast.error('Failed to load members');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const loadInvoicesData = async () => {
    setIsInvoicesLoading(true);
    try {
      const data = await receptionistService.getInvoices();
      setInvoices(data);
    } catch (err: any) {
      toast.error('Failed to load pending invoices');
    } finally {
      setIsInvoicesLoading(false);
    }
  };

  const loadEnquiriesData = async () => {
    setIsEnquiriesLoading(true);
    try {
      const data = await receptionistService.getEnquiries();
      setEnquiries(data);
    } catch (err: any) {
      toast.error('Failed to load enquiries');
    } finally {
      setIsEnquiriesLoading(false);
    }
  };

  // ── 1. Check-in Handler ────────────────────────────────────────────
  const handleCheckInSubmit = async (codeToUse?: string, memberIdToUse?: number) => {
    const inputCode = codeToUse || scannerInput.trim();
    if (!inputCode && !memberIdToUse) {
      toast.error('Please scan a QR token or select a member');
      return;
    }

    setIsCheckingIn(true);
    try {
      const result = await receptionistService.checkIn({
        code: inputCode || undefined,
        member_id: memberIdToUse || undefined,
        method: codeToUse ? 'QR' : scannerInput.startsWith('QR') ? 'QR' : 'Manual',
      });

      setLastCheckInResult(result);
      setScannerInput('');

      if (result.alert) {
        if (result.alert.level === 'CRITICAL') {
          toast.error(result.alert.message, { duration: 6000 });
        } else {
          toast(result.alert.message, { icon: '⚠️', duration: 5000 });
        }
      } else {
        toast.success(`Check-in verified: ${result.member.full_name}`);
      }

      // Re-focus scanner box
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Check-in failed');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // ── 2. Booking Modal Handlers ─────────────────────────────────────
  const openNewBookingModal = (courtId: number, slotTime: string) => {
    setBookingCourtId(courtId);
    const startsAt = `${calendarDate} ${slotTime}:00`;
    setBookingStartsAt(startsAt);
    // Default 1 hour slot
    const [h, m] = slotTime.split(':').map(Number);
    const endH = String(h + 1).padStart(2, '0');
    setBookingEndsAt(`${calendarDate} ${endH}:${String(m).padStart(2, '0')}:00`);
    setBookingMemberId(null);
    setBookingMemberSearch('');
    setBookingMemberOptions([]);
    setBookingGuestName('');
    setBookingGuestPhone('');
    setBookingType('exclusive');
    setBookingAmount('800');
    setBookingNotes('');
    setIsBookingModalOpen(true);
  };

  // Live member search in booking modal
  useEffect(() => {
    if (!bookingMemberSearch.trim() || bookingMemberId) {
      setBookingMemberOptions([]);
      return;
    }
    const t = setTimeout(() => {
      receptionistService.getMembers(bookingMemberSearch).then(setBookingMemberOptions).catch(console.error);
    }, 200);
    return () => clearTimeout(t);
  }, [bookingMemberSearch, bookingMemberId]);

  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCourtId) return;

    if (!bookingMemberId && !bookingGuestName) {
      toast.error('Please select an existing member or provide guest details');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const res = await receptionistService.createBooking({
        court_id: bookingCourtId,
        member_id: bookingMemberId || undefined,
        guest_name: bookingGuestName || undefined,
        guest_phone: bookingGuestPhone || undefined,
        starts_at: bookingStartsAt,
        ends_at: bookingEndsAt,
        reservation_type: bookingType,
        amount_charged: Number(bookingAmount) || 0,
        notes: bookingNotes || undefined,
      });

      toast.success(`Booking created! Ref: ${res.bookingRef}`);
      setIsBookingModalOpen(false);
      loadCalendarData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reserve court slot');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedReservation?.booking_id) return;
    setIsCancelling(true);
    try {
      await receptionistService.cancelBooking(selectedReservation.booking_id, cancelReason);
      toast.success('Booking cancelled and slot freed');
      setSelectedReservation(null);
      setCancelReason('');
      loadCalendarData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  // ── 3. Member Directory Handlers ──────────────────────────────────
  const openMemberDetail = async (id: number) => {
    setSelectedMemberId(id);
    setIsMemberDetailLoading(true);
    try {
      const data = await receptionistService.getMemberById(id);
      setMemberDetail(data);
    } catch (err: any) {
      toast.error('Failed to load member profile');
    } finally {
      setIsMemberDetailLoading(false);
    }
  };

  const handleRegisterMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberPhone) return;

    setIsRegistering(true);
    try {
      const res = await receptionistService.registerMember({
        full_name: newMemberName,
        phone: newMemberPhone,
        email: newMemberEmail || undefined,
        date_of_birth: newMemberDob || undefined,
        address_line1: newMemberAddress || undefined,
        plan_id: newMemberPlanId,
      });

      toast.success(`Member registered! Code: ${res.member_code}`);
      setIsRegisterModalOpen(false);
      // Reset form
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberEmail('');
      setNewMemberDob('');
      setNewMemberAddress('');
      setNewMemberPlanId(undefined);
      loadMembersData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register member');
    } finally {
      setIsRegistering(false);
    }
  };

  const openAssignPlanModal = (memberId: number, memberName: string) => {
    setAssignPlanMemberId(memberId);
    setAssignPlanMemberName(memberName);
    setAssignPlanSelectedId(plans[0]?.id || null);
    setAssignPlanFee(plans[0]?.fee ? String(plans[0].fee) : '3999');
    setIsAssignPlanModalOpen(true);
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPlanMemberId || !assignPlanSelectedId) return;

    setIsAssigningPlan(true);
    try {
      const res = await receptionistService.sellMembership({
        member_id: assignPlanMemberId,
        plan_id: assignPlanSelectedId,
        fee_charged: Number(assignPlanFee),
      });

      toast.success(`Plan activated! Invoice generated: ${res.invoice_no}`);
      setIsAssignPlanModalOpen(false);
      loadMembersData();
      if (selectedMemberId === assignPlanMemberId) {
        openMemberDetail(assignPlanMemberId);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign plan');
    } finally {
      setIsAssigningPlan(false);
    }
  };

  // ── 4. Billing Handlers ───────────────────────────────────────────
  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(String(invoice.balance_due));
    setPaymentMethod('UPI');
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    setIsRecordingPayment(true);
    try {
      const receipt = await receptionistService.recordPayment({
        invoice_id: selectedInvoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        transaction_ref: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });

      toast.success(`Payment recorded! Receipt: ${receipt.receipt_no}`);
      setSelectedInvoice(null);
      setReceiptData(receipt);
      loadInvoicesData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // ── 5. Enquiry Handlers ───────────────────────────────────────────
  const handleCreateEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqName || !enqPhone) return;

    setIsSubmittingEnquiry(true);
    try {
      await receptionistService.createEnquiry({
        full_name: enqName,
        phone: enqPhone,
        email: enqEmail || undefined,
        source: enqSource,
        enquiry_type: enqType,
        interested_sport_id: enqSportId,
        message: enqMessage || undefined,
      });

      toast.success('New enquiry recorded in lead tracker');
      setIsNewEnquiryModalOpen(false);
      setEnqName('');
      setEnqPhone('');
      setEnqEmail('');
      setEnqMessage('');
      loadEnquiriesData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record enquiry');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const handleUpdateEnquirySubmit = async (e: React.FormEvent) => {
    if (!selectedEnquiry) return;
    setIsUpdatingEnquiry(true);
    try {
      await receptionistService.updateEnquiry(selectedEnquiry.id, {
        status: enqStatus,
        note_summary: enqNoteSummary || undefined,
        next_follow_up_at: enqFollowUpDate ? `${enqFollowUpDate} 10:00:00` : undefined,
      });

      toast.success('Enquiry updated');
      setSelectedEnquiry(null);
      setEnqNoteSummary('');
      loadEnquiriesData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update enquiry');
    } finally {
      setIsUpdatingEnquiry(false);
    }
  };

  // 30-min Court time slots generator
  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  ];

  return (
    <ProtectedRoute allowedRoles={['FRONT_DESK']}>
      <PageLayout>
        <div className="min-h-screen pt-6 sm:pt-8 pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          {/* ══════════════════════════════════════════════════
              RECEPTIONIST CONCIERGE HEADER BAR
          ══════════════════════════════════════════════════ */}
          <div className="mb-6 rounded-3xl p-5 sm:p-6 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Title & Badge */}
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] p-[2px] shadow-lg flex-shrink-0">
                <div className="w-full h-full rounded-[14px] bg-[#121214] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#EAD29A]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                    Front Desk Concierge
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B89047]/15 text-[#B89047] border border-[#B89047]/30">
                    Live Station
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Logged in as <strong className="text-[#1D1D1F] dark:text-gray-200">{user?.name}</strong> • Role: Front Desk
                </p>
              </div>
            </div>

            {/* ── Global Quick Search Bar & Station Controls ── */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-80 md:w-88 flex-shrink-0" ref={searchDropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Quick lookup: Name, Phone, CC-Code..."
                    className="w-full h-11 pl-10 pr-9 rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/[0.04] text-xs sm:text-sm text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none transition-all shadow-sm"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  {globalSearch && (
                    <button
                      onClick={() => setGlobalSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-12 left-0 right-0 z-50 rounded-2xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                    <div className="p-2 border-b border-black/5 dark:border-white/10 text-[10px] uppercase font-bold tracking-wider text-gray-400 px-3">
                      Matching Members ({searchResults.length})
                    </div>
                    {searchResults.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5 last:border-none flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold truncate text-[#1D1D1F] dark:text-white">{m.full_name}</p>
                            <span className="text-[10px] font-mono text-gray-400">{m.member_code}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{m.phone} • {m.current_plan || 'No Plan'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              handleCheckInSubmit(undefined, m.id);
                              setGlobalSearch('');
                              setSearchResults([]);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors cursor-pointer"
                          >
                            Check In
                          </button>
                          <button
                            onClick={() => {
                              openMemberDetail(m.id);
                              setGlobalSearch('');
                              setSearchResults([]);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Station Controls: Theme & Sign Out */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                <button
                  onClick={toggleTheme}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border border-black/10 dark:border-white/10 hover:border-[#B89047] bg-white/60 dark:bg-white/[0.04] transition-colors cursor-pointer"
                  title={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                >
                  {isNight ? <Moon size={16} className="text-[#EAD29A]" /> : <Sun size={16} className="text-[#B89047]" />}
                </button>
                <button
                  onClick={() => logout()}
                  className="h-11 px-3.5 rounded-2xl flex items-center gap-1.5 text-xs font-semibold border border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer"
                  title="Sign Out of Front Desk"
                >
                  <LogOut size={14} />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              MODULE NAVIGATION TABS
          ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {[
              { id: 'checkin',   label: 'Check-In Station',     icon: QrCode,     badge: 'Priority' },
              { id: 'calendar',  label: 'Court Calendar & Book', icon: Calendar,  badge: `${courts.length || 10} Courts` },
              { id: 'members',   label: 'Member Directory',    icon: Users,      badge: `${members.length || ''}` },
              { id: 'billing',   label: 'Billing & POS',        icon: CreditCard, badge: invoices.length > 0 ? `${invoices.length} Due` : undefined },
              { id: 'enquiries', label: 'Leads & Enquiries',    icon: PhoneCall,  badge: `${enquiries.length || ''}` },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer select-none',
                    isActive
                      ? isNight
                        ? 'bg-gradient-to-r from-[#B89047] to-[#A67C38] text-black border-transparent shadow-lg shadow-[#B89047]/20 font-bold'
                        : 'bg-[#121214] text-white border-transparent shadow-md'
                      : isNight
                      ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:border-[#B89047]/40 hover:text-white'
                      : 'bg-white/80 border-black/10 text-gray-700 hover:border-[#B89047]/50 hover:text-black'
                  )}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase',
                        isActive
                          ? 'bg-black/20 text-black dark:text-black'
                          : 'bg-[#B89047]/15 text-[#B89047]'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════
              TAB 1: CHECK-IN SYSTEM (HIGH PRIORITY)
          ══════════════════════════════════════════════════ */}
          {activeTab === 'checkin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: QR / Barcode Scanner Target */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-3xl p-6 sm:p-8 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#B89047]" />
                      <h2 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                        QR Check-In Station
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraScannerOpen(true)}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#B89047] to-[#A67C38] text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#B89047]/20 transition-all cursor-pointer"
                      >
                        <Camera size={13} />
                        <span>Open Camera</span>
                      </button>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20 hidden sm:inline-block">
                        Hardware Ready
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Scan via physical USB barcode gun or click <strong className="text-[#B89047]">"Open Camera"</strong> to scan the member card using your webcam or phone camera.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCheckInSubmit();
                    }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <input
                        ref={scannerInputRef}
                        type="text"
                        value={scannerInput}
                        onChange={(e) => setScannerInput(e.target.value)}
                        placeholder="Scan QR token, enter CC-Code, or phone number..."
                        className="w-full h-14 pl-12 pr-28 rounded-2xl border-2 border-[#B89047]/40 bg-white/90 dark:bg-white/[0.05] text-sm font-mono font-medium text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-4 focus:ring-[#B89047]/20 outline-none transition-all shadow-inner"
                      />
                      <QrCode size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B89047]" />

                      {/* Camera Trigger inside Input */}
                      <button
                        type="button"
                        onClick={() => setIsCameraScannerOpen(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-3 rounded-xl bg-[#B89047]/15 hover:bg-[#B89047] text-[#B89047] hover:text-white border border-[#B89047]/30 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                        title="Open Camera Scanner"
                      >
                        <Camera size={14} />
                        <span className="hidden sm:inline">Camera</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCameraScannerOpen(true)}
                        className="h-12 rounded-xl text-xs sm:text-sm font-bold border-2 border-[#B89047] bg-[#B89047]/10 hover:bg-[#B89047]/20 text-[#B89047] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Camera size={16} />
                        <span>Live Camera Scan</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isCheckingIn || !scannerInput.trim()}
                        className="h-12 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-95 shadow-md border border-[#B89047]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        {isCheckingIn ? (
                          <>
                            <RotateCw size={16} className="animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={16} />
                            <span>Submit Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Quick Member Search & Check-in helper */}
                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
                    <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-3 font-display">
                      Or Select from Registered Members
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {members.slice(0, 6).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleCheckInSubmit(undefined, m.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-black/5 dark:border-white/10 hover:border-[#B89047]/40 bg-white/40 dark:bg-white/[0.02] text-left transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-[#1D1D1F] dark:text-white group-hover:text-[#B89047]">
                              {m.full_name}
                            </p>
                            <span className="text-[10px] text-gray-400">{m.member_code}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-[#B89047]">Check In →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Check-In Result & Status Alerts */}
              <div className="lg:col-span-6">
                {lastCheckInResult ? (
                  <div className="rounded-3xl p-6 sm:p-8 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl space-y-6">
                    
                    {/* Header Banner */}
                    <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                          Check-In Recorded
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {new Date(lastCheckInResult.checked_in_at).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Member Identity Card */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#B89047] flex items-center justify-center text-lg font-bold text-[#121214] flex-shrink-0 shadow-md">
                        {lastCheckInResult.member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-[#1D1D1F] dark:text-white truncate">
                          {lastCheckInResult.member.full_name}
                        </h4>
                        <p className="text-xs font-mono text-[#B89047]">{lastCheckInResult.member.member_code}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{lastCheckInResult.member.phone}</p>
                      </div>
                    </div>

                    {/* ── Status Alerts Box (Expired / Unpaid Dues) ── */}
                    {lastCheckInResult.alert ? (
                      <div
                        className={cn(
                          'p-4 rounded-2xl border flex items-start gap-3',
                          lastCheckInResult.alert.level === 'CRITICAL'
                            ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        )}
                      >
                        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider">
                            {lastCheckInResult.alert.level === 'CRITICAL' ? 'Security Notice — Action Required' : 'Member Notice'}
                          </p>
                          <p className="text-sm font-semibold">{lastCheckInResult.alert.message}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                        <CheckCircle2 size={20} className="flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Account in Good Standing</p>
                          <p className="text-sm font-semibold">Active privileges • Zero outstanding dues</p>
                        </div>
                      </div>
                    )}

                    {/* Detailed Status Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Membership Tier</span>
                        <p className="text-sm font-bold text-[#1D1D1F] dark:text-white mt-0.5">
                          {lastCheckInResult.membership.planName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {lastCheckInResult.membership.planExpiry
                            ? `Valid till ${new Date(lastCheckInResult.membership.planExpiry).toLocaleDateString()}`
                            : 'No active plan'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Account Balance</span>
                        <p
                          className={cn(
                            'text-sm font-bold mt-0.5',
                            lastCheckInResult.billing.totalUnpaid > 0 ? 'text-red-500' : 'text-emerald-500'
                          )}
                        >
                          {lastCheckInResult.billing.totalUnpaid > 0
                            ? `₹${lastCheckInResult.billing.totalUnpaid.toLocaleString('en-IN')} Due`
                            : '₹0 (All Clear)'}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {lastCheckInResult.billing.unpaidInvoices.length > 0
                            ? `${lastCheckInResult.billing.unpaidInvoices.length} unpaid bill(s)`
                            : 'No pending invoices'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => openMemberDetail(lastCheckInResult.member.id)}
                        className="flex-1 h-11 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        Open Full Profile
                      </button>
                      {lastCheckInResult.billing.totalUnpaid > 0 && (
                        <button
                          onClick={() => {
                            if (lastCheckInResult.billing.unpaidInvoices[0]) {
                              openPaymentModal(lastCheckInResult.billing.unpaidInvoices[0]);
                            }
                          }}
                          className="flex-1 h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors"
                        >
                          Collect Dues Now
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[380px] rounded-3xl p-8 bg-white/40 dark:bg-white/[0.02] border border-dashed border-black/15 dark:border-white/15 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                      <QrCode size={28} className="text-gray-400" />
                    </div>
                    <h3 className="font-display text-base font-bold text-gray-500 dark:text-gray-400">
                      Awaiting Scan or Check-In
                    </h3>
                    <p className="text-xs text-gray-400 max-w-sm mt-1">
                      Scan a member QR badge or use the manual search on the left to verify active plan status and inspect outstanding dues.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 2: COURT CALENDAR & BOOKING ENGINE
          ══════════════════════════════════════════════════ */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Controls Strip: Date & Sport Filters */}
              <div className="rounded-3xl p-5 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-[#B89047]" />
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold outline-none focus:border-[#B89047]"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {Array.from({ length: 14 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const dStr = formatLocalDate(d);
                      const isSelected = calendarDate === dStr;
                      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
                      const dateNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <button
                          key={dStr}
                          type="button"
                          onClick={() => setCalendarDate(dStr)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex flex-col items-center leading-tight cursor-pointer active:scale-95',
                            isSelected
                              ? 'bg-gradient-to-r from-[#B89047] to-[#D4AF37] text-black border-[#B89047] shadow-md font-bold ring-2 ring-[#B89047]/40'
                              : 'bg-white/70 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#B89047]/40 hover:text-black dark:hover:text-white'
                          )}
                        >
                          <span className="text-[11px] uppercase tracking-wider">{dayName}</span>
                          <span className={cn('text-[9.5px] font-normal opacity-80', isSelected && 'font-semibold text-black/90')}>
                            {dateNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sport Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setSelectedSportId(undefined)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      selectedSportId === undefined
                        ? 'bg-[#121214] text-white dark:bg-[#B89047] dark:text-black border-transparent'
                        : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'
                    )}
                  >
                    All Sports
                  </button>
                  {sports.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSportId(s.id)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                        selectedSportId === s.id
                          ? 'bg-[#121214] text-white dark:bg-[#B89047] dark:text-black border-transparent'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Grid Timeline */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                        <th className="p-3 text-left text-xs font-bold text-gray-500 font-display uppercase tracking-wider w-44 sticky left-0 bg-white/95 dark:bg-[#0A0A0D]/95 backdrop-blur-md z-10">
                          Court Surface
                        </th>
                        {timeSlots.map((time) => (
                          <th key={time} className="p-2 text-center text-[10px] font-mono text-gray-400 font-semibold border-l border-black/5 dark:border-white/5 w-20">
                            {time}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courts.map((court) => (
                        <tr key={court.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                          <td className="p-3 sticky left-0 bg-white/95 dark:bg-[#0A0A0D]/95 backdrop-blur-md z-10 border-r border-black/5 dark:border-white/5">
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white truncate">{court.name}</p>
                            <span className="text-[10px] text-[#B89047] font-semibold">{court.sport_name || court.surface}</span>
                          </td>
                          {timeSlots.map((time) => {
                            // Find reservation overlapping this slot
                            const slotStart = new Date(`${calendarDate}T${time}:00`);
                            const match = reservations.find((r) => {
                              if (r.court_id !== court.id) return false;
                              const rStart = new Date(r.starts_at);
                              const rEnd = new Date(r.ends_at);
                              return slotStart >= rStart && slotStart < rEnd;
                            });

                            if (match) {
                              return (
                                <td
                                  key={time}
                                  onClick={() => setSelectedReservation(match)}
                                  className="p-1 border-l border-black/5 dark:border-white/5 cursor-pointer bg-[#B89047]/15 hover:bg-[#B89047]/30 transition-colors"
                                  title={`Booked: ${match.member_name || 'Guest'} (${match.reservation_type})`}
                                >
                                  <div className="h-8 rounded-lg bg-[#B89047] text-white dark:text-black flex items-center justify-center text-[9px] font-bold px-1 truncate shadow-sm">
                                    {match.member_name ? match.member_name.split(' ')[0] : 'Booked'}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={time}
                                onClick={() => openNewBookingModal(court.id, time)}
                                className="p-1 border-l border-black/5 dark:border-white/5 cursor-pointer hover:bg-emerald-500/15 transition-colors group"
                                title={`Available: Click to book ${court.name} at ${time}`}
                              >
                                <div className="h-8 rounded-lg border border-transparent group-hover:border-emerald-500/40 flex items-center justify-center text-[10px] text-transparent group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-bold transition-all">
                                  +
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 3: MEMBER MANAGEMENT MODULE
          ══════════════════════════════════════════════════ */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="rounded-3xl p-5 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={memberFilterSearch}
                    onChange={(e) => setMemberFilterSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadMembersData()}
                    placeholder="Filter by name, phone, code..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs outline-none focus:border-[#B89047]"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl text-xs font-semibold bg-[#121214] text-white dark:bg-[#B89047] dark:text-black flex items-center justify-center gap-1.5 hover:opacity-90 shadow-md cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Register New Member</span>
                </button>
              </div>

              {/* Members Directory Table */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="p-4">Member</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Active Plan</th>
                        <th className="p-4">Plan Expiry</th>
                        <th className="p-4">Outstanding</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-[#1D1D1F] dark:text-white text-xs">{m.full_name}</p>
                            <span className="font-mono text-[10px] text-[#B89047]">{m.member_code}</span>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-700 dark:text-gray-300">{m.phone}</p>
                            <p className="text-[10px] text-gray-400">{m.email || '—'}</p>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {m.current_plan || 'No Active Plan'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-gray-500">
                            {m.plan_expiry ? new Date(m.plan_expiry).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 font-bold">
                            {Number(m.total_dues) > 0 ? (
                              <span className="text-red-500">₹{Number(m.total_dues).toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-emerald-500">₹0</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                                m.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-red-500/10 text-red-500'
                              )}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => openMemberDetail(m.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => openAssignPlanModal(m.id, m.full_name)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#B89047]/15 text-[#B89047] hover:bg-[#B89047] hover:text-white transition-colors"
                            >
                              Assign Plan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 4: BILLING & POS (POINT OF SALE)
          ══════════════════════════════════════════════════ */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="rounded-3xl p-5 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-lg flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                    Unpaid Invoices &amp; Point of Sale
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Collect dues, guest fees, and membership subscription balances.
                  </p>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  {invoices.length} Unpaid Invoices
                </span>
              </div>

              {/* Invoices Table */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Billed To</th>
                        <th className="p-4">Issue Date</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Balance Due</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Payment Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#B89047]">{inv.invoice_no}</td>
                          <td className="p-4">
                            <p className="font-bold text-[#1D1D1F] dark:text-white">{inv.bill_to_name}</p>
                            <span className="text-[10px] text-gray-400">{inv.member_code || inv.member_phone || '—'}</span>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-gray-500">
                            {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-gray-500">
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                            ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 font-bold text-red-500 text-sm">
                            ₹{Number(inv.balance_due).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500">
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors cursor-pointer shadow-sm"
                            >
                              Collect Payment
                            </button>
                          </td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-400">
                            No unpaid invoices found. All member accounts are fully settled.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 5: ENQUIRIES & LEAD MANAGEMENT
          ══════════════════════════════════════════════════ */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6">
              <div className="rounded-3xl p-5 bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-lg flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                    Member Leads &amp; Walk-In Tracker
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Capture interested visitors, schedule trials, and log follow-up notes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadEnquiriesData}
                    disabled={isEnquiriesLoading}
                    className="h-10 px-4 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 hover:border-[#B89047]/40 bg-white/70 dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw size={14} className={cn(isEnquiriesLoading && 'animate-spin')} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => setIsNewEnquiryModalOpen(true)}
                    className="h-10 px-5 rounded-xl text-xs font-semibold bg-[#121214] text-white dark:bg-[#B89047] dark:text-black flex items-center gap-1.5 hover:opacity-90 shadow-md cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Log New Enquiry</span>
                  </button>
                </div>
              </div>

              {/* Enquiries Table */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="p-4">Visitor Name</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Source</th>
                        <th className="p-4">Interest Area</th>
                        <th className="p-4">Latest Note</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {enquiries.map((enq) => (
                        <tr key={enq.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-[#1D1D1F] dark:text-white">{enq.full_name}</td>
                          <td className="p-4">
                            <p className="text-gray-700 dark:text-gray-300">{enq.phone}</p>
                            <p className="text-[10px] text-gray-400">{enq.email || '—'}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 dark:bg-white/5">
                              {enq.source}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-[#B89047]">
                            {enq.interested_plan || enq.interested_sport || enq.enquiry_type}
                          </td>
                          <td className="p-4 text-gray-500 max-w-xs truncate">
                            {enq.latest_note || enq.message || '—'}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                                enq.status === 'Open'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : enq.status === 'Joined'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-gray-500/10 text-gray-400'
                              )}
                            >
                              {enq.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedEnquiry(enq);
                                setEnqStatus(enq.status);
                                setEnqFollowUpDate('');
                                setEnqNoteSummary('');
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 hover:border-[#B89047]/50"
                            >
                              Follow Up
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: CREATE COURT BOOKING
          ══════════════════════════════════════════════════ */}
          {isBookingModalOpen && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Reserve Court Slot
                  </h3>
                  <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Date &amp; Start Time</label>
                      <input
                        type="text"
                        disabled
                        value={bookingStartsAt}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">End Time</label>
                      <input
                        type="text"
                        value={bookingEndsAt}
                        onChange={(e) => setBookingEndsAt(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Player Type Switcher */}
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1.5">Player Selection</label>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        value={bookingMemberSearch}
                        onChange={(e) => {
                          setBookingMemberSearch(e.target.value);
                          setBookingMemberId(null);
                        }}
                        placeholder="Search member by name or phone..."
                        className="w-full p-2.5 pl-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs outline-none focus:border-[#B89047]"
                      />
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    {bookingMemberOptions.length > 0 && !bookingMemberId && (
                      <div className="max-h-36 overflow-y-auto border border-black/10 dark:border-white/10 rounded-xl mb-3 divide-y divide-black/5 dark:divide-white/5">
                        {bookingMemberOptions.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setBookingMemberId(m.id);
                              setBookingMemberSearch(`${m.full_name} (${m.member_code})`);
                              setBookingMemberOptions([]);
                            }}
                            className="p-2 text-xs hover:bg-[#B89047]/10 cursor-pointer flex justify-between"
                          >
                            <span className="font-semibold">{m.full_name}</span>
                            <span className="text-gray-400">{m.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!bookingMemberId && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="text"
                          value={bookingGuestName}
                          onChange={(e) => setBookingGuestName(e.target.value)}
                          placeholder="Or Guest Full Name"
                          className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                        />
                        <input
                          type="text"
                          value={bookingGuestPhone}
                          onChange={(e) => setBookingGuestPhone(e.target.value)}
                          placeholder="Guest Phone (+91...)"
                          className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Play Mode</label>
                      <select
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                      >
                        <option value="exclusive">Exclusive (Full Court)</option>
                        <option value="social">Social Play</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Fee (₹)</label>
                      <input
                        type="number"
                        value={bookingAmount}
                        onChange={(e) => setBookingAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Notes / Equipment</label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g., Floodlights required, Restrung racket ready..."
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors mt-2"
                  >
                    {isSubmittingBooking ? 'Reserving...' : 'Confirm Court Reservation'}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: VIEW / CANCEL ACTIVE RESERVATION
          ══════════════════════════════════════════════════ */}
          {selectedReservation && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                  <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                    Reservation Details
                  </h3>
                  <button onClick={() => setSelectedReservation(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <p className="font-bold text-sm text-[#1D1D1F] dark:text-white">{selectedReservation.member_name || 'Walk-in Guest'}</p>
                    <p className="text-gray-500 font-mono">{selectedReservation.booking_ref || 'Reference Pending'}</p>
                    <p className="text-gray-500">{selectedReservation.member_phone || ''}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                    <p>Start: <strong className="text-black dark:text-white font-mono">{new Date(selectedReservation.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
                    <p>End: <strong className="text-black dark:text-white font-mono">{new Date(selectedReservation.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
                    <p>Type: <strong className="capitalize">{selectedReservation.reservation_type}</strong></p>
                    <p>Fee: <strong>₹{selectedReservation.amount_charged || '0'}</strong></p>
                  </div>
                </div>

                {/* Cancel Booking Section */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-3">
                  <label className="block text-[11px] uppercase font-bold text-gray-400">Cancellation Reason</label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g., Weather delay, Member phone request..."
                    className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                  />
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="w-full h-10 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Reservation & Free Slot'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: REGISTER NEW MEMBER
          ══════════════════════════════════════════════════ */}
          {isRegisterModalOpen && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Register New Member
                  </h3>
                  <button onClick={() => setIsRegisterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRegisterMemberSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Vikramaditya Rao"
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="member@example.com"
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={newMemberDob}
                        onChange={(e) => setNewMemberDob(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Membership Plan</label>
                      <select
                        value={newMemberPlanId || ''}
                        onChange={(e) => setNewMemberPlanId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                      >
                        <option value="">No Plan (Register First)</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.fee).toLocaleString('en-IN')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Address</label>
                    <input
                      type="text"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      placeholder="Residential address..."
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors mt-3"
                  >
                    {isRegistering ? 'Registering...' : 'Register Member & Generate QR Code'}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: MEMBER PROFILE & HISTORY DRAWER
          ══════════════════════════════════════════════════ */}
          {memberDetail && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#B89047] flex items-center justify-center font-bold text-base text-[#121214]">
                      {memberDetail.profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                        {memberDetail.profile.full_name}
                      </h3>
                      <p className="text-xs font-mono text-[#B89047]">{memberDetail.profile.member_code}</p>
                    </div>
                  </div>
                  <button onClick={() => setMemberDetail(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Phone</span>
                    <p className="font-semibold text-[#1D1D1F] dark:text-white mt-0.5">{memberDetail.profile.phone}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Email</span>
                    <p className="font-semibold text-[#1D1D1F] dark:text-white mt-0.5 truncate">{memberDetail.profile.email || '—'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Joined On</span>
                    <p className="font-semibold text-[#1D1D1F] dark:text-white mt-0.5">
                      {memberDetail.profile.joined_on ? new Date(memberDetail.profile.joined_on).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {/* Active Membership Plans */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-display">
                      Active Membership Plan
                    </h4>
                    <button
                      onClick={() => {
                        openAssignPlanModal(memberDetail.profile.id, memberDetail.profile.full_name);
                      }}
                      className="text-xs font-semibold text-[#B89047] hover:underline"
                    >
                      + Assign / Renew Plan
                    </button>
                  </div>
                  {memberDetail.active_memberships.length > 0 ? (
                    <div className="space-y-2">
                      {memberDetail.active_memberships.map((ms) => (
                        <div key={ms.id} className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#1D1D1F] dark:text-white">{ms.plan_name} Membership</p>
                            <p className="text-[11px] text-gray-500">
                              Valid: {new Date(ms.start_date).toLocaleDateString()} – {new Date(ms.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500">
                            {ms.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-black/15 dark:border-white/15 text-center text-xs text-gray-400">
                      No active membership plan currently assigned.
                    </div>
                  )}
                </div>

                {/* Past Bookings & Check-ins History */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bookings */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-display mb-2">
                      Recent Court Bookings
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {memberDetail.bookings.map((b) => (
                        <div key={b.id} className="p-2 rounded-xl border border-black/5 dark:border-white/5 text-[11px]">
                          <p className="font-semibold text-[#1D1D1F] dark:text-white">{b.court_name}</p>
                          <p className="text-gray-400">{new Date(b.starts_at).toLocaleDateString()} • {b.status}</p>
                        </div>
                      ))}
                      {memberDetail.bookings.length === 0 && (
                        <p className="text-xs text-gray-400">No booking history yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Check-ins */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-display mb-2">
                      Recent Check-Ins
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {memberDetail.checkIns.map((ci) => (
                        <div key={ci.id} className="p-2 rounded-xl border border-black/5 dark:border-white/5 text-[11px] flex justify-between">
                          <span className="font-mono text-gray-500">{new Date(ci.checked_in_at).toLocaleString()}</span>
                          <span className="font-semibold text-[#B89047]">{ci.method}</span>
                        </div>
                      ))}
                      {memberDetail.checkIns.length === 0 && (
                        <p className="text-xs text-gray-400">No check-ins recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: ASSIGN / RENEW PLAN
          ══════════════════════════════════════════════════ */}
          {isAssignPlanModalOpen && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
                  <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                    Assign Plan to {assignPlanMemberName}
                  </h3>
                  <button onClick={() => setIsAssignPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAssignPlanSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Select Membership Plan</label>
                    <select
                      value={assignPlanSelectedId || ''}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setAssignPlanSelectedId(id);
                        const p = plans.find((x) => x.id === id);
                        if (p) setAssignPlanFee(String(p.fee));
                      }}
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.duration_months} Mos) — ₹{Number(p.fee).toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Fee to Charge (₹)</label>
                    <input
                      type="number"
                      required
                      value={assignPlanFee}
                      onChange={(e) => setAssignPlanFee(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      * This workflow will activate the plan and automatically generate an unpaid invoice in the POS module.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isAssigningPlan}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors mt-2 cursor-pointer"
                  >
                    {isAssigningPlan ? 'Assigning...' : 'Activate Plan & Generate Invoice'}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: COLLECT PAYMENT (POS)
          ══════════════════════════════════════════════════ */}
          {selectedInvoice && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                      Collect Payment
                    </h3>
                    <p className="text-xs font-mono text-[#B89047]">{selectedInvoice.invoice_no}</p>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Billed To:</span>
                      <span className="font-bold text-[#1D1D1F] dark:text-white">{selectedInvoice.bill_to_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Invoice:</span>
                      <span className="font-semibold">₹{Number(selectedInvoice.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">Outstanding Balance:</span>
                      <span className="font-bold text-red-500 text-sm">₹{Number(selectedInvoice.balance_due).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Amount to Collect (₹) *</label>
                    <input
                      type="number"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Payment Method *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['UPI', 'Card', 'Cash', 'Online'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={cn(
                            'py-2 rounded-xl text-xs font-semibold border transition-colors',
                            paymentMethod === method
                              ? 'bg-[#B89047] text-white border-transparent shadow-sm'
                              : 'border-black/10 dark:border-white/10 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'
                          )}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Transaction Ref / Cheque #</label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. UPI Ref / Bank ID..."
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRecordingPayment}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors mt-2"
                  >
                    {isRecordingPayment ? 'Recording...' : 'Process Payment & Issue Receipt'}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: RECEIPT ACTION (PRINT / EMAIL)
          ══════════════════════════════════════════════════ */}
          {receiptData && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Payment Recorded Successfully
                </h3>
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Receipt #:</span>
                    <span className="font-mono font-bold text-[#B89047]">{receiptData.receipt_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Invoice #:</span>
                    <span className="font-mono">{receiptData.invoice_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member:</span>
                    <span className="font-bold">{receiptData.bill_to_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="font-bold text-emerald-500 text-sm">₹{Number(receiptData.amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method:</span>
                    <span className="font-semibold">{receiptData.method}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="h-11 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1.5"
                  >
                    <Printer size={15} />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => {
                      toast.success(`Receipt ${receiptData.receipt_no} dispatched via email & SMS`);
                      setReceiptData(null);
                    }}
                    className="h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Send Receipt</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: LOG NEW ENQUIRY (LEAD)
          ══════════════════════════════════════════════════ */}
          {isNewEnquiryModalOpen && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Log Visitor Enquiry
                  </h3>
                  <button onClick={() => setIsNewEnquiryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateEnquirySubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Visitor Full Name *</label>
                    <input
                      type="text"
                      required
                      value={enqName}
                      onChange={(e) => setEnqName(e.target.value)}
                      placeholder="e.g. Sunita Kulkarni"
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={enqPhone}
                        onChange={(e) => setEnqPhone(e.target.value)}
                        placeholder="+91 98000 12345"
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={enqEmail}
                        onChange={(e) => setEnqEmail(e.target.value)}
                        placeholder="visitor@example.com"
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Lead Source</label>
                      <select
                        value={enqSource}
                        onChange={(e) => setEnqSource(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                      >
                        <option value="Walk-in">Walk-in</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Member Referral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Primary Interest</label>
                      <select
                        value={enqSportId || ''}
                        onChange={(e) => setEnqSportId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                      >
                        <option value="">Full Club Membership</option>
                        {sports.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} Coaching / Play</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Notes / Requirement</label>
                    <textarea
                      rows={3}
                      value={enqMessage}
                      onChange={(e) => setEnqMessage(e.target.value)}
                      placeholder="e.g. Inquired about weekend coaching packages for 2 kids..."
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors mt-2"
                  >
                    {isSubmittingEnquiry ? 'Saving...' : 'Save Enquiry to Lead Tracker'}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* ══════════════════════════════════════════════════
              MODAL: FOLLOW-UP LEAD ACTION
          ══════════════════════════════════════════════════ */}
          {selectedEnquiry && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                      Follow Up: {selectedEnquiry.full_name}
                    </h3>
                    <p className="text-xs text-gray-500">{selectedEnquiry.phone}</p>
                  </div>
                  <button onClick={() => setSelectedEnquiry(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Update Status</label>
                    <select
                      value={enqStatus}
                      onChange={(e) => setEnqStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs font-semibold"
                    >
                      <option value="Open">Open</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Trial Scheduled">Trial Scheduled</option>
                      <option value="Joined">Joined (Converted Member)</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Follow-Up Note Summary</label>
                    <textarea
                      rows={3}
                      value={enqNoteSummary}
                      onChange={(e) => setEnqNoteSummary(e.target.value)}
                      placeholder="e.g. Called visitor — scheduled court trial for Sunday 5 PM..."
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">Next Follow-Up Date</label>
                    <input
                      type="date"
                      value={enqFollowUpDate}
                      onChange={(e) => setEnqFollowUpDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-xs"
                    />
                  </div>

                  <button
                    onClick={handleUpdateEnquirySubmit}
                    disabled={isUpdatingEnquiry}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-[#B89047] text-white hover:bg-[#A67C38] transition-colors mt-2"
                  >
                    {isUpdatingEnquiry ? 'Saving...' : 'Save Follow-Up & Timeline Note'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Camera QR Scanner Modal */}
          <CameraQrScannerModal
            isOpen={isCameraScannerOpen}
            onClose={() => setIsCameraScannerOpen(false)}
            onScan={(decodedCode) => {
              setScannerInput(decodedCode);
              handleCheckInSubmit(decodedCode);
            }}
            title="Front Desk Member Verification"
          />

        </div>
      </PageLayout>
    </ProtectedRoute>
  );
};

export default ReceptionistPage;
