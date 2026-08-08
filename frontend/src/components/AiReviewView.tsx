"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Sparkles, Bot, CheckCircle2, ArrowRight, MessageCircle, Send } from "lucide-react";

type Mode = 'review' | 'chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiReviewView: React.FC<{ userId: number }> = ({ userId }) => {
  const [mode, setMode] = useState<Mode>('review');

  // Review state — sekarang personal AI (bukan pool manual)
  const [reviewLoading, setReviewLoading] = useState(false);
  const [review, setReview] = useState<{ date: string; review: string } | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      setReview(await api.getAiReviewPersonal(userId));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: Message = { role: 'user', content: chatInput.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const { reply } = await api.chatCoach(newMessages, userId);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Maaf, terjadi error. Coba lagi ya.' }]);
    }
    setChatLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('review')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition ${
            mode === 'review'
              ? "bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 border-transparent"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Review Harian
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border transition ${
            mode === 'chat'
              ? "bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 border-transparent"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <MessageCircle className="w-4 h-4" /> Chat Coach
        </button>
      </div>

      {/* REVIEW MODE — AI PERSONAL */}
      {mode === 'review' && (
        <>
          <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-teal-400 uppercase tracking-wider">Lean8 AI Coach</span>
                <h2 className="text-2xl font-bold text-slate-100">Review Harian Personal</h2>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Coach menganalisa makanan, habit, dan tren berat badanmu hari ini — lalu ngobrol natural soal progresmu. Bukan template, beneran personal.
            </p>
            <button
              onClick={handleReview}
              disabled={reviewLoading}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 animate-spin-slow" />
              <span>{reviewLoading ? "Coach lagi merhatiin harimu..." : "Review Hari Ini"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {reviewLoading && (
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Membaca makanan, habit & tren beratmu...</p>
            </div>
          )}

          {!reviewLoading && review && (
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  <span>Pesan Coach Untukmu</span>
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">{review.date}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{review.review}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Review ini disusun dari data aslimu hari ini — makin rajin isi log, makin personal sarannya.</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* CHAT MODE */}
      {mode === 'chat' && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Chat dengan Coach</h3>
              <p className="text-[11px] text-slate-500">Spesialis nutrisi, diet & kesehatan</p>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Tanya apa aja soal nutrisi, diet, atau progress lo!</p>
                <p className="text-xs mt-1">Contoh: "Kenapa berat stuck?", "Ide makanan tinggi protein?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-500 text-slate-950 font-medium'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tanya Coach sesuatu..."
              disabled={chatLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-4 py-2.5 bg-teal-500 text-slate-950 rounded-2xl font-semibold disabled:opacity-50 hover:bg-teal-400 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};