import React, { useState } from 'react';
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
  Info
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
  const [copied, setCopied] = useState(false);
  const [promptMode, setPromptMode] = useState('overview');

  const schoolLogo = getSiteLogo(student.school);
  const isKinder = student.isKinder;

  const handleCopyPrompt = (mode) => {
    const text = generateNotebookLMPrompt(student, mode);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER: Dark Navy (Matching Screenshot 4, 5, 6) */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
                  Teacher: {student.teacherName || 'Unassigned'}
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

        {/* MODAL NAVIGATION TABS: Top Pill Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: BENCHMARKS */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Trimester & Multi-Year Comparative Growth</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* STAR Reading or Amira */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {isKinder ? 'Amira Reading Assessment' : 'STAR Reading Score'}
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                      {isKinder ? (student.benchmarks?.amira || 'Not recorded') : (student.benchmarks?.starReading || 'Not recorded')}
                    </div>
                  </div>

                  {/* Math Common Assessment or Kinder Writing */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {isKinder ? 'Kindergarten Writing Assessment' : 'Math Common Assessment (Tri 1/2)'}
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                      {isKinder ? (student.benchmarks?.kinderWriting || 'Not recorded') : (student.benchmarks?.mathCa || 'Not recorded')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched Sheet Tabs & Raw Benchmarks */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Matched Sheet Assessment Tabs</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(student.assessmentsByTab || {}).map(([tab, metrics]) => (
                    <div key={tab} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>{tab}</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        {Object.entries(metrics).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 truncate max-w-[140px]">{k}:</span>
                            <span className="font-mono font-bold text-slate-800">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SBAC TRAJECTORY */}
          {activeTab === 'sbac' && !isKinder && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Latest Smarter Balanced ELA
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {student.sbac?.latestEla?.scaledScore || '—'}
                    </span>
                    <span className="text-xs font-bold text-blue-700">
                      {student.sbac?.latestEla?.rawLevel || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200/80">
                  <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                    Latest Smarter Balanced Math
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {student.sbac?.latestMath?.scaledScore || '—'}
                    </span>
                    <span className="text-xs font-bold text-indigo-700">
                      {student.sbac?.latestMath?.rawLevel || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historical Trajectory Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Longitudinal CAASPP Trajectory Records</span>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <p className="text-slate-600">
                    Smarter Balanced assessment histories are tracked across elementary grade levels to evaluate Distance to Standard (DFS) and year-over-year gains.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELPAC & ELD */}
          {activeTab === 'elpac' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Overall ELPAC
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                    {student.latestOverall?.rawLevel || 'Level ' + (student.latestOverall?.performanceLevel || '—')}
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Oral Language (Part 1)
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                    {student.latestOral?.rawLevel || 'Level ' + (student.latestOral?.performanceLevel || '—')}
                  </div>
                </div>

                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Written Language (Part 2)
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                    {student.latestWritten?.rawLevel || 'Level ' + (student.latestWritten?.performanceLevel || '—')}
                  </div>
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
