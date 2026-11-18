import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Sparkles, BookOpen, Calculator, Languages, Lock } from 'lucide-react';
import { DISTRICT_LOGO, GOOGLE_CLIENT_ID } from '../config/constants.js';

export default function LoginView({ onLoginSuccess, error, isLoading }) {
  const googleBtnRef = useRef(null);

  useEffect(() => {
    /* global google */
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response && response.credential) {
            onLoginSuccess(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
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
    }
  }, [onLoginSuccess]);

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
          
          {/* Feature Pillars */}
          <div className="grid grid-cols-3 gap-2 text-center pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <BookOpen className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-700 block">Benchmarks</span>
              <span className="text-[10px] text-slate-400">STAR & CAs</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Calculator className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-700 block">SBAC</span>
              <span className="text-[10px] text-slate-400">CAASPP DFS</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Languages className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-700 block">ELPAC</span>
              <span className="text-[10px] text-slate-400">ELD Progress</span>
            </div>
          </div>

          {/* Google Sign-in Button Container */}
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

          {/* Loading State */}
          {isLoading && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium text-center animate-pulse">
              Authenticating and fetching your classroom roster...
            </div>
          )}

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
