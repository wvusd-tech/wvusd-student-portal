import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Sparkles, BookOpen, Calculator, Languages, Lock, ArrowRight } from 'lucide-react';
import { DISTRICT_LOGO, GOOGLE_CLIENT_ID } from '../config/constants.js';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function LoginView({ onLoginSuccess, error, isLoading }) {
  const googleBtnRef = useRef(null);
  const [manualEmail, setManualEmail] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    /* global google */
    if (typeof window !== 'undefined' && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response && response.credential) {
              const payload = decodeJwt(response.credential);
              const email = payload?.email || '';
              onLoginSuccess(response.credential, email);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      } catch (err) {
        console.warn('GSI init notice:', err);
      }
    }
  }, [onLoginSuccess]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@wvusd.org')) return;
    onLoginSuccess('', manualEmail.trim().toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* District Logo */}
        <img
          src={DISTRICT_LOGO}
          alt="WVUSD Logo"
          className="mx-auto h-20 w-auto object-contain drop-shadow-sm mb-4"
        />

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Teacher Classroom Edition
          </span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          WVUSD Student 360
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Unified Assessment Portfolio for Walnut Valley Teachers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 space-y-6">
          
          {/* Feature Pillars: Clean 3 boxes with icon and title only */}
          <div className="grid grid-cols-3 gap-2 text-center pb-4 border-b border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Benchmarks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">SBAC</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <Languages className="w-5 h-5 text-amber-500 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">ELPAC</span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign in with your <strong>@wvusd.org</strong> account</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>Access Denied</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          {/* Loading State: Animated Bouncing Dots */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Loading classroom roster & assessment data...
              </span>
            </div>
          )}

          {/* Alternative Email Login Accordion */}
          <div className="pt-2 text-center">
            {!showManual ? (
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Sign in with verified staff email instead
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-100">
                <div className="relative">
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="username@wvusd.org"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!manualEmail.includes('@wvusd.org')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-600 disabled:bg-slate-300 text-white rounded-md text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Staff account verified against authoritative district directory.
                </p>
              </form>
            )}
          </div>

          {/* District Footnote */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Walnut Valley Unified School District · Zero-Trust Staff Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
