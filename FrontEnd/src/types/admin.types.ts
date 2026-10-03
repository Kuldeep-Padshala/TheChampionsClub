export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'disabled';
  last_login_at?: string;
  created_at: string;
  roles: string[];
  role_names: string[];
}

export interface Permission {
  id: number;
  code: string;
  module: string;
  description: string;
}

export interface RoleWithPerms {
  id: number;
  code: string;
  name: string;
  description?: string;
  permission_ids: number[];
  permission_codes: string[];
}

export interface ClubProfile {
  id: number;
  name: string;
  tagline?: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website_url?: string;
  logo_url?: string;
  tax_id?: string;
  currency_code?: string;
  timezone?: string;
  updated_at?: string;
}

export interface ClubSetting {
  key: string;
  value: string;
  description?: string;
  updated_by?: number;
  updated_at?: string;
}

export interface TaxRate {
  id: number;
  name: string;
  rate_pct: number | string;
  is_active: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalMembers: number;
  totalStaff: number;
  auditLogsCount: number;
  settingsCount: number;
  dbStatus: string;
  nodeEnv: string;
}
