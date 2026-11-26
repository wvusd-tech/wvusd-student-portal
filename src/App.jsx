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
import { Sparkles, Users, RefreshCw, UserCheck, Eye, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { getSiteLogo } from './config/constants.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [allDistrictStudents, setAllDistrictStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Admin Classroom Mirroring (Super Admin & Site Admin)
  const [mirroredTeacher, setMirroredTeacher] = useState(null);
  const [showMirrorModal, setShowMirrorModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

  // RBAC Roles
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === 'SuperAdmin' || user.school === 'ALL' || user.email === 'kwendland@wvusd.org';
  }, [user]);

  const isSiteAdmin = useMemo(() => {
    if (!user) return false;
    if (isSuperAdmin) return false;
    return user.role === 'SiteAdmin' || (user.assignedSites && user.assignedSites.length > 0 && user.school !== 'ALL');
  }, [user, isSuperAdmin]);

  const canMirrorTeachers = isSuperAdmin || isSiteAdmin;
  const lockedSchool = isSiteAdmin ? (user.assignedSites?.[0] || user.school) : null;

  // Handle Google Login / Auth
  const handleLogin = useCallback(async (idToken) => {
    if (!idToken || typeof idToken !== 'string' || idToken.trim().length <= 40) {
      sessionStorage.clear();
      setAuthError('Valid Google Sign-In credential is required.');
      return;
    }

    setIsLoadingRoster(true);
    setAuthError(null);

    try {
      // 1. Initial Roster + ELPAC fetch (anchor)
      const data = await fetchRosterAndElpac(idToken);

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
      sessionStorage.setItem('wvusd_user_token', idToken);

      // If SuperAdmin or SiteAdmin, show mirror modal automatically
      const isMirrorRole = activeUser.role === 'SuperAdmin' || activeUser.role === 'SiteAdmin' || activeUser.school === 'ALL' || activeUser.email === 'kwendland@wvusd.org' || (activeUser.assignedSites && activeUser.assignedSites.length > 0);
      if (isMirrorRole) {
        setShowMirrorModal(true);
      }

      // 2. Background Parallel Fetch: SBAC + Data Portal using verified id_token
      setIsLoadingStreams(true);
      const [sbacRes, dataRes] = await Promise.allSettled([
        fetchSbacData(idToken),
        fetchDataPortalData(idToken)
      ]);

      const sbacStudents = sbacRes.status === 'fulfilled' ? sbacRes.value : [];
      const dataStudents = dataRes.status === 'fulfilled' ? dataRes.value : [];

      // Hydrate streams
      const fullyMerged = mergeStudentStreams(baseList, sbacStudents, dataStudents);
      setAllDistrictStudents(fullyMerged);
      setIsLoadingStreams(false);

    } catch (err) {
      console.error('Login/Fetch Error:', err);
      sessionStorage.clear();
      setUser(null);
      setAllDistrictStudents([]);
      setAuthError(err.message || 'Authentication failed. Please verify access with Tech TOSA.');
      setIsLoadingRoster(false);
      setIsLoadingStreams(false);
    }
  }, []);

  // Restore Session on Mount (only if non-expired id_token exists)
  useEffect(() => {
    const cachedToken = sessionStorage.getItem('wvusd_user_token');
    if (cachedToken) {
      try {
        const payload = JSON.parse(atob(cachedToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload?.exp && payload.exp * 1000 <= Date.now()) {
          sessionStorage.clear();
          return;
        }
        handleLogin(cachedToken);
      } catch {
        sessionStorage.clear();
      }
    }
  }, [handleLogin]);

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setAllDistrictStudents([]);
    setSelectedStudent(null);
    setMirroredTeacher(null);
    setShowMirrorModal(false);
    setSearchQuery('');
    setActiveFilter('ALL');
    setSelectedGrade('ALL');
    setAuthError(null);
  };

  // Determine Classroom Students (either mirrored teacher's students or teacher's own students)
  const classroomStudents = useMemo(() => {
    if (canMirrorTeachers) {
      if (!mirroredTeacher) return [];
      return allDistrictStudents.filter(s => {
        const tMatch = s.teacherEmail?.toLowerCase() === mirroredTeacher.email?.toLowerCase() ||
          s.teacherName?.toLowerCase() === mirroredTeacher.name?.toLowerCase();
        const sMatch = !mirroredTeacher.school || s.school === mirroredTeacher.school;
        return tMatch && sMatch;
      });
    }
    return allDistrictStudents;
  }, [canMirrorTeachers, mirroredTeacher, allDistrictStudents]);

  // Extract Available Grades dynamically for filter buttons
  const availableGrades = useMemo(() => {
    const gradesSet = new Set();
    classroomStudents.forEach(s => {
      if (s.isKinder) gradesSet.add('Kinder');
      else if (s.gradeNum !== undefined && s.gradeNum !== null) gradesSet.add(s.gradeNum);
      else if (s.gradeLevel) gradesSet.add(s.gradeLevel);
    });

    const hasKinder = gradesSet.has('Kinder');
    gradesSet.delete('Kinder');

    const numGrades = Array.from(gradesSet).sort((a, b) => Number(a) - Number(b));
    const result = [];
    if (hasKinder) result.push('Kinder');
    return result.concat(numGrades);
  }, [classroomStudents]);

  // Compute demographic counts for quick chips
  const counts = useMemo(() => {
    let sped = 0, p504 = 0, el = 0, rfep = 0, foster = 0;
    classroomStudents.forEach(s => {
      if (s.flags?.sped) sped++;
      if (s.flags?.plan504) p504++;
      if (s.flags?.elStatus && s.flags.elStatus !== 'EO') {
        if (s.flags.elStatus === 'RFEP') rfep++;
        else el++;
      }
      if (s.flags?.homelessFoster) foster++;
    });
    return {
      total: classroomStudents.length,
      sped,
      504: p504,
      el,
      rfep,
      foster
    };
  }, [classroomStudents]);

  // Filtered Students based on search query, demographic filter, and grade selection
  const filteredStudents = useMemo(() => {
    return classroomStudents.filter(student => {
      // 1. Grade Filter
      if (selectedGrade !== 'ALL') {
        if (selectedGrade === 'Kinder' && !student.isKinder) return false;
        if (selectedGrade !== 'Kinder') {
          const matchGrade = student.gradeNum === Number(selectedGrade) ||
            String(student.gradeLevel || student.grade) === String(selectedGrade);
          if (!matchGrade) return false;
        }
      }

      // 2. Demographic Filter
      if (activeFilter === 'SPED' && !student.flags?.sped) return false;
      if (activeFilter === '504' && !student.flags?.plan504) return false;
      if (activeFilter === 'EL' && (!student.flags?.elStatus || student.flags.elStatus === 'EO' || student.flags.elStatus === 'RFEP')) return false;
      if (activeFilter === 'RFEP' && student.flags?.elStatus !== 'RFEP') return false;
      if (activeFilter === 'FOSTER' && !student.flags?.homelessFoster) return false;

      // 3. Search Query (Name, Student ID, Teacher)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = student.name?.toLowerCase().includes(q);
        const idMatch = String(student.studentId || student.id || '').includes(q);
        const teacherMatch = student.teacherName?.toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !teacherMatch) return false;
      }

      return true;
    });
  }, [classroomStudents, selectedGrade, activeFilter, searchQuery]);

  // If not logged in, show Login View
  if (!user) {
    return (
      <LoginView
        onLoginSuccess={handleLogin}
        error={authError}
        isLoading={isLoadingRoster}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      {/* Primary Header */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Classroom Mirror Banner (Super Admin & Site Admin) */}
      {canMirrorTeachers && mirroredTeacher && (
        <div className={`text-white px-4 py-2.5 shadow-sm ${
          isSiteAdmin
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700'
            : 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-white/20 font-bold tracking-wide uppercase text-[10px] inline-flex items-center gap-1">
                {isSiteAdmin ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-200" />
                    <span>Site Admin Mirroring · {lockedSchool}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>Super Admin Mirroring</span>
                  </>
                )}
              </span>
              <span>
                Viewing <strong>{mirroredTeacher.name}</strong>'s classroom at <strong>{mirroredTeacher.school}</strong>.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMirrorModal(true)}
                className="px-3 py-1 bg-white text-slate-800 rounded-lg font-bold hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Switch Teacher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Page Title & Status */}
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

        {/* If Admin has not selected a teacher yet */}
        {canMirrorTeachers && !mirroredTeacher ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <UserCheck className={`w-12 h-12 mx-auto ${isSiteAdmin ? 'text-emerald-500' : 'text-amber-500'}`} />
            <h3 className="text-lg font-bold text-slate-900">
              {isSiteAdmin ? `Site Administrator Access · ${lockedSchool}` : 'Super Admin Classroom Mirroring Required'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isSiteAdmin
                ? `Please choose a classroom teacher at ${lockedSchool} to inspect their classroom roster and assessment metrics.`
                : 'To keep performance lightning fast and replicate the exact teacher experience, please choose a teacher classroom to mirror.'}
            </p>
            <button
              onClick={() => setShowMirrorModal(true)}
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2 ${
                isSiteAdmin ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
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

      {/* Teacher Selector Modal (Super Admin & Site Admin) */}
      {showMirrorModal && (
        <TeacherMirrorSelector
          students={allDistrictStudents}
          currentMirroredTeacher={mirroredTeacher}
          lockedSchool={lockedSchool}
          isSiteAdmin={isSiteAdmin}
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
