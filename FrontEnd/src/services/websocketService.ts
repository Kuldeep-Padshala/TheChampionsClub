import toast from 'react-hot-toast';
import { ClubNotification } from './notificationService';

type EventCallback<T = any> = (data: T) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected = false;

  constructor() {
    this.init();
  }

  /**
   * Derive WebSocket URL from environment or current host
   */
  private getWsUrl(): string {
    const customUrl = import.meta.env.VITE_WS_URL;
    if (customUrl) return customUrl;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const parsed = new URL(apiUrl);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}`;
    } catch {
      return 'ws://localhost:5000';
    }
  }

  /**
   * Connect or reconnect to WebSocket gateway
   */
  public init(): void {
    if (typeof window === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = this.getWsUrl();
      const wsUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { status: 'connected' });

        // Ensure auth handshake with current token
        if (token) {
          this.send('AUTH', { token });
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.warn('[WS Parse Error]', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', { status: 'disconnected' });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch (err) {
      console.warn('[WS Init Failed]', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.init();
    }, 4000);
  }

  /**
   * Luxury audio chime synthesizer for incoming VIP events
   */
  public playChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Champagne chime (chords 880Hz -> 1318.51Hz)
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Audio playback blocked or unsupported by browser policy
    }
  }

  /**
   * Handle parsed packets from server
   */
  private handleIncomingMessage(data: any): void {
    if (!data || !data.type) return;

    // 1. Direct In-App Notification
    if (data.type === 'NOTIFICATION' && data.notification) {
      const notif: ClubNotification = data.notification;
      this.playChime();

      // Show toast
      toast(notif.body || notif.title, {
        icon: '🔔',
        style: {
          background: '#0E0E12',
          color: '#FAF8F5',
          border: '1px solid rgba(184, 144, 71, 0.45)',
          boxShadow: '0 16px 36px rgba(0,0,0,0.8)',
        },
      });

      this.emit('notification', notif);
    }

    // 2. Real-Time Court Slot Activity
    if (data.type === 'COURT_SLOT_BOOKED' || data.type === 'COURT_SLOT_CANCELLED') {
      this.emit('court_slot_change', data);
    }

    // 3. Forward all types to raw listeners
    this.emit(data.type, data);
  }

  /**
   * Send JSON payload to gateway
   */
  public send(type: string, payload: Record<string, any> = {}): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, ...payload }));
    }
  }

  /**
   * Re-authenticate after login
   */
  public authenticate(token: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('AUTH', { token });
    } else {
      this.init();
    }
  }

  /**
   * Event subscription system
   */
  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.off(event, callback);
    };
  }

  public off(event: string, callback: EventCallback): void {
    const eventSet = this.listeners.get(event);
    if (eventSet) {
      eventSet.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventSet = this.listeners.get(event);
    if (eventSet) {
      eventSet.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[WS Listener error for ${event}]`, err);
        }
      });
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
