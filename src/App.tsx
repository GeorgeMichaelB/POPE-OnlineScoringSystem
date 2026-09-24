import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CalendarCheck,
  QrCode,
  Settings,
  BookOpen,
  Trophy,
  Crown,
  LogOut,
  Cake,
  Download
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  SummerClubSettings,
  ConfessionRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings,
  VisitRecord,
  ClassHero,
  UserAccount,
  AuditLogEntry
} from './types';
import { db, DEFAULT_SUMMER_CLUB_SETTINGS } from './services/db';
import { sound } from './services/sound';
import {
  getNearestFridayDateString,
  getNearestSaturdayDateString,
  getNearestThursdayDateString,
  getNearestWeekdayDateString,
  getUrgentBirthdayAlerts,
  calculateFridayLateDeduction,
} from './utils/helpers';
import { authenticateWithMacTouchID } from './services/biometrics';

import { AttendanceView } from './components/AttendanceView';
import { DarsKtabView } from './components/DarsKtabView';
import { Mal3abView } from './components/Mal3abView';
import { SummerClubView } from './components/SummerClubView';
import { BirthdaysView } from './components/BirthdaysView';
import { CustomEventsView } from './components/CustomEventsView';
import { ScoringView } from './components/ScoringView';
import { VisitsView } from './components/VisitsView';
import { StudentListView } from './components/StudentListView';
import { ClassHeroesLeaderboardView } from './components/ClassHeroesLeaderboardView';
import { HeroManageModal } from './components/HeroManageModal';
import { LoginView } from './components/LoginView';
import { AuditLogView } from './components/AuditLogView';
import { QRScannerModal } from './components/QRScannerModal';
import { FridayFullscreenScanner } from './components/FridayFullscreenScanner';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { NavDroplist, type AppView } from './components/NavDroplist';
import { InstallPromptModal } from './components/InstallPromptModal';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('attendance');

  // Dates
  const [fridayDate, setFridayDate] = useState<string>(getNearestFridayDateString());
  const [saturdayDate, setSaturdayDate] = useState<string>(getNearestSaturdayDateString());
  const [thursdayDate, setThursdayDate] = useState<string>(getNearestThursdayDateString());

  // Summer Club states
  const [summerClubSettings, setSummerClubSettings] = useState<SummerClubSettings>(DEFAULT_SUMMER_CLUB_SETTINGS);
  const [summerClubSubpage, setSummerClubSubpage] = useState<'day1' | 'day2'>('day1');
  const [summerClubDay1Date, setSummerClubDay1Date] = useState<string>(getNearestWeekdayDateString(DEFAULT_SUMMER_CLUB_SETTINGS.day1Weekday));
  const [summerClubDay2Date, setSummerClubDay2Date] = useState<string>(getNearestWeekdayDateString(DEFAULT_SUMMER_CLUB_SETTINGS.day2Weekday));

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [darsKtab, setDarsKtab] = useState<DarsKtabRecord[]>([]);
  const [mal3ab, setMal3ab] = useState<Mal3abRecord[]>([]);
  const [summerClub, setSummerClub] = useState<SummerClubRecord[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [pointSettings, setPointSettings] = useState<PointSettings>({
    fridayClassEnabled: true,
    fridayClassPoints: 10,
    odasEnabled: true,
    odasPoints: 15,
    darsKtabEnabled: true,
    darsKtabPoints: 10,
    ashyaEnabled: true,
    ashyaPoints: 5,
    mal3abEnabled: true,
    mal3abPoints: 10,
    mal3abMatchEnabled: true,
    mal3abMatchPoints: 5,
    summerClubEnabled: true,
    summerClubPoints: 10,
    summerClubActivityEnabled: true,
    summerClubActivityPoints: 5,
    confessionEnabled: true,
    confessionPoints: 20,
    customEventsEnabled: true,
    customEventPoints: 20,
    customPointsEnabled: true,
  });
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [customPoints, setCustomPoints] = useState<CustomPointEntry[]>([]);
  const [classHeroes, setClassHeroes] = useState<ClassHero[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentServantName, setCurrentServantName] = useState<string>('George Michael');
  const [loading, setLoading] = useState(true);

  // Browser Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Urgent Birthday Alerts (<= 3 days away)
  const urgentBirthdayAlerts = useMemo(() => {
    return getUrgentBirthdayAlerts(students);
  }, [students]);

  // Active / Selected Student states
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [activeVisitStudentId, setActiveVisitStudentId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Friday Class Live Attendance Timer State (per session date)
  const [fridayTimerStartTime, setFridayTimerStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(`pss_friday_timer_${fridayDate}`);
    return saved ? Number(saved) : null;
  });
  const [fridayTimerRunning, setFridayTimerRunning] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pss_friday_timer_running_${fridayDate}`);
    return saved === 'true';
  });
  const [fridayTimerElapsedSeconds, setFridayTimerElapsedSeconds] = useState<number>(() => {
    const savedStart = localStorage.getItem(`pss_friday_timer_${fridayDate}`);
    const savedRunning = localStorage.getItem(`pss_friday_timer_running_${fridayDate}`);
    if (savedStart && savedRunning === 'true') {
      return Math.max(0, Math.floor((Date.now() - Number(savedStart)) / 1000));
    }
    const savedElapsed = localStorage.getItem(`pss_friday_timer_elapsed_${fridayDate}`);
    return savedElapsed ? Number(savedElapsed) : 0;
  });

  const [lastScanResult, setLastScanResult] = useState<{
    student: Student;
    date: string;
    isLate: boolean;
    pointsAwarded: number;
    checkInMinutes?: number;
    timerActive: boolean;
  } | null>(null);

  // Sync Timer when Friday Date changes
  useEffect(() => {
    const savedStart = localStorage.getItem(`pss_friday_timer_${fridayDate}`);
    const savedRunning = localStorage.getItem(`pss_friday_timer_running_${fridayDate}`);
    if (savedStart && savedRunning === 'true') {
      const startTime = Number(savedStart);
      setFridayTimerStartTime(startTime);
      setFridayTimerRunning(true);
      setFridayTimerElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    } else if (savedStart && savedRunning === 'false') {
      const startTime = Number(savedStart);
      const savedElapsed = localStorage.getItem(`pss_friday_timer_elapsed_${fridayDate}`);
      setFridayTimerStartTime(startTime);
      setFridayTimerRunning(false);
      setFridayTimerElapsedSeconds(savedElapsed ? Number(savedElapsed) : 0);
    } else {
      setFridayTimerStartTime(null);
      setFridayTimerRunning(false);
      setFridayTimerElapsedSeconds(0);
    }
  }, [fridayDate]);

  // Timer Tick Interval
  useEffect(() => {
    if (!fridayTimerRunning || !fridayTimerStartTime) return;
    const interval = setInterval(() => {
      setFridayTimerElapsedSeconds(Math.max(0, Math.floor((Date.now() - fridayTimerStartTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [fridayTimerRunning, fridayTimerStartTime]);

  const handleStartFridayTimer = () => {
    const now = Date.now();
    const adjustedStart = fridayTimerElapsedSeconds > 0 ? now - fridayTimerElapsedSeconds * 1000 : now;
    setFridayTimerStartTime(adjustedStart);
    setFridayTimerRunning(true);
    localStorage.setItem(`pss_friday_timer_${fridayDate}`, String(adjustedStart));
    localStorage.setItem(`pss_friday_timer_running_${fridayDate}`, 'true');
    localStorage.removeItem(`pss_friday_timer_elapsed_${fridayDate}`);
    sound.playSuccessChime();

    // 🚀 Launch Fullscreen Mirrored Camera & Live Timer HUD together!
    setIsFridayFullscreenScannerOpen(true);
  };

  const handleStopFridayTimer = async (bypassTouchID = false) => {
    if (!bypassTouchID && pointSettings.fridayLateRequireTouchID !== false) {
      const auth = await authenticateWithMacTouchID('Verify MacBook fingerprint (Touch ID) to stop Friday class timer');
      if (!auth.success) {
        sound.playAlertChime();
        alert(auth.error || 'Timer cannot be stopped without MacBook Touch ID fingerprint verification.');
        return;
      }
      sound.playSuccessChime();
    }

    setFridayTimerRunning(false);
    localStorage.setItem(`pss_friday_timer_running_${fridayDate}`, 'false');
    localStorage.setItem(`pss_friday_timer_elapsed_${fridayDate}`, String(fridayTimerElapsedSeconds));
  };

  const handleResetFridayTimer = async () => {
    if (fridayTimerRunning && pointSettings.fridayLateRequireTouchID !== false) {
      const auth = await authenticateWithMacTouchID('Verify MacBook fingerprint (Touch ID) to reset Friday class timer');
      if (!auth.success) {
        sound.playAlertChime();
        alert(auth.error || 'Timer cannot be reset without MacBook Touch ID fingerprint verification.');
        return;
      }
      sound.playSuccessChime();
    }

    setFridayTimerStartTime(null);
    setFridayTimerRunning(false);
    setFridayTimerElapsedSeconds(0);
    localStorage.removeItem(`pss_friday_timer_${fridayDate}`);
    localStorage.removeItem(`pss_friday_timer_running_${fridayDate}`);
    localStorage.removeItem(`pss_friday_timer_elapsed_${fridayDate}`);
  };

  const handleToggleFridayLateStatus = async (studentId: string) => {
    const existing = attendance.find(
      (r) => r.studentId === studentId && r.date === fridayDate
    );
    if (!existing || !existing.sundaySchool) return;

    const newLateStatus = !existing.isLate;
    const deduction = calculateFridayLateDeduction(
      newLateStatus ? (existing.checkInMinutes ?? ((pointSettings.fridayLateCutoffMinutes ?? 15) + 1)) : 0,
      pointSettings
    );
    const awardedPoints = newLateStatus ? deduction.awardedPoints : (pointSettings.fridayClassPoints || 10);

    const updated = await db.recordAttendance(
      studentId,
      fridayDate,
      existing.sundaySchool,
      existing.odas,
      newLateStatus,
      existing.checkInMinutes,
      awardedPoints
    );
    setAttendance((prev) => {
      const filtered = prev.filter((r) => r.id !== updated.id);
      return [...filtered, updated];
    });

    const student = students.find((s) => s.id === studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'ATTENDANCE_LATE_TOGGLE',
      details: `Changed late status for ${student?.name || studentId} to ${newLateStatus ? 'Late' : 'On-Time'} (${awardedPoints} pts)`,
      category: 'attendance',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // Modal triggers
  const [isFridayFullscreenScannerOpen, setIsFridayFullscreenScannerOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrScanMode, setQrScanMode] = useState<
    'attendance' | 'dars_ktab' | 'mal3ab' | 'summer_club_day1' | 'summer_club_day2' | 'event' | 'visit' | 'register'
  >('attendance');
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [scannedQrForRegistration, setScannedQrForRegistration] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageHeroesOpen, setIsManageHeroesOpen] = useState(false);

  // PWA Apps Menu Installation states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari standalone check
      window.navigator.standalone === true
    ) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check & trigger browser desktop notification for birthdays 3 days away
  const triggerBirthdayNotifications = (urgentList: ReturnType<typeof getUrgentBirthdayAlerts>) => {
    if (urgentList.length === 0) return;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      urgentList.forEach((item) => {
        const timeStr = item.daysUntil === 0 ? 'today!' : `in ${item.daysUntil} days (${item.nextBirthdayDateString})`;
        try {
          new Notification(`🎂 Birthday Reminder: ${item.student.name}`, {
            body: `${item.student.name} is turning ${item.turningAge} ${timeStr}! Send church pastoral blessings.`,
          });
        } catch (e) {
          console.warn('Could not display system notification:', e);
        }
      });
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          triggerBirthdayNotifications(urgentBirthdayAlerts);
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  };

  // Load initial data
  const loadAllData = async () => {
    try {
      const [stu, att, dk, ml3, sc, scCfg, evts, vis, ptsCfg, pts, heroes, logs, confs] = await Promise.all([
        db.getStudents(),
        db.getAttendance(),
        db.getDarsKtabAttendance(),
        db.getMal3abAttendance(),
        db.getSummerClubAttendance(),
        db.getSummerClubSettings(),
        db.getCustomEvents(),
        db.getVisits(),
        db.getPointSettings(),
        db.getCustomPoints(),
        db.getClassHeroes(),
        db.getAuditLogs(),
        db.getConfessionRecords(),
      ]);
      setStudents(stu);
      setAttendance(att);
      setDarsKtab(dk);
      setMal3ab(ml3);
      setSummerClub(sc);
      setSummerClubSettings(scCfg);
      setSummerClubDay1Date(getNearestWeekdayDateString(scCfg.day1Weekday));
      setSummerClubDay2Date(getNearestWeekdayDateString(scCfg.day2Weekday));
      setCustomEvents(evts);
      if (evts.length > 0 && !selectedEventId) {
        setSelectedEventId(evts[0].id);
      }
      setVisits(vis);
      setPointSettings(ptsCfg);
      setCustomPoints(pts);
      setClassHeroes(heroes);
      setAuditLogs(logs);
      setConfessions(confs);

      // Trigger 3-day advance notification if permission is already granted
      const urgent = getUrgentBirthdayAlerts(stu);
      triggerBirthdayNotifications(urgent);

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
    value: boolean,
    explicitIsLate?: boolean,
    explicitCheckInMinutes?: number,
    explicitPointsAwarded?: number
  ) => {
    const existing = attendance.find(
      (r) => r.studentId === studentId && r.date === fridayDate
    );

    const ssValue = type === 'sundaySchool' ? value : existing?.sundaySchool ?? false;
    const odasValue = type === 'odas' ? value : existing?.odas ?? false;

    let isLate = existing?.isLate ?? false;
    let checkInMinutes = existing?.checkInMinutes;
    let pointsAwarded = existing?.pointsAwarded;

    if (type === 'sundaySchool') {
      if (value) {
        if (explicitIsLate !== undefined) {
          isLate = explicitIsLate;
          checkInMinutes = explicitCheckInMinutes;
          pointsAwarded =
            explicitPointsAwarded !== undefined
              ? explicitPointsAwarded
              : calculateFridayLateDeduction(checkInMinutes, pointSettings).awardedPoints;
        } else if (fridayTimerStartTime && fridayTimerRunning) {
          const elapsedMinutes = (Date.now() - fridayTimerStartTime) / 60000;
          checkInMinutes = Math.floor(elapsedMinutes);
          const deduction = calculateFridayLateDeduction(checkInMinutes, pointSettings);
          isLate = deduction.isLate;
          pointsAwarded = deduction.awardedPoints;
        } else {
          // If timer not started, full points!
          isLate = false;
          checkInMinutes = undefined;
          pointsAwarded = pointSettings.fridayClassPoints || 10;
        }
      } else {
        isLate = false;
        checkInMinutes = undefined;
        pointsAwarded = undefined;
      }
    }

    const updated = await db.recordAttendance(
      studentId,
      fridayDate,
      ssValue,
      odasValue,
      isLate,
      checkInMinutes,
      pointsAwarded
    );
    setAttendance((prev) => {
      const filtered = prev.filter((r) => r.id !== updated.id);
      return [...filtered, updated];
    });

    if (value) {
      sound.playSuccessChime();
    }

    // Audit Log
    const student = students.find((s) => s.id === studentId);
    const lateText = isLate ? ' (Late - Decreased Points)' : ' (On-Time)';
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'ATTENDANCE_FRIDAY',
      details: `Updated Friday attendance for ${student?.name || studentId} (${fridayDate}): Class=${ssValue ? `Present${lateText}` : 'Absent'}, Odas=${odasValue ? 'Present' : 'Absent'}`,
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

  // 3. Thursday Mal3ab Actions
  const handleToggleMal3ab = async (
    studentId: string,
    type: 'attended' | 'matchPlayed',
    value: boolean
  ) => {
    const existing = mal3ab.find(
      (r) => r.studentId === studentId && r.date === thursdayDate
    );

    const attVal = type === 'attended' ? value : existing?.attended ?? false;
    const matchVal = type === 'matchPlayed' ? value : existing?.matchPlayed ?? false;

    const updated = await db.recordMal3abAttendance(studentId, thursdayDate, attVal, matchVal);
    setMal3ab((prev) => {
      const filtered = prev.filter((r) => r.id !== updated.id);
      return [...filtered, updated];
    });

    if (value) {
      sound.playSuccessChime();
    }

    const student = students.find((s) => s.id === studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'ATTENDANCE_MAL3AB',
      details: `Updated Thursday Mal3ab for ${student?.name || studentId} (${thursdayDate}): Attended=${attVal ? 'Present' : 'Absent'}, Match=${matchVal ? 'Played' : 'Not Played'}`,
      category: 'mal3ab',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  // 4. Summer Club Actions (2 Subpages)
  const handleToggleSummerClub = async (
    studentId: string,
    subpage: 'day1' | 'day2',
    type: 'attended' | 'activity',
    value: boolean
  ) => {
    const sessionDate = subpage === 'day1' ? summerClubDay1Date : summerClubDay2Date;
    const existing = summerClub.find(
      (r) => r.studentId === studentId && r.subpage === subpage && r.date === sessionDate
    );

    const attVal = type === 'attended' ? value : existing?.attended ?? false;
    const actVal = type === 'activity' ? value : existing?.activity ?? false;

    const updated = await db.recordSummerClubAttendance(studentId, subpage, sessionDate, attVal, actVal);
    setSummerClub((prev) => {
      const filtered = prev.filter((r) => r.id !== updated.id);
      return [...filtered, updated];
    });

    if (value) {
      sound.playSuccessChime();
    }

    const student = students.find((s) => s.id === studentId);
    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: 'ATTENDANCE_SUMMER_CLUB',
      details: `Updated Summer Club ${subpage === 'day1' ? 'First Day' : 'Second Day'} for ${student?.name || studentId} (${sessionDate}): Attended=${attVal ? 'Present' : 'Absent'}, Activity=${actVal ? 'Present' : 'Absent'}`,
      category: 'summer_club',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleUpdateSummerClubSettings = async (newSettings: SummerClubSettings) => {
    await db.saveSummerClubSettings(newSettings);
    setSummerClubSettings(newSettings);
  };

  // 5. Custom Event Actions
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

  // Confession Handlers (متابعة سر الاعتراف الشهري)
  const handleToggleConfession = async (
    studentId: string,
    month: string,
    attended: boolean,
    scheduledDay?: number,
    confessionDate?: string,
    confessionFather?: string,
    notes?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    await db.recordConfession(
      studentId,
      month,
      attended,
      scheduledDay,
      confessionDate,
      confessionFather || student?.confessionFather,
      notes
    );
    const updated = await db.getConfessionRecords();
    setConfessions(updated);

    await db.addLogEntry({
      username: currentUser?.username || '@servant',
      servantName: currentUser?.name || currentServantName,
      action: attended ? 'CONFESSION_LOGGED' : 'CONFESSION_UNCHECKED',
      details: `${attended ? 'Recorded monthly confession' : 'Unchecked monthly confession'} for ${student?.name || studentId} for month ${month} (+${pointSettings.confessionPoints ?? 20} pts)`,
      category: 'scoring',
    });
    const updatedLogs = await db.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const handleUpdateStudentConfessionSchedule = async (studentId: string, day: number, confessionFather?: string) => {
    await db.updateStudentConfessionSchedule(studentId, day, confessionFather);
    const updatedStudents = await db.getStudents();
    setStudents(updatedStudents);
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
    const cleanScanned = scannedCode.trim().toLowerCase();
    const foundStudent = students.find(
      (s) =>
        s.id.toLowerCase() === cleanScanned ||
        (s.series && s.series.toLowerCase() === cleanScanned)
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
      let isLate = false;
      let checkInMinutes: number | undefined = undefined;
      let pointsAwarded = pointSettings.fridayClassPoints || 10;
      const timerActive = Boolean(fridayTimerStartTime && fridayTimerRunning);

      if (timerActive && fridayTimerStartTime) {
        const elapsedMinutes = (Date.now() - fridayTimerStartTime) / 60000;
        checkInMinutes = Math.floor(elapsedMinutes);
        const deduction = calculateFridayLateDeduction(checkInMinutes, pointSettings);
        isLate = deduction.isLate;
        pointsAwarded = deduction.awardedPoints;
      }

      setLastScanResult({
        student: foundStudent,
        date: fridayDate,
        isLate,
        pointsAwarded,
        checkInMinutes,
        timerActive,
      });

      handleToggleFridayAttendance(foundStudent.id, 'sundaySchool', true, isLate, checkInMinutes, pointsAwarded);
      setCurrentView('attendance');
    } else if (qrScanMode === 'dars_ktab') {
      handleToggleDarsKtab(foundStudent.id, 'darsKtab', true);
      setCurrentView('dars_ktab');
    } else if (qrScanMode === 'mal3ab') {
      handleToggleMal3ab(foundStudent.id, 'attended', true);
      setCurrentView('mal3ab');
    } else if (qrScanMode === 'summer_club_day1') {
      handleToggleSummerClub(foundStudent.id, 'day1', 'attended', true);
      setSummerClubSubpage('day1');
      setCurrentView('summer_club');
    } else if (qrScanMode === 'summer_club_day2') {
      handleToggleSummerClub(foundStudent.id, 'day2', 'attended', true);
      setSummerClubSubpage('day2');
      setCurrentView('summer_club');
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

  const openMal3abScanner = () => {
    setQrScanMode('mal3ab');
    setIsQRScannerOpen(true);
  };

  const openSummerClubScanner = (subpage: 'day1' | 'day2' = 'day1') => {
    setQrScanMode(subpage === 'day1' ? 'summer_club_day1' : 'summer_club_day2');
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
            <div className="header-main-bar">
              <div className="church-brand">
                <div className="brand-icon">
                  <BookOpen size={18} />
                </div>
                <div className="brand-titles">
                  <h1>Pope Saweros Class</h1>
                  <p>Online Scoring & Attendance System (Grade 4)</p>
                </div>
              </div>

              {/* Right Header Actions */}
              <div className="header-actions">
                {/* Install App to Device Button */}
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(true)}
                  className="btn btn-sm btn-install-pwa"
                  title="Install App to Apps Menu (تثبيت التطبيق على الجهاز)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  <Download size={14} />
                  <span className="hide-on-mobile">{isAppInstalled ? 'Installed' : 'Install App'}</span>
                </button>

                {/* Urgent Birthday Alert Indicator (if any boy has birthday <= 3 days) */}
                {urgentBirthdayAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentView('birthdays')}
                    className="btn btn-sm"
                    title={`${urgentBirthdayAlerts.length} upcoming birthday alerts in next 3 days!`}
                    style={{
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#be123c',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(225, 29, 72, 0.1)',
                    }}
                  >
                    <Cake size={15} color="#e11d48" />
                    <span className="hide-on-mobile" style={{ fontSize: '0.78rem' }}>
                      {urgentBirthdayAlerts.length} Birthday{urgentBirthdayAlerts.length > 1 ? 's' : ''}!
                    </span>
                    <span className="show-on-mobile-only" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                      {urgentBirthdayAlerts.length}
                    </span>
                  </button>
                )}

                {/* Servant Account Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.55rem',
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
                  <span className="hide-on-mobile">{currentUser?.username}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (currentView === 'dars_ktab') openDarsKtabScanner();
                    else if (currentView === 'mal3ab') openMal3abScanner();
                    else if (currentView === 'summer_club') openSummerClubScanner(summerClubSubpage);
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

            {/* Unified Navigation Droplist Bar */}
            <div className="header-nav-droplist-wrapper">
              <NavDroplist
                currentView={currentView}
                onChangeView={setCurrentView}
                customEventsCount={customEvents.length}
                studentsCount={students.length}
                auditLogsCount={auditLogs.length}
                birthdayAlertCount={urgentBirthdayAlerts.length}
                isAdmin={currentUser?.role === 'admin'}
              />
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
            mal3ab={mal3ab}
            summerClub={summerClub}
            confessions={confessions}
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
            onToggleLateStatus={handleToggleFridayLateStatus}
            onOpenQRScanner={openFridayScanner}
            onOpenFullscreenScanner={() => setIsFridayFullscreenScannerOpen(true)}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            selectedDate={fridayDate}
            onChangeDate={setFridayDate}
            lastScannedStudent={lastScannedStudent}
            lastScanResult={lastScanResult}
            pointSettings={pointSettings}
            fridayTimerStartTime={fridayTimerStartTime}
            fridayTimerRunning={fridayTimerRunning}
            fridayTimerElapsedSeconds={fridayTimerElapsedSeconds}
            onStartTimer={handleStartFridayTimer}
            onStopTimer={handleStopFridayTimer}
            onResetTimer={handleResetFridayTimer}
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

        {/* VIEW 3: Thursday Mal3ab (Sports & Pitch) */}
        {currentView === 'mal3ab' && (
          <Mal3abView
            students={students}
            records={mal3ab}
            onToggleRecord={handleToggleMal3ab}
            onOpenQRScanner={openMal3abScanner}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            selectedDate={thursdayDate}
            onChangeDate={setThursdayDate}
            lastScannedStudent={lastScannedStudent}
          />
        )}

        {/* VIEW 4: Summer Club (2 Subpages with Configurable Weekday Defaults) */}
        {currentView === 'summer_club' && (
          <SummerClubView
            students={students}
            records={summerClub}
            settings={summerClubSettings}
            onUpdateSettings={handleUpdateSummerClubSettings}
            onToggleRecord={handleToggleSummerClub}
            onOpenQRScanner={openSummerClubScanner}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            activeSubpage={summerClubSubpage}
            onChangeSubpage={setSummerClubSubpage}
            day1Date={summerClubDay1Date}
            onChangeDay1Date={setSummerClubDay1Date}
            day2Date={summerClubDay2Date}
            onChangeDay2Date={setSummerClubDay2Date}
            lastScannedStudent={lastScannedStudent}
          />
        )}

        {/* VIEW 5: Birthdays & 3-Day Alerts */}
        {currentView === 'birthdays' && (
          <BirthdaysView
            students={students}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            onRequestNotificationPermission={requestNotificationPermission}
            notificationPermission={notificationPermission}
          />
        )}

        {/* VIEW 6: Customized Events */}
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

        {/* VIEW 7: Online Scoring System */}
        {currentView === 'scoring' && (
          <ScoringView
            students={students}
            attendance={attendance}
            darsKtab={darsKtab}
            mal3ab={mal3ab}
            summerClub={summerClub}
            confessions={confessions}
            customEvents={customEvents}
            customPoints={customPoints}
            pointSettings={pointSettings}
            onSavePointSettings={handleSavePointSettings}
            onAddCustomPoints={handleAddCustomPoints}
            onDeleteCustomPoint={handleDeleteCustomPoint}
            onToggleConfession={handleToggleConfession}
            onUpdateStudentConfessionDay={handleUpdateStudentConfessionSchedule}
            onSelectStudent={(student) => setSelectedStudentForDetail(student)}
            currentServantName={currentServantName}
          />
        )}

        {/* VIEW 8: Visits & Eftekad */}
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

        {/* VIEW 9: Boys Roster */}
        {currentView === 'students' && (
          <StudentListView
            students={students}
            attendance={attendance}
            darsKtab={darsKtab}
            mal3ab={mal3ab}
            summerClub={summerClub}
            confessions={confessions}
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

        {/* VIEW 10: Admin Activity Audit Log (Admin Only) */}
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
            onClick={() => setCurrentView('attendance')}
            className={`mobile-nav-btn ${currentView === 'attendance' ? 'active' : ''}`}
            title="Friday Attendance & Liturgy"
          >
            <CalendarCheck size={19} />
            <span>Friday</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('dars_ktab')}
            className={`mobile-nav-btn ${currentView === 'dars_ktab' ? 'active' : ''}`}
            title="Saturday Dars Ktab & Ashya"
          >
            <BookOpen size={19} />
            <span>Dars Ktab</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('heroes')}
            className="mobile-nav-btn"
            style={{ color: '#d97706' }}
            title="Hall of Champions"
          >
            <Crown size={19} />
            <span>Champions</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('scoring')}
            className={`mobile-nav-btn ${currentView === 'scoring' ? 'active' : ''}`}
            title="Points & Confessions"
          >
            <Trophy size={19} />
            <span>Score</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('students')}
            className={`mobile-nav-btn ${currentView === 'students' ? 'active' : ''}`}
            title="Student Roster"
          >
            <Users size={19} />
            <span>Boys</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {/* Friday Fullscreen Mirrored Scanner & Live Digital Timer HUD */}
      <FridayFullscreenScanner
        isOpen={isFridayFullscreenScannerOpen}
        onClose={() => setIsFridayFullscreenScannerOpen(false)}
        onStopTimer={() => handleStopFridayTimer(true)}
        students={students}
        attendance={attendance}
        pointSettings={pointSettings}
        selectedDate={fridayDate}
        timerStartTime={fridayTimerStartTime}
        timerRunning={fridayTimerRunning}
        timerElapsedSeconds={fridayTimerElapsedSeconds}
        onRecordAttendance={(studentId, type, value, isLate, checkInMinutes, pointsAwarded) => {
          handleToggleFridayAttendance(studentId, type, value, isLate, checkInMinutes, pointsAwarded);
        }}
      />

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
        title={
          qrScanMode === 'attendance'
            ? 'Scan Passport for Friday Class'
            : qrScanMode === 'dars_ktab'
              ? 'Scan Passport for Saturday Dars Ktab'
              : qrScanMode === 'mal3ab'
                ? 'Scan Passport for Thursday Mal3ab'
                : qrScanMode === 'summer_club_day1'
                  ? 'Scan Passport for Summer Club (First Day)'
                  : qrScanMode === 'summer_club_day2'
                    ? 'Scan Passport for Summer Club (Second Day)'
                    : qrScanMode === 'event'
                      ? 'Scan Passport for Event'
                      : qrScanMode === 'visit'
                        ? 'Scan Passport to Start Visit'
                        : 'Scan Passport QR Code'
        }
        continuous={
          qrScanMode === 'attendance' ||
          qrScanMode === 'dars_ktab' ||
          qrScanMode === 'mal3ab' ||
          qrScanMode === 'summer_club_day1' ||
          qrScanMode === 'summer_club_day2'
        }
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
          mal3ab={mal3ab}
          summerClub={summerClub}
          confessions={confessions}
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
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        pointSettings={pointSettings}
        onSavePointSettings={handleSavePointSettings}
      />

      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsAppInstalled(true)}
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
