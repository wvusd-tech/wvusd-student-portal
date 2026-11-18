import React, { useState, useMemo } from 'react';
import { UserCheck, Search, School, Users, ChevronRight, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { getSiteLogo } from '../config/constants.js';

export default function TeacherMirrorSelector({
  students = [],
  onSelectTeacher,
  currentMirroredTeacher = null,
  lockedSchool = null,
  isSiteAdmin = false,
  onClose = null
}) {
  const [selectedSchool, setSelectedSchool] = useState(lockedSchool || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract teachers grouped by school
  const { schoolList, teachers } = useMemo(() => {
    const schools = new Set();
    const teacherMap = new Map();

    students.forEach(s => {
      const sch = s.school && s.school !== 'ALL' ? s.school : 'District Unassigned';
      schools.add(sch);

      // If site admin with locked school, only ingest teachers matching their site
      if (lockedSchool && sch.toLowerCase() !== lockedSchool.toLowerCase()) {
        return;
      }

      const teacher = (s.teacherName && s.teacherName !== 'Unassigned') ? s.teacherName : s.teacherEmail;
      if (!teacher) return;

      const key = `${sch}::${teacher}`;
      if (!teacherMap.has(key)) {
        teacherMap.set(key, {
          name: s.teacherName || teacher.split('@')[0],
          email: s.teacherEmail || '',
          school: sch,
          grades: new Set(),
          students: []
        });
      }

      const rec = teacherMap.get(key);
      rec.students.push(s);
      if (s.isKinder) rec.grades.add('Kinder');
      else if (s.gradeNum !== undefined) rec.grades.add(`Gr ${s.gradeNum}`);
    });

    const list = Array.from(teacherMap.values()).map(t => ({
      ...t,
      gradeSummary: Array.from(t.grades).join(', ') || 'Elementary'
    }));

    return {
      schoolList: Array.from(schools).sort(),
      teachers: list.sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [students, lockedSchool]);

  // Filter teachers by school & search query
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (!lockedSchool && selectedSchool !== 'ALL' && t.school !== selectedSchool) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = t.name.toLowerCase().includes(q);
        const emailMatch = t.email.toLowerCase().includes(q);
        const schoolMatch = t.school.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !schoolMatch) return false;
      }
      return true;
    });
  }, [teachers, selectedSchool, searchQuery, lockedSchool]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center gap-2 mb-1.5">
            {lockedSchool ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Site Administrator Mode · {lockedSchool}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Super Admin Mode
              </span>
            )}
          </div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <UserCheck className={`w-5 h-5 ${lockedSchool ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Select a Teacher Classroom to Mirror</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lockedSchool
              ? `Select any teacher at ${lockedSchool} to view their exact roster, 3-row cards, and AI NotebookLM prompts.`
              : 'Choose any classroom teacher to view their exact roster, 3-row cards, and AI NotebookLM prompts as they see it.'}
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teacher name or email..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* School Selector (or Locked Site Indicator) */}
            <div className="sm:w-64">
              {lockedSchool ? (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <School className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{lockedSchool}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded shrink-0">
                    Site Locked
                  </span>
                </div>
              ) : (
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  <option value="ALL">All School Sites ({schoolList.length})</option>
                  {schoolList.map(sch => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Teacher List (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredTeachers.map(teacher => {
                const schoolLogo = getSiteLogo(teacher.school);
                const isSelected = currentMirroredTeacher?.email === teacher.email && currentMirroredTeacher?.school === teacher.school;
                return (
                  <button
                    key={`${teacher.school}::${teacher.name}`}
                    onClick={() => onSelectTeacher(teacher)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={schoolLogo}
                        alt="School"
                        className="w-8 h-8 object-contain rounded-md border border-slate-100 p-0.5 bg-slate-50 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                          {teacher.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <span className="font-medium text-slate-600">{teacher.gradeSummary}</span>
                          <span>·</span>
                          <span className="truncate">{teacher.school}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-800 group-hover:border-blue-200">
                        {teacher.students.length} students
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No teachers found for {lockedSchool || 'your selection'}.
            </div>
          )}
        </div>

        {/* Footer */}
        {onClose && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
