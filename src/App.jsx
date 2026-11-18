import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import FilterBar from './components/FilterBar.jsx';
import StudentCard from './components/StudentCard.jsx';
import StudentModal from './components/StudentModal.jsx';
import LoginView from './components/LoginView.jsx';

import {
  fetchRosterAndElpac,
  fetchSbacData,
  fetchDataPortalData
} from './services/api.js';
import { mergeStudentStreams } from './utils/studentDataMerger.js';
import { Sparkles, Users, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');

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
      setStudents(baseList);
      setIsLoadingRoster(false);

      // Save session
      sessionStorage.setItem('wvusd_user_email', activeUser.email);
      if (idToken) sessionStorage.setItem('wvusd_user_token', idToken);

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
      setStudents(fullyMerged);
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
    setStudents([]);
    setSelectedStudent(null);
    setAuthError(null);
  };

  // Extract Available Grades for Filter Bar
  const availableGrades = useMemo(() => {
    const set = new Set();
    students.forEach(s => {
      if (s.isKinder) set.add('Kinder');
      else if (s.gradeNum !== undefined && s.gradeNum !== null) set.add(s.gradeNum);
    });
    return Array.from(set).sort((a, b) => {
      if (a === 'Kinder') return -1;
      if (b === 'Kinder') return 1;
      return a - b;
    });
  }, [students]);

  // Demographic & Flag Counts
  const counts = useMemo(() => {
    return {
      total: students.length,
      sped: students.filter(s => s.flags?.sped).length,
      plan504: students.filter(s => s.flags?.plan504).length,
      el: students.filter(s => s.flags?.elStatus && s.flags.elStatus !== 'EO' && s.flags.elStatus !== 'RFEP').length,
      rfep: students.filter(s => s.flags?.elStatus === 'RFEP').length,
      homelessFoster: students.filter(s => s.flags?.homelessFoster).length
    };
  }, [students]);

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
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
  }, [students, searchQuery, selectedGrade, activeFilter]);

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Classroom Student Portfolio</span>
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {students.length} Students
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

      </main>

      {/* 360 Profile Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
