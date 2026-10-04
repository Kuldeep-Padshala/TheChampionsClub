import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  KeyRound,
  Settings,
  Percent,
  History,
  Lock,
  Unlock,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw,
  Save,
  Plus,
  ShieldCheck,
  Crown,
  FileText,
  Clock,
  UserCheck,
  UserX,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import {
  AdminUser,
  RoleWithPerms,
  Permission,
  ClubProfile,
  ClubSetting,
  TaxRate,
  AuditLog,
  AdminStats
} from '../types/admin.types';
import { cn } from '../utils/cn';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleWithPerms[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [settings, setSettings] = useState<ClubSetting[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Users Filter State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Password Reset Modal State
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [tempPassword, setTempPassword] = useState('Password@123');
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Role Permissions Selection State
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [activePermIds, setActivePermIds] = useState<number[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Club Profile Edit State
  const [profileForm, setProfileForm] = useState<Partial<ClubProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Tax Rate Modal State
  const [isAddTaxOpen, setIsAddTaxOpen] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [isSubmittingTax, setIsSubmittingTax] = useState(false);

  // Dynamic Settings Edit State
  const [editingSettingKey, setEditingSettingKey] = useState<string | null>(null);
  const [editingSettingValue, setEditingSettingValue] = useState<string>('');
  const [isSavingSetting, setIsSavingSetting] = useState(false);
  const [isAddSettingOpen, setIsAddSettingOpen] = useState(false);
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        statsData,
        usersData,
        rolesData,
        profileData,
        settingsData,
        taxData,
        auditData
      ] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getUsers().catch(() => []),
        adminService.getRolesAndPermissions().catch(() => ({ roles: [], permissions: [] })),
        adminService.getClubProfile().catch(() => null),
        adminService.getClubSettings().catch(() => []),
        adminService.getTaxRates().catch(() => []),
        adminService.getAuditLogs().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setUsersList(usersData);
      setRoles(rolesData.roles);
      setPermissions(rolesData.permissions);
      if (profileData) {
        setProfile(profileData);
        setProfileForm(profileData);
      }
      setSettings(settingsData);
      setTaxRates(taxData);
      setAuditLogs(auditData);

      // Set initial role permissions
      const initialRole = rolesData.roles.find(r => r.id === selectedRoleId) || rolesData.roles[0];
      if (initialRole) {
        setSelectedRoleId(initialRole.id);
        setActivePermIds(initialRole.permission_ids || []);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
      toast.error('Failed to load system administration data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update active permissions when selected role changes
  useEffect(() => {
    const role = roles.find(r => r.id === selectedRoleId);
    if (role) {
      setActivePermIds(role.permission_ids || []);
    }
  }, [selectedRoleId, roles]);

  // Toggle user lock
  const handleToggleLock = async (u: AdminUser) => {
    const action = u.status === 'suspended' ? 'unlock' : 'lock';
    try {
      const res = await adminService.toggleUserLock(u.id, action);
      toast.success(res.message);
      setUsersList(prev => prev.map(item => item.id === u.id ? { ...item, status: action === 'unlock' ? 'active' : 'suspended' } : item));
      adminService.getStats().then(s => setStats(s)).catch(() => {});
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to toggle account lock');
    }
  };

  // Force password reset
  const handleForcePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    setIsResettingPass(true);
    try {
      const res = await adminService.forcePasswordReset(resetUser.id, tempPassword);
      toast.success(res.message);
      setResetUser(null);
      setTempPassword('Password@123');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPass(false);
    }
  };

  // Toggle single permission checkbox
  const togglePermission = (permId: number) => {
    setActivePermIds(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  // Save role permissions
  const handleSavePermissions = async () => {
    setIsSavingPerms(true);
    try {
      const res = await adminService.updateRolePermissions(selectedRoleId, activePermIds);
      toast.success(res.message);
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permission_ids: activePermIds } : r));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Save club profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await adminService.updateClubProfile(profileForm);
      toast.success(res.message);
      setProfile(prev => ({ ...prev, ...profileForm } as ClubProfile));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update club profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Add new tax rate
  const handleAddTaxRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName || !newTaxRate) return;

    setIsSubmittingTax(true);
    try {
      const res = await adminService.addTaxRate({
        name: newTaxName.trim(),
        rate_pct: parseFloat(newTaxRate),
        is_active: 1
      });
      toast.success(res.message);
      setIsAddTaxOpen(false);
      setNewTaxName('');
      setNewTaxRate('');
      const updatedTaxes = await adminService.getTaxRates();
      setTaxRates(updatedTaxes);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add tax rate');
    } finally {
      setIsSubmittingTax(false);
    }
  };

  // Toggle Tax Rate Active
  const handleToggleTaxRate = async (rate: TaxRate) => {
    try {
      const newStatus = rate.is_active ? 0 : 1;
      await adminService.toggleTaxRate(rate.id, newStatus === 1);
      toast.success(`Tax rate ${rate.name} set to ${newStatus === 1 ? 'active' : 'inactive'}`);
      setTaxRates(prev => prev.map(r => r.id === rate.id ? { ...r, is_active: newStatus } : r));
    } catch (err: any) {
      toast.error('Failed to toggle tax rate');
    }
  };

  // Dynamic Settings Update Handler
  const handleSaveSetting = async (key: string, value: string) => {
    setIsSavingSetting(true);
    try {
      const res = await adminService.updateClubSetting(key, value);
      toast.success(res.message);
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      setEditingSettingKey(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update setting');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Dynamic Settings Create Handler
  const handleCreateSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSettingKey.trim()) {
      toast.error('Setting key cannot be empty');
      return;
    }
    try {
      const res = await adminService.updateClubSetting(newSettingKey.trim(), newSettingValue.trim());
      toast.success(res.message);
      setIsAddSettingOpen(false);
      setNewSettingKey('');
      setNewSettingValue('');
      const updated = await adminService.getClubSettings();
      setSettings(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create setting');
    }
  };

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    permissions.forEach(p => {
      const mod = p.module || 'general';
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    });
    return map;
  }, [permissions]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = userSearch.toLowerCase();
      const matchesSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchesRole =
        userRoleFilter === 'ALL' ||
        u.roles.includes(userRoleFilter);

      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0A0A0D] text-[#1D1D1F] dark:text-[#FAF8F5] pt-24 pb-16 px-3 sm:px-6 lg:px-8 font-sans selection:bg-[#B89047]/30 transition-colors">
      {/* ── Top Header / Station Badge ────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-[#14141A] dark:via-[#1A1A24] dark:to-[#121216] border border-black/10 dark:border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#0D0D12] flex items-center justify-center">
                <Settings className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  ⚙️ System Administrator
                </span>
                <span className="text-xs text-gray-500 dark:text-white/50 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-cyan-600 dark:text-cyan-400" /> Infrastructure, Access & Security Governance
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
                System Administration & Security Suite
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60">
                Administrator: <strong className="text-[#1D1D1F] dark:text-white">{user?.name || 'Vikram Batra'}</strong> • User Security, Role Matrices, Audit Logs & Club Parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-white/80 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
              <span>Refresh Registry</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Registered Accounts
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white">
                {stats?.totalUsers ?? usersList.length}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                {stats?.activeUsers ?? usersList.filter(u => u.status === 'active').length} active
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Locked / Suspended
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-rose-600 dark:text-red-400">
                {stats?.lockedUsers ?? usersList.filter(u => u.status === 'suspended').length}
              </span>
              <span className="text-xs text-gray-400 dark:text-white/40">accounts</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Configured Roles
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white">
                {roles.length}
              </span>
              <span className="text-xs text-cyan-600 dark:text-cyan-400">48 Permissions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              System Audit Entries
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white">
                {stats?.auditLogsCount ?? auditLogs.length}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Verified</span>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ──────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 p-1.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-sm overflow-x-auto select-none">
          <button
            onClick={() => setTab('users')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'users'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Users size={16} />
            <span>User Security & Access</span>
          </button>

          <button
            onClick={() => setTab('roles')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'roles'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <KeyRound size={16} />
            <span>Roles & Permissions Matrix</span>
          </button>

          <button
            onClick={() => setTab('settings')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Settings size={16} />
            <span>Club Profile & Settings</span>
          </button>

          <button
            onClick={() => setTab('taxes')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'taxes'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Percent size={16} />
            <span>Tax Slabs & GST</span>
          </button>

          <button
            onClick={() => setTab('audit')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <History size={16} />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ══════════════════════════════════════════════════════════
            TAB 1: USER SECURITY & ACCESS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="rounded-3xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  Personnel & Member Registry ({filteredUsers.length} accounts)
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Global directory of athletes, front desk, coaching staff, and management
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user, email or phone..."
                    className="w-56 sm:w-64 px-3 py-1.5 pl-8 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-cyan-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-[#14141A] text-black dark:text-white">All Roles</option>
                  <option value="SYSTEM_ADMIN" className="bg-white dark:bg-[#14141A] text-black dark:text-white">System Admin</option>
                  <option value="OWNER" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Owner</option>
                  <option value="MANAGER" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Manager</option>
                  <option value="FRONT_DESK" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Front Desk</option>
                  <option value="BAR_STAFF" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Bar Staff</option>
                  <option value="SHOP_STAFF" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Shop Staff</option>
                  <option value="ACCOUNTANT" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Accountant</option>
                  <option value="MEMBER" className="bg-white dark:bg-[#14141A] text-black dark:text-white">Member</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-white/40 font-semibold uppercase tracking-wider text-[10px] bg-stone-50 dark:bg-white/[0.02]">
                    <th className="py-3 px-3">Identity</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Role Authority</th>
                    <th className="py-3 px-3">Account State</th>
                    <th className="py-3 px-3">Created</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-xs text-black flex-shrink-0">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1D1D1F] dark:text-white">{u.full_name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-white/40">ID #{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-gray-700 dark:text-white/80 font-mono text-[11px]">{u.email}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white/40">{u.phone || 'No phone recorded'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r, i) => (
                            <span
                              key={i}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider',
                                r === 'SYSTEM_ADMIN' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30' :
                                r === 'OWNER' ? 'bg-amber-500/20 text-[#B89047] dark:text-[#EAD29A] border border-amber-500/30' :
                                r === 'MANAGER' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                                r === 'ACCOUNTANT' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                r === 'SHOP_STAFF' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' :
                                r === 'BAR_STAFF' ? 'bg-amber-600/15 text-amber-700 dark:text-amber-500' :
                                r === 'FRONT_DESK' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                                'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-white/70'
                              )}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            u.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                            u.status === 'suspended' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400' :
                            'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500')} />
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-white/50 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Force Password Reset */}
                          <button
                            onClick={() => setResetUser(u)}
                            className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            title="Force Password Reset"
                          >
                            <KeyRound size={14} />
                          </button>

                          {/* Lock / Unlock Toggle */}
                          <button
                            onClick={() => handleToggleLock(u)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors cursor-pointer',
                              u.status === 'suspended'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30'
                                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white'
                            )}
                            title={u.status === 'suspended' ? 'Unlock Account' : 'Lock & Suspend Account'}
                          >
                            {u.status === 'suspended' ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: ROLES & PERMISSIONS MATRIX
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'roles' && (
          <div className="rounded-3xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  Granular Role & Permissions Matrix
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Select a club role and configure exact read/write capability flags across all subsystems
                </p>
              </div>

              <button
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md self-start sm:self-auto"
              >
                <Save size={15} />
                <span>{isSavingPerms ? 'Persisting...' : 'Save Role Matrix'}</span>
              </button>
            </div>

            {/* Role Select Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                    selectedRoleId === r.id
                      ? 'bg-cyan-500 text-black font-bold shadow-md'
                      : 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
                  )}
                >
                  {r.name} ({r.permission_ids?.length || 0})
                </button>
              ))}
            </div>

            {/* Permissions Grouped By Module */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(permissionsByModule).map(([mod, perms]) => (
                <div key={mod} className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {mod}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-white/40">{perms.length} perms</span>
                  </div>

                  <div className="space-y-2">
                    {perms.map(p => {
                      const isChecked = activePermIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-xs select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            className="mt-0.5 rounded accent-cyan-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-mono text-[11px] text-[#1D1D1F] dark:text-white font-medium block">
                              {p.code}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-white/50 leading-tight block">
                              {p.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: CLUB PROFILE & SETTINGS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Global Club Profile Form */}
            <form onSubmit={handleSaveProfile} className="rounded-3xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Club Master Profile & Legal Coordinates
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    Official establishment identity displayed across tax invoices and digital receipts
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Save size={15} />
                  <span>{isSavingProfile ? 'Saving...' : 'Update Club Profile'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Club Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={profileForm.tagline || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={profileForm.tax_id || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Official Phone
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Base Currency & Timezone
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${profileForm.currency_code || 'INR'} • ${profileForm.timezone || 'Asia/Kolkata'}`}
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-black/60 border border-black/10 dark:border-white/10 text-gray-500 dark:text-white/50 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Address Line
                  </label>
                  <input
                    type="text"
                    value={profileForm.address_line1 || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, address_line1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </form>

            {/* Club Settings Key-Value Table (100% Dynamic & Editable) */}
            <div className="rounded-3xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Operational Runtime Parameters ({settings.length} keys)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/50">Live club business logic switches, booking cutoff horizons, and cash floats</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSettingOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Add Parameter</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/5">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-white/40 font-semibold uppercase tracking-wider text-[10px] bg-stone-50 dark:bg-white/[0.02]">
                      <th className="py-2.5 px-3">Parameter Key</th>
                      <th className="py-2.5 px-3">Configured Value</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {settings.map((s) => {
                      const isEditing = editingSettingKey === s.key;
                      return (
                        <tr key={s.key} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">{s.key}</td>
                          <td className="py-2.5 px-3 font-mono text-[#1D1D1F] dark:text-white">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingSettingValue}
                                  onChange={(e) => setEditingSettingValue(e.target.value)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-black/60 border border-cyan-500 text-xs font-mono text-[#1D1D1F] dark:text-white outline-none w-48 shadow-inner"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <span className="font-bold bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-[11px]">
                                {s.value}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 dark:text-white/50 text-[11px]">{s.description || 'System setting'}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={isSavingSetting}
                                  onClick={() => handleSaveSetting(s.key, editingSettingValue)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <Save size={12} />
                                  <span>{isSavingSetting ? 'Saving...' : 'Save'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSettingKey(null)}
                                  className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-gray-600 dark:text-white/70 text-[11px] transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSettingKey(s.key);
                                  setEditingSettingValue(s.value);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-medium text-[11px] transition-colors cursor-pointer"
                              >
                                Edit Value
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Setting Parameter Modal */}
            {isAddSettingOpen && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121216] border border-black/10 dark:border-white/15 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                    <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Add Runtime Parameter
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddSettingOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSetting} className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                        Parameter Key (Dot-Notation)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. club.guest_pass_limit"
                        value={newSettingKey}
                        onChange={(e) => setNewSettingKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                        Configured Value
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 or true or 1500"
                        value={newSettingValue}
                        onChange={(e) => setNewSettingValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsAddSettingOpen(false)}
                        className="px-3 py-2 rounded-xl text-gray-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        Save Parameter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: TAX RATES & GST SLABS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'taxes' && (
          <div className="rounded-3xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  Statutory Tax Slabs & GST Schedules
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Configure goods and services tax rates applied across invoice line items
                </p>
              </div>

              <button
                onClick={() => setIsAddTaxOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus size={15} />
                <span>Add Tax Bracket</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {taxRates.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[#1D1D1F] dark:text-white text-base block">{t.name}</span>
                    <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
                      {parseFloat(String(t.rate_pct))}%
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-white/40 mt-1 block">Slab ID #{t.id}</span>
                  </div>

                  <button
                    onClick={() => handleToggleTaxRate(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                      t.is_active
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-white/40 border-black/10 dark:border-white/10'
                    )}
                  >
                    {t.is_active ? 'Active Slab' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: SYSTEM SECURITY AUDIT LOGS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="rounded-3xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  Cryptographic System Audit Trail
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Tamper-evident chronological log of administrative and financial operations
                </p>
              </div>
              <span className="text-xs text-gray-400 dark:text-white/40 font-mono">
                {auditLogs.length} Records Verified
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-white/40 font-semibold uppercase tracking-wider text-[10px] bg-stone-50 dark:bg-white/[0.02]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action Signature</th>
                    <th className="py-2.5 px-3">Entity Reference</th>
                    <th className="py-2.5 px-3">Data Diff Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-gray-500 dark:text-white/50">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-[#1D1D1F] dark:text-white font-sans font-semibold">
                        {log.user_name || 'System Agent'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-white/60">
                        {log.entity_type} #{log.entity_id || 'Global'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 dark:text-white/40 max-w-xs truncate text-[10px]">
                        {log.new_values ? JSON.stringify(log.new_values) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: PASSWORD RESET ─────────────────────────────────── */}
      {resetUser && typeof document !== 'undefined' && createPortal(
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">Force Reset User Password</h3>
              <button
                onClick={() => setResetUser(null)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleForcePasswordReset} className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-white/60 mb-2">
                  Target Account: <strong className="text-[#1D1D1F] dark:text-white">{resetUser.full_name}</strong> ({resetUser.email})
                </p>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <p className="text-[11px] text-gray-500 dark:text-white/50">
                The user account will be unlocked, and they will be prompted to change their password on next login.
              </p>

              <button
                type="submit"
                disabled={isResettingPass}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isResettingPass ? 'Overwriting Credentials...' : 'Confirm Password Reset'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: ADD TAX BRACKET ────────────────────────────────── */}
      {isAddTaxOpen && typeof document !== 'undefined' && createPortal(
        <div data-lenis-prevent="true" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">Create New Tax Slab</h3>
              <button
                onClick={() => setIsAddTaxOpen(false)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTaxRate} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Bracket Label *
                </label>
                <input
                  type="text"
                  required
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                  placeholder="e.g. GST 18% or Special Duty 2%"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Rate Percentage (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                  placeholder="18.00"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTax}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTax ? 'Registering Slab...' : 'Create Tax Rate'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminPage;
