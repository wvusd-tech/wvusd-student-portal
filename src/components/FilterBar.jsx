import React from 'react';
import { Search, Filter, Users, ShieldAlert, Sparkles, X } from 'lucide-react';

export default function FilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  selectedGrade,
  onGradeChange,
  availableGrades = [],
  counts = { total: 0, sped: 0, el: 0, rfep: 0, plan504: 0, homelessFoster: 0 }
}) {
  const filterChips = [
    { id: 'ALL', label: 'All Students', count: counts.total },
    { id: 'SPED', label: 'SPED / IEP', count: counts.sped, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: '504', label: '504 Plan', count: counts.plan504, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { id: 'LEP', label: 'Active EL', count: counts.el, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'RFEP', label: 'Redesignated (RFEP)', count: counts.rfep, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { id: 'FOSTER_HOMELESS', label: 'Foster / Homeless', count: counts.homelessFoster, color: 'text-purple-700 bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 mb-6 space-y-4">
      {/* Top Row: Search and Grade Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search students by name or ID..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grade Filter Buttons */}
        {availableGrades.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            <span className="text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Grade:
            </span>
            <button
              onClick={() => onGradeChange('ALL')}
              className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                selectedGrade === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {availableGrades.map((gr) => (
              <button
                key={gr}
                onClick={() => onGradeChange(gr)}
                className={`px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {gr === 0 || String(gr).toUpperCase() === 'K' ? 'Kinder' : `Gr ${gr}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row: Demographic Badges Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : chip.color || 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-white/80 text-slate-700 border border-slate-200/60'
                }`}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
