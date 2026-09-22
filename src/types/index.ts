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

// Scoring System Rules (Points automatically awarded for attendance activities)
export interface PointSettings {
  fridayClassPoints: number; // e.g. 10 pts
  odasPoints: number; // e.g. 15 pts
  darsKtabPoints: number; // e.g. 10 pts
  ashyaPoints: number; // e.g. 5 pts
  customEventPoints: number; // e.g. 20 pts
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
export type LogCategory = 'auth' | 'attendance' | 'scoring' | 'heroes' | 'events' | 'visits' | 'students';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  servantName: string;
  action: string;
  details: string;
  category: LogCategory;
}


