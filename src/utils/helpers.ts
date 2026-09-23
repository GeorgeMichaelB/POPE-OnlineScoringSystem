import type {
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  ConfessionRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings,
  VisitRecord,
  Student
} from '../types';

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) ? 0 : Math.max(0, age);
}

// Calculate comprehensive attendance stats across Friday, Saturday, Mal3ab, Summer Club, and Events
export function calculateAttendanceStats(
  studentId: string,
  fridayRecords: AttendanceRecord[],
  darsKtabRecords: DarsKtabRecord[] = [],
  customEvents: CustomEvent[] = [],
  mal3abRecords: Mal3abRecord[] = [],
  summerClubRecords: SummerClubRecord[] = [],
  confessionRecords: ConfessionRecord[] = []
) {
  // Friday Attendance
  const uniqueFridayDates = Array.from(new Set(fridayRecords.map((r) => r.date)));
  const totalFridaySessions = uniqueFridayDates.length;
  const studentFridayRecords = fridayRecords.filter((r) => r.studentId === studentId);
  const fridayPresent = studentFridayRecords.filter((r) => r.sundaySchool).length;
  const odasPresent = studentFridayRecords.filter((r) => r.odas).length;

  const fridayPercent = totalFridaySessions > 0 ? Math.round((fridayPresent / totalFridaySessions) * 100) : 0;
  const odasPercent = totalFridaySessions > 0 ? Math.round((odasPresent / totalFridaySessions) * 100) : 0;

  // Saturday Dars Ktab & Ashya Attendance
  const uniqueSaturdayDates = Array.from(new Set(darsKtabRecords.map((r) => r.date)));
  const totalSaturdaySessions = uniqueSaturdayDates.length;
  const studentSatRecords = darsKtabRecords.filter((r) => r.studentId === studentId);
  const darsKtabPresent = studentSatRecords.filter((r) => r.darsKtab).length;
  const ashyaPresent = studentSatRecords.filter((r) => r.ashya).length;

  const darsKtabPercent = totalSaturdaySessions > 0 ? Math.round((darsKtabPresent / totalSaturdaySessions) * 100) : 0;
  const ashyaPercent = totalSaturdaySessions > 0 ? Math.round((ashyaPresent / totalSaturdaySessions) * 100) : 0;

  // Thursday Mal3ab Attendance
  const uniqueMal3abDates = Array.from(new Set(mal3abRecords.map((r) => r.date)));
  const totalMal3abSessions = uniqueMal3abDates.length;
  const studentMal3abRecords = mal3abRecords.filter((r) => r.studentId === studentId);
  const mal3abAttended = studentMal3abRecords.filter((r) => r.attended).length;
  const mal3abMatch = studentMal3abRecords.filter((r) => r.matchPlayed).length;
  const mal3abPercent = totalMal3abSessions > 0 ? Math.round((mal3abAttended / totalMal3abSessions) * 100) : 0;

  // Summer Club Attendance
  const uniqueSummerClubDates = Array.from(new Set(summerClubRecords.map((r) => `${r.subpage}_${r.date}`)));
  const totalSummerClubSessions = uniqueSummerClubDates.length;
  const studentSummerClubRecords = summerClubRecords.filter((r) => r.studentId === studentId);
  const summerClubAttended = studentSummerClubRecords.filter((r) => r.attended).length;
  const summerClubActivity = studentSummerClubRecords.filter((r) => r.activity).length;
  const summerClubPercent = totalSummerClubSessions > 0 ? Math.round((summerClubAttended / totalSummerClubSessions) * 100) : 0;

  // Custom Events Attended
  const totalCustomEvents = customEvents.length;
  const eventsAttended = customEvents.filter((ev) => ev.attendeeIds.includes(studentId)).length;
  const eventsPercent = totalCustomEvents > 0 ? Math.round((eventsAttended / totalCustomEvents) * 100) : 0;

    // Monthly Confession stats
  const studentConfessions = confessionRecords.filter((r) => r.studentId === studentId && r.attended);
  const confessionAttendedCount = studentConfessions.length;

return {
    totalSessions: totalFridaySessions,
    sundaySchoolPresent: fridayPresent,
    sundaySchoolPercent: fridayPercent,
    odasPresent,
    odasPercent,

    totalSaturdaySessions,
    darsKtabPresent,
    darsKtabPercent,
    ashyaPresent,
    ashyaPercent,

    totalMal3abSessions,
    mal3abAttended,
    mal3abMatch,
    mal3abPercent,

    totalSummerClubSessions,
    summerClubAttended,
    summerClubActivity,
    summerClubPercent,

    totalCustomEvents,
    eventsAttended,
    eventsPercent,
    confessionAttendedCount,
    studentConfessions,
  };
}

// Calculate scoring details for a boy
export function calculateStudentScore(
  studentId: string,
  fridayRecords: AttendanceRecord[],
  darsKtabRecords: DarsKtabRecord[],
  customEvents: CustomEvent[],
  customPointEntries: CustomPointEntry[],
  settings: PointSettings,
  mal3abRecords: Mal3abRecord[] = [],
  summerClubRecords: SummerClubRecord[] = [],
  confessionRecords: ConfessionRecord[] = []
) {
  // Friday Class points (only if enabled)
  const isFridayEnabled = settings.fridayClassEnabled !== false;
  const fridayCount = fridayRecords.filter((r) => r.studentId === studentId && r.sundaySchool).length;
  const fridayPoints = isFridayEnabled ? fridayCount * (settings.fridayClassPoints || 0) : 0;

  // Odas / Liturgy points (only if enabled)
  const isOdasEnabled = settings.odasEnabled !== false;
  const odasCount = fridayRecords.filter((r) => r.studentId === studentId && r.odas).length;
  const odasPoints = isOdasEnabled ? odasCount * (settings.odasPoints || 0) : 0;

  // Saturday Dars Ktab points (only if enabled)
  const isDarsKtabEnabled = settings.darsKtabEnabled !== false;
  const darsKtabCount = darsKtabRecords.filter((r) => r.studentId === studentId && r.darsKtab).length;
  const darsKtabPoints = isDarsKtabEnabled ? darsKtabCount * (settings.darsKtabPoints || 0) : 0;

  // Saturday Ashya points (only if enabled)
  const isAshyaEnabled = settings.ashyaEnabled !== false;
  const ashyaCount = darsKtabRecords.filter((r) => r.studentId === studentId && r.ashya).length;
  const ashyaPoints = isAshyaEnabled ? ashyaCount * (settings.ashyaPoints || 0) : 0;

  // Thursday Mal3ab points (only if enabled)
  const isMal3abEnabled = settings.mal3abEnabled !== false;
  const mal3abAttendedCount = mal3abRecords.filter((r) => r.studentId === studentId && r.attended).length;
  const mal3abPoints = isMal3abEnabled ? mal3abAttendedCount * (settings.mal3abPoints ?? 10) : 0;

  const isMal3abMatchEnabled = settings.mal3abMatchEnabled !== false;
  const mal3abMatchCount = mal3abRecords.filter((r) => r.studentId === studentId && r.matchPlayed).length;
  const mal3abMatchPoints = isMal3abMatchEnabled ? mal3abMatchCount * (settings.mal3abMatchPoints ?? 5) : 0;

  // Summer Club points (only if enabled)
  const isSummerClubEnabled = settings.summerClubEnabled !== false;
  const summerClubAttendedCount = summerClubRecords.filter((r) => r.studentId === studentId && r.attended).length;
  const summerClubPoints = isSummerClubEnabled ? summerClubAttendedCount * (settings.summerClubPoints ?? 10) : 0;

  const isSummerClubActivityEnabled = settings.summerClubActivityEnabled !== false;
  const summerClubActivityCount = summerClubRecords.filter((r) => r.studentId === studentId && r.activity).length;
  const summerClubActivityPoints = isSummerClubActivityEnabled ? summerClubActivityCount * (settings.summerClubActivityPoints ?? 5) : 0;

  // Monthly Confession points (only if enabled)
  const isConfessionEnabled = settings.confessionEnabled !== false;
  const studentConfessions = confessionRecords.filter((r) => r.studentId === studentId && r.attended);
  const confessionCount = studentConfessions.length;
  const confessionPoints = isConfessionEnabled ? confessionCount * (settings.confessionPoints ?? 20) : 0;

  // Custom Events points (only if enabled)
  const isCustomEventsEnabled = settings.customEventsEnabled !== false;
  const eventCount = customEvents.filter((e) => e.attendeeIds.includes(studentId)).length;
  const eventPoints = isCustomEventsEnabled ? eventCount * (settings.customEventPoints || 0) : 0;

  // Manual Custom Points entered by servant (only if enabled)
  const isCustomPointsEnabled = settings.customPointsEnabled !== false;
  const studentCustomEntries = customPointEntries.filter((p) => p.studentId === studentId);
  const customPointsTotal = isCustomPointsEnabled
    ? studentCustomEntries.reduce((sum, item) => sum + (Number(item.points) || 0), 0)
    : 0;

  const totalScore =
    fridayPoints +
    odasPoints +
    darsKtabPoints +
    ashyaPoints +
    mal3abPoints +
    mal3abMatchPoints +
    summerClubPoints +
    summerClubActivityPoints +
    eventPoints +
    confessionPoints +
    customPointsTotal;

  return {
    totalScore,
    fridayPoints,
    fridayCount,
    odasPoints,
    odasCount,
    darsKtabPoints,
    darsKtabCount,
    ashyaPoints,
    ashyaCount,
    mal3abPoints,
    mal3abAttendedCount,
    mal3abMatchPoints,
    mal3abMatchCount,
    summerClubPoints,
    summerClubAttendedCount,
    summerClubActivityPoints,
    summerClubActivityCount,
    confessionPoints,
    confessionCount,
    confessionRecords: studentConfessions,
    eventPoints,
    eventCount,
    customPointsTotal,
    customEntries: studentCustomEntries,
  };
}

export function getStudentVisits(studentId: string, allVisits: VisitRecord[]) {
  const studentVisits = allVisits.filter((v) => v.studentId === studentId);
  const completedVisits = studentVisits
    .filter((v) => v.status === 'completed')
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  const lastVisit = completedVisits[0] || null;
  let daysSinceLastVisit: number | null = null;
  let needsEftekad = false;

  if (lastVisit) {
    const lastDate = new Date(lastVisit.scheduledDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit > 30) {
      needsEftekad = true;
    }
  } else {
    needsEftekad = true;
  }

  return {
    all: studentVisits,
    completed: completedVisits,
    lastVisit,
    daysSinceLastVisit,
    needsEftekad,
  };
}

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatTimerStopwatch(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get the nearest Friday
export function getNearestFridayDateString(): string {
  const now = new Date();
  const currentDay = now.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
  const diff = 5 - currentDay;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get the nearest Saturday
export function getNearestSaturdayDateString(): string {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = 6 - currentDay;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate an array of Friday dates only (e.g. past 14 weeks + next 4 weeks)
export function getFridaysList(countPast = 14, countFuture = 4): string[] {
  const baseNearestFriday = new Date(getNearestFridayDateString());
  const fridays: string[] = [];

  for (let i = -countPast; i <= countFuture; i++) {
    const d = new Date(baseNearestFriday);
    d.setDate(baseNearestFriday.getDate() + i * 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    fridays.push(`${year}-${month}-${day}`);
  }

  return fridays.reverse(); // most recent/upcoming first
}

// Generate an array of Saturday dates only (e.g. past 14 weeks + next 4 weeks)
export function getSaturdaysList(countPast = 14, countFuture = 4): string[] {
  const baseNearestSaturday = new Date(getNearestSaturdayDateString());
  const saturdays: string[] = [];

  for (let i = -countPast; i <= countFuture; i++) {
    const d = new Date(baseNearestSaturday);
    d.setDate(baseNearestSaturday.getDate() + i * 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    saturdays.push(`${year}-${month}-${day}`);
  }

  return saturdays.reverse(); // most recent/upcoming first
}

// Get the nearest Thursday (Thursday = 4)
export function getNearestThursdayDateString(): string {
  return getNearestWeekdayDateString(4);
}

// Generate an array of Thursday dates only
export function getThursdaysList(countPast = 14, countFuture = 4): string[] {
  return getWeekdayDatesList(4, countPast, countFuture);
}

// Generic weekday nearest date calculation (0 = Sun, 1 = Mon, ..., 6 = Sat)
export function getNearestWeekdayDateString(targetDayOfWeek: number): string {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = targetDayOfWeek - currentDay;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generic array of dates for any chosen weekday
export function getWeekdayDatesList(targetDayOfWeek: number, countPast = 14, countFuture = 4): string[] {
  const baseNearest = new Date(getNearestWeekdayDateString(targetDayOfWeek));
  const dates: string[] = [];

  for (let i = -countPast; i <= countFuture; i++) {
    const d = new Date(baseNearest);
    d.setDate(baseNearest.getDate() + i * 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  return dates.reverse(); // most recent/upcoming first
}

// Weekday selector options with English & Arabic translations
export interface WeekdayOption {
  value: number; // 0-6
  labelEn: string;
  labelAr: string;
}

export const WEEKDAY_OPTIONS: WeekdayOption[] = [
  { value: 0, labelEn: 'Sunday', labelAr: 'الأحد' },
  { value: 1, labelEn: 'Monday', labelAr: 'الإثنين' },
  { value: 2, labelEn: 'Tuesday', labelAr: 'الثلاثاء' },
  { value: 3, labelEn: 'Wednesday', labelAr: 'الأربعاء' },
  { value: 4, labelEn: 'Thursday', labelAr: 'الخميس' },
  { value: 5, labelEn: 'Friday', labelAr: 'الجمعة' },
  { value: 6, labelEn: 'Saturday', labelAr: 'السبت' },
];

export function getWeekdayName(weekdayNum: number, lang: 'en' | 'ar' = 'en'): string {
  const found = WEEKDAY_OPTIONS.find((w) => w.value === weekdayNum);
  if (!found) return '';
  return lang === 'ar' ? found.labelAr : found.labelEn;
}

// --- Birthday Utilities ---

export interface BirthdayInfo {
  student: Student;
  dob: string;
  nextBirthdayDate: Date;
  nextBirthdayDateString: string;
  daysUntil: number;
  turningAge: number;
  isToday: boolean;
  isUrgent3Days: boolean; // <= 3 days away
}

export function getStudentBirthdayInfo(student: Student, referenceDate = new Date()): BirthdayInfo | null {
  if (!student.dob) return null;
  const parts = student.dob.split('-');
  if (parts.length !== 3) return null;

  const birthYear = Number(parts[0]);
  const birthMonth = Number(parts[1]) - 1; // 0-indexed
  const birthDay = Number(parts[2]);

  const currentYear = referenceDate.getFullYear();
  // Normalize today at midnight for accurate day difference
  const today = new Date(currentYear, referenceDate.getMonth(), referenceDate.getDate());

  let nextBday = new Date(currentYear, birthMonth, birthDay);
  if (nextBday < today) {
    // Birthday has already passed this calendar year, so next one is next year
    nextBday = new Date(currentYear + 1, birthMonth, birthDay);
  }

  const diffMs = nextBday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const turningAge = nextBday.getFullYear() - birthYear;

  const monthPad = String(nextBday.getMonth() + 1).padStart(2, '0');
  const dayPad = String(nextBday.getDate()).padStart(2, '0');
  const nextBirthdayDateString = `${nextBday.getFullYear()}-${monthPad}-${dayPad}`;

  return {
    student,
    dob: student.dob,
    nextBirthdayDate: nextBday,
    nextBirthdayDateString,
    daysUntil,
    turningAge,
    isToday: daysUntil === 0,
    isUrgent3Days: daysUntil >= 0 && daysUntil <= 3,
  };
}

export function getUpcomingBirthdays(students: Student[], limitDays = 365): BirthdayInfo[] {
  const list: BirthdayInfo[] = [];
  const now = new Date();

  students.forEach((s) => {
    const info = getStudentBirthdayInfo(s, now);
    if (info && info.daysUntil <= limitDays) {
      list.push(info);
    }
  });

  // Sort by daysUntil ascending (soonest first)
  list.sort((a, b) => a.daysUntil - b.daysUntil);
  return list;
}

// Get urgent birthday alerts (0 to 3 days away)
export function getUrgentBirthdayAlerts(students: Student[]): BirthdayInfo[] {
  return getUpcomingBirthdays(students).filter((b) => b.isUrgent3Days);
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// --- Month & Confession Helper Utilities ---

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthYear(monthStr: string, lang: 'en' | 'ar' = 'en'): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = Number(parts[0]);
  const monthNum = Number(parts[1]); // 1-12

  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const arMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const mName = lang === 'ar' ? arMonths[monthNum - 1] : enMonths[monthNum - 1];
  return `${mName} ${year}`;
}

export function getRecentMonthsList(countPast = 5, countFuture = 1): string[] {
  const list: string[] = [];
  const now = new Date();

  for (let i = -countPast; i <= countFuture; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    list.push(`${year}-${month}`);
  }

  return list.reverse(); // Newest first
}
