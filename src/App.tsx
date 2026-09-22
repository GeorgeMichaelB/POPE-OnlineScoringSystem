import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  QrCode,
  Settings,
  BookOpen,
  Sparkles,
  Trophy,
  Crown,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings,
  VisitRecord,
  ClassHero,
  UserAccount,
  AuditLogEntry
} from './types';
import { db } from './services/db';
import { sound } from './services/sound';
import {
  getNearestFridayDateString,
  getNearestSaturdayDateString,
} from './utils/helpers';

import { AttendanceView } from './components/AttendanceView';
import { DarsKtabView } from './components/DarsKtabView';
import { CustomEventsView } from './components/CustomEventsView';
import { ScoringView } from './components/ScoringView';
import { VisitsView } from './components/VisitsView';
import { StudentListView } from './components/StudentListView';
import { ClassHeroesLeaderboardView } from './components/ClassHeroesLeaderboardView';
import { HeroManageModal } from './components/HeroManageModal';
import { LoginView } from './components/LoginView';
import { AuditLogView } from './components/AuditLogView';
import { QRScannerModal } from './components/QRScannerModal';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { SettingsModal } from './components/SettingsModal';

type AppView = 'heroes' | 'attendance' | 'dars_ktab' | 'events' | 'scoring' | 'visits' | 'students' | 'log';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('attendance');

  // Dates
  const [fridayDate, setFridayDate] = useState<string>(getNearestFridayDateString());
  const [saturdayDate, setSaturdayDate] = useState<string>(getNearestSaturdayDateString());

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [darsKtab, setDarsKtab] = useState<DarsKtabRecord[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [pointSettings, setPointSettings] = useState<PointSettings>({
    fridayClassPoints: 10,
    odasPoints: 15,
    darsKtabPoints: 10,
    ashyaPoints: 5,
    customEventPoints: 20,
  });
  const [customPoints, setCustomPoints] = useState<CustomPointEntry[]>([]);
  const [classHeroes, setClassHeroes] = useState<ClassHero[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentServantName, setCurrentServantName] = useState<string>('George Michael');
  const [loading, setLoading] = useState(true);

  // Active / Selected Student states
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [activeVisitStudentId, setActiveVisitStudentId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Modal triggers
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrScanMode, setQrScanMode] = useState<'attendance' | 'dars_ktab' | 'event' | 'visit' | 'register'>('attendance');
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [scannedQrForRegistration, setScannedQrForRegistration] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageHeroesOpen, setIsManageHeroesOpen] = useState(false);

  // Load initial data
  const loadAllData = async () => {
    try {
      const [stu, att, dk, evts, vis, ptsCfg, pts, heroes, logs] = await Promise.all([
        db.getStudents(),
        db.getAttendance(),
        db.getDarsKtabAttendance(),
        db.getCustomEvents(),
        db.getVisits(),
        db.getPointSettings(),
        db.getCustomPoints(),
        db.getClassHeroes(),
        db.getAuditLogs(),
      ]);
      setStudents(stu);
      setAttendance(att);
      setDarsKtab(dk);
      setCustomEvents(evts);
      if (evts.length > 0 && !selectedEventId) {
        setSelectedEventId(evts[0].id);
      }
      setVisits(vis);
      setPointSettings(ptsCfg);
      setCustomPoints(pts);
      setClassHeroes(heroes);
      setAuditLogs(logs);

      // Check current session
      const sessionUsername = db.getCurrentSession();
      if (sessionUsername) {
        const user = await db.getUserByUsername(sessionUsername);
        if (user) {
          setCurrentUser(user);
          setCurrentServantName(user.name);
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('view=heroes')) {
      setCurrentView('heroes');
    }
    loadAllData();
  }, []);

  // Auth Handlers
  const handleLoginSuccess = async (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentServantName(user.name);
    db.setCurrentSession(user.username);
    await db.addLogEntry({
      username: user.username,
      servantName: user.name,
      action: 'LOGIN',
      details: `${user.name} (${user.username}) logged in to the servant portal.`,
      category: 'auth',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await db.addLogEntry({
        username: currentUser.username,
        servantName: currentUser.name,
        action: 'LOGOUT',
        details: `${currentUser.name} (${currentUser.username}) logged out.`,
        category: 'auth',
      });
    }
    db.setCurrentSession(null);
    setCurrentUser(null);
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleUpdatePassword = async (username: string, newPass: string) => {
    await db.updateUserPassword(username, newPass);
    await db.addLogEntry({
      username,
      servantName: username,
      action: 'PASSWORD_CHANGE',
      details: `${username} changed temporary password to a confidential custom password.`,
      category: 'auth',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // 1. Friday Attendance Actions
  const handleToggleFridayAttendance = async (
    studentId: string,
    type: 'sundaySchool' | 'odas',
    value: boolean
  ) => {
    const existing = attendance.find(
      (r) => r.studentId === studentId && r.date === fridayDate
    );

    const ssValue = type === 'sundaySchool' ? value : existing?.sundaySchool ?? false;
    const odasValue = type === 'odas' ? value : existing?.odas ?? false;

    const updated = await db.recordAttendance(studentId, fridayDate, ssValue, odasValue);
    setAttendance((prev) => {
      const filtered = prev.filter((r) => r.id !== updated.id);
      return [...filtered, updated];
    });

    if (value) {
      sound.playSuccessChime();
    }

    // Audit Log
    const student = students.find((s) => s.id === studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'ATTENDANCE_FRIDAY',
      details: `Updated Friday attendance for ${student?.name || studentId} (${fridayDate}): Class=${ssValue ? 'Present' : 'Absent'}, Odas=${odasValue ? 'Present' : 'Absent'}`,
      category: 'attendance',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // 2. Saturday Dars Ktab Actions
  const handleToggleDarsKtab = async (
    studentId: string,
    type: 'ashya' | 'darsKtab',
    value: boolean
  ) => {
    const existing = darsKtab.find(
      (r) => r.studentId === studentId && r.date === saturdayDate
    );

    const ashyaVal = type === 'ashya' ? value : existing?.ashya ?? false;
    const dkVal = type === 'darsKtab' ? value : existing?.darsKtab ?? false;

    const updated = await db.recordDarsKtabAttendance(studentId, saturdayDate, ashyaVal, dkVal);
    setDarsKtab((prev) => {
      const filtered = prev.filter((r) => r.id !== updated.id);
      return [...filtered, updated];
    });

    if (value) {
      sound.playSuccessChime();
    }

    // Audit Log
    const student = students.find((s) => s.id === studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'ATTENDANCE_SATURDAY',
      details: `Updated Saturday Dars Ktab for ${student?.name || studentId} (${saturdayDate}): Dars Ktab=${dkVal ? 'Present' : 'Absent'}, Ashya=${ashyaVal ? 'Present' : 'Absent'}`,
      category: 'attendance',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // 3. Custom Event Actions
  const handleSaveCustomEvent = async (event: CustomEvent) => {
    await db.saveCustomEvent(event);
    const updated = await db.getCustomEvents();
    setCustomEvents(updated);

    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'EVENT_SAVED',
      details: `Created/updated event: "${event.title}" on ${event.date}`,
      category: 'events',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleDeleteCustomEvent = async (eventId: string) => {
    if (confirm('Delete this event?')) {
      await db.deleteCustomEvent(eventId);
      const updated = await db.getCustomEvents();
      setCustomEvents(updated);
      if (selectedEventId === eventId) {
        setSelectedEventId(updated[0]?.id || null);
      }

      await db.addLogEntry({
        username: currentUser?.username || '@servant',
        servantName: currentUser?.name || currentServantName,
        action: 'EVENT_DELETED',
        details: `Deleted event ID: ${eventId}`,
        category: 'events',
      });
      const updatedLogs = await db.getAuditLogs();
      setAuditLogs(updatedLogs);
    }
  };

  const handleToggleEventAttendance = async (eventId: string, studentId: string) => {
    const updatedEvent = await db.toggleEventAttendance(eventId, studentId);
    if (updatedEvent) {
      setCustomEvents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );
      sound.playSuccessChime();

      const student = students.find((s) => s.id === studentId);
      const isPresent = updatedEvent.attendeeIds.includes(studentId);
      await db.addLogEntry({
        username: currentUser?.username || '@servant',
        servantName: currentUser?.name || currentServantName,
        action: 'EVENT_ATTENDANCE',
        details: `Toggled event attendance for ${student?.name || studentId} in "${updatedEvent.title}": ${isPresent ? 'Present' : 'Removed'}`,
        category: 'events',
      });
      const updatedLogs = await db.getAuditLogs();
      setAuditLogs(updatedLogs);
    }
  };

  // 4. Scoring System Actions
  const handleSavePointSettings = async (newSettings: PointSettings) => {
    await db.savePointSettings(newSettings);
    setPointSettings(newSettings);

    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'SCORING_RULES_UPDATED',
      details: `Updated point rules (Friday: ${newSettings.fridayClassPoints}p, Odas: ${newSettings.odasPoints}p, Sat: ${newSettings.darsKtabPoints}p)`,
      category: 'scoring',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleAddCustomPoints = async (entry: CustomPointEntry) => {
    await db.addCustomPointEntry(entry);
    const updated = await db.getCustomPoints();
    setCustomPoints(updated);

    const student = students.find((s) => s.id === entry.studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || entry.servantName,
      action: 'POINTS_AWARDED',
      details: `Awarded ${entry.points > 0 ? '+' : ''}${entry.points} points to ${student?.name || entry.studentId} for: "${entry.reason}"`,
      category: 'scoring',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleDeleteCustomPoint = async (id: string) => {
    await db.deleteCustomPointEntry(id);
    const updated = await db.getCustomPoints();
    setCustomPoints(updated);

    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'POINTS_DELETED',
      details: `Deleted manual custom point entry ID: ${id}`,
      category: 'scoring',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // Class Heroes Actions
  const handleSaveClassHero = async (hero: ClassHero) => {
    await db.saveClassHero(hero);
    const updated = await db.getClassHeroes();
    setClassHeroes(updated);
    sound.playSuccessChime();

    const student = students.find((s) => s.id === hero.studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || hero.servantName,
      action: 'HERO_CROWNED',
      details: `Crowned ${student?.name || hero.studentId} as Class Hero: "${hero.title}" - ${hero.reason}`,
      category: 'heroes',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleDeleteClassHero = async (heroId: string) => {
    await db.deleteClassHero(heroId);
    const updated = await db.getClassHeroes();
    setClassHeroes(updated);

    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'HERO_REMOVED',
      details: `Removed hero spotlight ID: ${heroId}`,
      category: 'heroes',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // 5. Student CRUD
  const handleSaveStudent = async (student: Student) => {
    await db.saveStudent(student);
    await loadAllData();
    if (selectedStudentForDetail && selectedStudentForDetail.id === student.id) {
      setSelectedStudentForDetail(student);
    }

    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'STUDENT_SAVED',
      details: `Saved profile for ${student.name} (${student.id})`,
      category: 'students',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to delete this student profile and records?')) {
      await db.deleteStudent(studentId);
      setSelectedStudentForDetail(null);
      await loadAllData();

      await db.addLogEntry({
        username: currentUser?.username || '@servant',
        servantName: currentUser?.name || currentServantName,
        action: 'STUDENT_DELETED',
        details: `Deleted student profile ID: ${studentId}`,
        category: 'students',
      });
      const updatedLogs = await db.getAuditLogs();
      setAuditLogs(updatedLogs);
    }
  };

  // 6. Visit CRUD
  const handleSaveVisit = async (visit: VisitRecord) => {
    await db.saveVisit(visit);
    const updatedVisits = await db.getVisits();
    setVisits(updatedVisits);

    const student = students.find((s) => s.id === visit.studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || visit.servantName,
      action: 'VISIT_SAVED',
      details: `Saved pastoral visit record for ${student?.name || visit.studentId}: status=${visit.status}`,
      category: 'visits',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (confirm('Delete this scheduled visit?')) {
      await db.deleteVisit(visitId);
      const updatedVisits = await db.getVisits();
      setVisits(updatedVisits);

      await db.addLogEntry({
        username: currentUser?.username || '@servant',
        servantName: currentUser?.name || currentServantName,
        action: 'VISIT_DELETED',
        details: `Deleted visit record ID: ${visitId}`,
        category: 'visits',
      });
      const updatedLogs = await db.getAuditLogs();
      setAuditLogs(updatedLogs);
    }
  };

  // QR Scanning Handler
  const handleQRScan = (scannedCode: string) => {
    const foundStudent = students.find(
      (s) => s.id.toLowerCase() === scannedCode.toLowerCase()
    );

    if (!foundStudent) {
      sound.playAlertChime();
      setScannedQrForRegistration(scannedCode);
      setEditingStudent(null);
      setIsStudentFormOpen(true);
      return;
    }

    setLastScannedStudent(foundStudent);

    if (qrScanMode === 'attendance') {
      handleToggleFridayAttendance(foundStudent.id, 'sundaySchool', true);
      setCurrentView('attendance');
    } else if (qrScanMode === 'dars_ktab') {
      handleToggleDarsKtab(foundStudent.id, 'darsKtab', true);
      setCurrentView('dars_ktab');
    } else if (qrScanMode === 'event' && selectedEventId) {
      handleToggleEventAttendance(selectedEventId, foundStudent.id);
      setCurrentView('events');
    } else if (qrScanMode === 'visit') {
      setActiveVisitStudentId(foundStudent.id);
      setCurrentView('visits');
    } else {
      setSelectedStudentForDetail(foundStudent);
    }
  };

  const openFridayScanner = () => {
    setQrScanMode('attendance');
    setIsQRScannerOpen(true);
  };

  const openDarsKtabScanner = () => {
    setQrScanMode('dars_ktab');
    setIsQRScannerOpen(true);
  };

  const openEventScanner = () => {
    setQrScanMode('event');
    setIsQRScannerOpen(true);
  };

  const openVisitScanner = () => {
    setQrScanMode('visit');
    setIsQRScannerOpen(true);
  };

  const openRegisterScanner = () => {
    setQrScanMode('register');
    setIsQRScannerOpen(true);
  };

  const startHomeVisitForStudent = (student: Student) => {
    setActiveVisitStudentId(student.id);
    setCurrentView('visits');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          Loading Pope Saweros Class Online Scoring System...
        </p>
      </div>
    );
  }

  // Gate Servant Portal with Authentication (Boys can still view Hall of Champions directly)
  if (!currentUser && currentView !== 'heroes') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onLaunchHeroesScreen={() => setCurrentView('heroes')}
        getUserByUsername={(u) => db.getUserByUsername(u)}
        onUpdatePassword={handleUpdatePassword}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Header (Hidden on Boys Leaderboard Fullscreen Mode) */}
      {currentView !== 'heroes' && (
        <header className="app-header no-print">
          <div className="header-inner">
            <div className="church-brand">
              <div className="brand-icon">
                <BookOpen size={18} />
              </div>
              <div className="brand-titles">
                <h1>Pope Saweros Class</h1>
                <p>Online Scoring & Attendance System (Grade 4)</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="header-nav">
              <button
                type="button"
                onClick={() => setCurrentView('heroes')}
                className="nav-tab-btn"
                style={{
                  color: '#d97706',
                  borderColor: 'rgba(217, 119, 6, 0.4)',
                  background: 'rgba(217, 119, 6, 0.08)',
                  fontWeight: 700,
                }}
              >
                <Crown size={16} /> Hall of Champions (الأبطال)
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('attendance')}
                className={`nav-tab-btn ${currentView === 'attendance' ? 'active' : ''}`}
              >
                <CalendarCheck size={16} /> Friday Class
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('dars_ktab')}
                className={`nav-tab-btn ${currentView === 'dars_ktab' ? 'active' : ''}`}
              >
                <BookOpen size={16} /> Dars Ktab (Sat)
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('events')}
                className={`nav-tab-btn ${currentView === 'events' ? 'active' : ''}`}
              >
                <Sparkles size={16} /> Events ({customEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('scoring')}
                className={`nav-tab-btn ${currentView === 'scoring' ? 'active' : ''}`}
              >
                <Trophy size={16} /> Scoring
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('visits')}
                className={`nav-tab-btn ${currentView === 'visits' ? 'active' : ''}`}
              >
                <CalendarDays size={16} /> Eftekad
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('students')}
                className={`nav-tab-btn ${currentView === 'students' ? 'active' : ''}`}
              >
                <Users size={16} /> Boys ({students.length})
              </button>

              {/* Admin-Only Audit Log Tab */}
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setCurrentView('log')}
                  className={`nav-tab-btn ${currentView === 'log' ? 'active' : ''}`}
                  style={{
                    color: currentView === 'log' ? '#ffffff' : '#2563eb',
                    borderColor: 'rgba(37, 99, 235, 0.4)',
                    background: currentView === 'log' ? '#2563eb' : 'rgba(37, 99, 235, 0.08)',
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={16} /> Audit Log ({auditLogs.length})
                </button>
              )}
            </nav>

            {/* Right Header Actions */}
            <div className="header-actions">
              {/* Servant Account Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
                title={`Logged in as ${currentUser?.name}`}
              >
                {currentUser?.role === 'admin' ? (
                  <Crown size={14} color="#d97706" />
                ) : (
                  <Users size={14} color="#2563eb" />
                )}
                <span>{currentUser?.username}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentView === 'dars_ktab') openDarsKtabScanner();
                  else if (currentView === 'events') openEventScanner();
                  else if (currentView === 'visits') openVisitScanner();
                  else openFridayScanner();
                }}
                className="btn btn-secondary btn-sm"
                title="Quick Scan Passport QR"
              >
                <QrCode size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Servant Settings & Data Backup"
              >
                <Settings size={16} />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log Out (تسجيل الخروج)"
                style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={currentView === 'heroes' ? 'main-content heroes-fullscreen-mode' : 'main-content'}>
        {/* VIEW 0: Boy-Facing Hall of Champions & Leaderboard */}
        {currentView === 'heroes' && (
          <ClassHeroesLeaderboardView
            students={students}
            fridayAttendance={attendance}
            darsKtabAttendance={darsKtab}
            customEvents={customEvents}
            pointSettings={pointSettings}
            customPoints={customPoints}
            classHeroes={classHeroes}
            onOpenManageHeroes={() => setIsManageHeroesOpen(true)}
            onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
            onExitToDashboard={() => setCurrentView('attendance')}
          />
        )}

        {/* VIEW 1: Friday Main Attendance */}
        {currentView === 'attendance' && (
          <AttendanceView
            students={students}
            attendance={attendance}
            onToggleAttendance={handleToggleFridayAttendance}
            onOpenQRScanner={openFridayScanner}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            selectedDate={fridayDate}
            onChangeDate={setFridayDate}
            lastScannedStudent={lastScannedStudent}
          />
        )}

        {/* VIEW 2: Saturday Dars Ktab & Ashya */}
        {currentView === 'dars_ktab' && (
          <DarsKtabView
            students={students}
            records={darsKtab}
            onToggleRecord={handleToggleDarsKtab}
            onOpenQRScanner={openDarsKtabScanner}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            selectedDate={saturdayDate}
            onChangeDate={setSaturdayDate}
            lastScannedStudent={lastScannedStudent}
          />
        )}

        {/* VIEW 3: Customized Events */}
        {currentView === 'events' && (
          <CustomEventsView
            students={students}
            events={customEvents}
            onSaveEvent={handleSaveCustomEvent}
            onDeleteEvent={handleDeleteCustomEvent}
            onToggleAttendance={handleToggleEventAttendance}
            onOpenQRScanner={openEventScanner}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            lastScannedStudent={lastScannedStudent}
            selectedEventId={selectedEventId}
            onSelectEventId={setSelectedEventId}
          />
        )}

        {/* VIEW 4: Online Scoring System */}
        {currentView === 'scoring' && (
          <ScoringView
            students={students}
            attendance={attendance}
            darsKtab={darsKtab}
            customEvents={customEvents}
            customPoints={customPoints}
            pointSettings={pointSettings}
            onSavePointSettings={handleSavePointSettings}
            onAddCustomPoints={handleAddCustomPoints}
            onDeleteCustomPoint={handleDeleteCustomPoint}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            currentServantName={currentServantName}
          />
        )}

        {/* VIEW 5: Visits & Eftekad */}
        {currentView === 'visits' && (
          <VisitsView
            students={students}
            visits={visits}
            onSaveVisit={handleSaveVisit}
            onDeleteVisit={handleDeleteVisit}
            onOpenQRScanner={openVisitScanner}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            activeVisitStudentId={activeVisitStudentId}
            onClearActiveStudent={() => setActiveVisitStudentId(null)}
            currentServantName={currentServantName}
          />
        )}

        {/* VIEW 6: Boys Roster */}
        {currentView === 'students' && (
          <StudentListView
            students={students}
            attendance={attendance}
            darsKtab={darsKtab}
            customEvents={customEvents}
            customPoints={customPoints}
            pointSettings={pointSettings}
            visits={visits}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            onAddNewStudent={() => {
              setEditingStudent(null);
              setScannedQrForRegistration('');
              setIsStudentFormOpen(true);
            }}
            onScanNewPassport={openRegisterScanner}
            onStartVisit={startHomeVisitForStudent}
          />
        )}

        {/* VIEW 7: Admin Activity Audit Log (Admin Only) */}
        {currentView === 'log' && currentUser?.role === 'admin' && (
          <AuditLogView
            logs={auditLogs}
            onClearLogs={async () => {
              await db.clearAuditLogs();
              const updated = await db.getAuditLogs();
              setAuditLogs(updated);
            }}
            adminUsername={currentUser.username}
          />
        )}
      </main>

      {/* Mobile Bottom Bar (Hidden on Boys Leaderboard Fullscreen Mode) */}
      {currentView !== 'heroes' && (
        <div className="mobile-bottom-nav no-print">
          <button
            type="button"
            onClick={() => setCurrentView('heroes')}
            className="mobile-nav-btn"
            style={{ color: '#d97706' }}
          >
            <Crown size={18} />
            <span>Champions</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('attendance')}
            className={`mobile-nav-btn ${currentView === 'attendance' ? 'active' : ''}`}
          >
            <CalendarCheck size={18} />
            <span>Friday</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('dars_ktab')}
            className={`mobile-nav-btn ${currentView === 'dars_ktab' ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Dars Ktab</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('events')}
            className={`mobile-nav-btn ${currentView === 'events' ? 'active' : ''}`}
          >
            <Sparkles size={18} />
            <span>Events</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('scoring')}
            className={`mobile-nav-btn ${currentView === 'scoring' ? 'active' : ''}`}
          >
            <Trophy size={18} />
            <span>Score</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('visits')}
            className={`mobile-nav-btn ${currentView === 'visits' ? 'active' : ''}`}
          >
            <CalendarDays size={18} />
            <span>Eftekad</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('students')}
            className={`mobile-nav-btn ${currentView === 'students' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Boys</span>
          </button>

          {/* Admin Audit Log in Mobile Nav */}
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setCurrentView('log')}
              className={`mobile-nav-btn ${currentView === 'log' ? 'active' : ''}`}
              style={{ color: '#2563eb' }}
            >
              <ShieldCheck size={18} />
              <span>Audit Log</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
        title={
          qrScanMode === 'attendance'
            ? 'Scan Passport for Friday Class'
            : qrScanMode === 'dars_ktab'
            ? 'Scan Passport for Saturday Dars Ktab'
            : qrScanMode === 'event'
            ? 'Scan Passport for Event'
            : qrScanMode === 'visit'
            ? 'Scan Passport to Start Visit'
            : 'Scan Passport QR Code'
        }
        continuous={qrScanMode === 'attendance' || qrScanMode === 'dars_ktab'}
      />

      <StudentFormModal
        isOpen={isStudentFormOpen}
        onClose={() => {
          setIsStudentFormOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        initialQrCode={scannedQrForRegistration}
        existingStudent={editingStudent}
      />

      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          attendance={attendance}
          darsKtab={darsKtab}
          customEvents={customEvents}
          customPoints={customPoints}
          pointSettings={pointSettings}
          visits={visits}
          isOpen={true}
          onClose={() => setSelectedStudentForDetail(null)}
          onEdit={(st) => {
            setSelectedStudentForDetail(null);
            setEditingStudent(st);
            setIsStudentFormOpen(true);
          }}
          onDelete={handleDeleteStudent}
          onStartVisit={startHomeVisitForStudent}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentServantName={currentServantName}
        onUpdateServantName={(name) => {
          db.setCurrentServantName(name);
          setCurrentServantName(name);
        }}
        onDataChanged={loadAllData}
      />

      <HeroManageModal
        isOpen={isManageHeroesOpen}
        onClose={() => setIsManageHeroesOpen(false)}
        students={students}
        heroes={classHeroes}
        onSaveHero={handleSaveClassHero}
        onDeleteHero={handleDeleteClassHero}
        servantName={currentServantName}
      />
    </div>
  );
};

export default App;
