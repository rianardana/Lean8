"use client";

import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Register service worker (minimal, biar installable + standalone)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    if (ios) setShow(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Download className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-900">Install Lean Mode</p>
            {isIOS ? (
              <p className="text-xs text-slate-500">
                Buka menu Share di Safari, lalu pilih <span className="font-semibold">&quot;Add to Home Screen&quot;</span>.
              </p>
            ) : (
              <p className="text-xs text-slate-500">Pasang di home screen biar aksesnya makin cepat.</p>
            )}
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {!isIOS && (
        <button
          onClick={install}
          className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:opacity-95 transition"
        >
          Install
        </button>
      )}
    </div>
  );
};
