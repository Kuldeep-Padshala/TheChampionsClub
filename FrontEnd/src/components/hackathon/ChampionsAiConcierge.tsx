import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Zap,
  Calendar,
  Trophy,
  Coffee,
  ShoppingBag,
  ArrowRight,
  Bot,
  User,
  ChevronDown,
  Minimize2
} from 'lucide-react';
import api from '../../api/client';
import { cn } from '../../utils/cn';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: {
    type: string;
    label?: string;
    path?: string;
    options?: string[];
  } | null;
}

interface ChampionsAiConciergeProps {
  onTriggerEmergencyRestring?: () => void;
  onTriggerTrialModal?: () => void;
  onTriggerTourModal?: () => void;
}

export const ChampionsAiConcierge: React.FC<ChampionsAiConciergeProps> = ({
  onTriggerEmergencyRestring,
  onTriggerTrialModal,
  onTriggerTourModal,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'ai',
      text: 'Welcome to The Champions Club! I am your AI Club Concierge. How can I elevate your sporting experience today?',
      action: {
        type: 'SUGGESTIONS',
        options: [
          '⚡ 10-Min Emergency String Repair',
          '📅 Check Court Slots',
          '🎟️ Book Free Trial Session',
          '👑 Gold vs Silver Perks',
          '🏆 Hackathon Story Tour',
        ],
      },
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/public/ai-concierge', { message: text });
      const aiReply: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: res.data?.reply || 'I am ready to assist you with court bookings, memberships, or emergency gear!',
        action: res.data?.action || null,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: 'Our AI concierge is connected to the club network! You can view court slots on the Courts page or choose a membership tier.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: any) => {
    if (!action) return;
    if (action.type === 'NAVIGATE' && action.path) {
      setIsOpen(false);
      navigate(action.path);
    } else if (action.type === 'EMERGENCY_RESTRING' && onTriggerEmergencyRestring) {
      setIsOpen(false);
      onTriggerEmergencyRestring();
    } else if (action.type === 'BOOK_TRIAL' && onTriggerTrialModal) {
      setIsOpen(false);
      onTriggerTrialModal();
    } else if (action.type === 'OPEN_TOUR' && onTriggerTourModal) {
      setIsOpen(false);
      onTriggerTourModal();
    }
  };

  return (
    <>
      {/* ── Floating Luxury Trigger Pill in Bottom-Right ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full bg-gradient-to-r from-[#121216] via-[#1F1F28] to-[#121216] text-white border border-[#B89047]/50 shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-[#B89047] hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          aria-label="Open AI Concierge"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B89047] animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAD29A]" />
          </div>
          <Sparkles size={16} className="text-[#EAD29A] group-hover:rotate-12 transition-transform" />
          <span className="font-display text-xs sm:text-sm font-semibold tracking-wide text-white">
            Ask Club AI Concierge
          </span>
        </button>
      )}

      {/* ── Floating Concierge Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-h-[600px] h-[82vh] bg-[#0E0E12] border border-[#B89047]/45 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 backdrop-blur-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#141418] via-[#1A1A22] to-[#141418] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#EAD29A] to-[#B89047] text-black flex items-center justify-center shadow-md">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-display font-bold text-sm text-white">Champions AI Concierge</h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-gray-400">Live Club Intelligence • 24/7 Match Assistance</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Minimize"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {messages?.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex gap-2.5',
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-[#18181F] border border-[#B89047]/30 text-[#EAD29A] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={12} />
                  </div>
                )}

                <div className="space-y-2 max-w-[82%]">
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl leading-relaxed text-xs shadow-sm',
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-[#B89047] to-[#D4AF37] text-black font-medium rounded-tr-none'
                        : 'bg-white/[0.05] border border-white/10 text-gray-200 rounded-tl-none'
                    )}
                  >
                    {m.text}
                  </div>

                  {/* Suggestion action pills */}
                  {m.action?.type === 'SUGGESTIONS' && Array.isArray(m.action.options) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.action.options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(opt.replace(/^[^a-zA-Z0-9]+/, ''))}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/15 text-gray-300 hover:border-[#B89047] hover:text-[#EAD29A] transition-all cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single CTA action button */}
                  {m.action && m.action.type !== 'SUGGESTIONS' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#B89047] text-black hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      <span>{m.action.label || 'Take Action'}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-gray-400 text-xs italic">
                <span className="w-2 h-2 rounded-full bg-[#B89047] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#B89047] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#B89047] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1">Concierge consulting club database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-hide text-[11px]">
            <button
              onClick={() => handleSend('Emergency Racket Restringing')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium whitespace-nowrap hover:bg-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Zap size={11} />
              <span>10-Min String Repair</span>
            </button>
            <button
              onClick={() => handleSend('Are courts free today?')}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium whitespace-nowrap hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Calendar size={11} />
              <span>Free Slots</span>
            </button>
            <button
              onClick={() => handleSend('Explain membership plans')}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium whitespace-nowrap hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trophy size={11} />
              <span>Plans</span>
            </button>
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#121216] border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about courts, plans, pro shop..."
              className="flex-1 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-white text-xs outline-none focus:border-[#B89047]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-[#B89047] to-[#D4AF37] text-black flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
