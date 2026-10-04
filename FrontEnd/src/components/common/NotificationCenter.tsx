import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Sparkles, Calendar, CreditCard, Crown, ShoppingBag, Radio, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, ClubNotification } from '../../services/notificationService';
import { websocketService } from '../../services/websocketService';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const NotificationCenter: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isNight = theme === 'night';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isLive, setIsLive] = useState(websocketService.getIsConnected());
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications(40);
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.unread_count || 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Subscribe to real-time WebSocket events
  useEffect(() => {
    // 1. Connection status listener
    const unsubConn = websocketService.on('connection_change', (data: { status: string }) => {
      setIsLive(data.status === 'connected');
    });

    // 2. Incoming live notification
    const unsubNotif = websocketService.on('notification', (newNotif: ClubNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubConn();
      unsubNotif();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notifId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await notificationService.markAsRead(notifId);
    if (success) {
      setNotifications((prev) =>
        prev?.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications((prev) => prev?.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar size={15} className={isNight ? 'text-emerald-400' : 'text-emerald-700'} />;
      case 'payment':
        return <CreditCard size={15} className={isNight ? 'text-[#EAD29A]' : 'text-[#7C500C]'} />;
      case 'membership':
        return <Crown size={15} className={isNight ? 'text-[#EAD29A]' : 'text-[#7C500C]'} />;
      case 'order':
        return <ShoppingBag size={15} className={isNight ? 'text-sky-400' : 'text-sky-700'} />;
      default:
        return <Sparkles size={15} className={isNight ? 'text-[#B89047]' : 'text-[#7C500C]'} />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className={cn(
          'relative p-2 sm:p-2.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center border active:scale-95',
          isNight
            ? 'bg-[#16161A] border-white/10 text-white hover:bg-[#202026] hover:border-[#B89047]/40'
            : 'bg-[#F7F5F0] border-black/5 text-[#121214] hover:bg-[#EFECE3] hover:border-[#B89047]/40',
          isOpen && (isNight ? 'border-[#B89047] ring-1 ring-[#B89047]/40' : 'border-[#7C500C] ring-1 ring-[#7C500C]/30')
        )}
        title={unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'Club Notifications'}
      >
        <Bell
          size={16}
          className={cn(
            'transition-transform duration-200',
            unreadCount > 0
              ? isNight ? 'text-[#EAD29A]' : 'text-[#7C500C]'
              : isNight ? 'text-neutral-400' : 'text-neutral-700'
          )}
        />

        {/* Pulse Beacon & Badge */}
        {unreadCount > 0 && (
          <>
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold shadow-md border-2',
                isNight
                  ? 'bg-gradient-to-r from-amber-500 to-[#B89047] text-black border-[#0A0A0D]'
                  : 'bg-gradient-to-r from-[#B89047] to-[#7C500C] text-white border-white'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-[#B89047] animate-ping opacity-40 pointer-events-none" />
          </>
        )}
      </button>

      {/* Luxury Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className={cn(
              'fixed sm:absolute top-20 sm:top-auto left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:mt-3 w-auto sm:w-[380px] rounded-3xl border z-50 overflow-hidden backdrop-blur-2xl',
              isNight
                ? 'bg-[#0E0E12]/98 border-white/15 text-white shadow-[0_24px_50px_rgba(0,0,0,0.85)]'
                : 'bg-white border-black/10 text-[#121214] shadow-[0_24px_50px_rgba(0,0,0,0.18)]'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('font-display font-bold text-sm tracking-wide', isNight ? 'text-white' : 'text-[#121214]')}>
                  Club Notifications
                </span>
                {isLive ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      isNight
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                    )}
                  >
                    <Radio size={10} className="animate-pulse" /> Live
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      isNight
                        ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    )}
                  >
                    Offline
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className={cn(
                      'text-[11px] font-medium transition-colors flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer',
                      isNight
                        ? 'text-[#B89047] hover:text-[#EAD29A] hover:bg-white/5'
                        : 'text-[#7C500C] hover:text-[#5C3A04] hover:bg-black/5 font-semibold'
                    )}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={13} />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'p-1 rounded-lg transition-colors cursor-pointer',
                    isNight ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                  )}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] px-4 pt-2 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
                  activeTab === 'all'
                    ? isNight
                      ? 'border-[#B89047] text-[#B89047]'
                      : 'border-[#7C500C] text-[#7C500C] font-bold'
                    : isNight
                    ? 'border-transparent text-neutral-400 hover:text-neutral-200'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                )}
              >
                <span>All</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    isNight ? 'bg-white/10 text-neutral-300' : 'bg-black/5 text-neutral-700 font-semibold'
                  )}
                >
                  {notifications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
                  activeTab === 'unread'
                    ? isNight
                      ? 'border-[#B89047] text-[#B89047]'
                      : 'border-[#7C500C] text-[#7C500C] font-bold'
                    : isNight
                    ? 'border-transparent text-neutral-400 hover:text-neutral-200'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                )}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isNight
                        ? 'bg-[#B89047]/20 text-[#EAD29A]'
                        : 'bg-[#FAF4E6] text-[#7C500C] border border-[#B89047]/40'
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.05] scrollbar-thin">
              {isLoading && notifications.length === 0 ? (
                <div className={cn('p-8 text-center text-xs', isNight ? 'text-neutral-400' : 'text-neutral-600')}>
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-1',
                      isNight ? 'bg-[#B89047]/10 text-[#B89047]' : 'bg-[#FAF4E6] text-[#7C500C]'
                    )}
                  >
                    <Sparkles size={22} />
                  </div>
                  <p className={cn('text-sm font-semibold', isNight ? 'text-neutral-300' : 'text-[#121214]')}>
                    You're all caught up
                  </p>
                  <p className={cn('text-xs max-w-[200px]', isNight ? 'text-neutral-500' : 'text-neutral-600')}>
                    No {activeTab === 'unread' ? 'unread' : ''} alerts or announcements at this time.
                  </p>
                </div>
              ) : (
                filteredNotifications?.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    className={cn(
                      'p-3.5 sm:p-4 transition-colors flex items-start gap-3 cursor-pointer group',
                      !notif.is_read
                        ? isNight
                          ? 'bg-[#181822]/80 hover:bg-[#20202e]'
                          : 'bg-[#FAF6EC] hover:bg-[#F3EDE0]'
                        : isNight
                        ? 'hover:bg-white/[0.03]'
                        : 'hover:bg-black/[0.02]'
                    )}
                  >
                    {/* Category Icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border',
                        isNight ? 'bg-[#1E1E26] border-white/10' : 'bg-[#FAF4E6] border-[#B89047]/30'
                      )}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          className={cn(
                            'text-xs truncate',
                            !notif.is_read
                              ? isNight
                                ? 'text-[#EAD29A] font-bold'
                                : 'text-[#7C500C] font-bold'
                              : isNight
                              ? 'text-neutral-200 font-medium'
                              : 'text-[#18181B] font-semibold'
                          )}
                        >
                          {notif.title}
                        </h4>
                        <span
                          className={cn(
                            'text-[10px] flex-shrink-0',
                            isNight ? 'text-neutral-400' : 'text-neutral-500 font-medium'
                          )}
                        >
                          {formatTimestamp(notif.created_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-xs leading-relaxed line-clamp-2',
                          isNight ? 'text-neutral-300' : 'text-[#374151]'
                        )}
                      >
                        {notif.body}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notif.is_read && (
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0 mt-2',
                          isNight
                            ? 'bg-[#B89047] shadow-[0_0_8px_rgba(184,144,71,0.6)]'
                            : 'bg-[#7C500C] shadow-[0_0_6px_rgba(124,80,12,0.4)]'
                        )}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className={cn(
                'p-3 border-t text-center text-[11px]',
                isNight
                  ? 'bg-black/30 border-white/[0.08] text-neutral-400'
                  : 'bg-[#F9F8F6] border-black/[0.06] text-neutral-600 font-medium'
              )}
            >
              <span>The Champions Club Real-Time Dispatch</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
