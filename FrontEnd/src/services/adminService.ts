import api from '../api/client';
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

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await api.get('/admin/stats');
    return res.data.data;
  },

  async getUsers(): Promise<AdminUser[]> {
    const res = await api.get('/admin/users');
    return res.data.data || [];
  },

  async toggleUserLock(id: number, action: 'lock' | 'unlock'): Promise<{ message: string }> {
    const res = await api.patch(`/admin/users/${id}/lock`, { action });
    return res.data;
  },

  async forcePasswordReset(id: number, new_password?: string): Promise<{ message: string }> {
    const res = await api.post(`/admin/users/${id}/reset-password`, { new_password: new_password || 'Password@123' });
    return res.data;
  },

  async getRolesAndPermissions(): Promise<{ roles: RoleWithPerms[]; permissions: Permission[] }> {
    const res = await api.get('/admin/roles');
    return res.data.data;
  },

  async updateRolePermissions(roleId: number, permission_ids: number[]): Promise<{ message: string }> {
    const res = await api.patch(`/admin/roles/${roleId}/permissions`, { permission_ids });
    return res.data;
  },

  async getClubProfile(): Promise<ClubProfile> {
    const res = await api.get('/admin/profile');
    return res.data.data;
  },

  async updateClubProfile(data: Partial<ClubProfile>): Promise<{ message: string }> {
    const res = await api.patch('/admin/profile', data);
    return res.data;
  },

  async getClubSettings(): Promise<ClubSetting[]> {
    const res = await api.get('/admin/settings');
    return res.data.data || [];
  },

  async updateClubSetting(key: string, value: string): Promise<{ message: string }> {
    const res = await api.patch('/admin/settings', { key, value });
    return res.data;
  },

  async getTaxRates(): Promise<TaxRate[]> {
    const res = await api.get('/admin/tax-rates');
    return res.data.data || [];
  },

  async addTaxRate(data: { name: string; rate_pct: number; is_active?: number }): Promise<{ message: string; taxRateId: number }> {
    const res = await api.post('/admin/tax-rates', data);
    return res.data;
  },

  async toggleTaxRate(id: number, is_active: boolean): Promise<{ message: string }> {
    const res = await api.patch(`/admin/tax-rates/${id}/toggle`, { is_active });
    return res.data;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await api.get('/admin/audit-logs');
    return res.data.data || [];
  },
};
