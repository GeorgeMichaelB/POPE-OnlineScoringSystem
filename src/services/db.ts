import { get, set } from 'idb-keyval';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  SummerClubSettings,
  CustomEvent,
  VisitRecord,
  PointSettings,
  CustomPointEntry,
  ClassHero,
  UserAccount,
  AuditLogEntry,
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'pss_students_v1',
  ATTENDANCE: 'pss_attendance_v1',
  DARS_KTAB: 'pss_dars_ktab_v1',
  MAL3AB: 'pss_mal3ab_v1',
  SUMMER_CLUB: 'pss_summer_club_v1',
  SUMMER_CLUB_SETTINGS: 'pss_summer_club_settings_v1',
  CUSTOM_EVENTS: 'pss_custom_events_v1',
  VISITS: 'pss_visits_v1',
  POINT_SETTINGS: 'pss_point_settings_v1',
  CUSTOM_POINTS: 'pss_custom_points_v1',
  CLASS_HEROES: 'pss_class_heroes_v1',
  SERVANT_NAME: 'pss_current_servant',
  USERS: 'pss_users_v2',
  AUDIT_LOGS: 'pss_audit_logs_v1',
  SESSION: 'pss_session_v1',
};

export const DEFAULT_SUMMER_CLUB_SETTINGS: SummerClubSettings = {
  day1Weekday: 2, // Tuesday (الثلاثاء) default
  day2Weekday: 4, // Thursday (الخميس) default
};

const DEFAULT_POINT_SETTINGS: PointSettings = {
  fridayClassPoints: 10,
  odasPoints: 15,
  darsKtabPoints: 10,
  ashyaPoints: 5,
  customEventPoints: 20,
  mal3abPoints: 10,
  mal3abMatchPoints: 5,
  summerClubPoints: 10,
  summerClubActivityPoints: 5,
};

const INITIAL_CUSTOM_POINTS: CustomPointEntry[] = [
  {
    id: 'pts-1',
    studentId: 'PASSPORT-101',
    date: '2026-09-18',
    points: 10,
    reason: 'Memorized Gospel of Mark chapter 1 verse recitation',
    servantName: 'Servant Mina',
    createdAt: '2026-09-18T11:00:00Z',
  },
  {
    id: 'pts-2',
    studentId: 'PASSPORT-103',
    date: '2026-09-19',
    points: 15,
    reason: 'Alhan competition top score in Saturday Dars Ktab',
    servantName: 'Servant George',
    createdAt: '2026-09-19T19:00:00Z',
  },
];

const INITIAL_CLASS_HEROES: ClassHero[] = [
  {
    id: 'hero-1',
    studentId: 'PASSPORT-103',
    title: 'بطل المذبح والألحان (Altar & Alhan Champion)',
    reason: 'حضر باكرًا جدًا للقداس الإلهي، ساعد في إعداد البخور، وخدم بخشوع وفرح على المذبح.',
    badgeIcon: 'cross',
    awardedDate: '2026-09-18',
    servantName: 'خادم مينا',
    createdAt: '2026-09-18T12:00:00Z',
  },
  {
    id: 'hero-2',
    studentId: 'PASSPORT-101',
    title: 'بطل مسابقة الإنجيل (Bible Master)',
    reason: 'حفظ وتسميع إصحاح كامل من إنجيل معلمنا مرقس بدون أي خطأ أمام جميع زملائه!',
    badgeIcon: 'crown',
    awardedDate: '2026-09-19',
    servantName: 'خادم جورج',
    createdAt: '2026-09-19T19:30:00Z',
  },
];

// Predefined Servant Accounts
const INITIAL_USERS: UserAccount[] = [
  {
    username: '@george.michael',
    name: 'George Michael (Admin)',
    role: 'admin',
    passwordHash: '90122005',
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    username: '@philo.ashraf',
    name: 'Philo Ashraf',
    role: 'servant',
    passwordHash: 'password',
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    username: '@kiro.hossny',
    name: 'Kiro Hossny',
    role: 'servant',
    passwordHash: 'password',
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    username: '@alfred.samy',
    name: 'Alfred Samy',
    role: 'servant',
    passwordHash: 'password',
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Initial Audit Activity Logs
const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-18T08:00:00Z',
    username: '@george.michael',
    servantName: 'George Michael (Admin)',
    action: 'SYSTEM_INITIALIZED',
    details: 'Pope Saweros Grade 4 Sunday School Online Scoring & Attendance initialized with multi-servant accounts.',
    category: 'auth',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-18T11:05:00Z',
    username: '@george.michael',
    servantName: 'George Michael (Admin)',
    action: 'POINTS_AWARDED',
    details: 'Awarded +10 points to David Mina Youssef for "Memorized Gospel of Mark chapter 1 recitation".',
    category: 'scoring',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-18T12:00:00Z',
    username: '@george.michael',
    servantName: 'George Michael (Admin)',
    action: 'HERO_CROWNED',
    details: 'Crowned Youssef Peter Nabil as "بطل المذبح والألحان (Altar & Alhan Champion)".',
    category: 'heroes',
  },
];

// Initial sample data (Grade 4 Pope Saweros Class)
const INITIAL_STUDENTS: Student[] = [
  {
    id: 'PASSPORT-101',
    name: 'David Mina Youssef',
    dob: '2015-04-12',
    address: '14 Al-Horreya St., Heliopolis, Apt 4',
    school: 'St. Joseph Language School',
    boyPhone: '01211223344',
    dadPhone: '01223456789',
    momPhone: '01012345678',
    loveLanguage: 'Words of Affirmation',
    weakPoints: 'Shy in class discussions, gets distracted easily during hymns, needs encouragement to read Bible daily.',
    hobbies: 'Plays football (striker), loves sketching church icons, learning Coptic Alhan.',
    notes: 'Very kind boy. Responds wonderfully to praise. Father travels frequently for work; David appreciates spiritual follow-up.',
    photoUrl: '/avatars/david.jpg',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'PASSPORT-102',
    name: 'Mark Fady Shenouda',
    dob: '2015-08-25',
    address: '28 Ramses Ext., Nasr City, Building 12',
    school: 'Collège de la Sainte Famille',
    boyPhone: '01022334455',
    dadPhone: '01129876543',
    momPhone: '01287654321',
    loveLanguage: 'Quality Time',
    weakPoints: 'Quick tempered when playing games with peers, tends to arrive late to Sunday school.',
    hobbies: 'Loves robotics, chess, reading history and lives of martyrs.',
    notes: 'Active and enthusiastic. Great deacon potential. Needs calm one-on-one time to open up about school pressure.',
    photoUrl: '/avatars/mark.jpg',
    createdAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'PASSPORT-103',
    name: 'Youssef Peter Nabil',
    dob: '2015-11-03',
    address: '7 Cleopatra St., Korba, Heliopolis',
    school: 'Ramses College',
    boyPhone: '01133445566',
    dadPhone: '01005544332',
    momPhone: '01112233445',
    loveLanguage: 'Receiving Gifts',
    weakPoints: 'Struggles with regular fasting on Wednesdays and Fridays, needs encouragement in personal prayer.',
    hobbies: 'Plays piano, swimming, collects saint holy cards.',
    notes: 'Always helpful setting up the classroom. Very attached to his grandmother who is currently recovering from surgery.',
    photoUrl: '/avatars/youssef.jpg',
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'PASSPORT-104',
    name: 'Kyrollos Michael George',
    dob: '2015-02-18',
    address: '42 Abbassiya Sq., Cairo, 3rd Floor',
    school: 'Orman Language School',
    boyPhone: '',
    dadPhone: '01201122334',
    momPhone: '01098877665',
    loveLanguage: 'Physical Touch',
    weakPoints: 'Sometimes feels overlooked when quieter, anxious about upcoming math exams.',
    hobbies: 'Karate green belt, church choir member, drawing comic books.',
    notes: 'Has a warm heart and loves serving others. Remind him to bring his Agpeya to class.',
    photoUrl: '/avatars/kyrollos.jpg',
    createdAt: '2026-01-20T10:15:00Z',
  },
];

const INITIAL_FRIDAY_ATTENDANCE: AttendanceRecord[] = [
  { id: 'PASSPORT-101_2026-09-04', studentId: 'PASSPORT-101', date: '2026-09-04', sundaySchool: true, odas: true, timestamp: '2026-09-04T08:15:00Z' },
  { id: 'PASSPORT-101_2026-09-11', studentId: 'PASSPORT-101', date: '2026-09-11', sundaySchool: true, odas: true, timestamp: '2026-09-11T08:10:00Z' },
  { id: 'PASSPORT-101_2026-09-18', studentId: 'PASSPORT-101', date: '2026-09-18', sundaySchool: true, odas: false, timestamp: '2026-09-18T09:45:00Z' },

  { id: 'PASSPORT-102_2026-09-04', studentId: 'PASSPORT-102', date: '2026-09-04', sundaySchool: true, odas: false, timestamp: '2026-09-04T09:50:00Z' },
  { id: 'PASSPORT-102_2026-09-11', studentId: 'PASSPORT-102', date: '2026-09-11', sundaySchool: false, odas: false, timestamp: '2026-09-11T10:00:00Z' },
  { id: 'PASSPORT-102_2026-09-18', studentId: 'PASSPORT-102', date: '2026-09-18', sundaySchool: true, odas: true, timestamp: '2026-09-18T08:20:00Z' },

  { id: 'PASSPORT-103_2026-09-04', studentId: 'PASSPORT-103', date: '2026-09-04', sundaySchool: true, odas: true, timestamp: '2026-09-04T08:05:00Z' },
  { id: 'PASSPORT-103_2026-09-11', studentId: 'PASSPORT-103', date: '2026-09-11', sundaySchool: true, odas: true, timestamp: '2026-09-11T08:12:00Z' },
  { id: 'PASSPORT-103_2026-09-18', studentId: 'PASSPORT-103', date: '2026-09-18', sundaySchool: true, odas: true, timestamp: '2026-09-18T08:00:00Z' },

  { id: 'PASSPORT-104_2026-09-04', studentId: 'PASSPORT-104', date: '2026-09-04', sundaySchool: false, odas: false, timestamp: '2026-09-04T10:00:00Z' },
  { id: 'PASSPORT-104_2026-09-11', studentId: 'PASSPORT-104', date: '2026-09-11', sundaySchool: true, odas: false, timestamp: '2026-09-11T09:30:00Z' },
  { id: 'PASSPORT-104_2026-09-18', studentId: 'PASSPORT-104', date: '2026-09-18', sundaySchool: false, odas: false, timestamp: '2026-09-18T10:00:00Z' },
];

const INITIAL_DARS_KTAB: DarsKtabRecord[] = [
  { id: 'PASSPORT-101_2026-09-05', studentId: 'PASSPORT-101', date: '2026-09-05', ashya: true, darsKtab: true, timestamp: '2026-09-05T18:00:00Z' },
  { id: 'PASSPORT-101_2026-09-12', studentId: 'PASSPORT-101', date: '2026-09-12', ashya: true, darsKtab: true, timestamp: '2026-09-12T18:05:00Z' },
  { id: 'PASSPORT-101_2026-09-19', studentId: 'PASSPORT-101', date: '2026-09-19', ashya: false, darsKtab: true, timestamp: '2026-09-19T18:45:00Z' },

  { id: 'PASSPORT-102_2026-09-05', studentId: 'PASSPORT-102', date: '2026-09-05', ashya: true, darsKtab: false, timestamp: '2026-09-05T18:10:00Z' },
  { id: 'PASSPORT-102_2026-09-12', studentId: 'PASSPORT-102', date: '2026-09-12', ashya: true, darsKtab: true, timestamp: '2026-09-12T18:00:00Z' },

  { id: 'PASSPORT-103_2026-09-05', studentId: 'PASSPORT-103', date: '2026-09-05', ashya: true, darsKtab: true, timestamp: '2026-09-05T18:00:00Z' },
  { id: 'PASSPORT-103_2026-09-12', studentId: 'PASSPORT-103', date: '2026-09-12', ashya: true, darsKtab: true, timestamp: '2026-09-12T18:00:00Z' },
  { id: 'PASSPORT-103_2026-09-19', studentId: 'PASSPORT-103', date: '2026-09-19', ashya: true, darsKtab: true, timestamp: '2026-09-19T18:00:00Z' },
];

const INITIAL_MAL3AB: Mal3abRecord[] = [
  { id: 'PASSPORT-101_2026-09-17', studentId: 'PASSPORT-101', date: '2026-09-17', attended: true, matchPlayed: true, timestamp: '2026-09-17T17:00:00Z' },
  { id: 'PASSPORT-102_2026-09-17', studentId: 'PASSPORT-102', date: '2026-09-17', attended: true, matchPlayed: true, timestamp: '2026-09-17T17:05:00Z' },
  { id: 'PASSPORT-103_2026-09-17', studentId: 'PASSPORT-103', date: '2026-09-17', attended: true, matchPlayed: false, timestamp: '2026-09-17T17:10:00Z' },
  { id: 'PASSPORT-104_2026-09-17', studentId: 'PASSPORT-104', date: '2026-09-17', attended: false, matchPlayed: false, timestamp: '2026-09-17T17:00:00Z' },
];

const INITIAL_SUMMER_CLUB: SummerClubRecord[] = [
  { id: 'PASSPORT-101_day1_2026-09-15', studentId: 'PASSPORT-101', subpage: 'day1', date: '2026-09-15', attended: true, activity: true, timestamp: '2026-09-15T10:00:00Z' },
  { id: 'PASSPORT-102_day1_2026-09-15', studentId: 'PASSPORT-102', subpage: 'day1', date: '2026-09-15', attended: true, activity: false, timestamp: '2026-09-15T10:15:00Z' },
  { id: 'PASSPORT-103_day1_2026-09-15', studentId: 'PASSPORT-103', subpage: 'day1', date: '2026-09-15', attended: true, activity: true, timestamp: '2026-09-15T10:00:00Z' },
  { id: 'PASSPORT-101_day2_2026-09-17', studentId: 'PASSPORT-101', subpage: 'day2', date: '2026-09-17', attended: true, activity: true, timestamp: '2026-09-17T10:00:00Z' },
  { id: 'PASSPORT-103_day2_2026-09-17', studentId: 'PASSPORT-103', subpage: 'day2', date: '2026-09-17', attended: true, activity: true, timestamp: '2026-09-17T10:00:00Z' },
];

const INITIAL_CUSTOM_EVENTS: CustomEvent[] = [
  {
    id: 'event-1',
    title: 'St. Mina Monastery Spiritual Trip',
    date: '2026-09-15',
    location: 'St. Mina Monastery, Maryut',
    description: 'Spiritual day for Pope Saweros class: Liturgy, Bible quiz, and monastery blessing.',
    attendeeIds: ['PASSPORT-101', 'PASSPORT-102', 'PASSPORT-103'],
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'event-2',
    title: 'Bible & Alhan Championship',
    date: '2026-09-22',
    location: 'Church Main Hall',
    description: 'Bible contest covering Gospel of Saint Mark.',
    attendeeIds: ['PASSPORT-101', 'PASSPORT-103'],
    createdAt: '2026-09-01T12:00:00Z',
  },
];

const INITIAL_VISITS: VisitRecord[] = [
  {
    id: 'visit-1',
    studentId: 'PASSPORT-101',
    servantName: 'Servant Mina & Servant George',
    scheduledDate: '2026-09-10',
    scheduledTime: '18:00',
    status: 'completed',
    durationSeconds: 2700,
    notes: 'Wonderful home visit with David and his family. Spoke about Saint Moses the Strong. David showed his recent church drawings. Blessed the home.',
    photos: [],
    createdAt: '2026-09-08T14:00:00Z',
    completedAt: '2026-09-10T18:45:00Z',
  },
  {
    id: 'visit-2',
    studentId: 'PASSPORT-102',
    servantName: 'Servant George',
    scheduledDate: '2026-09-25',
    scheduledTime: '19:00',
    status: 'scheduled',
    durationSeconds: 0,
    notes: 'Planned visit to check on Mark after his exams.',
    photos: [],
    createdAt: '2026-09-18T16:00:00Z',
  },
];

class DatabaseService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // --- Students ---
  async getStudents(): Promise<Student[]> {
    if (!this.isBrowser()) return INITIAL_STUDENTS;
    try {
      const stored = await get<Student[]>(STORAGE_KEYS.STUDENTS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    } catch (e) {
      console.warn('Error fetching students:', e);
      return INITIAL_STUDENTS;
    }
  }

  async saveStudents(students: Student[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.STUDENTS, students);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Error saving students:', e);
    }
  }

  async saveStudent(student: Student): Promise<void> {
    const students = await this.getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.unshift(student);
    }
    await this.saveStudents(students);
  }

  async deleteStudent(id: string): Promise<void> {
    const students = await this.getStudents();
    const filtered = students.filter((s) => s.id !== id);
    await this.saveStudents(filtered);
  }

  // --- Main Friday Attendance ---
  async getAttendance(): Promise<AttendanceRecord[]> {
    if (!this.isBrowser()) return INITIAL_FRIDAY_ATTENDANCE;
    try {
      const stored = await get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllAttendance(INITIAL_FRIDAY_ATTENDANCE);
      return INITIAL_FRIDAY_ATTENDANCE;
    } catch (e) {
      console.warn('Error fetching attendance:', e);
      return INITIAL_FRIDAY_ATTENDANCE;
    }
  }

  async saveAllAttendance(records: AttendanceRecord[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.ATTENDANCE, records);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving attendance:', e);
    }
  }

  async recordAttendance(
    studentId: string,
    date: string,
    sundaySchool: boolean,
    odas: boolean
  ): Promise<AttendanceRecord> {
    const records = await this.getAttendance();
    const recordId = `${studentId}_${date}`;
    const existingIndex = records.findIndex((r) => r.id === recordId || (r.studentId === studentId && r.date === date));

    const newRecord: AttendanceRecord = {
      id: recordId,
      studentId,
      date,
      sundaySchool,
      odas,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    await this.saveAllAttendance(records);
    return newRecord;
  }

  // --- Saturday Dars Ktab Attendance ---
  async getDarsKtabAttendance(): Promise<DarsKtabRecord[]> {
    if (!this.isBrowser()) return INITIAL_DARS_KTAB;
    try {
      const stored = await get<DarsKtabRecord[]>(STORAGE_KEYS.DARS_KTAB);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.DARS_KTAB);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllDarsKtab(INITIAL_DARS_KTAB);
      return INITIAL_DARS_KTAB;
    } catch (e) {
      console.warn('Error fetching Dars Ktab:', e);
      return INITIAL_DARS_KTAB;
    }
  }

  async saveAllDarsKtab(records: DarsKtabRecord[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.DARS_KTAB, records);
      localStorage.setItem(STORAGE_KEYS.DARS_KTAB, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving Dars Ktab records:', e);
    }
  }

  async recordDarsKtabAttendance(
    studentId: string,
    date: string,
    ashya: boolean,
    darsKtab: boolean
  ): Promise<DarsKtabRecord> {
    const records = await this.getDarsKtabAttendance();
    const recordId = `${studentId}_${date}`;
    const existingIndex = records.findIndex((r) => r.id === recordId || (r.studentId === studentId && r.date === date));

    const newRecord: DarsKtabRecord = {
      id: recordId,
      studentId,
      date,
      ashya,
      darsKtab,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    await this.saveAllDarsKtab(records);
    return newRecord;
  }

  // --- Thursday Mal3ab Attendance (ملعب الخميس) ---
  async getMal3abAttendance(): Promise<Mal3abRecord[]> {
    if (!this.isBrowser()) return INITIAL_MAL3AB;
    try {
      const stored = await get<Mal3abRecord[]>(STORAGE_KEYS.MAL3AB);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.MAL3AB);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllMal3ab(INITIAL_MAL3AB);
      return INITIAL_MAL3AB;
    } catch (e) {
      console.warn('Error fetching Mal3ab records:', e);
      return INITIAL_MAL3AB;
    }
  }

  async saveAllMal3ab(records: Mal3abRecord[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.MAL3AB, records);
      localStorage.setItem(STORAGE_KEYS.MAL3AB, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving Mal3ab records:', e);
    }
  }

  async recordMal3abAttendance(
    studentId: string,
    date: string,
    attended: boolean,
    matchPlayed: boolean
  ): Promise<Mal3abRecord> {
    const records = await this.getMal3abAttendance();
    const recordId = `${studentId}_${date}`;
    const existingIndex = records.findIndex((r) => r.id === recordId || (r.studentId === studentId && r.date === date));

    const newRecord: Mal3abRecord = {
      id: recordId,
      studentId,
      date,
      attended,
      matchPlayed,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    await this.saveAllMal3ab(records);
    return newRecord;
  }

  // --- Summer Club Attendance (النادي الصيفي - يومين) ---
  async getSummerClubAttendance(): Promise<SummerClubRecord[]> {
    if (!this.isBrowser()) return INITIAL_SUMMER_CLUB;
    try {
      const stored = await get<SummerClubRecord[]>(STORAGE_KEYS.SUMMER_CLUB);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.SUMMER_CLUB);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllSummerClub(INITIAL_SUMMER_CLUB);
      return INITIAL_SUMMER_CLUB;
    } catch (e) {
      console.warn('Error fetching Summer Club records:', e);
      return INITIAL_SUMMER_CLUB;
    }
  }

  async saveAllSummerClub(records: SummerClubRecord[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.SUMMER_CLUB, records);
      localStorage.setItem(STORAGE_KEYS.SUMMER_CLUB, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving Summer Club records:', e);
    }
  }

  async recordSummerClubAttendance(
    studentId: string,
    subpage: 'day1' | 'day2',
    date: string,
    attended: boolean,
    activity: boolean
  ): Promise<SummerClubRecord> {
    const records = await this.getSummerClubAttendance();
    const recordId = `${studentId}_${subpage}_${date}`;
    const existingIndex = records.findIndex(
      (r) => r.id === recordId || (r.studentId === studentId && r.subpage === subpage && r.date === date)
    );

    const newRecord: SummerClubRecord = {
      id: recordId,
      studentId,
      subpage,
      date,
      attended,
      activity,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    await this.saveAllSummerClub(records);
    return newRecord;
  }

  // --- Summer Club Configurable Weekdays Settings ---
  async getSummerClubSettings(): Promise<SummerClubSettings> {
    if (!this.isBrowser()) return DEFAULT_SUMMER_CLUB_SETTINGS;
    try {
      const stored = await get<SummerClubSettings>(STORAGE_KEYS.SUMMER_CLUB_SETTINGS);
      if (stored && typeof stored.day1Weekday === 'number' && typeof stored.day2Weekday === 'number') {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.SUMMER_CLUB_SETTINGS);
      if (local) {
        const parsed = JSON.parse(local);
        if (typeof parsed.day1Weekday === 'number' && typeof parsed.day2Weekday === 'number') {
          return parsed;
        }
      }
      await this.saveSummerClubSettings(DEFAULT_SUMMER_CLUB_SETTINGS);
      return DEFAULT_SUMMER_CLUB_SETTINGS;
    } catch (e) {
      console.warn('Error fetching Summer Club settings:', e);
      return DEFAULT_SUMMER_CLUB_SETTINGS;
    }
  }

  async saveSummerClubSettings(settings: SummerClubSettings): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.SUMMER_CLUB_SETTINGS, settings);
      localStorage.setItem(STORAGE_KEYS.SUMMER_CLUB_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving Summer Club settings:', e);
    }
  }

  // --- Customized Events ---
  async getCustomEvents(): Promise<CustomEvent[]> {
    if (!this.isBrowser()) return INITIAL_CUSTOM_EVENTS;
    try {
      const stored = await get<CustomEvent[]>(STORAGE_KEYS.CUSTOM_EVENTS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.CUSTOM_EVENTS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllCustomEvents(INITIAL_CUSTOM_EVENTS);
      return INITIAL_CUSTOM_EVENTS;
    } catch (e) {
      console.warn('Error fetching custom events:', e);
      return INITIAL_CUSTOM_EVENTS;
    }
  }

  async saveAllCustomEvents(events: CustomEvent[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.CUSTOM_EVENTS, events);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Error saving custom events:', e);
    }
  }

  async saveCustomEvent(event: CustomEvent): Promise<void> {
    const events = await this.getCustomEvents();
    const index = events.findIndex((e) => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.unshift(event);
    }
    await this.saveAllCustomEvents(events);
  }

  async deleteCustomEvent(id: string): Promise<void> {
    const events = await this.getCustomEvents();
    const filtered = events.filter((e) => e.id !== id);
    await this.saveAllCustomEvents(filtered);
  }

  async toggleEventAttendance(eventId: string, studentId: string): Promise<CustomEvent | null> {
    const events = await this.getCustomEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;

    if (event.attendeeIds.includes(studentId)) {
      event.attendeeIds = event.attendeeIds.filter((id) => id !== studentId);
    } else {
      event.attendeeIds.push(studentId);
    }

    await this.saveAllCustomEvents(events);
    return event;
  }

  // --- Scoring System: Point Settings ---
  async getPointSettings(): Promise<PointSettings> {
    if (!this.isBrowser()) return DEFAULT_POINT_SETTINGS;
    try {
      const stored = await get<PointSettings>(STORAGE_KEYS.POINT_SETTINGS);
      if (stored) return stored;
      const local = localStorage.getItem(STORAGE_KEYS.POINT_SETTINGS);
      if (local) return JSON.parse(local);
      await this.savePointSettings(DEFAULT_POINT_SETTINGS);
      return DEFAULT_POINT_SETTINGS;
    } catch (e) {
      console.warn('Error loading point settings:', e);
      return DEFAULT_POINT_SETTINGS;
    }
  }

  async savePointSettings(settings: PointSettings): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.POINT_SETTINGS, settings);
      localStorage.setItem(STORAGE_KEYS.POINT_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving point settings:', e);
    }
  }

  // --- Scoring System: Custom Points ---
  async getCustomPoints(): Promise<CustomPointEntry[]> {
    if (!this.isBrowser()) return INITIAL_CUSTOM_POINTS;
    try {
      const stored = await get<CustomPointEntry[]>(STORAGE_KEYS.CUSTOM_POINTS);
      if (stored && Array.isArray(stored)) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.CUSTOM_POINTS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
      await this.saveAllCustomPoints(INITIAL_CUSTOM_POINTS);
      return INITIAL_CUSTOM_POINTS;
    } catch (e) {
      console.warn('Error loading custom points:', e);
      return INITIAL_CUSTOM_POINTS;
    }
  }

  async saveAllCustomPoints(entries: CustomPointEntry[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.CUSTOM_POINTS, entries);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_POINTS, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving custom points:', e);
    }
  }

  async addCustomPointEntry(entry: CustomPointEntry): Promise<void> {
    const entries = await this.getCustomPoints();
    entries.unshift(entry);
    await this.saveAllCustomPoints(entries);
  }

  async deleteCustomPointEntry(id: string): Promise<void> {
    const entries = await this.getCustomPoints();
    const filtered = entries.filter((e) => e.id !== id);
    await this.saveAllCustomPoints(filtered);
  }

  // --- Class Heroes (أبطال الفصل ولوحة الشرف) ---
  async getClassHeroes(): Promise<ClassHero[]> {
    if (!this.isBrowser()) return INITIAL_CLASS_HEROES;
    try {
      const stored = await get<ClassHero[]>(STORAGE_KEYS.CLASS_HEROES);
      if (stored && Array.isArray(stored)) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.CLASS_HEROES);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
      await this.saveAllClassHeroes(INITIAL_CLASS_HEROES);
      return INITIAL_CLASS_HEROES;
    } catch (e) {
      console.warn('Error loading class heroes:', e);
      return INITIAL_CLASS_HEROES;
    }
  }

  async saveAllClassHeroes(heroes: ClassHero[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.CLASS_HEROES, heroes);
      localStorage.setItem(STORAGE_KEYS.CLASS_HEROES, JSON.stringify(heroes));
    } catch (e) {
      console.error('Error saving class heroes:', e);
    }
  }

  async saveClassHero(hero: ClassHero): Promise<void> {
    const heroes = await this.getClassHeroes();
    const index = heroes.findIndex((h) => h.id === hero.id);
    if (index >= 0) {
      heroes[index] = hero;
    } else {
      heroes.unshift(hero);
    }
    await this.saveAllClassHeroes(heroes);
  }

  async deleteClassHero(id: string): Promise<void> {
    const heroes = await this.getClassHeroes();
    const filtered = heroes.filter((h) => h.id !== id);
    await this.saveAllClassHeroes(filtered);
  }

  // --- Visits / Eftekad ---
  async getVisits(): Promise<VisitRecord[]> {
    if (!this.isBrowser()) return INITIAL_VISITS;
    try {
      const stored = await get<VisitRecord[]>(STORAGE_KEYS.VISITS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.VISITS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllVisits(INITIAL_VISITS);
      return INITIAL_VISITS;
    } catch (e) {
      console.warn('Error fetching visits:', e);
      return INITIAL_VISITS;
    }
  }

  async saveAllVisits(visits: VisitRecord[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.VISITS, visits);
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    } catch (e) {
      console.error('Error saving visits:', e);
    }
  }

  async saveVisit(visit: VisitRecord): Promise<void> {
    const visits = await this.getVisits();
    const index = visits.findIndex((v) => v.id === visit.id);
    if (index >= 0) {
      visits[index] = visit;
    } else {
      visits.unshift(visit);
    }
    await this.saveAllVisits(visits);
  }

  async deleteVisit(id: string): Promise<void> {
    const visits = await this.getVisits();
    const filtered = visits.filter((v) => v.id !== id);
    await this.saveAllVisits(filtered);
  }

  // --- Servant Name & Session ---
  getCurrentServantName(): string {
    if (!this.isBrowser()) return 'George Michael';
    return localStorage.getItem(STORAGE_KEYS.SERVANT_NAME) || 'George Michael';
  }

  setCurrentServantName(name: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SERVANT_NAME, name);
  }

  getCurrentSession(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(STORAGE_KEYS.SESSION);
  }

  setCurrentSession(username: string | null): void {
    if (!this.isBrowser()) return;
    if (username) {
      localStorage.setItem(STORAGE_KEYS.SESSION, username);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  // --- Multi-Servant Accounts ---
  async getUsers(): Promise<UserAccount[]> {
    if (!this.isBrowser()) return INITIAL_USERS;
    try {
      const stored = await get<UserAccount[]>(STORAGE_KEYS.USERS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.USERS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllUsers(INITIAL_USERS);
      return INITIAL_USERS;
    } catch (e) {
      console.warn('Error loading users:', e);
      return INITIAL_USERS;
    }
  }

  async saveAllUsers(users: UserAccount[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.USERS, users);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }

  async getUserByUsername(username: string): Promise<UserAccount | null> {
    const users = await this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    return (
      users.find(
        (u) =>
          u.username.toLowerCase() === cleanUsername ||
          u.username.toLowerCase() === `@${cleanUsername.replace(/^@/, '')}`
      ) || null
    );
  }

  async updateUserPassword(username: string, newPassword: string): Promise<void> {
    const users = await this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const index = users.findIndex(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.username.toLowerCase() === `@${cleanUsername.replace(/^@/, '')}`
    );
    if (index >= 0) {
      users[index] = {
        ...users[index],
        passwordHash: newPassword,
        mustChangePassword: false,
      };
      await this.saveAllUsers(users);
    }
  }

  // --- Activity Audit Logs (Admin Only) ---
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (!this.isBrowser()) return INITIAL_LOGS;
    try {
      const stored = await get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllAuditLogs(INITIAL_LOGS);
      return INITIAL_LOGS;
    } catch (e) {
      console.warn('Error loading audit logs:', e);
      return INITIAL_LOGS;
    }
  }

  async saveAllAuditLogs(logs: AuditLogEntry[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.AUDIT_LOGS, logs);
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving audit logs:', e);
    }
  }

  async addLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const logs = await this.getAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 1000 logs
    const trimmed = logs.slice(0, 1000);
    await this.saveAllAuditLogs(trimmed);
    return newLog;
  }

  async clearAuditLogs(): Promise<void> {
    await this.saveAllAuditLogs([]);
  }

  // --- Full Backup & Restore ---
  async exportFullBackup(): Promise<string> {
    const students = await this.getStudents();
    const attendance = await this.getAttendance();
    const darsKtab = await this.getDarsKtabAttendance();
    const mal3ab = await this.getMal3abAttendance();
    const summerClub = await this.getSummerClubAttendance();
    const summerClubSettings = await this.getSummerClubSettings();
    const customEvents = await this.getCustomEvents();
    const visits = await this.getVisits();
    const pointSettings = await this.getPointSettings();
    const customPoints = await this.getCustomPoints();
    const classHeroes = await this.getClassHeroes();
    const users = await this.getUsers();
    const auditLogs = await this.getAuditLogs();

    const backup = {
      version: 6,
      appName: 'Pope Saweros Sunday School Online Scoring & Attendance System',
      exportDate: new Date().toISOString(),
      students,
      attendance,
      darsKtab,
      mal3ab,
      summerClub,
      summerClubSettings,
      customEvents,
      visits,
      pointSettings,
      customPoints,
      classHeroes,
      users,
      auditLogs,
    };
    return JSON.stringify(backup, null, 2);
  }

  async importFullBackup(jsonString: string): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.students || !Array.isArray(data.students)) {
        throw new Error('Invalid backup file format: missing students array.');
      }
      await this.saveStudents(data.students);
      if (Array.isArray(data.attendance)) await this.saveAllAttendance(data.attendance);
      if (Array.isArray(data.darsKtab)) await this.saveAllDarsKtab(data.darsKtab);
      if (Array.isArray(data.mal3ab)) await this.saveAllMal3ab(data.mal3ab);
      if (Array.isArray(data.summerClub)) await this.saveAllSummerClub(data.summerClub);
      if (data.summerClubSettings) await this.saveSummerClubSettings(data.summerClubSettings);
      if (Array.isArray(data.customEvents)) await this.saveAllCustomEvents(data.customEvents);
      if (Array.isArray(data.visits)) await this.saveAllVisits(data.visits);
      if (data.pointSettings) await this.savePointSettings(data.pointSettings);
      if (Array.isArray(data.customPoints)) await this.saveAllCustomPoints(data.customPoints);
      if (Array.isArray(data.classHeroes)) await this.saveAllClassHeroes(data.classHeroes);
      if (Array.isArray(data.users)) await this.saveAllUsers(data.users);
      if (Array.isArray(data.auditLogs)) await this.saveAllAuditLogs(data.auditLogs);

      return {
        success: true,
        count: data.students.length,
        message: `Successfully imported ${data.students.length} students with scores, attendance, visits, heroes, and logs!`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error during import.';
      return { success: false, count: 0, message };
    }
  }

  async resetToSampleData(): Promise<void> {
    await this.saveStudents(INITIAL_STUDENTS);
    await this.saveAllAttendance(INITIAL_FRIDAY_ATTENDANCE);
    await this.saveAllDarsKtab(INITIAL_DARS_KTAB);
    await this.saveAllMal3ab(INITIAL_MAL3AB);
    await this.saveAllSummerClub(INITIAL_SUMMER_CLUB);
    await this.saveSummerClubSettings(DEFAULT_SUMMER_CLUB_SETTINGS);
    await this.saveAllCustomEvents(INITIAL_CUSTOM_EVENTS);
    await this.saveAllVisits(INITIAL_VISITS);
    await this.savePointSettings(DEFAULT_POINT_SETTINGS);
    await this.saveAllCustomPoints(INITIAL_CUSTOM_POINTS);
    await this.saveAllClassHeroes(INITIAL_CLASS_HEROES);
    await this.saveAllUsers(INITIAL_USERS);
    await this.saveAllAuditLogs(INITIAL_LOGS);
  }
}

export const db = new DatabaseService();
