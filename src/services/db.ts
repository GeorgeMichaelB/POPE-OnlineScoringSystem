import { get, set } from 'idb-keyval';
import { syncService, type SyncEventType } from './sync';
import { cloudSync } from './firebase';
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
  UserRole,
  UserStatus,
  ClassRoom,
  AuditLogEntry,
  DailyBackupSnapshot,
} from '../types';

const STORAGE_KEYS = {
  CLASSES: 'pss_saas_classes_v1',
  CURRENT_CLASS: 'pss_current_class_id',
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
  USERS: 'pss_users_v3',
  AUDIT_LOGS: 'pss_audit_logs_v2',
  SUPERADMIN_LOGS: 'pss_superadmin_audit_logs_v1',
  DAILY_BACKUPS: 'pss_daily_backups_v1',
  LAST_DAILY_BACKUP_DATE: 'pss_last_daily_backup_date',
  SESSION: 'pss_session_v1',
};

const BASE_KEY_TO_SYNC_TYPE: Record<string, SyncEventType> = {
  [STORAGE_KEYS.STUDENTS]: 'STUDENTS_UPDATED',
  [STORAGE_KEYS.ATTENDANCE]: 'ATTENDANCE_UPDATED',
  [STORAGE_KEYS.DARS_KTAB]: 'DARS_KTAB_UPDATED',
  [STORAGE_KEYS.MAL3AB]: 'MAL3AB_UPDATED',
  [STORAGE_KEYS.SUMMER_CLUB]: 'SUMMER_CLUB_UPDATED',
  [STORAGE_KEYS.SUMMER_CLUB_SETTINGS]: 'SUMMER_CLUB_SETTINGS_UPDATED',
  [STORAGE_KEYS.CONFESSIONS]: 'CONFESSIONS_UPDATED',
  [STORAGE_KEYS.CUSTOM_EVENTS]: 'CUSTOM_EVENTS_UPDATED',
  [STORAGE_KEYS.VISITS]: 'VISITS_UPDATED',
  [STORAGE_KEYS.POINT_SETTINGS]: 'POINT_SETTINGS_UPDATED',
  [STORAGE_KEYS.CUSTOM_POINTS]: 'CUSTOM_POINTS_UPDATED',
  [STORAGE_KEYS.CLASS_HEROES]: 'CLASS_HEROES_UPDATED',
  [STORAGE_KEYS.AUDIT_LOGS]: 'AUDIT_LOGS_UPDATED',
};

export const DEFAULT_CLASS: ClassRoom = {
  id: 'class_popesaweros',
  name: 'Pope Saweros Class (Grade 4)',
  username: 'popesaweros4',
  adminUsername: '@george.michael',
  createdAt: '2026-01-01T00:00:00Z',
  description: 'Official Pope Saweros Grade 4 Sunday School Class',
  status: 'active',
};

export const INITIAL_CLASSES: ClassRoom[] = [DEFAULT_CLASS];

export const DEFAULT_SUMMER_CLUB_SETTINGS: SummerClubSettings = {
  day1Weekday: 2, // Tuesday (الثلاثاء) default
  day2Weekday: 4, // Thursday (الخميس) default
};

export const DEFAULT_POINT_SETTINGS: PointSettings = {
  fridayClassEnabled: true,
  fridayClassPoints: 10,
  fridayLateCutoffMinutes: 15,
  fridayLatePenaltyPoints: 0,
  fridayLateIntervalMinutes: 2,
  fridayLateIntervalPoints: 1,
  fridayLateDeductionEnabled: true,
  fridayLateRequireTouchID: true,
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
};

const INITIAL_CUSTOM_POINTS: CustomPointEntry[] = [];

const INITIAL_CLASS_HEROES: ClassHero[] = [];

// Master SuperAdmin Account (@george.dev / 90122005)
export const SUPERADMIN_ACCOUNT: UserAccount = {
  username: '@george.dev',
  name: 'George Dev (Super Admin)',
  role: 'superadmin',
  passwordHash: '90122005',
  status: 'approved',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00Z',
};

// Predefined Servant Accounts
const INITIAL_USERS: UserAccount[] = [
  SUPERADMIN_ACCOUNT,
  {
    username: '@george.michael',
    name: 'George Michael (Admin)',
    role: 'admin',
    passwordHash: '90122005',
    classId: 'class_popesaweros',
    classUsername: 'popesaweros4',
    status: 'approved',
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    username: '@philo.ashraf',
    name: 'Philo Ashraf',
    role: 'servant',
    passwordHash: 'password',
    classId: 'class_popesaweros',
    classUsername: 'popesaweros4',
    status: 'approved',
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    username: '@kiro.hossny',
    name: 'Kiro Hossny',
    role: 'servant',
    passwordHash: 'password',
    classId: 'class_popesaweros',
    classUsername: 'popesaweros4',
    status: 'approved',
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    username: '@alfred.samy',
    name: 'Alfred Samy',
    role: 'servant',
    passwordHash: 'password',
    classId: 'class_popesaweros',
    classUsername: 'popesaweros4',
    status: 'approved',
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

  private activeClassId: string = DEFAULT_CLASS.id;
  private currentServantUsername: string = '@george.michael';
  private currentServantName: string = 'George Michael (Admin)';

  setSyncServant(username: string, name: string): void {
    this.currentServantUsername = username;
    this.currentServantName = name;
    syncService.setCurrentUser({ username, name });
  }

  setActiveClassId(classId: string | null): void {
    this.activeClassId = classId || DEFAULT_CLASS.id;
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS, this.activeClassId);
    }
    syncService.init(this.activeClassId, {
      username: this.currentServantUsername,
      name: this.currentServantName,
    });
  }

  getActiveClassId(): string {
    if (this.isBrowser()) {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS);
      if (saved) {
        this.activeClassId = saved;
      }
    }
    return this.activeClassId || DEFAULT_CLASS.id;
  }

  getScopedKey(baseKey: string, classId?: string): string {
    const cid = classId || this.getActiveClassId();
    return `${baseKey}_${cid}`;
  }

  // --- Classes Management (SaaS Multi-Tenancy) ---
  async getClasses(): Promise<ClassRoom[]> {
    if (!this.isBrowser()) return INITIAL_CLASSES;
    try {
      let stored: ClassRoom[] | undefined = undefined;
      try {
        stored = await get<ClassRoom[]>(STORAGE_KEYS.CLASSES);
      } catch {
        // Fallback to localStorage
      }
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored.map((c) => ({ ...c, status: c.status || 'active' }));
      }
      const local = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: ClassRoom) => ({ ...c, status: c.status || 'active' }));
        }
      }
      await this.saveAllClasses(INITIAL_CLASSES);
      return INITIAL_CLASSES;
    } catch (e) {
      console.warn('Error fetching classes:', e);
      return INITIAL_CLASSES;
    }
  }

  async saveAllClasses(classes: ClassRoom[], broadcast = true): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      try {
        await set(STORAGE_KEYS.CLASSES, classes);
      } catch {
        // Safe IDB fallback
      }
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
      if (broadcast) {
        syncService.publish({
          classId: 'global',
          type: 'CLASSES_UPDATED',
          data: classes,
          senderUsername: this.currentServantUsername,
          senderName: this.currentServantName,
        });
      }
    } catch (e) {
      console.error('Error saving classes:', e);
    }
  }

  async getClassById(id: string): Promise<ClassRoom | null> {
    const classes = await this.getClasses();
    return classes.find((c) => c.id === id) || null;
  }

  async getClassByUsername(username: string): Promise<ClassRoom | null> {
    const classes = await this.getClasses();
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    return classes.find((c) => c.username.toLowerCase().replace(/^@/, '') === clean) || null;
  }

  async checkClassUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.getClassByUsername(username);
    return !existing;
  }

  async createClass(
    name: string,
    username: string,
    adminUsername: string,
    description?: string
  ): Promise<ClassRoom> {
    const classes = await this.getClasses();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_-]/g, '');

    if (!cleanUsername) {
      throw new Error('Class username cannot be empty.');
    }

    const existing = classes.find(
      (c) => c.username.toLowerCase().replace(/^@/, '') === cleanUsername
    );
    if (existing) {
      throw new Error(`Class username "@${cleanUsername}" is already taken. Please choose another username.`);
    }

    const newClass: ClassRoom = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      username: cleanUsername,
      adminUsername: adminUsername.startsWith('@') ? adminUsername : `@${adminUsername}`,
      createdAt: new Date().toISOString(),
      description: description?.trim() || '',
      status: 'active',
    };

    classes.push(newClass);
    await this.saveAllClasses(classes);

    // Initialize scoped settings for the new class
    this.setActiveClassId(newClass.id);
    await this.savePointSettings(DEFAULT_POINT_SETTINGS);
    await this.saveSummerClubSettings(DEFAULT_SUMMER_CLUB_SETTINGS);
    await this.saveStudents([]);

    await this.addLogEntry({
      username: adminUsername,
      servantName: adminUsername,
      action: 'CLASS_CREATED',
      details: `New class created: "${newClass.name}" (@${newClass.username})`,
      category: 'classes',
    });

    return newClass;
  }

  // SuperAdmin: Suspend / Reactivate Class
  async suspendClass(classId: string, suspended: boolean): Promise<void> {
    const classes = await this.getClasses();
    const index = classes.findIndex((c) => c.id === classId);
    if (index >= 0) {
      classes[index] = {
        ...classes[index],
        status: suspended ? 'suspended' : 'active',
      };
      await this.saveAllClasses(classes);

      await this.addLogEntry({
        username: '@george.dev',
        servantName: 'George Dev (Super Admin)',
        action: suspended ? 'SUPERADMIN_CLASS_SUSPENDED' : 'SUPERADMIN_CLASS_REACTIVATED',
        details: `Class "${classes[index].name}" (@${classes[index].username}) was ${suspended ? 'suspended' : 'reactivated'} by Superadmin.`,
        category: 'superadmin',
      });
    }
  }

  async isClassSuspended(classId: string): Promise<boolean> {
    const cls = await this.getClassById(classId);
    return cls?.status === 'suspended';
  }

  // SuperAdmin: Delete Class Permanently
  async deleteClass(classId: string): Promise<void> {
    const classes = await this.getClasses();
    const target = classes.find((c) => c.id === classId);
    if (!target) return;

    const filtered = classes.filter((c) => c.id !== classId);
    await this.saveAllClasses(filtered);

    // Update users assigned to this class
    const users = await this.getUsers();
    let usersChanged = false;
    const updatedUsers = users.map((u) => {
      if (u.classId === classId) {
        usersChanged = true;
        return {
          ...u,
          classId: undefined,
          classUsername: undefined,
          status: 'rejected' as UserStatus,
        };
      }
      return u;
    });

    if (usersChanged) {
      await this.saveAllUsers(updatedUsers);
    }

    // Clean up scoped localStorage keys
    if (this.isBrowser()) {
      const suffix = `_${classId}`;
      Object.keys(localStorage).forEach((key) => {
        if (key.endsWith(suffix)) {
          localStorage.removeItem(key);
        }
      });
    }

    await this.addLogEntry({
      username: '@george.dev',
      servantName: 'George Dev (Super Admin)',
      action: 'SUPERADMIN_CLASS_DELETED',
      details: `Class "${target.name}" (@${target.username}) was permanently deleted by Superadmin.`,
      category: 'superadmin',
    });
  }

  async getClassStudentsCount(classId: string): Promise<number> {
    const currentActive = this.getActiveClassId();
    this.setActiveClassId(classId);
    const students = await this.getStudents();
    this.setActiveClassId(currentActive);
    return students.length;
  }

  async getClassServantsCount(classId: string): Promise<number> {
    const users = await this.getUsers();
    return users.filter((u) => u.classId === classId).length;
  }

  getCurrentClassId(): string | null {
    if (!this.isBrowser()) return DEFAULT_CLASS.id;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS) || DEFAULT_CLASS.id;
  }

  setCurrentClassId(classId: string | null): void {
    if (!this.isBrowser()) return;
    if (classId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS, classId);
      this.activeClassId = classId;
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CLASS);
      this.activeClassId = DEFAULT_CLASS.id;
    }
  }


  private async getScopedData<T>(baseKey: string, fallback: T): Promise<T> {
    if (!this.isBrowser()) return fallback;
    const scopedKey = this.getScopedKey(baseKey);
    const activeClassId = this.getActiveClassId();

    try {
      let stored: T | undefined = undefined;
      try {
        stored = await get<T>(scopedKey);
      } catch {
        // Fallback to localStorage
      }
      if (stored !== undefined && stored !== null) {
        return stored;
      }

      const local = localStorage.getItem(scopedKey);
      if (local !== null) {
        return JSON.parse(local);
      }

      // If default class, check legacy un-scoped key
      if (activeClassId === DEFAULT_CLASS.id) {
        let legacyStored: T | undefined = undefined;
        try {
          legacyStored = await get<T>(baseKey);
        } catch {
          // Fallback to localStorage
        }
        if (legacyStored !== undefined && legacyStored !== null) {
          await this.setScopedData(baseKey, legacyStored);
          return legacyStored;
        }
        const legacyLocal = localStorage.getItem(baseKey);
        if (legacyLocal !== null) {
          const parsed = JSON.parse(legacyLocal);
          await this.setScopedData(baseKey, parsed);
          return parsed;
        }
      }

      // Check cloud if local storage has no data (crucial for new devices logging in)
      if (cloudSync.isConfigured()) {
        try {
          const cloudSection = await cloudSync.getClassSection<T>(activeClassId, baseKey);
          if (cloudSection !== null && cloudSection !== undefined) {
            await this.setScopedData(baseKey, cloudSection, false);
            return cloudSection;
          }
        } catch {}
      }

      // Non-default class or empty fallback
      await this.setScopedData(baseKey, fallback);
      return fallback;
    } catch (e) {
      console.warn(`Error fetching scoped data for ${scopedKey}:`, e);
      return fallback;
    }
  }

  /**
   * Pulls all class data and global users/classes from Firebase Cloud to local device
   */
  async syncClassWithCloud(classId = this.getActiveClassId()): Promise<{ synced: boolean; count: number }> {
    if (!cloudSync.isConfigured()) return { synced: false, count: 0 };

    const sections = [
      STORAGE_KEYS.STUDENTS,
      STORAGE_KEYS.ATTENDANCE,
      STORAGE_KEYS.DARS_KTAB,
      STORAGE_KEYS.MAL3AB,
      STORAGE_KEYS.SUMMER_CLUB,
      STORAGE_KEYS.SUMMER_CLUB_SETTINGS,
      STORAGE_KEYS.CONFESSIONS,
      STORAGE_KEYS.CUSTOM_EVENTS,
      STORAGE_KEYS.VISITS,
      STORAGE_KEYS.POINT_SETTINGS,
      STORAGE_KEYS.CUSTOM_POINTS,
      STORAGE_KEYS.CLASS_HEROES,
      STORAGE_KEYS.AUDIT_LOGS,
    ];

    let count = 0;
    for (const key of sections) {
      try {
        const cloudData = await cloudSync.getClassSection(classId, key);
        if (cloudData !== null && cloudData !== undefined) {
          await this.setScopedData(key, cloudData, false);
          count++;
        }
      } catch (err) {
        console.warn(`Error pulling cloud section ${key}:`, err);
      }
    }

    // Also pull global classes and users if available
    try {
      const cloudClasses = await cloudSync.getGlobal<ClassRoom[]>('classes');
      if (cloudClasses && Array.isArray(cloudClasses) && cloudClasses.length > 0) {
        await this.saveAllClasses(cloudClasses, false);
      }
    } catch {}

    try {
      const cloudUsers = await cloudSync.getGlobal<UserAccount[]>('users');
      if (cloudUsers && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        await this.saveAllUsers(cloudUsers, false);
      }
    } catch {}

    return { synced: true, count };
  }

  /**
   * Bundles all current local class data & global users/classes for one-click upload to Firebase Cloud
   */
  async exportLocalClassSnapshot(classId = this.getActiveClassId()) {
    const currentActive = this.getActiveClassId();
    this.setActiveClassId(classId);
    try {
      const [
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
        auditLogs,
        classes,
        users,
      ] = await Promise.all([
        this.getStudents(),
        this.getAttendance(),
        this.getDarsKtabAttendance(),
        this.getMal3abAttendance(),
        this.getSummerClubAttendance(),
        this.getSummerClubSettings(),
        this.getConfessionRecords(),
        this.getCustomEvents(),
        this.getVisits(),
        this.getPointSettings(),
        this.getCustomPoints(),
        this.getClassHeroes(),
        this.getAuditLogs(),
        this.getClasses(),
        this.getUsers(),
      ]);

      const sections: Record<string, unknown> = {
        [STORAGE_KEYS.STUDENTS]: students,
        [STORAGE_KEYS.ATTENDANCE]: attendance,
        [STORAGE_KEYS.DARS_KTAB]: darsKtab,
        [STORAGE_KEYS.MAL3AB]: mal3ab,
        [STORAGE_KEYS.SUMMER_CLUB]: summerClub,
        [STORAGE_KEYS.SUMMER_CLUB_SETTINGS]: summerClubSettings,
        [STORAGE_KEYS.CONFESSIONS]: confessions,
        [STORAGE_KEYS.CUSTOM_EVENTS]: customEvents,
        [STORAGE_KEYS.VISITS]: visits,
        [STORAGE_KEYS.POINT_SETTINGS]: pointSettings,
        [STORAGE_KEYS.CUSTOM_POINTS]: customPoints,
        [STORAGE_KEYS.CLASS_HEROES]: classHeroes,
        [STORAGE_KEYS.AUDIT_LOGS]: auditLogs,
      };

      return {
        classes,
        users,
        sections,
      };
    } finally {
      this.setActiveClassId(currentActive);
    }
  }

  async applyRemoteUpdate<T>(baseKey: string, data: T): Promise<void> {
    await this.setScopedData(baseKey, data, false);
  }

  private async setScopedData<T>(baseKey: string, data: T, broadcast = true): Promise<void> {
    if (!this.isBrowser()) return;
    const scopedKey = this.getScopedKey(baseKey);
    try {
      try {
        await set(scopedKey, data);
      } catch {
        // Safe IDB fallback
      }
      localStorage.setItem(scopedKey, JSON.stringify(data));

      // Real-time broadcast to all other servants in the same class
      if (broadcast) {
        const syncType = BASE_KEY_TO_SYNC_TYPE[baseKey];
        if (syncType) {
          syncService.publish({
            classId: this.getActiveClassId(),
            type: syncType,
            data,
            senderUsername: this.currentServantUsername,
            senderName: this.currentServantName,
          });
        }
      }
    } catch (e) {
      console.error(`Error saving scoped data for ${scopedKey}:`, e);
    }
  }

  // --- Students ---
  async getStudents(): Promise<Student[]> {
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    if (!this.isBrowser()) return isDefault ? INITIAL_STUDENTS : [];
    return await this.getScopedData<Student[]>(
      STORAGE_KEYS.STUDENTS,
      isDefault ? INITIAL_STUDENTS : []
    );
  }

  async saveStudents(students: Student[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.STUDENTS, students);
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
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<AttendanceRecord[]>(
      STORAGE_KEYS.ATTENDANCE,
      isDefault ? INITIAL_FRIDAY_ATTENDANCE : []
    );
  }

  async saveAllAttendance(records: AttendanceRecord[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.ATTENDANCE, records);
  }

  async recordAttendance(
    studentId: string,
    date: string,
    sundaySchool: boolean,
    odas: boolean,
    isLate?: boolean,
    checkInMinutes?: number,
    pointsAwarded?: number
  ): Promise<AttendanceRecord> {
    const records = await this.getAttendance();
    const recordId = `${studentId}_${date}`;
    const existingIndex = records.findIndex((r) => r.id === recordId || (r.studentId === studentId && r.date === date));
    const existing = existingIndex >= 0 ? records[existingIndex] : null;

    const newRecord: AttendanceRecord = {
      id: recordId,
      studentId,
      date,
      sundaySchool,
      odas,
      timestamp: existing?.timestamp || new Date().toISOString(),
      isLate: isLate !== undefined ? isLate : existing?.isLate ?? false,
      checkInMinutes: checkInMinutes !== undefined ? checkInMinutes : existing?.checkInMinutes,
      pointsAwarded: pointsAwarded !== undefined ? pointsAwarded : existing?.pointsAwarded,
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    await this.saveAllAttendance(records);
    return newRecord;
  }

  async updateAttendanceLateStatus(
    studentId: string,
    date: string,
    isLate: boolean
  ): Promise<AttendanceRecord | null> {
    const records = await this.getAttendance();
    const recordId = `${studentId}_${date}`;
    const existingIndex = records.findIndex((r) => r.id === recordId || (r.studentId === studentId && r.date === date));
    if (existingIndex < 0) return null;

    const existing = records[existingIndex];
    const updated: AttendanceRecord = {
      ...existing,
      isLate,
    };
    records[existingIndex] = updated;
    await this.saveAllAttendance(records);
    return updated;
  }

  // --- Saturday Dars Ktab Attendance ---
  async getDarsKtabAttendance(): Promise<DarsKtabRecord[]> {
    if (!this.isBrowser()) return INITIAL_DARS_KTAB;
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<DarsKtabRecord[]>(
      STORAGE_KEYS.DARS_KTAB,
      isDefault ? INITIAL_DARS_KTAB : []
    );
  }

  async saveAllDarsKtab(records: DarsKtabRecord[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.DARS_KTAB, records);
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
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<Mal3abRecord[]>(
      STORAGE_KEYS.MAL3AB,
      isDefault ? INITIAL_MAL3AB : []
    );
  }

  async saveAllMal3ab(records: Mal3abRecord[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.MAL3AB, records);
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
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<SummerClubRecord[]>(
      STORAGE_KEYS.SUMMER_CLUB,
      isDefault ? INITIAL_SUMMER_CLUB : []
    );
  }

  async saveAllSummerClub(records: SummerClubRecord[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.SUMMER_CLUB, records);
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
    return await this.getScopedData<SummerClubSettings>(
      STORAGE_KEYS.SUMMER_CLUB_SETTINGS,
      DEFAULT_SUMMER_CLUB_SETTINGS
    );
  }

  async saveSummerClubSettings(settings: SummerClubSettings): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.SUMMER_CLUB_SETTINGS, settings);
  }

  // --- Monthly Confession Attendance (سر ومتابعة الاعتراف الشهري) ---
  async getConfessionRecords(): Promise<ConfessionRecord[]> {
    if (!this.isBrowser()) return INITIAL_CONFESSIONS;
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<ConfessionRecord[]>(
      STORAGE_KEYS.CONFESSIONS,
      isDefault ? INITIAL_CONFESSIONS : []
    );
  }

  async saveAllConfessionRecords(records: ConfessionRecord[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.CONFESSIONS, records);
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
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<CustomEvent[]>(
      STORAGE_KEYS.CUSTOM_EVENTS,
      isDefault ? INITIAL_CUSTOM_EVENTS : []
    );
  }

  async saveAllCustomEvents(events: CustomEvent[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.CUSTOM_EVENTS, events);
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
    return await this.getScopedData<PointSettings>(
      STORAGE_KEYS.POINT_SETTINGS,
      DEFAULT_POINT_SETTINGS
    );
  }

  async savePointSettings(settings: PointSettings): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.POINT_SETTINGS, settings);
  }

  // --- Scoring System: Custom Points ---
  async getCustomPoints(): Promise<CustomPointEntry[]> {
    if (!this.isBrowser()) return INITIAL_CUSTOM_POINTS;
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<CustomPointEntry[]>(
      STORAGE_KEYS.CUSTOM_POINTS,
      isDefault ? INITIAL_CUSTOM_POINTS : []
    );
  }

  async saveAllCustomPoints(entries: CustomPointEntry[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.CUSTOM_POINTS, entries);
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
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<ClassHero[]>(
      STORAGE_KEYS.CLASS_HEROES,
      isDefault ? INITIAL_CLASS_HEROES : []
    );
  }

  async saveAllClassHeroes(heroes: ClassHero[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.CLASS_HEROES, heroes);
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
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<VisitRecord[]>(
      STORAGE_KEYS.VISITS,
      isDefault ? INITIAL_VISITS : []
    );
  }

  async saveAllVisits(visits: VisitRecord[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.VISITS, visits);
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

  // --- Multi-Servant Accounts & Approvals ---
  async getUsers(): Promise<UserAccount[]> {
    if (!this.isBrowser()) return INITIAL_USERS;
    try {
      let list: UserAccount[] = [];
      try {
        const stored = await get<UserAccount[]>(STORAGE_KEYS.USERS);
        if (stored && Array.isArray(stored) && stored.length > 0) {
          list = stored;
        }
      } catch {
        // Fallback to localStorage
      }
      if (list.length === 0) {
        const local = localStorage.getItem(STORAGE_KEYS.USERS);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      }
      if (list.length === 0) {
        list = [...INITIAL_USERS];
      }

      // Ensure @george.dev superadmin account is always present
      const hasSuperAdmin = list.some(
        (u) => u.username.toLowerCase() === '@george.dev' || u.username.toLowerCase() === 'george.dev'
      );
      if (!hasSuperAdmin) {
        list.unshift(SUPERADMIN_ACCOUNT);
        await this.saveAllUsers(list);
      } else {
        list = list.map((u) => {
          if (u.username.toLowerCase() === '@george.dev' || u.username.toLowerCase() === 'george.dev') {
            return {
              ...u,
              role: 'superadmin' as UserRole,
              passwordHash: u.passwordHash || '90122005',
              status: 'approved' as UserStatus,
            };
          }
          return {
            ...u,
            classId: u.classId || (u.role === 'superadmin' ? undefined : DEFAULT_CLASS.id),
            classUsername: u.classUsername || (u.role === 'superadmin' ? undefined : DEFAULT_CLASS.username),
            status: u.status || 'approved',
          };
        });
      }

      return list;
    } catch (e) {
      console.warn('Error loading users:', e);
      return INITIAL_USERS;
    }
  }

  async saveAllUsers(users: UserAccount[], broadcast = true): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      try {
        await set(STORAGE_KEYS.USERS, users);
      } catch {
        // Safe IDB fallback
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (broadcast) {
        syncService.publish({
          classId: 'global',
          type: 'USERS_UPDATED',
          data: users,
          senderUsername: this.currentServantUsername,
          senderName: this.currentServantName,
        });
      }
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }

  async getUserByUsername(username: string): Promise<UserAccount | null> {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === '@george.dev' || cleanUsername === 'george.dev') {
      const users = await this.getUsers();
      const superUser = users.find(
        (u) =>
          u.username.toLowerCase() === '@george.dev' ||
          u.username.toLowerCase() === 'george.dev'
      );
      return superUser || SUPERADMIN_ACCOUNT;
    }
    const users = await this.getUsers();
    return (
      users.find(
        (u) =>
          u.username.toLowerCase() === cleanUsername ||
          u.username.toLowerCase() === `@${cleanUsername.replace(/^@/, '')}`
      ) || null
    );
  }

  async registerUser(params: {
    username: string;
    name: string;
    password: string;
    role: UserRole;
    classId?: string;
    classUsername?: string;
    status?: UserStatus;
  }): Promise<UserAccount> {
    const users = await this.getUsers();
    const cleanUsername = params.username.trim().startsWith('@')
      ? params.username.trim()
      : `@${params.username.trim()}`;

    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      throw new Error(`Username ${cleanUsername} already exists. Please choose a different username.`);
    }

    const newUser: UserAccount = {
      username: cleanUsername,
      name: params.name.trim(),
      role: params.role,
      passwordHash: params.password,
      classId: params.classId,
      classUsername: params.classUsername,
      status: params.status || 'approved',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await this.saveAllUsers(users);

    await this.addLogEntry({
      username: newUser.username,
      servantName: newUser.name,
      action: 'SERVANT_REGISTERED',
      details: `Servant ${newUser.name} registered with role ${newUser.role} (status: ${newUser.status})`,
      category: 'servants',
    });

    return newUser;
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

  async getPendingServantsForClass(classId: string): Promise<UserAccount[]> {
    const users = await this.getUsers();
    return users.filter((u) => u.classId === classId && u.status === 'pending');
  }

  async approveServant(username: string): Promise<void> {
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
        status: 'approved',
      };
      await this.saveAllUsers(users);

      await this.addLogEntry({
        username: users[index].username,
        servantName: users[index].name,
        action: 'SERVANT_APPROVED',
        details: `Servant ${users[index].name} (@${users[index].username}) was approved by class admin`,
        category: 'servants',
      });
    }
  }

  async rejectServant(username: string): Promise<void> {
    const users = await this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const index = users.findIndex(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.username.toLowerCase() === `@${cleanUsername.replace(/^@/, '')}`
    );
    if (index >= 0) {
      const servant = users[index];
      users[index] = {
        ...servant,
        status: 'rejected',
        classId: undefined,
        classUsername: undefined,
      };
      await this.saveAllUsers(users);

      await this.addLogEntry({
        username: servant.username,
        servantName: servant.name,
        action: 'SERVANT_REJECTED',
        details: `Servant ${servant.name} request to join was declined by class admin`,
        category: 'servants',
      });
    }
  }

  async getClassServants(classId: string): Promise<UserAccount[]> {
    const users = await this.getUsers();
    return users.filter((u) => u.classId === classId && u.status === 'approved');
  }

  async removeServantFromClass(username: string): Promise<void> {
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
        classId: undefined,
        classUsername: undefined,
        status: undefined,
      };
      await this.saveAllUsers(users);
    }
  }

  // SuperAdmin: Delete any servant account
  async deleteUser(username: string): Promise<void> {
    const clean = username.trim().toLowerCase();
    if (clean === '@george.dev' || clean === 'george.dev') {
      throw new Error('The master SuperAdmin account cannot be deleted.');
    }
    const users = await this.getUsers();
    const target = users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.username.toLowerCase() === `@${clean.replace(/^@/, '')}`
    );
    if (!target) return;

    const filtered = users.filter(
      (u) =>
        u.username.toLowerCase() !== clean &&
        u.username.toLowerCase() !== `@${clean.replace(/^@/, '')}`
    );
    await this.saveAllUsers(filtered);

    await this.addLogEntry({
      username: '@george.dev',
      servantName: 'George Dev (Super Admin)',
      action: 'SUPERADMIN_USER_DELETED',
      details: `Account for servant "${target.name}" (@${target.username}) was permanently deleted by Superadmin.`,
      category: 'superadmin',
    });
  }

  // SuperAdmin: Update servant role
  async updateUserRole(username: string, newRole: UserRole): Promise<void> {
    const users = await this.getUsers();
    const clean = username.trim().toLowerCase();
    const index = users.findIndex(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.username.toLowerCase() === `@${clean.replace(/^@/, '')}`
    );
    if (index >= 0) {
      users[index] = {
        ...users[index],
        role: newRole,
      };
      await this.saveAllUsers(users);

      await this.addLogEntry({
        username: '@george.dev',
        servantName: 'George Dev (Super Admin)',
        action: 'SUPERADMIN_ROLE_UPDATED',
        details: `Role for ${users[index].name} (@${users[index].username}) was updated to "${newRole}".`,
        category: 'superadmin',
      });
    }
  }

  // SuperAdmin: Update servant approval status
  async updateUserStatus(username: string, newStatus: UserStatus): Promise<void> {
    const users = await this.getUsers();
    const clean = username.trim().toLowerCase();
    const index = users.findIndex(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.username.toLowerCase() === `@${clean.replace(/^@/, '')}`
    );
    if (index >= 0) {
      users[index] = {
        ...users[index],
        status: newStatus,
      };
      await this.saveAllUsers(users);

      await this.addLogEntry({
        username: '@george.dev',
        servantName: 'George Dev (Super Admin)',
        action: 'SUPERADMIN_STATUS_UPDATED',
        details: `Status for ${users[index].name} (@${users[index].username}) was changed to "${newStatus}".`,
        category: 'superadmin',
      });
    }
  }

  // SuperAdmin: Total Students Count Across All Classes
  async getAllGlobalStudentsCount(): Promise<number> {
    const classes = await this.getClasses();
    let total = 0;
    for (const c of classes) {
      total += await this.getClassStudentsCount(c.id);
    }
    return total;
  }


  // --- Activity Audit Logs (Per Class) ---
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (!this.isBrowser()) return INITIAL_LOGS;
    const isDefault = this.getActiveClassId() === DEFAULT_CLASS.id;
    return await this.getScopedData<AuditLogEntry[]>(
      STORAGE_KEYS.AUDIT_LOGS,
      isDefault ? INITIAL_LOGS : []
    );
  }

  async saveAllAuditLogs(logs: AuditLogEntry[]): Promise<void> {
    await this.setScopedData(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  async addLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    // If superadmin action or backups, record into permanent superadmin master audit logs
    if (entry.category === 'superadmin' || entry.category === 'backups' || entry.username === '@george.dev') {
      try {
        let masterLogs: AuditLogEntry[] = [];
        try {
          const stored = await get<AuditLogEntry[]>(STORAGE_KEYS.SUPERADMIN_LOGS);
          if (stored && Array.isArray(stored)) masterLogs = stored;
        } catch { }
        if (masterLogs.length === 0) {
          const local = localStorage.getItem(STORAGE_KEYS.SUPERADMIN_LOGS);
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) masterLogs = parsed;
          }
        }
        masterLogs.unshift(newLog);
        const trimmedMaster = masterLogs.slice(0, 1000);
        try {
          await set(STORAGE_KEYS.SUPERADMIN_LOGS, trimmedMaster);
        } catch { }
        localStorage.setItem(STORAGE_KEYS.SUPERADMIN_LOGS, JSON.stringify(trimmedMaster));
      } catch (err) {
        console.warn('Error saving superadmin log:', err);
      }
    }

    // Also record into current class logs
    const logs = await this.getAuditLogs();
    logs.unshift(newLog);
    const trimmed = logs.slice(0, 1000);
    await this.saveAllAuditLogs(trimmed);
    return newLog;
  }

  async getGlobalAuditLogs(): Promise<AuditLogEntry[]> {
    const allLogs: AuditLogEntry[] = [];
    const seenIds = new Set<string>();

    // 1. Fetch permanent superadmin audit logs
    try {
      let masterLogs: AuditLogEntry[] = [];
      try {
        const stored = await get<AuditLogEntry[]>(STORAGE_KEYS.SUPERADMIN_LOGS);
        if (stored && Array.isArray(stored)) masterLogs = stored;
      } catch { }
      if (masterLogs.length === 0) {
        const local = localStorage.getItem(STORAGE_KEYS.SUPERADMIN_LOGS);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) masterLogs = parsed;
        }
      }
      for (const log of masterLogs) {
        if (!seenIds.has(log.id)) {
          seenIds.add(log.id);
          allLogs.push(log);
        }
      }
    } catch (e) {
      console.warn('Error reading master superadmin logs:', e);
    }

    // 2. Fetch all logs from all active classes
    const classes = await this.getClasses();
    const currentActive = this.getActiveClassId();

    for (const c of classes) {
      this.setActiveClassId(c.id);
      const classLogs = await this.getAuditLogs();
      for (const log of classLogs) {
        if (!seenIds.has(log.id)) {
          seenIds.add(log.id);
          allLogs.push(log);
        }
      }
    }
    this.setActiveClassId(currentActive);
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allLogs;
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
    const classes = await this.getClasses();

    const backup = {
      version: 7,
      appName: 'Sunday School Online Scoring & SaaS Attendance System',
      exportDate: new Date().toISOString(),
      classId: this.getActiveClassId(),
      classes,
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
      if (Array.isArray(data.classes)) await this.saveAllClasses(data.classes);

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

  // --- Automated Daily Backups with 3-Day Rolling Retention ---
  async getDailyBackups(): Promise<DailyBackupSnapshot[]> {
    if (!this.isBrowser()) return [];
    try {
      let stored: DailyBackupSnapshot[] | undefined = undefined;
      try {
        stored = await get<DailyBackupSnapshot[]>(STORAGE_KEYS.DAILY_BACKUPS);
      } catch { }
      if (stored && Array.isArray(stored)) {
        return stored.slice(0, 3);
      }
      const local = localStorage.getItem(STORAGE_KEYS.DAILY_BACKUPS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Error reading daily backups:', e);
    }
    return [];
  }

  async saveAllDailyBackups(backups: DailyBackupSnapshot[]): Promise<void> {
    if (!this.isBrowser()) return;
    // Enforce 3-day rolling retention: newest first, max 3 snapshots
    const sorted = [...backups].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const trimmed = sorted.slice(0, 3);
    try {
      try {
        await set(STORAGE_KEYS.DAILY_BACKUPS, trimmed);
      } catch { }
      localStorage.setItem(STORAGE_KEYS.DAILY_BACKUPS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving daily backups:', e);
    }
  }

  async createDailyBackupSnapshot(triggerLabel?: string): Promise<DailyBackupSnapshot> {
    const previousActive = this.getActiveClassId();
    try {
      const classes = await this.getClasses();
      const users = await this.getUsers();

      // Collect superadmin logs
      let superadminLogs: AuditLogEntry[] = [];
      try {
        const stored = await get<AuditLogEntry[]>(STORAGE_KEYS.SUPERADMIN_LOGS);
        if (stored && Array.isArray(stored)) superadminLogs = stored;
      } catch { }
      if (superadminLogs.length === 0 && this.isBrowser()) {
        const local = localStorage.getItem(STORAGE_KEYS.SUPERADMIN_LOGS);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) superadminLogs = parsed;
          } catch { }
        }
      }

      // Collect scoped data from each class
      const classDataMap: Record<string, any> = {};
      let totalStudents = 0;

      for (const c of classes) {
        this.setActiveClassId(c.id);
        const students = await this.getStudents();
        totalStudents += students.length;
        const attendance = await this.getAttendance();
        const darsKtab = await this.getDarsKtabAttendance();
        const mal3ab = await this.getMal3abAttendance();
        const summerClub = await this.getSummerClubAttendance();
        const summerClubSettings = await this.getSummerClubSettings();
        const confessions = await this.getConfessionRecords();
        const customEvents = await this.getCustomEvents();
        const visits = await this.getVisits();
        const pointSettings = await this.getPointSettings();
        const customPoints = await this.getCustomPoints();
        const classHeroes = await this.getClassHeroes();
        const auditLogs = await this.getAuditLogs();

        classDataMap[c.id] = {
          classRoom: c,
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
          auditLogs,
        };
      }

      const payloadObj = {
        version: 7,
        appName: 'Pope Saweros SaaS Sunday School Platform',
        snapshotTimestamp: new Date().toISOString(),
        classes,
        users,
        superadminLogs,
        classesData: classDataMap,
      };

      const payloadJson = JSON.stringify(payloadObj);
      const todayDate = new Date().toISOString().split('T')[0];
      const sizeKb = Math.round((payloadJson.length / 1024) * 10) / 10;

      const snapshot: DailyBackupSnapshot = {
        id: `daily_backup_${todayDate}_${Date.now()}`,
        date: todayDate,
        timestamp: new Date().toISOString(),
        label: triggerLabel || `Automated Daily Backup (${todayDate})`,
        totalClasses: classes.length,
        totalStudents,
        totalUsers: users.length,
        dataSizeKb: sizeKb,
        payload: payloadJson,
      };

      // Rolling 3-day update:
      let currentBackups = await this.getDailyBackups();
      // Replace if one already exists for today, or prepend new
      currentBackups = currentBackups.filter((b) => b.date !== todayDate);
      currentBackups.unshift(snapshot);
      // Sort newest first
      currentBackups.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      // Keep only up to 3 days! Oldest (4th, etc.) is deleted automatically
      const retained = currentBackups.slice(0, 3);
      await this.saveAllDailyBackups(retained);

      if (this.isBrowser()) {
        localStorage.setItem(STORAGE_KEYS.LAST_DAILY_BACKUP_DATE, todayDate);
      }

      await this.addLogEntry({
        username: '@george.dev',
        servantName: 'Platform SuperAdmin',
        action: 'DAILY_BACKUP_CREATED',
        details: `Daily platform backup snapshot created for ${todayDate}. (Retained: ${retained.length}/3 rolling backups). Size: ${sizeKb} KB`,
        category: 'backups',
      });

      return snapshot;
    } finally {
      this.setActiveClassId(previousActive);
    }
  }

  async checkAndTriggerDailyBackup(): Promise<DailyBackupSnapshot | null> {
    if (!this.isBrowser()) return null;
    const todayDate = new Date().toISOString().split('T')[0];
    const lastBackupDate = localStorage.getItem(STORAGE_KEYS.LAST_DAILY_BACKUP_DATE);

    if (lastBackupDate === todayDate) {
      const existing = await this.getDailyBackups();
      if (existing.some((b) => b.date === todayDate)) {
        return null; // Already backed up today
      }
    }

    // Trigger daily backup snapshot
    return await this.createDailyBackupSnapshot(`Automated Daily Backup (${todayDate})`);
  }

  async restoreFromDailyBackup(snapshotId: string): Promise<{ success: boolean; message: string }> {
    const backups = await this.getDailyBackups();
    const target = backups.find((b) => b.id === snapshotId);
    if (!target) {
      throw new Error(`Backup snapshot with ID "${snapshotId}" was not found.`);
    }

    const previousActive = this.getActiveClassId();
    try {
      const parsed = JSON.parse(target.payload);
      if (!parsed || !parsed.classes || !Array.isArray(parsed.classes)) {
        throw new Error('Invalid or corrupted snapshot structure.');
      }

      // 1. Restore Classes
      await this.saveAllClasses(parsed.classes);

      // 2. Restore Users
      if (Array.isArray(parsed.users)) {
        await this.saveAllUsers(parsed.users);
      }

      // 3. Restore SuperAdmin master logs
      if (Array.isArray(parsed.superadminLogs)) {
        try {
          await set(STORAGE_KEYS.SUPERADMIN_LOGS, parsed.superadminLogs);
        } catch { }
        if (this.isBrowser()) {
          localStorage.setItem(STORAGE_KEYS.SUPERADMIN_LOGS, JSON.stringify(parsed.superadminLogs));
        }
      }

      // 4. Restore Class Scoped Records
      if (parsed.classesData && typeof parsed.classesData === 'object') {
        for (const cid of Object.keys(parsed.classesData)) {
          const cData = parsed.classesData[cid];
          this.setActiveClassId(cid);

          if (Array.isArray(cData.students)) await this.saveStudents(cData.students);
          if (Array.isArray(cData.attendance)) await this.saveAllAttendance(cData.attendance);
          if (Array.isArray(cData.darsKtab)) await this.saveAllDarsKtab(cData.darsKtab);
          if (Array.isArray(cData.mal3ab)) await this.saveAllMal3ab(cData.mal3ab);
          if (Array.isArray(cData.summerClub)) await this.saveAllSummerClub(cData.summerClub);
          if (cData.summerClubSettings) await this.saveSummerClubSettings(cData.summerClubSettings);
          if (Array.isArray(cData.confessions)) await this.saveAllConfessionRecords(cData.confessions);
          if (Array.isArray(cData.customEvents)) await this.saveAllCustomEvents(cData.customEvents);
          if (Array.isArray(cData.visits)) await this.saveAllVisits(cData.visits);
          if (cData.pointSettings) await this.savePointSettings(cData.pointSettings);
          if (Array.isArray(cData.customPoints)) await this.saveAllCustomPoints(cData.customPoints);
          if (Array.isArray(cData.classHeroes)) await this.saveAllClassHeroes(cData.classHeroes);
          if (Array.isArray(cData.auditLogs)) await this.saveAllAuditLogs(cData.auditLogs);
        }
      }

      await this.addLogEntry({
        username: '@george.dev',
        servantName: 'Platform SuperAdmin',
        action: 'RESTORE_FROM_DAILY_BACKUP',
        details: `Platform restored to snapshot point-in-time: ${target.label} (${target.date} ${new Date(target.timestamp).toLocaleTimeString()}). Total Classes: ${target.totalClasses}, Students: ${target.totalStudents}`,
        category: 'backups',
      });

      return {
        success: true,
        message: `System restored successfully to ${target.date} snapshot point in time!`,
      };
    } finally {
      this.setActiveClassId(previousActive);
    }
  }

  async deleteDailyBackup(snapshotId: string): Promise<void> {
    let backups = await this.getDailyBackups();
    backups = backups.filter((b) => b.id !== snapshotId);
    await this.saveAllDailyBackups(backups);
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
    await this.saveAllClasses(INITIAL_CLASSES);
  }
}

export const db = new DatabaseService();
