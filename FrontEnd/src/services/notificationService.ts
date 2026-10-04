import api from '../api/client';

export interface ClubNotification {
  id: number;
  recipient_user_id?: number | null;
  type: 'booking' | 'payment' | 'membership' | 'order' | 'system' | 'general' | string;
  channel: string;
  title: string;
  body: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: number | boolean;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  unread_count: number;
  data: ClubNotification[];
}

export const notificationService = {
  /**
   * Fetch current notifications for the logged in user
   */
  async getNotifications(limit = 30, unreadOnly = false): Promise<NotificationsResponse> {
    try {
      const response = await api.get<NotificationsResponse>('/notifications', {
        params: { limit, unreadOnly: unreadOnly ? 'true' : 'false' },
      });
      return response.data;
    } catch (error) {
      console.error('[notificationService.getNotifications]', error);
      return { success: false, unread_count: 0, data: [] };
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: number): Promise<boolean> {
    try {
      const response = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
      return !!response.data.success;
    } catch (error) {
      console.error('[notificationService.markAsRead]', error);
      return false;
    }
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await api.patch<{ success: boolean }>('/notifications/read-all');
      return !!response.data.success;
    } catch (error) {
      console.error('[notificationService.markAllAsRead]', error);
      return false;
    }
  },
};
