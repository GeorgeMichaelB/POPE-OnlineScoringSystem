export type LoveLanguage =
  | 'Words of Affirmation'
  | 'Quality Time'
  | 'Receiving Gifts'
  | 'Acts of Service'
  | 'Physical Touch'
  | 'Other / Not determined';

export interface Student {
  id: string; // QR code passport string / ID
  name: string;
  dob: string; // YYYY-MM-DD
  address: string;
  school: string;
  category?: string; // Optional/legacy (All boys are Grade 4 Pope Saweros class)
  boyPhone?: string; // Boy's own phone number
  dadPhone: string;
  momPhone: string;
  loveLanguage: LoveLanguage;
  weakPoints: string; // Areas needing spiritual & behavioral pastoral care
  hobbies: string; // Interests, talents, sports ("hoppies")
  notes: string; // General servant notes
  confessionFather?: string; // اب الاعتراف - Confession Father / Priest
  confessionMonthlyDay?: number; // Chosen monthly confession day of month (1-31)
  photoUrl?: string; // Profile picture (base64 or URL)
  createdAt: string;
}

// Main Friday Attendance (Friday School Class + Odas / Liturgy)
export interface AttendanceRecord {
  id: string; // `${studentId}_${date}`
  studentId: string;
  date: string; // YYYY-MM-DD (Fridays)
  sundaySchool: boolean; // Main Class Attendance (Friday)
  odas: boolean; // Liturgy / Communion
  timestamp: string; // Check-in time
}

// Saturday Dars Ktab & Ashya Attendance
export interface DarsKtabRecord {
  id: string; // `${studentId}_${date}`
  studentId: string;
  date: string; // YYYY-MM-DD (Saturdays)
  ashya: boolean; // Attended Vespers (عشية)
  darsKtab: boolean; // Attended Bible Study (درس كتاب)
  timestamp: string;
}

// Thursday Mal3ab Attendance (حضور ومشاركة الملعب والنشاط الرياضي - الخميس)
export interface Mal3abRecord {
  id: string; // `${studentId}_${date}`
  studentId: string;
  date: string; // YYYY-MM-DD (Thursdays)
  attended: boolean; // Attended Mal3ab (حضور الملعب)
  matchPlayed: boolean; // Match / Sportsmanship / Activity (مشاركة ولعب الماتش)
  timestamp: string;
}

// Summer Club Configurable Defaults for 2 Subpages (النادي الصيفي)
export interface SummerClubSettings {
  day1Weekday: number; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat (Default 2: Tuesday)
  day2Weekday: number; // (Default 4: Thursday)
}

// Summer Club Attendance Record (First Day or Second Day)
export interface SummerClubRecord {
  id: string; // `${studentId}_${subpage}_${date}`
  studentId: string;
  subpage: 'day1' | 'day2';
  date: string; // YYYY-MM-DD
  attended: boolean; // Attended Club Day (حضور النادي)
  activity: boolean; // Workshop / Activity / Spiritual Topic (الورشة والنشاط)
  timestamp: string;
}

// Customized Events (Trips, Spiritual Days, Conferences, Retreats)
export interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  location?: string;
  description?: string;
  attendeeIds: string[]; // List of Student IDs present
  createdAt: string;
}

// Monthly Confession Record (سر ومتابعة الاعتراف الشهري)
export interface ConfessionRecord {
  id: string; // `${studentId}_${month}` e.g. "PASSPORT-101_2026-09"
  studentId: string;
  month: string; // YYYY-MM (e.g. "2026-09")
  attended: boolean; // Attended confession this month (حضر / راح الاعتراف)
  scheduledDay?: number; // Chosen day of the month (1-31)
  confessionDate?: string; // Exact date attended (YYYY-MM-DD)
  confessionFather?: string; // Priest name (أب الاعتراف)
  notes?: string; // General notes
  timestamp: string;
}

// Scoring System Rules (Points automatically awarded for attendance activities)
export interface PointSettings {
  fridayClassPoints: number; // e.g. 10 pts
  odasPoints: number; // e.g. 15 pts
  darsKtabPoints: number; // e.g. 10 pts
  ashyaPoints: number; // e.g. 5 pts
  customEventPoints: number; // e.g. 20 pts
  mal3abPoints?: number; // e.g. 10 pts
  mal3abMatchPoints?: number; // e.g. 5 pts
  summerClubPoints?: number; // e.g. 10 pts
  summerClubActivityPoints?: number; // e.g. 5 pts
  confessionPoints?: number; // e.g. 20 pts (حضور سر الاعتراف الشهري)
}

// Manual or Custom Point Additions/Deductions entered by the servant
export interface CustomPointEntry {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  points: number; // positive or negative number chosen by servant
  reason: string; // e.g. "Answered Bible question", "Memorized hymn", "Class discipline"
  servantName: string;
  createdAt: string;
}

export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface VisitRecord {
  id: string;
  studentId: string;
  servantName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  status: VisitStatus;
  durationSeconds: number; // Duration tracked by live visit stopwatch
  notes: string;
  photos: string[]; // Array of base64 images taken during the visit
  createdAt: string;
  completedAt?: string;
}

// Class Heroes & Spotlight Champions (أبطال الفصل ولوحة الشرف)
export type HeroBadgeIcon = 'crown' | 'flame' | 'star' | 'cross' | 'shield' | 'trophy';

export interface ClassHero {
  id: string;
  studentId: string;
  title: string; // e.g. "بطل الأسبوع الروحي", "بطل مسابقة الإنجيل", "بطل المذبح والألحان"
  reason: string; // Why the boy is spotlighted as a hero (any custom servant reason)
  badgeIcon: HeroBadgeIcon;
  awardedDate: string; // YYYY-MM-DD
  servantName: string;
  createdAt: string;
}

// Multi-Servant Accounts & Roles
export type UserRole = 'admin' | 'servant';

export interface UserAccount {
  username: string; // e.g. "@george.michael", "@philo.ashraf", "@kiro.hossny", "@alfred.samy"
  name: string; // Servant display name
  role: UserRole; // 'admin' | 'servant'
  passwordHash: string; // Plain/hash password
  mustChangePassword: boolean; // Must set custom password on first login
  createdAt: string;
  lastLoginAt?: string;
}

// Activity Audit Log
export type LogCategory = 'auth' | 'attendance' | 'scoring' | 'heroes' | 'events' | 'visits' | 'students' | 'mal3ab' | 'summer_club' | 'confession';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  servantName: string;
  action: string;
  details: string;
  category: LogCategory;
}


