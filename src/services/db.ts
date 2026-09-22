import { get, set } from 'idb-keyval';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  SummerClubSettings,
  ConfessionRecord,
  CustomEvent,
  VisitRecord,
  PointSettings,
  CustomPointEntry,
  ClassHero,
  UserAccount,
  AuditLogEntry,
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'pss_students_v3',
  ATTENDANCE: 'pss_attendance_v2',
  DARS_KTAB: 'pss_dars_ktab_v2',
  MAL3AB: 'pss_mal3ab_v2',
  SUMMER_CLUB: 'pss_summer_club_v2',
  SUMMER_CLUB_SETTINGS: 'pss_summer_club_settings_v1',
  CONFESSIONS: 'pss_confessions_v2',
  CUSTOM_EVENTS: 'pss_custom_events_v2',
  VISITS: 'pss_visits_v2',
  POINT_SETTINGS: 'pss_point_settings_v1',
  CUSTOM_POINTS: 'pss_custom_points_v2',
  CLASS_HEROES: 'pss_class_heroes_v2',
  SERVANT_NAME: 'pss_current_servant',
  USERS: 'pss_users_v2',
  AUDIT_LOGS: 'pss_audit_logs_v2',
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
  confessionPoints: 20,
};

const INITIAL_CUSTOM_POINTS: CustomPointEntry[] = [];

const INITIAL_CLASS_HEROES: ClassHero[] = [];

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
    timestamp: '2026-09-23T00:00:00Z',
    username: '@george.michael',
    servantName: 'George Michael (Admin)',
    action: 'SYSTEM_INITIALIZED',
    details: 'Pope Saweros Grade 4 Sunday School Online Scoring & Attendance initialized with official 28-student roster.',
    category: 'students',
  },
];

// Official Grade 4 Pope Saweros Class Roster (28 Real Students)
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'AWI1012',
    series: 'APSAW2743401',
    name: 'Andy Wael Ibrahim',
    arabicName: 'أندي وائل إبراهيم',
    dob: '2016-10-12',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'RAS0101',
    series: 'APSRA2743402',
    name: 'Roger Amin Sabry',
    arabicName: 'روجيه أمين صبري',
    dob: '2017-01-01',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'CNN0210',
    series: 'APSCN2743403',
    name: 'Chris Nabil Nassif',
    arabicName: 'كريس نبيل نصيف',
    dob: '2016-02-10',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'KFF1218',
    series: 'APSKF2743404',
    name: 'Karim Farid Fadl',
    arabicName: 'كريم فريد فضل',
    dob: '2017-12-18',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'CAJ0827',
    series: 'APSCA2743405',
    name: 'Chris Andre Joseph',
    arabicName: 'كريس اندريه',
    dob: '2016-08-27',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'OZR1210',
    series: 'APSOZ2743406',
    name: 'Oliver Zaher Roushdy',
    arabicName: 'اولفير زاهر رشدى',
    dob: '2016-12-10',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'SSS0929',
    series: 'APSSS2743407',
    name: 'Sam Sameh Sami',
    arabicName: 'سام سامح سامي',
    dob: '2016-09-29',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'MRW0117',
    series: 'APSMR2743408',
    name: 'Mark Raymond Wagieh',
    arabicName: 'مارك ريمون وجية',
    dob: '2017-01-17',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'AAS0122',
    series: 'APSAA2743409',
    name: 'Adam Adel Saeed',
    arabicName: 'ادم عادل سعيد',
    dob: '2017-01-22',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'RRA0117',
    series: 'APSRR2743410',
    name: 'Rivan Romany Anwar',
    arabicName: 'ريڤان روماني أنور',
    dob: '2017-01-17',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'MJA0516',
    series: 'APSMJ2743411',
    name: 'Marcellino Joseph',
    arabicName: 'مارسلينو جوزيف',
    dob: '2016-05-16',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'ERB0309',
    series: 'APSER2743412',
    name: 'Estefanos Romany',
    arabicName: 'اسطفانوس روماني',
    dob: '2016-03-09',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'ARB0309',
    series: 'APSAR2743413',
    name: 'Abanoub Romany',
    arabicName: 'ابنوب روماني بشري',
    dob: '2016-03-09',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'PMX0310',
    series: 'APSPM2743414',
    name: 'Philopateer Mina',
    arabicName: 'فيلوباتير مينا',
    dob: '2016-03-10',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'KSA1212',
    series: 'APSKS2743415',
    name: 'Karim Sherif Adi',
    arabicName: 'كريم شريف عادي',
    dob: '2016-12-12',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'MDT0220',
    series: 'APSMD2743416',
    name: 'Martyros Dimedos',
    arabicName: 'مارتيروس ديميدوس',
    dob: '2018-02-20',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'EMB0808',
    series: 'APSEM2743417',
    name: 'Evandro Michael',
    arabicName: 'ايفندرو مايكل بهجت',
    dob: '2016-08-08',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'RJX0318',
    series: 'APSRJ2743418',
    name: 'Robin Jean',
    arabicName: 'روبن جان',
    dob: '2017-03-18',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'TPS0505',
    series: 'APSTP2743419',
    name: 'Tony Pola Shafik',
    arabicName: 'توني بولا شفيق',
    dob: '2017-05-05',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'PGB0720',
    series: 'APSPG2743420',
    name: 'Petronius Gergis Boshra',
    arabicName: 'بترونيوس جرجس',
    dob: '2016-07-20',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'MMX0228',
    series: 'APSMM2743421',
    name: 'Marten Mina',
    arabicName: 'مرتن مينا',
    dob: '2018-02-28',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'NKJ0718',
    series: 'APSNK2743422',
    name: 'Nofeer Kyrillos John',
    arabicName: 'نوفير كيرولس جون',
    dob: '2017-07-18',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'ERE1119',
    series: 'APSER2743423',
    name: 'Estefanos Romany Edward',
    arabicName: 'اسطفانوس روماني',
    dob: '2016-11-19',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'PDR1111',
    series: 'APSPD2743424',
    name: 'Petronius Domadios Roushdy',
    arabicName: 'بترونيوس دوماديوس',
    dob: '2016-11-04',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'KMA0729',
    series: 'APSKM2743425',
    name: 'Karim Malak Adel',
    arabicName: 'كريم ملاك عادل',
    dob: '2017-07-29',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'AM',
    series: 'APSAM2743426',
    name: 'Andy Mark',
    arabicName: 'أندي مارك',
    dob: '',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'YRA0811',
    series: 'APSYR2743427',
    name: 'Youssef Ramy Atef',
    arabicName: 'يوسف رامي عاطف',
    dob: '2017-11-08',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
  {
    id: 'SSR0825',
    series: 'APSSS2743428',
    name: 'Shady Shiref Roshdy',
    arabicName: 'شادي شريف',
    dob: '2016-08-25',
    address: '',
    school: '',
    category: 'Pope Saweros Class',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Other / Not determined',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: '2026-09-23T00:00:00Z',
  },
];

const INITIAL_FRIDAY_ATTENDANCE: AttendanceRecord[] = [];
const INITIAL_DARS_KTAB: DarsKtabRecord[] = [];
const INITIAL_MAL3AB: Mal3abRecord[] = [];
const INITIAL_SUMMER_CLUB: SummerClubRecord[] = [];
const INITIAL_CONFESSIONS: ConfessionRecord[] = [];
const INITIAL_CUSTOM_EVENTS: CustomEvent[] = [];
const INITIAL_VISITS: VisitRecord[] = [];

class DatabaseService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // --- Students ---
  async getStudents(): Promise<Student[]> {
    if (!this.isBrowser()) return INITIAL_STUDENTS;
    try {
      // Purge legacy mock sample data if present in localStorage
      const legacyStudents = localStorage.getItem('pss_students_v1');
      if (legacyStudents && legacyStudents.includes('PASSPORT-101')) {
        localStorage.removeItem('pss_students_v1');
        localStorage.removeItem('pss_attendance_v1');
        localStorage.removeItem('pss_dars_ktab_v1');
        localStorage.removeItem('pss_mal3ab_v1');
        localStorage.removeItem('pss_summer_club_v1');
        localStorage.removeItem('pss_confessions_v1');
        localStorage.removeItem('pss_custom_events_v1');
        localStorage.removeItem('pss_visits_v1');
        localStorage.removeItem('pss_custom_points_v1');
        localStorage.removeItem('pss_class_heroes_v1');
        localStorage.removeItem('pss_audit_logs_v1');
      }

      const stored = await get<Student[]>(STORAGE_KEYS.STUDENTS);
      if (
        stored &&
        Array.isArray(stored) &&
        stored.length > 0 &&
        !stored.some((s) => s.id.startsWith('PASSPORT-'))
      ) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (local) {
        const parsed = JSON.parse(local);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          !parsed.some((s: Student) => s.id.startsWith('PASSPORT-'))
        ) {
          return parsed;
        }
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
    await this.saveAllConfessionRecords(INITIAL_CONFESSIONS);
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

  // --- Monthly Confession Attendance (سر ومتابعة الاعتراف الشهري) ---
  async getConfessionRecords(): Promise<ConfessionRecord[]> {
    if (!this.isBrowser()) return INITIAL_CONFESSIONS;
    try {
      const stored = await get<ConfessionRecord[]>(STORAGE_KEYS.CONFESSIONS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      const local = localStorage.getItem(STORAGE_KEYS.CONFESSIONS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      await this.saveAllConfessionRecords(INITIAL_CONFESSIONS);
      return INITIAL_CONFESSIONS;
    } catch (e) {
      console.warn('Error fetching Confession records:', e);
      return INITIAL_CONFESSIONS;
    }
  }

  async saveAllConfessionRecords(records: ConfessionRecord[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      await set(STORAGE_KEYS.CONFESSIONS, records);
      localStorage.setItem(STORAGE_KEYS.CONFESSIONS, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving Confession records:', e);
    }
  }

  async recordConfession(
    studentId: string,
    month: string,
    attended: boolean,
    scheduledDay?: number,
    confessionDate?: string,
    confessionFather?: string,
    notes?: string
  ): Promise<ConfessionRecord> {
    const records = await this.getConfessionRecords();
    const recordId = `${studentId}_${month}`;
    const existingIndex = records.findIndex(
      (r) => r.id === recordId || (r.studentId === studentId && r.month === month)
    );

    const newRecord: ConfessionRecord = {
      id: recordId,
      studentId,
      month,
      attended,
      scheduledDay: scheduledDay ?? records[existingIndex]?.scheduledDay,
      confessionDate: attended ? (confessionDate || `${month}-${String(scheduledDay || new Date().getDate()).padStart(2, '0')}`) : undefined,
      confessionFather: confessionFather ?? records[existingIndex]?.confessionFather,
      notes: notes !== undefined ? notes : records[existingIndex]?.notes,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    await this.saveAllConfessionRecords(records);
    return newRecord;
  }

  async updateStudentConfessionSchedule(
    studentId: string,
    scheduledDay: number,
    confessionFather?: string
  ): Promise<void> {
    const students = await this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (student) {
      student.confessionMonthlyDay = scheduledDay;
      if (confessionFather !== undefined) {
        student.confessionFather = confessionFather;
      }
      await this.saveStudents(students);
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
    const confessions = await this.getConfessionRecords();
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
      confessions,
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
      if (Array.isArray(data.confessions)) await this.saveAllConfessionRecords(data.confessions);
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
    await this.saveAllConfessionRecords(INITIAL_CONFESSIONS);
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
