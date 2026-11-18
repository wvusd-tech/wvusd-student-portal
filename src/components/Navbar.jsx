import React from 'react';
import { LogOut, User, Sparkles, ShieldCheck } from 'lucide-react';
import { DISTRICT_LOGO, getSiteLogo } from '../config/constants.js';

export default function Navbar({ user, onLogout }) {
  const schoolLogo = getSiteLogo(user?.school);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: District Branding */}
        <div className="flex items-center gap-3">
          <img
            src={schoolLogo || DISTRICT_LOGO}
            alt="School Logo"
            className="w-10 h-10 object-contain rounded-lg border border-slate-200/80 bg-white p-0.5 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                WVUSD Student 360
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Teacher Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {user?.school && user.school !== 'ALL' ? user.school : 'Walnut Valley Unified School District'}
            </p>
          </div>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">{user.name || user.email}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{user.role || 'Teacher'}</span>
            </div>
          )}

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
