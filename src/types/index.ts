export type LoveLanguage =
  | 'Words of Affirmation'
  | 'Quality Time'
  | 'Receiving Gifts'
  | 'Acts of Service'
  | 'Physical Touch'
  | 'Other / Not determined';

export interface Student {
  id: string; // QR code passport string / ID (e.g. AWI1012)
  series?: string; // Series registration code (e.g. APSAW2743401)
  name: string;
  arabicName?: string; // Arabic name (الاسم باللغة العربية)
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
  isDeacon?: boolean; // شماس (Ordained / Serving Deacon)
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
  isLate?: boolean; // Scanned / checked in after class timer threshold
  checkInMinutes?: number; // Minutes elapsed from timer start when checked in
  pointsAwarded?: number; // Actual points calculated and awarded for this session
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
  fridayClassEnabled?: boolean;
  fridayClassPoints: number; // e.g. 10 pts
  fridayLateCutoffMinutes?: number; // e.g. 15 mins (late threshold / grace period after timer start)
  fridayLatePenaltyPoints?: number; // e.g. 0 or 1 pt (initial deduction at cutoff)
  fridayLateIntervalMinutes?: number; // e.g. 2 mins (cut points every X mins late)
  fridayLateIntervalPoints?: number; // e.g. 1 pt (points removed per interval)
  fridayLateDeductionEnabled?: boolean; // whether late point deduction is enabled (default true)
  fridayLateRequireTouchID?: boolean; // whether device biometrics (Face ID/Fingerprint/Touch ID) or screen lock is required to stop timer (default true)

  odasEnabled?: boolean;
  odasPoints: number; // e.g. 15 pts

  darsKtabEnabled?: boolean;
  darsKtabPoints: number; // e.g. 10 pts

  ashyaEnabled?: boolean;
  ashyaPoints: number; // e.g. 5 pts

  mal3abEnabled?: boolean;
  mal3abPoints?: number; // e.g. 10 pts

  mal3abMatchEnabled?: boolean;
  mal3abMatchPoints?: number; // e.g. 5 pts

  summerClubEnabled?: boolean;
  summerClubPoints?: number; // e.g. 10 pts

  summerClubActivityEnabled?: boolean;
  summerClubActivityPoints?: number; // e.g. 5 pts

  confessionEnabled?: boolean;
  confessionPoints?: number; // e.g. 20 pts (حضور سر الاعتراف الشهري)

  customEventsEnabled?: boolean;
  customEventPoints: number; // e.g. 20 pts

  customPointsEnabled?: boolean; // Manual extra points entered by servant
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
export type UserRole = 'superadmin' | 'admin' | 'servant';
export type UserStatus = 'approved' | 'pending' | 'rejected';
export type ClassStatus = 'active' | 'suspended' | 'pending';

export interface ClassRoom {
  id: string; // e.g. "class_popesaweros" or `cls_${Date.now()}`
  name: string; // e.g. "Pope Saweros Class (Grade 4)"
  username: string; // unique slug e.g. "popesaweros4" (lowercased)
  adminUsername: string; // Servant username of creator / class admin
  createdAt: string;
  description?: string;
  status?: ClassStatus; // Platform superadmin can suspend / reactivate / approve
}

export interface UserAccount {
  username: string; // unique username e.g. "@george.michael" or "@fady.nader"
  name: string; // Servant display name
  role: UserRole; // 'superadmin' | 'admin' | 'servant'
  passwordHash: string; // Plain/hash password
  classId?: string; // ID of the class they belong to
  classUsername?: string; // Unique username of the class they belong to
  status?: UserStatus; // 'approved' | 'pending' | 'rejected' (defaults to 'approved')
  mustChangePassword?: boolean; // Must set custom password on first login
  createdAt: string;
  lastLoginAt?: string;
}

// Activity Audit Log
export type LogCategory = 'auth' | 'attendance' | 'scoring' | 'heroes' | 'events' | 'visits' | 'students' | 'mal3ab' | 'summer_club' | 'confession' | 'classes' | 'servants' | 'superadmin' | 'backups';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  servantName: string;
  action: string;
  details: string;
  category: LogCategory;
}

// Daily Rolling 3-Day Backup Snapshot
export interface DailyBackupSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO timestamp
  label: string;
  totalClasses: number;
  totalStudents: number;
  totalUsers: number;
  dataSizeKb: number;
  payload: string; // Full JSON snapshot of platform
}

// ==========================================
// BOYS PORTAL & 1000+ BADGES ECOSYSTEM TYPES
// ==========================================

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';

export type BadgeCategory =
  | 'mazamer'
  | 'challenge'
  | 'quiz'
  | 'spiritual'
  | 'attendance'
  | 'hymns'
  | 'bible'
  | 'sports'
  | 'special';

export interface BadgeDefinition {
  id: string; // e.g. "badge_001", "mazmour_23_gold"
  name: string; // Arabic name e.g. "فارس الإنجيل"
  nameEn: string; // English name
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string; // Lucide icon identifier
  imageUrl?: string; // Custom uploaded badge image (base64 or URL)
  bgGradient: string;
  borderColor: string;
  textColor: string;
  rarityScore: number;
  tags?: string[];
}

export interface StudentBadge {
  id: string;
  studentId: string;
  badgeId: string;
  badgeName: string;
  badgeTier: BadgeTier;
  icon: string;
  imageUrl?: string;
  color: string;
  category: string;
  awardedAt: string; // ISO date
  reason: string; // e.g. "حفظ مزمور ٢٣ في الأسبوع الأول", "تحدي صلاة باكر"
  pointsAwarded?: number;
  count?: number;
}

export interface BoyPortalSettings {
  hideScores: boolean; // Hide scores from boys
  isShopEnabled: boolean; // Enable or disable shop
  announcementBanner?: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string; // Custom uploaded announcement banner or image
  targetAudience: 'boys' | 'parents' | 'all';
  isPinned: boolean;
  priority: 'normal' | 'urgent' | 'celebration';
  authorServant: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  price: number; // cost in score points
  stock: number; // remaining stock
  icon: string; // e.g. 'gift' | 'book' | 'gamepad' | 'award'
  imageUrl?: string; // Product photo (data URL or web URL)
  isEnabled: boolean;
  category?: string;
  createdAt: string;
}

export interface ShopOrder {
  id: string;
  studentId: string;
  studentName: string;
  itemId: string;
  itemTitle: string;
  pricePaid: number;
  status: 'pending' | 'delivered' | 'cancelled';
  redemptionCode: string; // e.g. "PRIZE-9842"
  orderedAt: string;
  deliveredAt?: string;
}

export interface MazmourDefinition {
  id: string;
  number: number; // Psalm number e.g. 23
  title: string; // e.g. "مزمور ٢٣: الرب راعيّ"
  reference: string; // e.g. "مزمور ٢٣ (مز ٢٢ أجبية)"
  textArabic: string;
  verseCount?: number;
  week1Score: number; // e.g. 30 pts (Gold badge)
  week2Score: number; // e.g. 20 pts (Silver badge)
  afterTimeScore: number; // e.g. 10 pts (Bronze badge)
  maxDropDays: number; // e.g. 21 days
  goldBadgeId?: string;
  silverBadgeId?: string;
  bronzeBadgeId?: string;
  isActive: boolean;
}

export interface MazmourRequest {
  id: string;
  studentId: string;
  studentName: string;
  mazmourId: string;
  mazmourNumber: number;
  mazmourTitle: string;
  status: 'requested' | 'approved' | 'ready_for_test' | 'completed' | 'dropped';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  droppedAt?: string;
  awardedTier?: 'gold' | 'silver' | 'bronze';
  awardedScore?: number;
  awardedBadgeId?: string;
  servantNotes?: string;
}

export interface BoyChallenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  scoreReward: number;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeTier: BadgeTier;
  badgeImageUrl?: string;
  category: 'spiritual' | 'attendance' | 'study' | 'service' | 'sports';
  dueDate?: string;
  isActive: boolean;
  completedStudentIds: string[];
  pendingStudentIds: string[];
  createdAt: string;
}

export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_blank'
  | 'order'
  | 'matching';

export interface QuizMatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type?: QuestionType; // defaults to 'mcq'
  imageUrl?: string;
  options?: string[]; // for mcq
  correctOptionIndex?: number; // for mcq
  correctBoolean?: boolean; // for true_false
  blankAnswer?: string; // for fill_blank
  acceptableAnswers?: string[]; // alternative answers for fill_blank
  orderItems?: string[]; // correct sequence of items
  matchingPairs?: QuizMatchingPair[]; // for matching
  explanation?: string;
}

export interface BoyQuiz {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  scoreReward: number;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeTier: BadgeTier;
  badgeImageUrl?: string;
  questions: QuizQuestion[];
  isActive: boolean;
  completedStudentIds: string[];
  createdAt: string;
}

export interface BoyQuestion {
  id: string;
  studentId: string;
  studentName: string;
  isAnonymous: boolean;
  questionText: string;
  category: 'spiritual' | 'bible' | 'personal' | 'confession' | 'general';
  answerText?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
  isPublic?: boolean;
}

export interface BoyNotification {
  id: string;
  studentId?: string; // null means broadcast to all boys
  title: string;
  message: string;
  type: 'announcement' | 'mazmour' | 'challenge' | 'quiz' | 'shop' | 'badge';
  timestamp: string;
  read: boolean;
  linkView?: string;
}




