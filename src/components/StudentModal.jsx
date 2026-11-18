import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Calculator,
  Languages,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Award,
  Compass,
  ArrowLeft
} from 'lucide-react';
import {
  getSiteLogo,
  SBAC_PERFORMANCE_LEVELS,
  ELPAC_PERFORMANCE_LEVELS
} from '../config/constants.js';
import { generateNotebookLMPrompt } from '../utils/studentDataMerger.js';

export default function StudentModal({ student, onClose }) {
  if (!student) return null;

  const [activeTab, setActiveTab] = useState('benchmarks'); // 'benchmarks', 'sbac', 'elpac', 'prompt'
  const [benchmarkSubTab, setBenchmarkSubTab] = useState('overview'); // 'overview' | specific tab name (e.g. '5th ELA', '5th Math')
  const [copied, setCopied] = useState(false);
  const [promptMode, setPromptMode] = useState('overview');
  const [prevStudentId, setPrevStudentId] = useState(student.studentId || student.id);

  // Reset subtab when student changes
  if ((student.studentId || student.id) !== prevStudentId) {
    setPrevStudentId(student.studentId || student.id);
    setBenchmarkSubTab('overview');
    setActiveTab('benchmarks');
  }

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const schoolLogo = getSiteLogo(student.school);
  const isKinder = student.isKinder;
  const matchedTabs = student.matchedTabs || Object.keys(student.assessmentsByTab || {});

  // SBAC data
  const sortedEla = [...(student.sbac?.elaHistory || [])].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  const sortedMath = [...(student.sbac?.mathHistory || [])].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  const sortedPlacements = [...(student.sbac?.mathPlacements || [])].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));

  const handleCopyPrompt = (mode) => {
    const text = generateNotebookLMPrompt(student, mode);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getSbacLevelBadge = (level) => {
    if (!level || !SBAC_PERFORMANCE_LEVELS[level]) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 rounded border border-slate-200">
          {level ? `Level ${level}` : 'N/A'}
        </span>
      );
    }
    const conf = SBAC_PERFORMANCE_LEVELS[level];
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${conf.color}`}>
        {conf.badge}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MODAL HEADER: Dark Navy */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <img
              src={schoolLogo}
              alt="School Logo"
              className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-700 shadow-sm shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-900/80 text-blue-200 font-mono text-xs font-bold border border-blue-700">
                  ID #{student.studentId || student.id}
                </span>
                <span className="text-xs text-slate-300">
                  {isKinder ? 'Kindergarten' : `Grade ${student.gradeLevel || student.grade}`}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-300">
                  Teacher: {student.teacherName || student.teacher || 'Unassigned'}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                {student.name}
              </h2>

              <p className="text-xs text-slate-400">
                {student.school || 'Walnut Valley USD'} · Academic Year 2026-2027
              </p>

              {/* Flags Strip */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {student.flags?.sped && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-semibold">
                    SPED / IEP
                  </span>
                )}
                {student.flags?.plan504 && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-semibold">
                    504 Plan
                  </span>
                )}
                {student.flags?.elStatus && student.flags.elStatus !== 'EO' && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-semibold">
                    {student.flags.elStatus === 'RFEP' ? 'Redesignated (RFEP)' : `Active EL (${student.flags.elStatus})`}
                  </span>
                )}
                {student.flags?.homelessFoster && (
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-semibold">
                    Foster / Homeless
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY MODAL NAVIGATION TABS */}
        <div className="bg-slate-50 px-5 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'benchmarks'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Local Benchmarks & Growth</span>
            </button>

            {!isKinder && (
              <button
                onClick={() => setActiveTab('sbac')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sbac'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                <span>SBAC Trajectory (CAASPP)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('elpac')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'elpac'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-amber-500" />
              <span>Multi-Year ELPAC & ELD</span>
            </button>

            <button
              onClick={() => setActiveTab('prompt')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'prompt'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI NotebookLM Architect</span>
            </button>
          </div>

          {/* Quick Copy AI Prompt Button */}
          <button
            onClick={() => handleCopyPrompt(activeTab)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Prompt!' : 'Copy NotebookLM Prompt'}</span>
          </button>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: BENCHMARKS & MATCHED TABS */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Benchmarks Sub-Navigation Bar: Overview + Matched Sheet Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto">
                <button
                  onClick={() => setBenchmarkSubTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    benchmarkSubTab === 'overview'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Overview & YoY Growth</span>
                </button>

                {matchedTabs.map((tab) => {
                  const count = (student.assessmentsByTab?.[tab] || []).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setBenchmarkSubTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        benchmarkSubTab === tab
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {/math/i.test(tab) ? <Calculator className="w-3.5 h-3.5 text-indigo-500" /> : <BookOpen className="w-3.5 h-3.5 text-blue-500" />}
                      <span>{tab}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                        benchmarkSubTab === tab ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-view: OVERVIEW & COMPARATIVE GROWTH */}
              {benchmarkSubTab === 'overview' && (
                <div className="space-y-5">
                  
                  {/* Trimester & Multi-Year Comparative Growth */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span>Trimester & Multi-Year Comparative Growth</span>
                      </h3>
                      {student.yoyComparisons?.length > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {student.yoyComparisons.length} Active Growth Trackers
                        </span>
                      )}
                    </div>

                    {student.yoyComparisons && student.yoyComparisons.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {student.yoyComparisons.map((comp, idx) => (
                          <div
                            key={`${comp.family}-${idx}`}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1.5 mb-2">
                                <span className="font-bold text-xs text-slate-800 line-clamp-1" title={comp.family}>
                                  {comp.family}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                                  comp.growth?.tier === 'strong_growth' ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 font-extrabold' :
                                  comp.growth?.tier === 'moderate_growth' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  comp.growth?.tier === 'strong_decline' ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300 font-extrabold' :
                                  comp.growth?.tier === 'moderate_decline' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {comp.growth?.badge || '⚪ Recorded'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div>
                                  <div className="text-[10px] text-slate-400 font-semibold truncate" title={comp.prevYear}>
                                    {comp.prevYear}
                                  </div>
                                  <div className="text-base font-extrabold text-slate-800 truncate">
                                    {comp.prev?.parsed?.latest || 'N/A'}
                                  </div>
                                </div>
                                <div className="border-l border-slate-200 pl-2">
                                  <div className="text-[10px] text-slate-400 font-semibold truncate" title={comp.currYear}>
                                    {comp.currYear}
                                  </div>
                                  <div className="text-base font-extrabold text-blue-600 truncate">
                                    {comp.curr?.parsed?.latest || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Checkpoint Progression Trail (e.g. Tri 1: 29.73 -> Tri 2: 37.84 -> Tri 3: 18.92) */}
                            {comp.checkpoints && comp.checkpoints.length > 2 && (
                              <div className="pt-1">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Checkpoint Progression:
                                </div>
                                <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                                  {comp.checkpoints.map((cp, cIdx) => (
                                    <React.Fragment key={`${cp.header}-${cIdx}`}>
                                      <span className={`px-1.5 py-0.5 rounded border ${
                                        cIdx === comp.checkpoints.length - 1
                                          ? 'bg-blue-50 text-blue-700 font-bold border-blue-200'
                                          : 'bg-white text-slate-600 border-slate-200'
                                      }`}>
                                        {cp.period || cp.year}: {cp.parsed?.latest}
                                      </span>
                                      {cIdx < comp.checkpoints.length - 1 && (
                                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Standalone Baseline Score */}
                            {comp.baselineCol && (
                              <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                                <span className="text-slate-500 font-medium">
                                  {comp.baselineCol.label || 'Baseline'} (Score Only):
                                </span>
                                <span className="font-mono font-bold text-slate-700">
                                  {comp.baselineCol.parsed?.latest}
                                </span>
                              </div>
                            )}

                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                              {comp.growth?.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Fallback High-Level Benchmark Cards */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKinder ? 'Amira Reading Assessment' : 'STAR Reading Score'}
                          </span>
                          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                            {isKinder ? (student.benchmarks?.amira || 'Not recorded') : (student.benchmarks?.starReading || 'Not recorded')}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isKinder ? 'Kindergarten Writing Assessment' : 'Math Common Assessment (Tri 1/2)'}
                          </span>
                          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                            {isKinder ? (student.benchmarks?.kinderWriting || 'Not recorded') : (student.benchmarks?.mathCa || 'Not recorded')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Standalone Baseline Assessment Scores Strip */}
                  {student.baselineScores && student.baselineScores.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Baseline Assessment Scores (Reference Only):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {student.baselineScores.map((b, idx) => (
                          <span
                            key={`${b.header}-${idx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                          >
                            <span className="text-slate-500">{b.year ? `${b.year} ` : ''}{b.family} Baseline:</span>
                            <strong className="text-slate-900 font-extrabold">{b.parsed?.latest}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MATCHED SHEET TABS SUMMARY BUTTONS (Screenshot 3 & 4) */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Matched Sheet Tabs for Student ID #{student.studentId || student.id}
                      </h4>
                      <span className="text-xs text-slate-400">
                        {isKinder ? 'Kinder Roster' : `Grade ${student.gradeLevel || student.grade} Roster`}
                      </span>
                    </div>

                    {matchedTabs.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {matchedTabs.map((tab) => {
                          const colCount = (student.assessmentsByTab?.[tab] || []).length;
                          return (
                            <button
                              key={tab}
                              onClick={() => setBenchmarkSubTab(tab)}
                              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition text-left cursor-pointer group"
                            >
                              <div className="p-2 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200">
                                {/math/i.test(tab) ? (
                                  <Calculator className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                  {tab}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {colCount} {colCount === 1 ? 'column' : 'columns'} assessed →
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No matched assessment sheet tabs on file for this student.</p>
                    )}
                  </div>

                  {/* Quick Action to SST Generator */}
                  <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-purple-900">
                        SST NotebookLM Intervention Analysis Ready
                      </div>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Student metrics across all tabs and multi-year trajectories are formatted for instant AI synthesis.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('prompt')}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      View SST Prompt
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-view: SPECIFIC MATCHED SHEET TAB (Screenshot 4) */}
              {matchedTabs.includes(benchmarkSubTab) && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        {/math/i.test(benchmarkSubTab) ? <Calculator className="w-5 h-5 text-indigo-600" /> : <BookOpen className="w-5 h-5 text-blue-600" />}
                        <span>{benchmarkSubTab} Assessment Records</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Showing all {(student.assessmentsByTab?.[benchmarkSubTab] || []).length} assessment columns from the live Google Sheet for ID #{student.studentId || student.id}.
                      </p>
                    </div>

                    <button
                      onClick={() => setBenchmarkSubTab('overview')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Growth Overview</span>
                    </button>
                  </div>

                  {/* Grid of Assessment Column Cards (Screenshot 4) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(student.assessmentsByTab?.[benchmarkSubTab] || []).map((col, idx) => (
                      <div
                        key={`${col.header}-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-blue-300 transition flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 pr-1">
                            <div className="text-xs font-bold text-slate-900 truncate" title={col.header}>
                              {col.baseName || col.header}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-1.5 mt-1">
                              {col.year && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                                  {col.year}
                                </span>
                              )}
                              {col.period && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
                                  {col.period}
                                </span>
                              )}
                              <span className="truncate text-slate-500">{col.family}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                              {col.parsed?.latest ?? col.rawVal}
                            </span>
                          </div>
                        </div>

                        {/* Multi-Attempt Progression Trail */}
                        {col.parsed?.history && col.parsed.history.length > 1 && (
                          <div className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                            <span className="text-slate-400 font-sans text-[9px] uppercase font-bold mr-1">Progression:</span>
                            {col.parsed.history.join(' → ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SBAC TRAJECTORY & HISTORICAL TABLES */}
          {activeTab === 'sbac' && !isKinder && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Quick Metrics Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-semibold">Latest ELA Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {student.sbac?.latestEla?.scaledScore || '—'}
                    </span>
                    {student.sbac?.latestEla?.performanceLevel && (
                      <span className="text-[11px] font-semibold text-emerald-600">
                        Level {student.sbac.latestEla.performanceLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-semibold">ELA Growth Delta</span>
                  <div className="flex items-center gap-1 mt-1 font-bold font-mono text-sm">
                    {student.sbac?.elaDelta !== null && student.sbac?.elaDelta !== undefined ? (
                      <span className={student.sbac.elaDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {student.sbac.elaDelta >= 0 ? `+${student.sbac.elaDelta}` : student.sbac.elaDelta} pts
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-semibold">Latest Math Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {student.sbac?.latestMath?.scaledScore || '—'}
                    </span>
                    {student.sbac?.latestMath?.performanceLevel && (
                      <span className="text-[11px] font-semibold text-blue-600">
                        Level {student.sbac.latestMath.performanceLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-semibold">Math Growth Delta</span>
                  <div className="flex items-center gap-1 mt-1 font-bold font-mono text-sm">
                    {student.sbac?.mathDelta !== null && student.sbac?.mathDelta !== undefined ? (
                      <span className={student.sbac.mathDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {student.sbac.mathDelta >= 0 ? `+${student.sbac.mathDelta}` : student.sbac.mathDelta} pts
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Longitudinal Comparison Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* ELA History Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h3 className="text-sm font-bold text-slate-800">
                        Smarter Balanced ELA History
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {sortedEla.length} Test Records
                    </span>
                  </div>

                  {sortedEla.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No longitudinal ELA SBAC test administrations recorded.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-2 font-medium">Test Year</th>
                            <th className="pb-2 font-medium">Date Taken</th>
                            <th className="pb-2 font-medium">Scale Score</th>
                            <th className="pb-2 font-medium">Performance Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 font-mono">
                          {sortedEla.map((rec, i) => (
                            <tr key={i} className="hover:bg-white/80 transition-colors">
                              <td className="py-2.5 font-bold text-slate-700">{rec.year}</td>
                              <td className="py-2.5 text-slate-500 font-sans">{rec.dateTaken || '—'}</td>
                              <td className="py-2.5 font-bold text-slate-900">{rec.scaledScore}</td>
                              <td className="py-2.5 font-sans">{getSbacLevelBadge(rec.performanceLevel)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Math History Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h3 className="text-sm font-bold text-slate-800">
                        Smarter Balanced Mathematics History
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {sortedMath.length} Test Records
                    </span>
                  </div>

                  {sortedMath.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No longitudinal Math SBAC test administrations recorded.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-2 font-medium">Test Year</th>
                            <th className="pb-2 font-medium">Date Taken</th>
                            <th className="pb-2 font-medium">Scale Score</th>
                            <th className="pb-2 font-medium">Performance Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 font-mono">
                          {sortedMath.map((rec, i) => (
                            <tr key={i} className="hover:bg-white/80 transition-colors">
                              <td className="py-2.5 font-bold text-slate-700">{rec.year}</td>
                              <td className="py-2.5 text-slate-500 font-sans">{rec.dateTaken || '—'}</td>
                              <td className="py-2.5 font-bold text-slate-900">{rec.scaledScore}</td>
                              <td className="py-2.5 font-sans">{getSbacLevelBadge(rec.performanceLevel)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* District Math Placement Progression */}
              {sortedPlacements.length > 0 && (
                <div className="bg-slate-50/80 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        District Math Placement Assessments
                      </h3>
                    </div>
                    <span className="text-xs text-indigo-600 font-mono font-semibold">
                      {sortedPlacements.length} {sortedPlacements.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {sortedPlacements.map((p, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white rounded-xl p-3 border border-indigo-200 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-semibold text-slate-700">{p.testLabel || p.testKey}</span>
                            <span className="font-mono text-[10px] text-slate-400">{p.year || p.dateTaken || '—'}</span>
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-xl font-extrabold text-slate-900 font-mono">
                              {p.rawScore}
                            </span>
                            {p.percent !== null && (
                              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                {p.percent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Longitudinal Insights Callout */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <h4 className="font-bold text-blue-900 text-sm mb-1">
                    Longitudinal Progress Assessment
                  </h4>
                  <p>
                    {student.sbac?.elaDelta !== null && student.sbac?.elaDelta > 0 
                      ? `Student has demonstrated positive Year-over-Year acceleration in ELA (+${student.sbac.elaDelta} scale points). `
                      : student.sbac?.elaDelta !== null && student.sbac?.elaDelta < 0
                      ? `Student showed a -${Math.abs(student.sbac.elaDelta)} scale point retraction in ELA. Targeted claim support recommended. `
                      : ''}
                    {student.sbac?.mathDelta !== null && student.sbac?.mathDelta > 0
                      ? `In Mathematics, student advanced by +${student.sbac.mathDelta} scale points. `
                      : student.sbac?.mathDelta !== null && student.sbac?.mathDelta < 0
                      ? `In Mathematics, student shifted by ${student.sbac.mathDelta} points. `
                      : ''}
                    Use the AI NotebookLM tabs above to automatically generate calibrated SST/IEP goals and tiered lesson adaptations directly mapped to these test points.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ELPAC DOMAIN BREAKDOWN */}
          {activeTab === 'elpac' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall ELPAC</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {student.latestOverall?.rawLevel || (student.latestOverall?.performanceLevel ? `Level ${student.latestOverall.performanceLevel}` : 'Not recorded')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    Scale Score: {student.latestOverall?.scaledScore || '—'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Oral Language</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {student.latestOral?.rawLevel || (student.latestOral?.performanceLevel ? `Level ${student.latestOral.performanceLevel}` : 'Not recorded')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    Scale Score: {student.latestOral?.scaledScore || '—'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Written Language</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {student.latestWritten?.rawLevel || (student.latestWritten?.performanceLevel ? `Level ${student.latestWritten.performanceLevel}` : 'Not recorded')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    Scale Score: {student.latestWritten?.scaledScore || '—'}
                  </span>
                </div>
              </div>

              {/* Domain Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Listening</span>
                  <span className="text-base font-bold text-slate-800 mt-1 block font-mono">
                    {student.latestOverall?.domainListening || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Speaking</span>
                  <span className="text-base font-bold text-slate-800 mt-1 block font-mono">
                    {student.latestOverall?.domainSpeaking || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Reading</span>
                  <span className="text-base font-bold text-slate-800 mt-1 block font-mono">
                    {student.latestOverall?.domainReading || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Writing</span>
                  <span className="text-base font-bold text-slate-800 mt-1 block font-mono">
                    {student.latestOverall?.domainWriting || '—'}
                  </span>
                </div>
              </div>

              {/* Teacher Observations */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Teacher & Counselor Observations
                </h4>
                {(student.teacherComments || []).length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {student.teacherComments.map((c, i) => (
                      <li key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="font-bold text-slate-800">[{c.academicYear} {c.testWindow}]: </span>
                        <span>{c.comment}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No notes recorded for this student.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTEBOOKLM ARCHITECT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPromptMode('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    promptMode === 'overview'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  360° Comprehensive Brief
                </button>
                <button
                  onClick={() => setPromptMode('benchmarks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    promptMode === 'benchmarks'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  SST Intervention Brief
                </button>
                {!isKinder && (
                  <button
                    onClick={() => setPromptMode('sbac')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      promptMode === 'sbac'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    SBAC Standards Mastery
                  </button>
                )}
                <button
                  onClick={() => setPromptMode('elpac')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    promptMode === 'elpac'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ELD & Reclassification (RFEP)
                </button>
              </div>

              {/* Code/Markdown Box */}
              <div className="relative">
                <pre className="w-full bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96 leading-relaxed border border-slate-800">
                  {generateNotebookLMPrompt(student, promptMode)}
                </pre>
                <button
                  onClick={() => handleCopyPrompt(promptMode)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Student: <strong className="text-slate-800">{student.name}</strong> · #{student.studentId || student.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
