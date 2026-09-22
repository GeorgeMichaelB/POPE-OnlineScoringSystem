import type {
  AttendanceRecord,
  DarsKtabRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings,
  VisitRecord
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

// Calculate comprehensive attendance stats across Friday, Saturday, and Events
export function calculateAttendanceStats(
  studentId: string,
  fridayRecords: AttendanceRecord[],
  darsKtabRecords: DarsKtabRecord[] = [],
  customEvents: CustomEvent[] = []
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

  // Custom Events Attended
  const totalCustomEvents = customEvents.length;
  const eventsAttended = customEvents.filter((ev) => ev.attendeeIds.includes(studentId)).length;
  const eventsPercent = totalCustomEvents > 0 ? Math.round((eventsAttended / totalCustomEvents) * 100) : 0;

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

    totalCustomEvents,
    eventsAttended,
    eventsPercent,
  };
}

// Calculate scoring details for a boy
export function calculateStudentScore(
  studentId: string,
  fridayRecords: AttendanceRecord[],
  darsKtabRecords: DarsKtabRecord[],
  customEvents: CustomEvent[],
  customPointEntries: CustomPointEntry[],
  settings: PointSettings
) {
  // Friday Class points
  const fridayCount = fridayRecords.filter((r) => r.studentId === studentId && r.sundaySchool).length;
  const fridayPoints = fridayCount * (settings.fridayClassPoints || 0);

  // Odas / Liturgy points
  const odasCount = fridayRecords.filter((r) => r.studentId === studentId && r.odas).length;
  const odasPoints = odasCount * (settings.odasPoints || 0);

  // Saturday Dars Ktab points
  const darsKtabCount = darsKtabRecords.filter((r) => r.studentId === studentId && r.darsKtab).length;
  const darsKtabPoints = darsKtabCount * (settings.darsKtabPoints || 0);

  // Saturday Ashya points
  const ashyaCount = darsKtabRecords.filter((r) => r.studentId === studentId && r.ashya).length;
  const ashyaPoints = ashyaCount * (settings.ashyaPoints || 0);

  // Custom Events points
  const eventCount = customEvents.filter((e) => e.attendeeIds.includes(studentId)).length;
  const eventPoints = eventCount * (settings.customEventPoints || 0);

  // Manual Custom Points entered by servant
  const studentCustomEntries = customPointEntries.filter((p) => p.studentId === studentId);
  const customPointsTotal = studentCustomEntries.reduce((sum, item) => sum + (Number(item.points) || 0), 0);

  const totalScore = fridayPoints + odasPoints + darsKtabPoints + ashyaPoints + eventPoints + customPointsTotal;

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
