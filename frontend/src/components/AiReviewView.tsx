"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { wibDate } from "@/lib/time";
import { Sparkles, Send, X } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isReview?: boolean;   
  reviewDate?: string;
}

export const AiReviewView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chip saran kontekstual berdasarkan habit hari ini
  useEffect(() => {
    const today = wibDate();
    api.getDaily(today).then((log) => {
      const chips: string[] = [];
      if (!log.workout) chips.push("Ide gerakan tanpa alat");
      if (!log.ifCompleted) chips.push("Tips jaga fasting");
      if (!log.proteinCompleted) chips.push("Ide makan tinggi protein");
      if (!log.waterCompleted) chips.push("Cara minum lebih banyak");
      if (!log.sleepCompleted) chips.push("Tips tidur lebih cepat");
      if (!log.noSnack) chips.push("Cara tahan ngemil");
      setSuggestions(chips.length ? chips : ["Apa yang harus aku fokuskan hari ini?", "Evaluasi pola makanku", "Tips naikkan konsistensi"]);
    }).catch(() => {});
  }, []);

  // Auto-scroll ke bawah tiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Tombol Review — manual, cuma kalau diklik
  const handleReview = async () => {
    setReviewLoading(true);
    try {
      const data = await api.getAiReviewPersonal();
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
      const { reply } = await api.chatCoach([...historyForApi, { role: 'user', content: userMsg.content }]);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Maaf, terjadi error. Coba lagi ya.' }]);
    }
    setChatLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full px-4 pt-4 pb-4">
      {/* Header Coach + Tombol Review */}
      <div className="flex items-center justify-between mb-4 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center overflow-hidden">
            <img src="/mascot.webp" alt="Coach" className="w-8 h-8 object-cover object-top rounded-full" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lean Mode Coach</h2>
            <p className="text-[11px] text-slate-500">Chat nutrisi & diet personal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReview}
            disabled={reviewLoading || chatLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20 hover:opacity-95 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className={`w-3.5 h-3.5 ${reviewLoading ? 'animate-spin' : ''}`} />
            {reviewLoading ? 'Memuat...' : 'Review Coach'}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition" aria-label="Tutup">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 px-6">
            <img src="/mascot.webp" alt="Coach AI" className="h-28 w-auto" />
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Halo! Mau tanya apa hari ini?</p>
              <p className="text-xs text-slate-500">Atau klik <span className="text-teal-600 font-semibold">"Review Coach"</span> biar Coach rangkum progresmu.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setChatInput(q)}
                  className="px-3 py-1.5 rounded-full text-[11px] bg-white border border-slate-200 text-slate-500 hover:border-teal-500/50 hover:text-teal-600 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <img src="/mascot.webp" alt="Coach" className="w-7 h-7 rounded-full object-cover object-top shrink-0 bg-teal-500/10" />
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-teal-500 text-slate-950 font-medium'
                : 'bg-white border border-slate-200 text-slate-800 whitespace-pre-line'
            }`}>
              {msg.isReview && (
                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono text-teal-600 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Review Coach • {msg.reviewDate}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-500">
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

      {/* Input Chat — bubble melayang */}
      <form onSubmit={handleChat} className="shrink-0 mt-2 mb-1 flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1.5 pl-4 shadow-lg shadow-slate-900/5">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Tanya Coach sesuatu..."
          disabled={chatLoading}
          className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || chatLoading}
          className="w-10 h-10 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-teal-400 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};