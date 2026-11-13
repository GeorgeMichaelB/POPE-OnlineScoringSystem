import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  Phone,
  MessageCircle,
  Printer,
  FileSpreadsheet,
  Search,
  ArrowUpDown,
  Church,
  BookOpen,
  Flame,
  Sun,
  Sparkles,
  Heart,
  CheckCircle2,
  XCircle,
  Share2,
  Info
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  CustomEvent,
  ConfessionRecord,
  VisitRecord
} from '../types';
import {
  formatDateIso,
  getWeekRange,
  shiftWeek,
  shiftMonth,
  getCurrentMonthString,
  formatMonthYear,
  getRecentMonthsList
} from '../utils/helpers';

export type AnalyticsPeriodMode = 'week' | 'month' | 'term';
export type ActivityKey =
  | 'all'
  | 'friday_class'
  | 'friday_odas'
  | 'dars_ktab'
  | 'ashya'
  | 'mal3ab'
  | 'summer_club'
  | 'events'
  | 'confession';

export type AbsentSortOption =
  | 'absences_desc'
  | 'absences_asc'
  | 'date_desc'
  | 'date_asc'
  | 'name_asc';

interface AnalyticsViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  darsKtab: DarsKtabRecord[];
  mal3ab?: Mal3abRecord[];
  summerClub?: SummerClubRecord[];
  customEvents?: CustomEvent[];
  confessions?: ConfessionRecord[];
  visits?: VisitRecord[];
  onSelectStudent: (student: Student) => void;
  onStartVisit?: (student: Student) => void;
  className?: string;
}

interface MissedSessionDetail {
  date: string;
  activityKey: ActivityKey;
  activityLabelEn: string;
  activityLabelAr: string;
}

interface StudentAttendanceSummary {
  student: Student;
  attendedCount: number;
  possibleSessionsCount: number;
  attendancePercent: number;
  missedCount: number;
  missedDetails: MissedSessionDetail[];
  latestMissedDate: string | null;
  earliestMissedDate: string | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  attendance = [],
  darsKtab = [],
  mal3ab = [],
  summerClub = [],
  customEvents = [],
  confessions = [],
  visits = [],
  onSelectStudent,
  onStartVisit,
  className = 'Pope Saweros Class',
}) => {
  // Period filter states
  const [periodMode, setPeriodMode] = useState<AnalyticsPeriodMode>('month');
  const [selectedWeek, setSelectedWeek] = useState(getWeekRange());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());

  // Navigation tab inside Analytics
  const [activeTab, setActiveTab] = useState<'top_attended' | 'absent_boys' | 'activities_overview' | 'matrix'>('top_attended');

  // Activity filter for Top Attended tab
  const [selectedActivity, setSelectedActivity] = useState<ActivityKey>('all');

  // Filter & sorting for Absent tab
  const [absentActivityFilter, setAbsentActivityFilter] = useState<ActivityKey>('all');
  const [absentSortBy, setAbsentSortBy] = useState<AbsentSortOption>('absences_desc');
  const [absentSearchQuery, setAbsentSearchQuery] = useState('');
  const [absentUrgencyFilter, setAbsentUrgencyFilter] = useState<'all' | 'critical' | 'moderate' | 'single'>('all');

  // Search in Top Attended
  const [topSearchQuery, setTopSearchQuery] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Calculate active date range based on period mode
  const { dateRangeStart, dateRangeEnd, periodLabelEn, periodLabelAr } = useMemo(() => {
    if (periodMode === 'week') {
      return {
        dateRangeStart: selectedWeek.start,
        dateRangeEnd: selectedWeek.end,
        periodLabelEn: selectedWeek.labelEn,
        periodLabelAr: selectedWeek.labelAr,
      };
    }
    if (periodMode === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const start = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      return {
        dateRangeStart: start,
        dateRangeEnd: end,
        periodLabelEn: formatMonthYear(selectedMonth, 'en'),
        periodLabelAr: formatMonthYear(selectedMonth, 'ar'),
      };
    }
    // 'term' / All Time: find earliest & latest date across records
    let minDate = '2026-01-01';
    let maxDate = formatDateIso(new Date());

    const allDates = [
      ...attendance.map((r) => r.date),
      ...darsKtab.map((r) => r.date),
      ...mal3ab.map((r) => r.date),
      ...summerClub.map((r) => r.date),
      ...(customEvents || []).map((r) => r?.date),
    ].filter(Boolean);

    if (allDates.length > 0) {
      allDates.sort();
      minDate = allDates[0];
      maxDate = allDates[allDates.length - 1];
    }

    return {
      dateRangeStart: minDate,
      dateRangeEnd: maxDate,
      periodLabelEn: 'All-Time Roster Records',
      periodLabelAr: 'السجل الإجمالي الشامل',
    };
  }, [periodMode, selectedWeek, selectedMonth, attendance, darsKtab, mal3ab, summerClub, customEvents]);

  // Helper date predicate
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    if (periodMode === 'term') return true;
    return dateStr >= dateRangeStart && dateStr <= dateRangeEnd;
  };

  // 2. Identify all session dates held within the period for every activity
  const sessionDatesByActivity = useMemo(() => {
    // Friday Class dates
    const fridayClassDates = Array.from(
      new Set(
        attendance
          .filter((r) => isDateInPeriod(r.date) && r.sundaySchool)
          .map((r) => r.date)
      )
    ).sort();

    // Friday Odas dates
    const fridayOdasDates = Array.from(
      new Set(
        attendance
          .filter((r) => isDateInPeriod(r.date) && r.odas)
          .map((r) => r.date)
      )
    ).sort();

    // Saturday Dars Ktab dates
    const darsKtabDates = Array.from(
      new Set(
        darsKtab
          .filter((r) => isDateInPeriod(r.date) && r.darsKtab)
          .map((r) => r.date)
      )
    ).sort();

    // Saturday Ashya dates
    const ashyaDates = Array.from(
      new Set(
        darsKtab
          .filter((r) => isDateInPeriod(r.date) && r.ashya)
          .map((r) => r.date)
      )
    ).sort();

    // Thursday Mal3ab dates
    const mal3abDates = Array.from(
      new Set(
        mal3ab
          .filter((r) => isDateInPeriod(r.date) && r.attended)
          .map((r) => r.date)
      )
    ).sort();

    // Summer Club dates
    const summerClubDates = Array.from(
      new Set(
        summerClub
          .filter((r) => isDateInPeriod(r.date) && r.attended)
          .map((r) => `${r.date}__${r.subpage}`)
      )
    ).sort();

    // Custom Events in period
    const eventsInPeriod = (customEvents || []).filter((e) => e && e.date && isDateInPeriod(e.date));

    // Confession sessions: for month, the selectedMonth counts as 1 monthly session
    const confessionInPeriod = confessions.filter((c) => {
      if (periodMode === 'month') {
        return c.month === selectedMonth && c.attended;
      }
      return c.confessionDate ? isDateInPeriod(c.confessionDate) && c.attended : false;
    });

    return {
      fridayClassDates,
      fridayOdasDates,
      darsKtabDates,
      ashyaDates,
      mal3abDates,
      summerClubDates,
      eventsInPeriod,
      confessionInPeriod,
      hasAnySessions:
        fridayClassDates.length > 0 ||
        fridayOdasDates.length > 0 ||
        darsKtabDates.length > 0 ||
        ashyaDates.length > 0 ||
        mal3abDates.length > 0 ||
        summerClubDates.length > 0 ||
        eventsInPeriod.length > 0 ||
        confessionInPeriod.length > 0,
    };
  }, [attendance, darsKtab, mal3ab, summerClub, customEvents, confessions, dateRangeStart, dateRangeEnd, periodMode, selectedMonth]);

  // 3. Activity configuration metadata
  const activityConfigs: Record<
    ActivityKey,
    {
      key: ActivityKey;
      titleEn: string;
      titleAr: string;
      dayTag: string;
      icon: React.ReactNode;
      color: string;
      accentBg: string;
      sessionsCount: number;
    }
  > = {
    all: {
      key: 'all',
      titleEn: 'All Activities Combined',
      titleAr: 'كافة الأنشطة مجمعة',
      dayTag: 'All',
      icon: <Award size={18} />,
      color: '#0284c7',
      accentBg: '#e0f2fe',
      sessionsCount:
        sessionDatesByActivity.fridayClassDates.length +
        sessionDatesByActivity.fridayOdasDates.length +
        sessionDatesByActivity.darsKtabDates.length +
        sessionDatesByActivity.ashyaDates.length +
        sessionDatesByActivity.mal3abDates.length +
        sessionDatesByActivity.summerClubDates.length +
        sessionDatesByActivity.eventsInPeriod.length +
        (periodMode === 'month' ? 1 : 0),
    },
    friday_class: {
      key: 'friday_class',
      titleEn: 'Friday Sunday School',
      titleAr: 'خدمة مدارس الأحد الجمعة',
      dayTag: 'Fri',
      icon: <Church size={18} />,
      color: '#059669',
      accentBg: '#d1fae5',
      sessionsCount: sessionDatesByActivity.fridayClassDates.length,
    },
    friday_odas: {
      key: 'friday_odas',
      titleEn: 'Friday Holy Liturgy (Odas)',
      titleAr: 'القداس الإلهي والتناول',
      dayTag: 'Fri',
      icon: <Sparkles size={18} />,
      color: '#d97706',
      accentBg: '#fef3c7',
      sessionsCount: sessionDatesByActivity.fridayOdasDates.length,
    },
    dars_ktab: {
      key: 'dars_ktab',
      titleEn: 'Saturday Bible Study',
      titleAr: 'درس كتاب السبت',
      dayTag: 'Sat',
      icon: <BookOpen size={18} />,
      color: '#2563eb',
      accentBg: '#dbeafe',
      sessionsCount: sessionDatesByActivity.darsKtabDates.length,
    },
    ashya: {
      key: 'ashya',
      titleEn: 'Saturday Vespers (Ashya)',
      titleAr: 'عشية السبت',
      dayTag: 'Sat',
      icon: <Church size={18} />,
      color: '#4f46e5',
      accentBg: '#e0e7ff',
      sessionsCount: sessionDatesByActivity.ashyaDates.length,
    },
    mal3ab: {
      key: 'mal3ab',
      titleEn: 'Thursday Mal3ab & Sports',
      titleAr: 'الملعب والنشاط الرياضي',
      dayTag: 'Thu',
      icon: <Flame size={18} />,
      color: '#16a34a',
      accentBg: '#dcfce7',
      sessionsCount: sessionDatesByActivity.mal3abDates.length,
    },
    summer_club: {
      key: 'summer_club',
      titleEn: 'Summer Club',
      titleAr: 'النادي الصيفي',
      dayTag: 'Club',
      icon: <Sun size={18} />,
      color: '#ea580c',
      accentBg: '#ffedd5',
      sessionsCount: sessionDatesByActivity.summerClubDates.length,
    },
    events: {
      key: 'events',
      titleEn: 'Custom Events & Trips',
      titleAr: 'الرحلات والمناسبات الخاصة',
      dayTag: 'Events',
      icon: <Sparkles size={18} />,
      color: '#7c3aed',
      accentBg: '#f3e8ff',
      sessionsCount: sessionDatesByActivity.eventsInPeriod.length,
    },
    confession: {
      key: 'confession',
      titleEn: 'Monthly Confession',
      titleAr: 'سر الاعتراف الشهري',
      dayTag: 'Monthly',
      icon: <Heart size={18} />,
      color: '#e11d48',
      accentBg: '#ffe4e6',
      sessionsCount: periodMode === 'month' ? 1 : sessionDatesByActivity.confessionInPeriod.length > 0 ? 1 : 0,
    },
  };

  // 4. Compute Attendance & Absence per student for a given activity
  const computeActivitySummaries = (actKey: ActivityKey): StudentAttendanceSummary[] => {
    return students.map((student) => {
      let attendedCount = 0;
      let possibleSessionsCount = 0;
      const missedDetails: MissedSessionDetail[] = [];

      // A. Friday Class
      if (actKey === 'all' || actKey === 'friday_class') {
        const total = sessionDatesByActivity.fridayClassDates.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.fridayClassDates.forEach((date) => {
            const rec = attendance.find((r) => r.studentId === student.id && r.date === date);
            if (rec && rec.sundaySchool) {
              attendedCount++;
            } else {
              missedDetails.push({
                date,
                activityKey: 'friday_class',
                activityLabelEn: 'Friday Sunday School',
                activityLabelAr: 'مدارس الأحد الجمعة',
              });
            }
          });
        }
      }

      // B. Friday Odas
      if (actKey === 'all' || actKey === 'friday_odas') {
        const total = sessionDatesByActivity.fridayOdasDates.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.fridayOdasDates.forEach((date) => {
            const rec = attendance.find((r) => r.studentId === student.id && r.date === date);
            if (rec && rec.odas) {
              attendedCount++;
            } else {
              missedDetails.push({
                date,
                activityKey: 'friday_odas',
                activityLabelEn: 'Friday Liturgy (Odas)',
                activityLabelAr: 'القداس الإلهي والتناول',
              });
            }
          });
        }
      }

      // C. Saturday Dars Ktab
      if (actKey === 'all' || actKey === 'dars_ktab') {
        const total = sessionDatesByActivity.darsKtabDates.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.darsKtabDates.forEach((date) => {
            const rec = darsKtab.find((r) => r.studentId === student.id && r.date === date);
            if (rec && rec.darsKtab) {
              attendedCount++;
            } else {
              missedDetails.push({
                date,
                activityKey: 'dars_ktab',
                activityLabelEn: 'Saturday Bible Study',
                activityLabelAr: 'درس كتاب السبت',
              });
            }
          });
        }
      }

      // D. Saturday Ashya
      if (actKey === 'all' || actKey === 'ashya') {
        const total = sessionDatesByActivity.ashyaDates.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.ashyaDates.forEach((date) => {
            const rec = darsKtab.find((r) => r.studentId === student.id && r.date === date);
            if (rec && rec.ashya) {
              attendedCount++;
            } else {
              missedDetails.push({
                date,
                activityKey: 'ashya',
                activityLabelEn: 'Saturday Vespers (Ashya)',
                activityLabelAr: 'عشية السبت',
              });
            }
          });
        }
      }

      // E. Thursday Mal3ab
      if (actKey === 'all' || actKey === 'mal3ab') {
        const total = sessionDatesByActivity.mal3abDates.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.mal3abDates.forEach((date) => {
            const rec = mal3ab.find((r) => r.studentId === student.id && r.date === date);
            if (rec && rec.attended) {
              attendedCount++;
            } else {
              missedDetails.push({
                date,
                activityKey: 'mal3ab',
                activityLabelEn: 'Thursday Mal3ab',
                activityLabelAr: 'الملعب الرياضي',
              });
            }
          });
        }
      }

      // F. Summer Club
      if (actKey === 'all' || actKey === 'summer_club') {
        const total = sessionDatesByActivity.summerClubDates.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.summerClubDates.forEach((composite) => {
            const [date, subpage] = composite.split('__');
            const rec = summerClub.find(
              (r) => r.studentId === student.id && r.date === date && r.subpage === subpage
            );
            if (rec && rec.attended) {
              attendedCount++;
            } else {
              missedDetails.push({
                date,
                activityKey: 'summer_club',
                activityLabelEn: `Summer Club (${subpage === 'day1' ? 'Day 1' : 'Day 2'})`,
                activityLabelAr: `النادي الصيفي (${subpage === 'day1' ? 'اليوم الأول' : 'اليوم الثاني'})`,
              });
            }
          });
        }
      }

      // G. Custom Events
      if (actKey === 'all' || actKey === 'events') {
        const total = sessionDatesByActivity.eventsInPeriod.length;
        if (total > 0) {
          possibleSessionsCount += total;
          sessionDatesByActivity.eventsInPeriod.forEach((ev) => {
            if (Array.isArray(ev?.attendeeIds) && ev.attendeeIds.includes(student.id)) {
              attendedCount++;
            } else {
              missedDetails.push({
                date: ev.date,
                activityKey: 'events',
                activityLabelEn: ev.title || 'Church Trip/Event',
                activityLabelAr: ev.title || 'مناسبة / رحلة كنسية',
              });
            }
          });
        }
      }

      // H. Confession (in month mode)
      if (actKey === 'all' || actKey === 'confession') {
        if (periodMode === 'month') {
          possibleSessionsCount += 1;
          const conf = confessions.find(
            (c) => c.studentId === student.id && c.month === selectedMonth && c.attended
          );
          if (conf) {
            attendedCount++;
          } else {
            missedDetails.push({
              date: `${selectedMonth}-01`,
              activityKey: 'confession',
              activityLabelEn: 'Monthly Confession',
              activityLabelAr: 'سر الاعتراف الشهري',
            });
          }
        }
      }

      // Sort missed details chronologically descending (most recent first)
      missedDetails.sort((a, b) => b.date.localeCompare(a.date));

      const missedCount = possibleSessionsCount - attendedCount;
      const attendancePercent =
        possibleSessionsCount > 0 ? Math.round((attendedCount / possibleSessionsCount) * 100) : 0;

      const latestMissedDate = missedDetails.length > 0 ? missedDetails[0].date : null;
      const earliestMissedDate = missedDetails.length > 0 ? missedDetails[missedDetails.length - 1].date : null;

      return {
        student,
        attendedCount,
        possibleSessionsCount,
        attendancePercent,
        missedCount,
        missedDetails,
        latestMissedDate,
        earliestMissedDate,
      };
    });
  };

  // Summaries for the currently selected activity in Top Attended
  const topAttendedSummaries = useMemo(() => {
    const list = computeActivitySummaries(selectedActivity);
    // Sort primarily by attendedCount descending, then attendancePercent descending, then student name
    return list.sort((a, b) => {
      if (b.attendedCount !== a.attendedCount) {
        return b.attendedCount - a.attendedCount;
      }
      if (b.attendancePercent !== a.attendancePercent) {
        return b.attendancePercent - a.attendancePercent;
      }
      return a.student.name.localeCompare(b.student.name);
    });
  }, [selectedActivity, sessionDatesByActivity, students]);

  // Filtered Top Attended list based on search
  const filteredTopAttended = useMemo(() => {
    if (!topSearchQuery.trim()) return topAttendedSummaries;
    const q = topSearchQuery.toLowerCase().trim();
    return topAttendedSummaries.filter(
      (s) =>
        s.student.name.toLowerCase().includes(q) ||
        (s.student.arabicName && s.student.arabicName.toLowerCase().includes(q)) ||
        s.student.id.toLowerCase().includes(q)
    );
  }, [topAttendedSummaries, topSearchQuery]);

  // Summaries for the Absent Boys tab
  const absentSummaries = useMemo(() => {
    const list = computeActivitySummaries(absentActivityFilter);
    // Keep only boys who missed at least 1 session
    const absentees = list.filter((item) => item.missedCount > 0 && item.possibleSessionsCount > 0);

    // Filter by urgency
    const urgencyFiltered = absentees.filter((item) => {
      if (absentUrgencyFilter === 'critical') return item.missedCount >= 3;
      if (absentUrgencyFilter === 'moderate') return item.missedCount === 2;
      if (absentUrgencyFilter === 'single') return item.missedCount === 1;
      return true;
    });

    // Filter by search query
    const searchFiltered = urgencyFiltered.filter((item) => {
      if (!absentSearchQuery.trim()) return true;
      const q = absentSearchQuery.toLowerCase().trim();
      return (
        item.student.name.toLowerCase().includes(q) ||
        (item.student.arabicName && item.student.arabicName.toLowerCase().includes(q)) ||
        item.student.id.toLowerCase().includes(q)
      );
    });

    // Apply sorting
    return searchFiltered.sort((a, b) => {
      if (absentSortBy === 'absences_desc') {
        if (b.missedCount !== a.missedCount) return b.missedCount - a.missedCount;
        return (b.latestMissedDate || '').localeCompare(a.latestMissedDate || '');
      }
      if (absentSortBy === 'absences_asc') {
        if (a.missedCount !== b.missedCount) return a.missedCount - b.missedCount;
        return (b.latestMissedDate || '').localeCompare(a.latestMissedDate || '');
      }
      if (absentSortBy === 'date_desc') {
        const dateA = a.latestMissedDate || '';
        const dateB = b.latestMissedDate || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return b.missedCount - a.missedCount;
      }
      if (absentSortBy === 'date_asc') {
        const dateA = a.earliestMissedDate || '9999-99-99';
        const dateB = b.earliestMissedDate || '9999-99-99';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return b.missedCount - a.missedCount;
      }
      if (absentSortBy === 'name_asc') {
        return a.student.name.localeCompare(b.student.name);
      }
      return 0;
    });
  }, [absentActivityFilter, absentSortBy, absentSearchQuery, absentUrgencyFilter, sessionDatesByActivity, students]);

  // Overall Statistics Cards
  const overallStats = useMemo(() => {
    const allSummaries = computeActivitySummaries('all');
    const totalPossibleSessions = activityConfigs.all.sessionsCount;

    let totalAttendanceHits = 0;
    let totalPossibleHits = 0;
    let perfectCount = 0;
    let criticalAbsentCount = 0;

    allSummaries.forEach((s) => {
      totalAttendanceHits += s.attendedCount;
      totalPossibleHits += s.possibleSessionsCount;
      if (s.possibleSessionsCount > 0 && s.attendedCount === s.possibleSessionsCount) {
        perfectCount++;
      }
      if (s.missedCount >= 3) {
        criticalAbsentCount++;
      }
    });

    const averageRate = totalPossibleHits > 0 ? Math.round((totalAttendanceHits / totalPossibleHits) * 100) : 0;

    // Find activity with highest attendance rate
    const activityKeys: ActivityKey[] = [
      'friday_class',
      'friday_odas',
      'dars_ktab',
      'ashya',
      'mal3ab',
      'summer_club',
    ];
    let bestActivityKey: ActivityKey = 'friday_class';
    let bestActivityRate = -1;

    activityKeys.forEach((key) => {
      const cfg = activityConfigs[key];
      if (cfg.sessionsCount > 0) {
        const sum = computeActivitySummaries(key);
        const totalAtt = sum.reduce((acc, curr) => acc + curr.attendedCount, 0);
        const totalPoss = sum.reduce((acc, curr) => acc + curr.possibleSessionsCount, 0);
        const rate = totalPoss > 0 ? Math.round((totalAtt / totalPoss) * 100) : 0;
        if (rate > bestActivityRate) {
          bestActivityRate = rate;
          bestActivityKey = key;
        }
      }
    });

    return {
      totalStudents: students.length,
      totalSessionsHeld: totalPossibleSessions,
      averageRate,
      perfectCount,
      criticalAbsentCount,
      bestActivity: activityConfigs[bestActivityKey],
      bestActivityRate: bestActivityRate >= 0 ? bestActivityRate : 0,
    };
  }, [students, sessionDatesByActivity]);

  // Format WhatsApp Link
  const getWhatsAppCareLink = (phone: string, student: Student) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const formattedPhone = clean.startsWith('0') ? `2${clean}` : clean;
    const displayName = student.arabicName ? `${student.arabicName} (${student.name})` : student.name;

    const message = `سلام ومحبة من كنيسة ربنا وفصل القديس البابا ساويرس ✝️❤️\nبنطمن على بطلنا الجميل ${displayName}، وحشنا جداً في الكنيسة ومدارس الأحد وبنتمنى نشوفه ونفرح بيه وسط أصحابه وإخوته! ✨\nكل سنة وأنتم طيبين وفي ملء النعمة والبركة دايماً 🙏`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  // Copy Full WhatsApp Report to Clipboard
  const handleCopyWhatsAppReport = () => {
    const top3 = topAttendedSummaries.slice(0, 5);
    const topAbsentees = absentSummaries.slice(0, 8);

    let report = `📊 *تقرير الحضور والغياب - كنيسة الشهيد مارجرجس*\n`;
    report += `⛪ *فصل القديس البابا ساويرس (الصف الرابع)*\n`;
    report += `🗓️ *الفترة: ${periodLabelAr} (${periodLabelEn})*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    report += `🏆 *المتفوقين في الحضور (Top Attended):*\n`;
    if (top3.length === 0) {
      report += `لا توجد جلسات مسجلة لهذه الفترة.\n`;
    } else {
      top3.forEach((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
        const name = item.student.arabicName ? `${item.student.arabicName} (${item.student.name})` : item.student.name;
        report += `${medal} ${idx + 1}. ${name} - حضور ${item.attendedCount}/${item.possibleSessionsCount} (${item.attendancePercent}%)\n`;
      });
    }

    report += `\n🚨 *المخدومين الغائبين للافتقاد (مرتبين بأيام الغياب):*\n`;
    if (topAbsentees.length === 0) {
      report += `✨ نشكر ربنا، نسبة حضور كاملة ولا يوجد غائبين!\n`;
    } else {
      topAbsentees.forEach((item, idx) => {
        const name = item.student.arabicName ? `${item.student.arabicName} (${item.student.name})` : item.student.name;
        const urgencyMark = item.missedCount >= 3 ? '🔴' : item.missedCount === 2 ? '🟠' : '🟡';
        report += `${urgencyMark} ${idx + 1}. ${name} - غياب ${item.missedCount} مرات:\n`;
        item.missedDetails.slice(0, 3).forEach((m) => {
          report += `   • ${m.date} (${m.activityLabelAr})\n`;
        });
        if (item.missedDetails.length > 3) {
          report += `   • و${item.missedDetails.length - 3} تواريخ أخرى...\n`;
        }
      });
    }

    report += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `صلوا لأجل الخدمة وافتقاد أولادنا! ✝️🙏`;

    navigator.clipboard.writeText(report);
    showToast('تم نسخ التقرير المنسق للواتساب بنجاح! 📋');
  };

  // Export CSV of Attendance & Absences
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Series',
      'Name',
      'Arabic Name',
      'Dad Phone',
      'Mom Phone',
      'Attended Count',
      'Total Sessions',
      'Attendance %',
      'Missed Count',
      'Missed Dates & Activities'
    ];

    const summaries = computeActivitySummaries('all');
    const rows = summaries.map((item) => {
      const missedSummary = item.missedDetails.map((m) => `${m.date} (${m.activityLabelEn})`).join('; ');
      return [
        item.student.id,
        item.student.series || '',
        `"${item.student.name}"`,
        `"${item.student.arabicName || ''}"`,
        item.student.dadPhone || '',
        item.student.momPhone || '',
        item.attendedCount,
        item.possibleSessionsCount,
        `${item.attendancePercent}%`,
        item.missedCount,
        `"${missedSummary}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PopeSaweros_Analytics_${periodLabelEn.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تنزيل ملف الإكسل (CSV) بنجاح! 📥');
  };

  return (
    <div className="analytics-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '0.8rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner: Title, Period Controls & Quick Actions */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            paddingBottom: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              }}
            >
              <BarChart3 size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Analytics & Attendance Reports
                </h1>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                  }}
                >
                  {className}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                تقارير الحضور والغياب الأسبوعية والشهرية، قائمة الأبطال الأكثر حضوراً، وسجل الغائبين للافتقاد
              </p>
            </div>
          </div>

          {/* Action Buttons: WhatsApp Share, Export CSV, Print */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyWhatsAppReport}
              className="btn btn-sm"
              style={{
                background: '#22c55e',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              }}
              title="Copy formatted summary to paste into servants' WhatsApp group"
            >
              <Share2 size={16} />
              <span>تقرير الواتساب</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
              }}
              title="Export report as CSV spreadsheet"
            >
              <FileSpreadsheet size={16} />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
              }}
              title="Print report or save as PDF"
            >
              <Printer size={16} />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs & Date Stepper */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Period Mode Selector (Weekly vs Monthly vs All-Time) */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '0.25rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setPeriodMode('week')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: periodMode === 'week' ? '#0f172a' : '#cbd5e1',
                backgroundColor: periodMode === 'week' ? '#38bdf8' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              📅 أسبوعي (Weekly)
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('month')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: periodMode === 'month' ? '#0f172a' : '#cbd5e1',
                backgroundColor: periodMode === 'month' ? '#38bdf8' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              🗓️ شهري (Monthly)
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('term')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: periodMode === 'term' ? '#0f172a' : '#cbd5e1',
                backgroundColor: periodMode === 'term' ? '#38bdf8' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              🌟 إجمالي السجل (All-Time)
            </button>
          </div>

          {/* Stepper Navigation for Week / Month */}
          {periodMode === 'week' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedWeek((prev) => shiftWeek(prev.start, -1))}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                }}
                title="Previous Week"
              >
                <ChevronLeft size={16} />
                <span>الأسبوع السابق</span>
              </button>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {selectedWeek.labelAr} ({selectedWeek.labelEn})
              </div>

              <button
                type="button"
                onClick={() => setSelectedWeek((prev) => shiftWeek(prev.start, 1))}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                }}
                title="Next Week"
              >
                <span>الأسبوع التالي</span>
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setSelectedWeek(getWeekRange())}
                className="btn btn-sm"
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontWeight: 700,
                }}
              >
                هذا الأسبوع
              </button>
            </div>
          )}

          {periodMode === 'month' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
                <span>الشهر السابق</span>
              </button>

              {/* Month Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {getRecentMonthsList(12, 1).map((mStr) => (
                  <option key={mStr} value={mStr} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                    {formatMonthYear(mStr, 'ar')} ({formatMonthYear(mStr, 'en')})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                }}
                title="Next Month"
              >
                <span>الشهر التالي</span>
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonth(getCurrentMonthString())}
                className="btn btn-sm"
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontWeight: 700,
                }}
              >
                هذا الشهر
              </button>
            </div>
          )}

          {periodMode === 'term' && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#38bdf8',
                fontWeight: 700,
              }}
            >
              عرض تراكمي شامل لكافة سجلات العام
            </div>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Card 1: Registered Boys */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي مخدومي الفصل</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {overallStats.totalStudents} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>بطل</span>
            </div>
          </div>
        </div>

        {/* Card 2: Sessions Conducted */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>الجلسات المنعقدة بالفترة</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {overallStats.totalSessionsHeld} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>جلسة</span>
            </div>
          </div>
        </div>

        {/* Card 3: Average Attendance Rate */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>متوسط نسبة الحضور</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>
              {overallStats.averageRate}%
            </div>
          </div>
        </div>

        {/* Card 4: Perfect Attendance */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#fdf4ff',
              color: '#c026d3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>أبطال الحضور الكامل 100%</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c026d3' }}>
              {overallStats.perfectCount} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>بطل</span>
            </div>
          </div>
        </div>

        {/* Card 5: Critical Absentees (Clickable to Absent Tab) */}
        <div
          className="card"
          onClick={() => {
            setActiveTab('absent_boys');
            setAbsentUrgencyFilter('critical');
          }}
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: overallStats.criticalAbsentCount > 0 ? '1px solid #fecdd3' : '1px solid var(--border-light)',
            backgroundColor: overallStats.criticalAbsentCount > 0 ? '#fff1f2' : 'var(--bg-card)',
            transition: 'transform 0.15s ease',
          }}
          title="Click to view absent boys needing immediate eftekad"
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: overallStats.criticalAbsentCount > 0 ? '#be123c' : '#f1f5f9',
              color: overallStats.criticalAbsentCount > 0 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: overallStats.criticalAbsentCount > 0 ? '#9f1239' : 'var(--text-muted)', fontWeight: 600 }}>
              غياب متكرر (3+ مرات)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: overallStats.criticalAbsentCount > 0 ? '#be123c' : 'var(--text-primary)' }}>
              {overallStats.criticalAbsentCount} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>مخدوم</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs: Top Attended vs Absent Boys vs Activities Comparison vs Matrix */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-light)',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('top_attended')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px 10px 0 0',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderBottom: activeTab === 'top_attended' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'top_attended' ? '#0284c7' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'top_attended' ? 'var(--bg-card)' : 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <Award size={18} />
          <span>المتفوقين في الحضور (Top Attended)</span>
          <span
            style={{
              backgroundColor: activeTab === 'top_attended' ? '#e0f2fe' : 'var(--bg-subtle)',
              color: activeTab === 'top_attended' ? '#0284c7' : 'var(--text-muted)',
              fontSize: '0.72rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
            }}
          >
            {topAttendedSummaries.filter((s) => s.attendedCount > 0).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('absent_boys')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px 10px 0 0',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderBottom: activeTab === 'absent_boys' ? '3px solid #be123c' : '3px solid transparent',
            color: activeTab === 'absent_boys' ? '#be123c' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'absent_boys' ? 'var(--bg-card)' : 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <AlertTriangle size={18} />
          <span>سجل الغائبين للافتقاد (Absent Boys)</span>
          <span
            style={{
              backgroundColor: activeTab === 'absent_boys' ? '#ffe4e6' : 'var(--bg-subtle)',
              color: activeTab === 'absent_boys' ? '#be123c' : 'var(--text-muted)',
              fontSize: '0.72rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontWeight: 800,
            }}
          >
            {absentSummaries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activities_overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px 10px 0 0',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderBottom: activeTab === 'activities_overview' ? '3px solid #7c3aed' : '3px solid transparent',
            color: activeTab === 'activities_overview' ? '#7c3aed' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'activities_overview' ? 'var(--bg-card)' : 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <BarChart3 size={18} />
          <span>مقارنة كافة الأنشطة (Overview)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px 10px 0 0',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderBottom: activeTab === 'matrix' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'matrix' ? '#059669' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'matrix' ? 'var(--bg-card)' : 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          <FileSpreadsheet size={18} />
          <span>كشف الحضور الإجمالي (Matrix Sheet)</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: TOP ATTENDED AT EVERY ACTIVITY
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'top_attended' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Activity Pills Bar */}
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              اختر الخدمة أو النشاط لعرض الأكثر حضوراً:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(Object.keys(activityConfigs) as ActivityKey[]).map((key) => {
                const act = activityConfigs[key];
                const isSelected = selectedActivity === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedActivity(key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: isSelected ? `2px solid ${act.color}` : '1px solid var(--border-light)',
                      backgroundColor: isSelected ? act.accentBg : 'var(--bg-subtle)',
                      color: isSelected ? act.color : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{act.icon}</span>
                    <span>{act.titleAr}</span>
                    <span
                      style={{
                        backgroundColor: isSelected ? act.color : 'var(--border-medium)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '999px',
                      }}
                    >
                      {act.sessionsCount} جلسة
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If no sessions were held in this period for the selected activity */}
          {activityConfigs[selectedActivity].sessionsCount === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'var(--text-muted)',
              }}
            >
              <Info size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                لا توجد جلسات مسجلة لنشاط ({activityConfigs[selectedActivity].titleAr}) خلال هذه الفترة
              </h3>
              <p style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>
                يمكنك التبديل إلى "هذا الشهر" أو "إجمالي السجل"، أو تسجيل حضور للنشاط أولاً.
              </p>
              <button
                type="button"
                onClick={() => setPeriodMode('month')}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '8px' }}
              >
                التبديل إلى التقرير الشهري
              </button>
            </div>
          ) : (
            <>
              {/* Top 3 Podium (منصة التتويج) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* 1st Place (Gold) */}
                {topAttendedSummaries[0] && topAttendedSummaries[0].attendedCount > 0 && (
                  <div
                    className="card"
                    onClick={() => onSelectStudent(topAttendedSummaries[0].student)}
                    style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      border: '2px solid #f59e0b',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.25)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                      }}
                    >
                      🥇 المركز الأول
                    </div>

                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                        marginBottom: '0.75rem',
                        border: '3px solid #ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      {topAttendedSummaries[0].student.photoUrl ? (
                        <img
                          src={topAttendedSummaries[0].student.photoUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        topAttendedSummaries[0].student.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>
                      {topAttendedSummaries[0].student.arabicName || topAttendedSummaries[0].student.name}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0.6rem', fontSize: '0.78rem', color: '#b45309' }}>
                      {topAttendedSummaries[0].student.name}
                    </p>

                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>حضور {topAttendedSummaries[0].attendedCount} من {topAttendedSummaries[0].possibleSessionsCount}</span>
                      <span style={{ color: '#d97706' }}>({topAttendedSummaries[0].attendancePercent}%)</span>
                    </div>
                  </div>
                )}

                {/* 2nd Place (Silver) */}
                {topAttendedSummaries[1] && topAttendedSummaries[1].attendedCount > 0 && (
                  <div
                    className="card"
                    onClick={() => onSelectStudent(topAttendedSummaries[1].student)}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '2px solid #94a3b8',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px -4px rgba(100, 116, 139, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        backgroundColor: '#64748b',
                        color: '#ffffff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                      }}
                    >
                      🥈 المركز الثاني
                    </div>

                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#94a3b8',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 10px rgba(100, 116, 139, 0.3)',
                        marginBottom: '0.75rem',
                        border: '3px solid #ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      {topAttendedSummaries[1].student.photoUrl ? (
                        <img
                          src={topAttendedSummaries[1].student.photoUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        topAttendedSummaries[1].student.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#334155' }}>
                      {topAttendedSummaries[1].student.arabicName || topAttendedSummaries[1].student.name}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0.6rem', fontSize: '0.78rem', color: '#64748b' }}>
                      {topAttendedSummaries[1].student.name}
                    </p>

                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>حضور {topAttendedSummaries[1].attendedCount} من {topAttendedSummaries[1].possibleSessionsCount}</span>
                      <span style={{ color: '#475569' }}>({topAttendedSummaries[1].attendancePercent}%)</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {topAttendedSummaries[2] && topAttendedSummaries[2].attendedCount > 0 && (
                  <div
                    className="card"
                    onClick={() => onSelectStudent(topAttendedSummaries[2].student)}
                    style={{
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      border: '2px solid #ea580c',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px -4px rgba(234, 88, 12, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        backgroundColor: '#c2410c',
                        color: '#ffffff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                      }}
                    >
                      🥉 المركز الثالث
                    </div>

                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#ea580c',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
                        marginBottom: '0.75rem',
                        border: '3px solid #ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      {topAttendedSummaries[2].student.photoUrl ? (
                        <img
                          src={topAttendedSummaries[2].student.photoUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        topAttendedSummaries[2].student.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#9a3412' }}>
                      {topAttendedSummaries[2].student.arabicName || topAttendedSummaries[2].student.name}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0.6rem', fontSize: '0.78rem', color: '#c2410c' }}>
                      {topAttendedSummaries[2].student.name}
                    </p>

                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: '#9a3412',
                        border: '1px solid #fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>حضور {topAttendedSummaries[2].attendedCount} من {topAttendedSummaries[2].possibleSessionsCount}</span>
                      <span style={{ color: '#ea580c' }}>({topAttendedSummaries[2].attendancePercent}%)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Ranking Table / Cards */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                    جدول الترتيب الكامل لنشاط ({activityConfigs[selectedActivity].titleAr})
                  </h3>

                  {/* Search in ranking */}
                  <div style={{ position: 'relative', minWidth: '220px' }}>
                    <Search
                      size={16}
                      color="var(--text-muted)"
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو الكود..."
                      value={topSearchQuery}
                      onChange={(e) => setTopSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 2.2rem 0.45rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-main)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.6rem 0.5rem', width: '50px' }}>الترتيب</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>المخدوم</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>الجلسات المحضورة</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>نسبة الحضور</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTopAttended.map((item, idx) => {
                        const rank = idx + 1;
                        const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                        return (
                          <tr
                            key={item.student.id}
                            onClick={() => onSelectStudent(item.student)}
                            style={{
                              borderBottom: '1px solid var(--border-light)',
                              cursor: 'pointer',
                              transition: 'background-color 0.1s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, fontSize: '0.9rem' }}>
                              {rankMedal}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--bg-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-light)',
                                  }}
                                >
                                  {item.student.photoUrl ? (
                                    <img src={item.student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    item.student.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                    {item.student.arabicName || item.student.name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {item.student.name} • {item.student.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '0.88rem' }}>
                              <span style={{ color: '#059669' }}>{item.attendedCount}</span> / {item.possibleSessionsCount}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', width: '180px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div
                                  style={{
                                    flex: 1,
                                    height: '8px',
                                    backgroundColor: 'var(--border-light)',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${item.attendancePercent}%`,
                                      height: '100%',
                                      backgroundColor:
                                        item.attendancePercent === 100
                                          ? '#059669'
                                          : item.attendancePercent >= 75
                                          ? '#0284c7'
                                          : item.attendancePercent >= 50
                                          ? '#f59e0b'
                                          : '#dc2626',
                                      borderRadius: '999px',
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '35px' }}>
                                  {item.attendancePercent}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {item.attendancePercent === 100 ? (
                                <span className="badge badge-success">حضور كامل 100% ⭐</span>
                              ) : item.attendancePercent >= 75 ? (
                                <span className="badge badge-success">ممتاز</span>
                              ) : item.attendancePercent >= 50 ? (
                                <span className="badge badge-warning">متوسط</span>
                              ) : (
                                <span className="badge badge-danger">غياب متكرر</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ABSENT BOYS & EFTEKAD TRACKER
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'absent_boys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls: Activity Filter, Urgency Filter, Sorting & Search */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '1rem',
                marginBottom: '1rem',
              }}
            >
              {/* Activity Filter for Absences */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  تصفية الغياب حسب النشاط:
                </span>
                <select
                  value={absentActivityFilter}
                  onChange={(e) => setAbsentActivityFilter(e.target.value as ActivityKey)}
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {(Object.keys(activityConfigs) as ActivityKey[]).map((key) => (
                    <option key={key} value={key}>
                      {activityConfigs[key].titleAr} ({activityConfigs[key].sessionsCount} جلسة)
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <ArrowUpDown size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '3px' }} />
                  ترتيب القائمة حسب:
                </span>
                <select
                  value={absentSortBy}
                  onChange={(e) => setAbsentSortBy(e.target.value as AbsentSortOption)}
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="absences_desc">الأكثر غياباً أولاً (Highest Absences)</option>
                  <option value="absences_asc">الأقل غياباً (Lowest Absences)</option>
                  <option value="date_desc">الغياب الأحدث تاريخاً (Most Recent Date)</option>
                  <option value="date_asc">الغياب الأقدم تاريخاً (Oldest Date)</option>
                  <option value="name_asc">اسم المخدوم أبجدياً (Name A-Z)</option>
                </select>
              </div>
            </div>

            {/* Urgency Filter Pills & Search */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setAbsentUrgencyFilter('all')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: absentUrgencyFilter === 'all' ? 'var(--color-primary)' : 'var(--bg-subtle)',
                    color: absentUrgencyFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  كافة الغائبين
                </button>

                <button
                  type="button"
                  onClick={() => setAbsentUrgencyFilter('critical')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: absentUrgencyFilter === 'critical' ? '#be123c' : '#fee2e2',
                    color: absentUrgencyFilter === 'critical' ? '#ffffff' : '#991b1b',
                  }}
                >
                  🔴 غياب متكرر (3+ مرات)
                </button>

                <button
                  type="button"
                  onClick={() => setAbsentUrgencyFilter('moderate')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: absentUrgencyFilter === 'moderate' ? '#d97706' : '#fef3c7',
                    color: absentUrgencyFilter === 'moderate' ? '#ffffff' : '#92400e',
                  }}
                >
                  🟠 غائب مرتين
                </button>

                <button
                  type="button"
                  onClick={() => setAbsentUrgencyFilter('single')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: absentUrgencyFilter === 'single' ? '#475569' : 'var(--bg-subtle)',
                    color: absentUrgencyFilter === 'single' ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  🟡 غياب جلسة واحدة
                </button>
              </div>

              {/* Search box */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="ابحث في الغائبين..."
                  value={absentSearchQuery}
                  onChange={(e) => setAbsentSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 2.2rem 0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Absent Boys List */}
          {absentSummaries.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'var(--text-muted)',
              }}
            >
              <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                نشكر ربنا! لا يوجد أولاد غائبين وفقاً لهذا الفلتر
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                كافة مخدومي الفصل حضروا الجلسات أو لا توجد جلسات مسجلة لهذه المعايير.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {absentSummaries.map((item) => {
                const isCritical = item.missedCount >= 3;
                const isModerate = item.missedCount === 2;
                const lastCompletedVisit = visits.find((v) => v.studentId === item.student.id && v.status === 'completed');

                return (
                  <div
                    key={item.student.id}
                    className="card"
                    style={{
                      padding: '1.15rem',
                      borderRadius: '14px',
                      border: isCritical
                        ? '1.5px solid #fecdd3'
                        : isModerate
                        ? '1.5px solid #fde68a'
                        : '1px solid var(--border-light)',
                      backgroundColor: isCritical ? '#fff8f8' : 'var(--bg-card)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      {/* Left/Student Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          onClick={() => onSelectStudent(item.student)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: isCritical ? '#fee2e2' : 'var(--bg-subtle)',
                            color: isCritical ? '#be123c' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            border: '1px solid var(--border-light)',
                            flexShrink: 0,
                          }}
                        >
                          {item.student.photoUrl ? (
                            <img src={item.student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            item.student.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4
                              onClick={() => onSelectStudent(item.student)}
                              style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {item.student.arabicName || item.student.name}
                            </h4>

                            {isCritical && (
                              <span
                                style={{
                                  backgroundColor: '#be123c',
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <AlertTriangle size={12} />
                                يحتاج افتقاد فوري!
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {item.student.name} • كود: {item.student.id}
                            {item.student.address && ` • ${item.student.address}`}
                          </div>
                        </div>
                      </div>

                      {/* Absence Count Badge */}
                      <div
                        style={{
                          backgroundColor: isCritical ? '#fee2e2' : isModerate ? '#fef3c7' : 'var(--bg-subtle)',
                          color: isCritical ? '#be123c' : isModerate ? '#b45309' : 'var(--text-secondary)',
                          padding: '0.45rem 0.9rem',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          border: isCritical ? '1px solid #fecaca' : isModerate ? '1px solid #fde68a' : '1px solid var(--border-light)',
                        }}
                      >
                        <XCircle size={16} />
                        <span>غائب {item.missedCount} مرات</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          (حضور {item.attendedCount}/{item.possibleSessionsCount})
                        </span>
                      </div>
                    </div>

                    {/* Missed Dates Breakdown Badges */}
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        تواريخ وأنشطة الغياب ({item.missedDetails.length} تاريخ):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {item.missedDetails.map((m, mIdx) => (
                          <span
                            key={mIdx}
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              border: '1px solid #fecaca',
                            }}
                          >
                            <Calendar size={12} />
                            <span>{m.date}</span>
                            <span style={{ opacity: 0.6 }}>•</span>
                            <span style={{ color: '#be123c' }}>{m.activityLabelAr}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: Call Dad, Call Mom, WhatsApp, Home Visit */}
                    <div
                      style={{
                        marginTop: '0.85rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      {item.student.dadPhone && (
                        <a
                          href={getWhatsAppCareLink(item.student.dadPhone, item.student)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            fontWeight: 700,
                            borderRadius: '8px',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            textDecoration: 'none',
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>واتساب ولي الأمر</span>
                        </a>
                      )}

                      {item.student.dadPhone && (
                        <a
                          href={`tel:${item.student.dadPhone}`}
                          className="btn btn-sm btn-secondary"
                          style={{ borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Phone size={14} />
                          <span>اتصال والده</span>
                        </a>
                      )}

                      {item.student.momPhone && (
                        <a
                          href={`tel:${item.student.momPhone}`}
                          className="btn btn-sm btn-secondary"
                          style={{ borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          <Phone size={14} />
                          <span>اتصال والدته</span>
                        </a>
                      )}

                      {lastCompletedVisit ? (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          ✓ تمت زيارته ({lastCompletedVisit.scheduledDate})
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                          لم يُفتقد بعد
                        </span>
                      )}

                      {onStartVisit && (
                        <button
                          type="button"
                          onClick={() => onStartVisit(item.student)}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#0d9488',
                            color: '#ffffff',
                            fontWeight: 700,
                            borderRadius: '8px',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                          }}
                        >
                          <Users size={14} />
                          <span>تسجيل زيارة افتقاد</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectStudent(item.student)}
                        className="btn btn-sm btn-secondary"
                        style={{ borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        <span>الملف الشخصي</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: ACTIVITIES COMPARISON OVERVIEW MATRIX
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'activities_overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {(
              [
                'friday_class',
                'friday_odas',
                'dars_ktab',
                'ashya',
                'mal3ab',
                'summer_club',
                'events',
                'confession',
              ] as ActivityKey[]
            ).map((actKey) => {
              const cfg = activityConfigs[actKey];
              const summaries = computeActivitySummaries(actKey);
              const totalAtt = summaries.reduce((acc, curr) => acc + curr.attendedCount, 0);
              const totalPoss = summaries.reduce((acc, curr) => acc + curr.possibleSessionsCount, 0);
              const rate = totalPoss > 0 ? Math.round((totalAtt / totalPoss) * 100) : 0;
              const topHero = summaries.sort((a, b) => b.attendedCount - a.attendedCount)[0];

              return (
                <div
                  key={actKey}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    {/* Header: Title & Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: cfg.accentBg,
                            color: cfg.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {cfg.icon}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{cfg.titleAr}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.titleEn}</span>
                        </div>
                      </div>

                      <span
                        style={{
                          backgroundColor: cfg.accentBg,
                          color: cfg.color,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                        }}
                      >
                        {cfg.sessionsCount} جلسة
                      </span>
                    </div>

                    {/* Attendance Gauge Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>نسبة الحضور الإجمالية للفصل</span>
                        <strong style={{ color: cfg.color }}>{rate}%</strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${rate}%`, height: '100%', backgroundColor: cfg.color, borderRadius: '999px' }} />
                      </div>
                    </div>

                    {/* Top Attendee in this activity */}
                    {topHero && topHero.attendedCount > 0 ? (
                      <div
                        onClick={() => onSelectStudent(topHero.student)}
                        style={{
                          backgroundColor: 'var(--bg-main)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          cursor: 'pointer',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: cfg.accentBg,
                            color: cfg.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                          }}
                        >
                          {topHero.student.photoUrl ? (
                            <img src={topHero.student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            topHero.student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>الأكثر حضوراً 🥇</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {topHero.student.arabicName || topHero.student.name}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: cfg.color }}>
                          {topHero.attendedCount} / {topHero.possibleSessionsCount}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                        لا يوجد حضور مسجل لهذه الفترة
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedActivity(actKey);
                      setActiveTab('top_attended');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    عرض ترتيب المتفوقين في هذا النشاط
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: DETAILED ATTENDANCE MATRIX SHEET
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                كشف الحضور الشامل لجميع المخدومين (Attendance Sheet)
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                نظرة سريعة على كشف الحضور والغياب لكافة التواريخ والجلسات
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} color="#10b981" /> حاضر
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <XCircle size={14} color="#ef4444" /> غائب
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-light)' }}>
                  <th style={{ padding: '0.65rem 0.5rem', width: '40px' }}>#</th>
                  <th style={{ padding: '0.65rem 0.5rem', minWidth: '160px' }}>المخدوم</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>خدمة الجمعة</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>القداس الإلهي</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>درس كتاب</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>عشية</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>الملعب</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>النادي</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>النسبة الإجمالية</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const friCount = attendance.filter((r) => isDateInPeriod(r.date) && r.studentId === student.id && r.sundaySchool).length;
                  const friTotal = sessionDatesByActivity.fridayClassDates.length;

                  const odasCount = attendance.filter((r) => isDateInPeriod(r.date) && r.studentId === student.id && r.odas).length;
                  const odasTotal = sessionDatesByActivity.fridayOdasDates.length;

                  const darsCount = darsKtab.filter((r) => isDateInPeriod(r.date) && r.studentId === student.id && r.darsKtab).length;
                  const darsTotal = sessionDatesByActivity.darsKtabDates.length;

                  const ashyaCount = darsKtab.filter((r) => isDateInPeriod(r.date) && r.studentId === student.id && r.ashya).length;
                  const ashyaTotal = sessionDatesByActivity.ashyaDates.length;

                  const mal3abCount = mal3ab.filter((r) => isDateInPeriod(r.date) && r.studentId === student.id && r.attended).length;
                  const mal3abTotal = sessionDatesByActivity.mal3abDates.length;

                  const summerCount = summerClub.filter((r) => isDateInPeriod(r.date) && r.studentId === student.id && r.attended).length;
                  const summerTotal = sessionDatesByActivity.summerClubDates.length;

                  const totalAtt = friCount + odasCount + darsCount + ashyaCount + mal3abCount + summerCount;
                  const totalPoss = friTotal + odasTotal + darsTotal + ashyaTotal + mal3abTotal + summerTotal;
                  const totalPercent = totalPoss > 0 ? Math.round((totalAtt / totalPoss) * 100) : 0;

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelectStudent(student)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>
                        <div>{student.arabicName || student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{student.id}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        {friTotal > 0 ? (
                          <span style={{ fontWeight: 700, color: friCount === friTotal ? '#059669' : friCount > 0 ? '#d97706' : '#dc2626' }}>
                            {friCount}/{friTotal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        {odasTotal > 0 ? (
                          <span style={{ fontWeight: 700, color: odasCount === odasTotal ? '#059669' : odasCount > 0 ? '#d97706' : '#dc2626' }}>
                            {odasCount}/{odasTotal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        {darsTotal > 0 ? (
                          <span style={{ fontWeight: 700, color: darsCount === darsTotal ? '#059669' : darsCount > 0 ? '#d97706' : '#dc2626' }}>
                            {darsCount}/{darsTotal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        {ashyaTotal > 0 ? (
                          <span style={{ fontWeight: 700, color: ashyaCount === ashyaTotal ? '#059669' : ashyaCount > 0 ? '#d97706' : '#dc2626' }}>
                            {ashyaCount}/{ashyaTotal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        {mal3abTotal > 0 ? (
                          <span style={{ fontWeight: 700, color: mal3abCount === mal3abTotal ? '#059669' : mal3abCount > 0 ? '#d97706' : '#dc2626' }}>
                            {mal3abCount}/{mal3abTotal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        {summerTotal > 0 ? (
                          <span style={{ fontWeight: 700, color: summerCount === summerTotal ? '#059669' : summerCount > 0 ? '#d97706' : '#dc2626' }}>
                            {summerCount}/{summerTotal}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            backgroundColor:
                              totalPercent === 100
                                ? '#ecfdf5'
                                : totalPercent >= 75
                                ? '#e0f2fe'
                                : totalPercent >= 50
                                ? '#fef3c7'
                                : '#fff1f2',
                            color:
                              totalPercent === 100
                                ? '#059669'
                                : totalPercent >= 75
                                ? '#0284c7'
                                : totalPercent >= 50
                                ? '#d97706'
                                : '#be123c',
                          }}
                        >
                          {totalPercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
