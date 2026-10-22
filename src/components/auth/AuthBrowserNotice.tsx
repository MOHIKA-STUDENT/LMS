'use client';

import { useState, useEffect } from 'react';
import { Smartphone, ExternalLink, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuthBrowserNoticeProps {
  formType?: 'register' | 'login';
  isClerkLoaded?: boolean;
}

export function AuthBrowserNotice({ formType = 'register', isClerkLoaded = false }: AuthBrowserNoticeProps) {
  const [isMiBrowser, setIsMiBrowser] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isMi = /MiuiBrowser|XiaoMi|MiBrowser/i.test(ua);
    const isOtherOEM = /UCBrowser|OppoBrowser|HeyTapBrowser|VivoBrowser/i.test(ua);
    const isAndr = /Android/i.test(ua);

    setIsMiBrowser(isMi || isOtherOEM);
    setIsAndroid(isAndr);

    // If Clerk has not mounted within 4.5 seconds, surface the troubleshooting guidance
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenInChrome = () => {
    if (typeof window === 'undefined') return;
    try {
      const urlWithoutScheme = window.location.href.replace(/^https?:\/\//, '');
      // Standard Android Chrome Intent to launch directly into Google Chrome
      window.location.href = `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
    } catch {
      toast.error('Unable to open Chrome directly. Please copy the link below.');
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied! Open Chrome and paste the URL.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.info('Please copy the link from your browser address bar.');
    }
  };

  // Only show if Clerk is still not loaded after timeout, OR if an OEM browser is detected and taking time
  if (isClerkLoaded && !isMiBrowser) {
    return null;
  }

  if (!timedOut && !isMiBrowser) {
    return null;
  }

  return (
    <div className="w-full max-w-md bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 text-left space-y-3 animate-in fade-in duration-300">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 mt-0.5 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-200">
            {isMiBrowser ? 'Built-in Mobile Browser Detected' : 'Form taking longer to load?'}
          </h3>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            {isMiBrowser
              ? 'Xiaomi Mi Browser and older phone browsers often block authentication scripts or third-party cookies. For the best experience, open in Google Chrome.'
              : 'If the sign-in/sign-up box below remains blank, your mobile browser may have ad-block or third-party cookie restrictions enabled.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {isAndroid ? (
          <button
            type="button"
            onClick={handleOpenInChrome}
            className="col-span-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-medium text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-900/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Chrome</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleCopyLink}
          className={`${
            isAndroid ? 'col-span-1' : 'col-span-2'
          } py-2 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-all`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Link!' : 'Copy Page Link'}</span>
        </button>
      </div>

      <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300/70">
        <span className="flex items-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Or disable "Ad Blocker" in browser menu (☰)</span>
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-amber-300 hover:text-white underline flex items-center space-x-1 shrink-0 ml-2"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reload</span>
        </button>
      </div>
    </div>
  );
}
