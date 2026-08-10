"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Sparkles, Bot, Send } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isReview?: boolean;   
  reviewDate?: string;
}

export const AiReviewView: React.FC<{ userId: number }> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah tiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Tombol Review — manual, cuma kalau diklik
  const handleReview = async () => {
    setReviewLoading(true);
    try {
      const data = await api.getAiReviewPersonal(userId);
      const reviewMsg: Message = { role: 'assistant', content: data.review, isReview: true, reviewDate: data.date };
      setMessages((prev) => [...prev, reviewMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Gagal memuat review, coba lagi ya.' }]);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: Message = { role: 'user', content: chatInput.trim() };
    // history buat API: buang flag isReview/reviewDate, kirim role+content doang
    const historyForApi = messages.map(({ role, content }) => ({ role, content }));
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const { reply } = await api.chatCoach([...historyForApi, { role: 'user', content: userMsg.content }], userId);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Maaf, terjadi error. Coba lagi ya.' }]);
    }
    setChatLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-180px)]">
      {/* Header Coach + Tombol Review */}
      <div className="flex items-center justify-between mb-4 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Lean8 Coach</h2>
            <p className="text-[11px] text-slate-500">Chat nutrisi & diet personal</p>
          </div>
        </div>
        <button
          onClick={handleReview}
          disabled={reviewLoading || chatLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20 hover:opacity-95 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
        >
          <Sparkles className={`w-3.5 h-3.5 ${reviewLoading ? 'animate-spin' : ''}`} />
          {reviewLoading ? 'Memuat...' : 'Review Coach'}
        </button>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 px-6">
            <Bot className="w-14 h-14 text-slate-700" />
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Halo! Mau tanya apa hari ini?</p>
              <p className="text-xs text-slate-600">Atau klik <span className="text-teal-400 font-semibold">"Review Coach"</span> biar Coach rangkum progresmu.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {['Kenapa berat stuck?', 'Ide makan tinggi protein', 'Tips jaga fasting'].map((q) => (
                <button
                  key={q}
                  onClick={() => setChatInput(q)}
                  className="px-3 py-1.5 rounded-full text-[11px] bg-slate-900 border border-slate-800 text-slate-400 hover:border-teal-500/50 hover:text-teal-400 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-teal-500 text-slate-950 font-medium'
                : 'bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-line'
            }`}>
              {msg.isReview && (
                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono text-teal-400 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Review Coach • {msg.reviewDate}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-400">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Chat — sticky bawah */}
      <form onSubmit={handleChat} className="flex gap-2 pt-3 shrink-0 border-t border-slate-800/60 mt-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Tanya Coach sesuatu..."
          disabled={chatLoading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || chatLoading}
          className="px-4 py-3 bg-teal-500 text-slate-950 rounded-2xl font-semibold disabled:opacity-50 hover:bg-teal-400 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};