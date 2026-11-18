import React from 'react';
import {
  BookOpen,
  Calculator,
  Languages,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Award
} from 'lucide-react';
import {
  getSiteLogo,
  SBAC_PERFORMANCE_LEVELS,
  ELPAC_PERFORMANCE_LEVELS
} from '../config/constants.js';

export default function StudentCard({ student, onSelect }) {
  const schoolLogo = getSiteLogo(student.school);
  const isKinder = student.isKinder;
  const isEnglishOnly = !student.flags?.elStatus || student.flags?.elStatus === 'EO';

  // SBAC Badges & Single-Row values
  const elaScore = student.sbac?.latestEla?.scaledScore;
  const elaLevel = student.sbac?.latestEla?.performanceLevel;
  const elaBadge = SBAC_PERFORMANCE_LEVELS[elaLevel];

  const mathScore = student.sbac?.latestMath?.scaledScore;
  const mathLevel = student.sbac?.latestMath?.performanceLevel;
  const mathBadge = SBAC_PERFORMANCE_LEVELS[mathLevel];

  // ELPAC Badges
  const elpacOverallLevel = student.latestOverall?.performanceLevel;
  const elpacOverallBadge = ELPAC_PERFORMANCE_LEVELS[elpacOverallLevel];
  const elpacOralLevel = student.latestOral?.performanceLevel;
  const elpacOralBadge = ELPAC_PERFORMANCE_LEVELS[elpacOralLevel];

  // Benchmarks / Local Data
  const starReading = student.benchmarks?.starReading;
  const mathCa = student.benchmarks?.mathCa;
  const amira = student.benchmarks?.amira;
  const kinderWriting = student.benchmarks?.kinderWriting;

  return (
    <div
      onClick={() => onSelect(student)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden relative"
    >
      {/* Top Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

      <div className="p-4 space-y-3">
        {/* Card Header: Student Name, ID, Grade & School Logo */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base truncate">
              {student.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="font-mono text-slate-400">#{student.studentId || student.id}</span>
              <span>·</span>
              <span className="font-semibold text-slate-700">
                {isKinder ? 'Kinder' : `Grade ${student.gradeLevel || student.grade}`}
              </span>
              {student.teacherName && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[120px] text-slate-600 font-medium">
                    {student.teacherName}
                  </span>
                </>
              )}
            </div>
          </div>

          <img
            src={schoolLogo}
            alt={student.school || 'School'}
            className="w-8 h-8 object-contain rounded-md border border-slate-100 p-0.5 bg-slate-50/50 shrink-0"
          />
        </div>

        {/* Demographic Badges Strip */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          {student.flags?.sped && (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              SPED / IEP
            </span>
          )}
          {student.flags?.plan504 && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              504 Plan
            </span>
          )}
          {student.flags?.elStatus && student.flags.elStatus !== 'EO' && (
            <span
              className={`px-2 py-0.5 rounded-md border ${
                student.flags.elStatus === 'RFEP'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {student.flags.elStatus === 'RFEP' ? 'RFEP' : `Active EL (${student.flags.elStatus})`}
            </span>
          )}
          {student.flags?.homelessFoster && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              Foster / Homeless
            </span>
          )}
        </div>

        {/* 3 Core Data Rows */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          {/* ROW 1: Benchmarks / Local Data */}
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
            {isKinder ? (
              // Kindergarten: Amira & Writing
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-slate-700">Amira:</span>
                  <span className="font-mono font-bold text-slate-900">{amira || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  <span className="font-semibold text-slate-700">Writing:</span>
                  <span className="font-mono font-bold text-slate-900">{kinderWriting || '—'}</span>
                </div>
              </div>
            ) : (
              // Grade 1-5: STAR Reading & Math Common Assessment
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-slate-700">STAR Reading:</span>
                  <span className="font-mono font-bold text-slate-900">{starReading || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-semibold text-slate-700">Math CA:</span>
                  <span className="font-mono font-bold text-slate-900">{mathCa || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* ROW 2: SBAC CAASPP (Single Line: ELA & Math) */}
          {!isKinder && (
            <div className="bg-blue-50/40 rounded-xl p-2.5 border border-blue-100/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 font-semibold text-blue-900">
                <span>SBAC:</span>
              </div>
              <div className="flex items-center gap-3">
                {/* ELA */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-medium">ELA:</span>
                  <span className="font-mono font-bold text-slate-900">{elaScore || '—'}</span>
                  {elaBadge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${elaBadge.color}`}>
                      L{elaLevel}
                    </span>
                  )}
                </div>
                <span className="text-slate-300">·</span>
                {/* Math */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-medium">Math:</span>
                  <span className="font-mono font-bold text-slate-900">{mathScore || '—'}</span>
                  {mathBadge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${mathBadge.color}`}>
                      L{mathLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ROW 3: ELPAC / Language Proficiency */}
          {!isEnglishOnly ? (
            <div className="bg-amber-50/40 rounded-xl p-2.5 border border-amber-100/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <Languages className="w-3.5 h-3.5 text-amber-600" />
                <span>ELPAC:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">Overall:</span>
                  {elpacOverallBadge ? (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${elpacOverallBadge.color}`}>
                      {elpacOverallBadge.badge}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-400">—</span>
                  )}
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">Oral:</span>
                  {elpacOralBadge ? (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${elpacOralBadge.color}`}>
                      {elpacOralBadge.badge}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-lg px-2.5 py-1 border border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Language Status:</span>
              <span className="font-medium text-slate-500">English Only (EO)</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Action Link */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:bg-blue-50/60 transition-colors">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>360° Profile & AI Prompts</span>
        </span>
        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
