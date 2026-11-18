import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import FilterBar from './components/FilterBar.jsx';
import StudentCard from './components/StudentCard.jsx';
import StudentModal from './components/StudentModal.jsx';
import LoginView from './components/LoginView.jsx';
import TeacherMirrorSelector from './components/TeacherMirrorSelector.jsx';

import {
  fetchRosterAndElpac,
  fetchSbacData,
  fetchDataPortalData
} from './services/api.js';
import { mergeStudentStreams } from './utils/studentDataMerger.js';
import { Sparkles, Users, RefreshCw, UserCheck, Eye, ArrowRightLeft } from 'lucide-react';
import { getSiteLogo } from './config/constants.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [allDistrictStudents, setAllDistrictStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Super Admin Teacher Mirroring
  const [mirroredTeacher, setMirroredTeacher] = useState(null);
  const [showMirrorModal, setShowMirrorModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === 'SuperAdmin' || user.school === 'ALL' || user.email === 'kwendland@wvusd.org';
  }, [user]);

  // Handle Google Login / Auth
  const handleLogin = useCallback(async (idToken, fallbackEmail = '') => {
    setIsLoadingRoster(true);
    setAuthError(null);

    try {
      // 1. Initial Roster + ELPAC fetch (anchor)
      const data = await fetchRosterAndElpac(fallbackEmail, idToken);

      if (!data || !data.user || !data.user.authorized) {
        throw new Error(data?.message || 'Unauthorized user account.');
      }

      const activeUser = data.user;
      setUser(activeUser);

      const baseList = mergeStudentStreams(data.students || [], [], []);
      setAllDistrictStudents(baseList);
      setIsLoadingRoster(false);

      // Save session
      sessionStorage.setItem('wvusd_user_email', activeUser.email);
      if (idToken) sessionStorage.setItem('wvusd_user_token', idToken);

      // If SuperAdmin, show mirror modal automatically
      const isAdmin = activeUser.role === 'SuperAdmin' || activeUser.school === 'ALL' || activeUser.email === 'kwendland@wvusd.org';
      if (isAdmin) {
        setShowMirrorModal(true);
      }

      // 2. Background Parallel Fetch: SBAC + Data Portal
      setIsLoadingStreams(true);
      const [sbacRes, dataRes] = await Promise.allSettled([
        fetchSbacData(activeUser.email),
        fetchDataPortalData(activeUser.email)
      ]);

      const sbacStudents = sbacRes.status === 'fulfilled' ? sbacRes.value : [];
      const dataStudents = dataRes.status === 'fulfilled' ? dataRes.value : [];

      // Hydrate streams
      const fullyMerged = mergeStudentStreams(baseList, sbacStudents, dataStudents);
      setAllDistrictStudents(fullyMerged);
      setIsLoadingStreams(false);

    } catch (err) {
      console.error('Login/Fetch Error:', err);
      setAuthError(err.message || 'Authentication failed. Please verify access with Tech TOSA.');
      setIsLoadingRoster(false);
      setIsLoadingStreams(false);
    }
  }, []);

  // Restore Session on Mount
  useEffect(() => {
    const cachedEmail = sessionStorage.getItem('wvusd_user_email');
    const cachedToken = sessionStorage.getItem('wvusd_user_token');
    if (cachedEmail || cachedToken) {
      handleLogin(cachedToken || '', cachedEmail || '');
    }
  }, [handleLogin]);

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setAllDistrictStudents([]);
    setSelectedStudent(null);
    setMirroredTeacher(null);
    setShowMirrorModal(false);
    setAuthError(null);
  };

  // Determine Classroom Students (either mirrored teacher's students or teacher's own students)
  const classroomStudents = useMemo(() => {
    if (isSuperAdmin) {
      if (!mirroredTeacher) return [];
      return allDistrictStudents.filter(s => {
        const tMatch = s.teacherEmail?.toLowerCase() === mirroredTeacher.email?.toLowerCase() ||
          s.teacherName?.toLowerCase() === mirroredTeacher.name?.toLowerCase();
        const sMatch = s.school === mirroredTeacher.school;
        return tMatch && sMatch;
      });
    }
    return allDistrictStudents;
  }, [isSuperAdmin, mirroredTeacher, allDistrictStudents]);

  // Extract Available Grades for Filter Bar
  const availableGrades = useMemo(() => {
    const set = new Set();
    classroomStudents.forEach(s => {
      if (s.isKinder) set.add('Kinder');
      else if (s.gradeNum !== undefined && s.gradeNum !== null) set.add(s.gradeNum);
    });
    return Array.from(set).sort((a, b) => {
      if (a === 'Kinder') return -1;
      if (b === 'Kinder') return 1;
      return a - b;
    });
  }, [classroomStudents]);

  // Demographic & Flag Counts
  const counts = useMemo(() => {
    return {
      total: classroomStudents.length,
      sped: classroomStudents.filter(s => s.flags?.sped).length,
      plan504: classroomStudents.filter(s => s.flags?.plan504).length,
      el: classroomStudents.filter(s => s.flags?.elStatus && s.flags.elStatus !== 'EO' && s.flags.elStatus !== 'RFEP').length,
      rfep: classroomStudents.filter(s => s.flags?.elStatus === 'RFEP').length,
      homelessFoster: classroomStudents.filter(s => s.flags?.homelessFoster).length
    };
  }, [classroomStudents]);

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return classroomStudents.filter(s => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const idMatch = String(s.studentId || s.id || '').includes(q);
        const teacherMatch = (s.teacherName || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !teacherMatch) return false;
      }

      // Grade Filter
      if (selectedGrade !== 'ALL') {
        if (selectedGrade === 'Kinder' && !s.isKinder) return false;
        if (selectedGrade !== 'Kinder' && s.gradeNum !== selectedGrade) return false;
      }

      // Demographic Chip Filter
      if (activeFilter === 'SPED' && !s.flags?.sped) return false;
      if (activeFilter === '504' && !s.flags?.plan504) return false;
      if (activeFilter === 'LEP' && (!s.flags?.elStatus || s.flags.elStatus === 'EO' || s.flags.elStatus === 'RFEP')) return false;
      if (activeFilter === 'RFEP' && s.flags?.elStatus !== 'RFEP') return false;
      if (activeFilter === 'FOSTER_HOMELESS' && !s.flags?.homelessFoster) return false;

      return true;
    });
  }, [classroomStudents, searchQuery, selectedGrade, activeFilter]);

  // If not logged in, render LoginView
  if (!user) {
    return (
      <LoginView
        onLoginSuccess={(token) => handleLogin(token, '')}
        error={authError}
        isLoading={isLoadingRoster}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar user={user} onLogout={handleLogout} />

      {/* SUPER ADMIN MIRROR BANNER */}
      {isSuperAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Eye className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Super Admin Mirror Mode:
                {mirroredTeacher ? (
                  <strong className="text-slate-900 ml-1">
                    {mirroredTeacher.name} ({mirroredTeacher.school} · {mirroredTeacher.gradeSummary} · {classroomStudents.length} Students)
                  </strong>
                ) : (
                  <span className="italic text-amber-700 ml-1">No classroom selected</span>
                )}
              </span>
            </div>

            <button
              onClick={() => setShowMirrorModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{mirroredTeacher ? 'Switch Teacher Classroom' : 'Select Teacher to Mirror'}</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Classroom Student Portfolio</span>
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {classroomStudents.length} Students
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select any student card to open the 360° Assessment Profile and generate AI NotebookLM intervention briefs.
            </p>
          </div>

          {/* Sync indicator */}
          {isLoadingStreams && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-xs animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>Hydrating SBAC & Benchmark records...</span>
            </div>
          )}
        </div>

        {/* If Super Admin has not selected a teacher yet */}
        {isSuperAdmin && !mirroredTeacher ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <UserCheck className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Super Admin Classroom Mirroring Required</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              To keep performance lightning fast and replicate the exact teacher experience, please choose a teacher classroom to mirror.
            </p>
            <button
              onClick={() => setShowMirrorModal(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Choose Teacher Classroom</span>
            </button>
          </div>
        ) : (
          <>
            {/* Filter & Search Bar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              selectedGrade={selectedGrade}
              onGradeChange={setSelectedGrade}
              availableGrades={availableGrades}
              counts={counts}
            />

            {/* Student Cards Grid */}
            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStudents.map(student => (
                  <StudentCard
                    key={student.studentId || student.id}
                    student={student}
                    onSelect={(st) => setSelectedStudent(st)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No students match your active filters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search query or switching your demographic filter back to "All Students".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('ALL');
                    setSelectedGrade('ALL');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* 360 Profile Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Super Admin Teacher Selector Modal */}
      {showMirrorModal && (
        <TeacherMirrorSelector
          students={allDistrictStudents}
          currentMirroredTeacher={mirroredTeacher}
          onSelectTeacher={(teacher) => {
            setMirroredTeacher(teacher);
            setShowMirrorModal(false);
            setSearchQuery('');
            setActiveFilter('ALL');
            setSelectedGrade('ALL');
          }}
          onClose={mirroredTeacher ? () => setShowMirrorModal(false) : null}
        />
      )}
    </div>
  );
}
