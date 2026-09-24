import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Sliders,
  Search,
  Save,
  Trash2,
  History,
  Church,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  UserCheck,
  CalendarCheck,
  BookOpen,
  Award,
  Sun,
  Palette,
  MapPin,
  Star,
  HeartHandshake,
  RotateCcw,
  CheckSquare,
  XSquare,
  Minus,
  X
} from 'lucide-react';
import { DEFAULT_POINT_SETTINGS } from '../services/db';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  ConfessionRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings
} from '../types';
import {
  calculateStudentScore,
  getTodayDateString,
  getCurrentMonthString,
  formatMonthYear
} from '../utils/helpers';
import { sound } from '../services/sound';

interface ScoringViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  darsKtab: DarsKtabRecord[];
  mal3ab?: Mal3abRecord[];
  summerClub?: SummerClubRecord[];
  confessions?: ConfessionRecord[];
  customEvents: CustomEvent[];
  customPoints: CustomPointEntry[];
  pointSettings: PointSettings;
  onSavePointSettings: (settings: PointSettings) => void;
  onAddCustomPoints: (entry: CustomPointEntry) => void;
  onDeleteCustomPoint: (id: string) => void;
  onToggleConfession?: (
    studentId: string,
    month: string,
    attended: boolean,
    scheduledDay?: number,
    confessionDate?: string,
    confessionFather?: string,
    notes?: string
  ) => void;
  onUpdateStudentConfessionDay?: (studentId: string, day: number, confessionFather?: string) => void;
  onSelectStudent: (student: Student) => void;
  currentServantName: string;
}

export const ScoringView: React.FC<ScoringViewProps> = ({
  students,
  attendance,
  darsKtab,
  mal3ab = [],
  summerClub = [],
  confessions = [],
  customEvents,
  customPoints,
  pointSettings,
  onSavePointSettings,
  onAddCustomPoints,
  onDeleteCustomPoint,
  onToggleConfession,
  onUpdateStudentConfessionDay,
  onSelectStudent,
  currentServantName,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'confession' | 'history'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddPointsModalOpen, setIsAddPointsModalOpen] = useState(false);
  const [selectedStudentForPoints, setSelectedStudentForPoints] = useState<string>(students[0]?.id || '');
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [pointsReason, setPointsReason] = useState('');
  const [pointsDate, setPointsDate] = useState(getTodayDateString());

  // Confession Tracking states
  const [selectedConfessionMonth, setSelectedConfessionMonth] = useState<string>(getCurrentMonthString());
  const [selectedPriestFilter, setSelectedPriestFilter] = useState<string>('ALL');
  const [editingConfessionModal, setEditingConfessionModal] = useState<{
    open: boolean;
    student: Student;
    record?: ConfessionRecord;
    customDate: string;
    customNotes: string;
  } | null>(null);

  // Temp form settings for rule customization
  const [tempSettings, setTempSettings] = useState<PointSettings>(pointSettings);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Compute live scores for all boys
  const scoredStudents = students.map((student) => {
    const scoreData = calculateStudentScore(
      student.id,
      attendance,
      darsKtab,
      customEvents,
      customPoints,
      pointSettings,
      mal3ab,
      summerClub,
      confessions
    );
    return {
      student,
      ...scoreData,
    };
  });

  // Sort by highest total score first
  scoredStudents.sort((a, b) => b.totalScore - a.totalScore);

  const q = searchQuery.toLowerCase().trim();
  const filteredScoredStudents = scoredStudents.filter((item) =>
    !q ||
    item.student.name.toLowerCase().includes(q) ||
    (item.student.arabicName && item.student.arabicName.toLowerCase().includes(q)) ||
    item.student.id.toLowerCase().includes(q) ||
    (item.student.series && item.student.series.toLowerCase().includes(q)) ||
    (item.student.confessionFather && item.student.confessionFather.toLowerCase().includes(q))
  );

  // Confession statistics for the selected month
  const monthConfessions = confessions.filter((c) => c.month === selectedConfessionMonth);
  const attendedThisMonthCount = monthConfessions.filter((c) => c.attended).length;
  const totalBoysCount = students.length;
  const monthCompletionPercent = totalBoysCount > 0 ? Math.round((attendedThisMonthCount / totalBoysCount) * 100) : 0;

  // Filtered boys for Confession Tracker
  const uniquePriests = Array.from(
    new Set(students.map((s) => s.confessionFather).filter(Boolean) as string[])
  );

  const filteredConfessionBoys = students.filter((student) => {
    const matchesQuery =
      !q ||
      student.name.toLowerCase().includes(q) ||
      (student.arabicName && student.arabicName.toLowerCase().includes(q)) ||
      student.id.toLowerCase().includes(q) ||
      (student.series && student.series.toLowerCase().includes(q)) ||
      (student.confessionFather && student.confessionFather.toLowerCase().includes(q));

    const matchesPriest =
      selectedPriestFilter === 'ALL' || student.confessionFather === selectedPriestFilter;

    return matchesQuery && matchesPriest;
  });

  // Month navigation helpers
  const handlePrevMonth = () => {
    const parts = selectedConfessionMonth.split('-');
    let year = Number(parts[0]);
    let month = Number(parts[1]) - 1;
    if (month < 1) {
      month = 12;
      year--;
    }
    setSelectedConfessionMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const parts = selectedConfessionMonth.split('-');
    let year = Number(parts[0]);
    let month = Number(parts[1]) + 1;
    if (month > 12) {
      month = 1;
      year++;
    }
    setSelectedConfessionMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const toggleActivity = (enabledKey: keyof PointSettings) => {
    setTempSettings((prev) => ({
      ...prev,
      [enabledKey]: prev[enabledKey] === false ? true : false,
    }));
  };

  const updateActivityPoints = (pointsKey: keyof PointSettings, newPoints: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(newPoints) ? 0 : newPoints));
    setTempSettings((prev) => ({
      ...prev,
      [pointsKey]: clamped,
    }));
  };

  const stepActivityPoints = (pointsKey: keyof PointSettings, delta: number) => {
    const current = Number(tempSettings[pointsKey]) || 0;
    updateActivityPoints(pointsKey, current + delta);
  };

  const handleEnableAllActivities = () => {
    setTempSettings((prev) => ({
      ...prev,
      fridayClassEnabled: true,
      odasEnabled: true,
      darsKtabEnabled: true,
      ashyaEnabled: true,
      mal3abEnabled: true,
      mal3abMatchEnabled: true,
      summerClubEnabled: true,
      summerClubActivityEnabled: true,
      confessionEnabled: true,
      customEventsEnabled: true,
      customPointsEnabled: true,
    }));
  };

  const handleDisableAllActivities = () => {
    setTempSettings((prev) => ({
      ...prev,
      fridayClassEnabled: false,
      odasEnabled: false,
      darsKtabEnabled: false,
      ashyaEnabled: false,
      mal3abEnabled: false,
      mal3abMatchEnabled: false,
      summerClubEnabled: false,
      summerClubActivityEnabled: false,
      confessionEnabled: false,
      customEventsEnabled: false,
      customPointsEnabled: false,
    }));
  };

  const handleResetToDefaults = () => {
    setTempSettings({ ...DEFAULT_POINT_SETTINGS });
  };

  const activitiesConfig = [
    {
      id: 'fridayClass',
      name: 'Friday Sunday School Class',
      arabicName: 'فصل مدارس الأحد (الجمعة)',
      categoryLabel: 'Church & Class / كنيسة وفصل',
      icon: CalendarCheck,
      iconBg: '#ecfdf5',
      iconColor: '#059669',
      enabledKey: 'fridayClassEnabled' as keyof PointSettings,
      pointsKey: 'fridayClassPoints' as keyof PointSettings,
      defaultPoints: 10,
      description: 'Points awarded when student attends the Friday Sunday School class',
      unitLabel: 'pts / class (نقطة / فصل)',
    },
    {
      id: 'odas',
      name: 'Holy Liturgy / Odas',
      arabicName: 'القداس الإلهي (الجمعة / الأحد)',
      categoryLabel: 'Church & Class / كنيسة وفصل',
      icon: Church,
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      enabledKey: 'odasEnabled' as keyof PointSettings,
      pointsKey: 'odasPoints' as keyof PointSettings,
      defaultPoints: 15,
      description: 'Points awarded when student attends holy divine liturgy',
      unitLabel: 'pts / liturgy (نقطة / قداس)',
    },
    {
      id: 'darsKtab',
      name: 'Saturday Dars Ktab',
      arabicName: 'درس الكتاب المقدس (السبت)',
      categoryLabel: 'Church & Class / كنيسة وفصل',
      icon: BookOpen,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      enabledKey: 'darsKtabEnabled' as keyof PointSettings,
      pointsKey: 'darsKtabPoints' as keyof PointSettings,
      defaultPoints: 10,
      description: 'Points awarded when student attends Saturday Bible study',
      unitLabel: 'pts / lesson (نقطة / حصة)',
    },
    {
      id: 'ashya',
      name: 'Saturday Ashya (Vespers)',
      arabicName: 'صلاة العشية (السبت)',
      categoryLabel: 'Church & Class / كنيسة وفصل',
      icon: Sparkles,
      iconBg: '#f0f9ff',
      iconColor: '#0284c7',
      enabledKey: 'ashyaEnabled' as keyof PointSettings,
      pointsKey: 'ashyaPoints' as keyof PointSettings,
      defaultPoints: 5,
      description: 'Points awarded when student attends Saturday evening vespers prayer',
      unitLabel: 'pts / prayer (نقطة / عشية)',
    },
    {
      id: 'mal3ab',
      name: 'Thursday Mal3ab Attendance',
      arabicName: 'حضور يوم الملعب والنشاط الرياضي (الخميس)',
      categoryLabel: 'Sports & Field / الملعب والرياضة',
      icon: Trophy,
      iconBg: '#f0fdfa',
      iconColor: '#0d9488',
      enabledKey: 'mal3abEnabled' as keyof PointSettings,
      pointsKey: 'mal3abPoints' as keyof PointSettings,
      defaultPoints: 10,
      description: 'Points awarded when student shows up and participates in Thursday field',
      unitLabel: 'pts / field day (نقطة / يوم ملعب)',
    },
    {
      id: 'mal3abMatch',
      name: 'Thursday Mal3ab Matches & Tournaments',
      arabicName: 'مباريات وبطولات الملعب',
      categoryLabel: 'Sports & Field / الملعب والرياضة',
      icon: Award,
      iconBg: '#ecfeff',
      iconColor: '#0891b2',
      enabledKey: 'mal3abMatchEnabled' as keyof PointSettings,
      pointsKey: 'mal3abMatchPoints' as keyof PointSettings,
      defaultPoints: 5,
      description: 'Bonus points awarded when student plays competitive tournament matches',
      unitLabel: 'pts / match (نقطة / مباراة)',
    },
    {
      id: 'summerClub',
      name: 'Summer Club Attendance',
      arabicName: 'حضور النادي الصيفي',
      categoryLabel: 'Summer Club / النادي الصيفي',
      icon: Sun,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      enabledKey: 'summerClubEnabled' as keyof PointSettings,
      pointsKey: 'summerClubPoints' as keyof PointSettings,
      defaultPoints: 10,
      description: 'Points awarded for each summer club gathering day attended',
      unitLabel: 'pts / day (نقطة / يوم نادي)',
    },
    {
      id: 'summerClubActivity',
      name: 'Summer Club Workshops & Crafts',
      arabicName: 'ورش وأنشطة النادي الصيفي',
      categoryLabel: 'Summer Club / النادي الصيفي',
      icon: Palette,
      iconBg: '#fdf2f8',
      iconColor: '#db2777',
      enabledKey: 'summerClubActivityEnabled' as keyof PointSettings,
      pointsKey: 'summerClubActivityPoints' as keyof PointSettings,
      defaultPoints: 5,
      description: 'Points awarded when student completes workshops, crafts or projects',
      unitLabel: 'pts / activity (نقطة / نشاط)',
    },
    {
      id: 'confession',
      name: 'Monthly Confession',
      arabicName: 'سر الاعتراف الشهري',
      categoryLabel: 'Spiritual Sacraments / أسرار كنسية',
      icon: HeartHandshake,
      iconBg: '#fdf4ff',
      iconColor: '#9333ea',
      enabledKey: 'confessionEnabled' as keyof PointSettings,
      pointsKey: 'confessionPoints' as keyof PointSettings,
      defaultPoints: 20,
      description: 'Spiritual incentive points awarded when student attends monthly confession with Abouna',
      unitLabel: 'pts / month (نقطة / شهرياً)',
    },
    {
      id: 'customEvents',
      name: 'Church Trips & Special Events',
      arabicName: 'الرحلات والمناسبات الخاصة',
      categoryLabel: 'Events & Trips / رحلات ومناسبات',
      icon: MapPin,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      enabledKey: 'customEventsEnabled' as keyof PointSettings,
      pointsKey: 'customEventPoints' as keyof PointSettings,
      defaultPoints: 20,
      description: 'Points awarded when student joins feasts, spiritual trips and class outings',
      unitLabel: 'pts / trip (نقطة / رحلة)',
    },
    {
      id: 'customPoints',
      name: 'Servant Extra Points & Bonuses',
      arabicName: 'نقاط إضافية وتشجيعية من الخدام',
      categoryLabel: 'Custom & Bonus / تشجيع وبونص',
      icon: Star,
      iconBg: '#faf5ff',
      iconColor: '#7c3aed',
      enabledKey: 'customPointsEnabled' as keyof PointSettings,
      pointsKey: undefined,
      defaultPoints: undefined,
      description: 'Allows servants to award custom on-the-fly bonuses for outstanding behavior',
      unitLabel: 'Flexible points (مبلغ متغير)',
    },
  ];

  const activeActivitiesCount = activitiesConfig.filter(
    (item) => tempSettings[item.enabledKey] !== false
  ).length;

  const handleSaveRules = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSavePointSettings(tempSettings);
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 2500);
    setIsSettingsOpen(false);
  };

  const handleAddPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPoints) return;

    const newEntry: CustomPointEntry = {
      id: `pts-${Date.now()}`,
      studentId: selectedStudentForPoints,
      date: pointsDate,
      points: Number(pointsAmount) || 0,
      reason: pointsReason.trim() || 'Custom points awarded',
      servantName: currentServantName,
      createdAt: new Date().toISOString(),
    };

    onAddCustomPoints(newEntry);
    sound.playSuccessChime();
    setIsAddPointsModalOpen(false);
    setPointsReason('');
    setPointsAmount(10);
  };

  const openQuickAddPoints = (studentId: string, amount: number, reason: string) => {
    const newEntry: CustomPointEntry = {
      id: `pts-${Date.now()}`,
      studentId,
      date: getTodayDateString(),
      points: amount,
      reason,
      servantName: currentServantName,
      createdAt: new Date().toISOString(),
    };
    onAddCustomPoints(newEntry);
    sound.playSuccessChime();
  };

  // Quick toggle confession attendance
  const handleQuickToggleConfession = (student: Student, currentAttended: boolean) => {
    if (!onToggleConfession) return;
    const newAttended = !currentAttended;
    const scheduledDay = student.confessionMonthlyDay || 15;
    const confessionDate = newAttended
      ? `${selectedConfessionMonth}-${String(scheduledDay).padStart(2, '0')}`
      : undefined;

    onToggleConfession(
      student.id,
      selectedConfessionMonth,
      newAttended,
      scheduledDay,
      confessionDate,
      student.confessionFather
    );

    if (newAttended) {
      sound.playSuccessChime();
    }
  };

  // Open modal for details/custom date on confession
  const handleSaveDetailedConfession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfessionModal || !onToggleConfession) return;

    const { student, customDate, customNotes } = editingConfessionModal;
    const scheduledDay = student.confessionMonthlyDay || 15;

    onToggleConfession(
      student.id,
      selectedConfessionMonth,
      true,
      scheduledDay,
      customDate || `${selectedConfessionMonth}-${String(scheduledDay).padStart(2, '0')}`,
      student.confessionFather,
      customNotes
    );

    sound.playSuccessChime();
    setEditingConfessionModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Online Scoring System (نظام النقاط والتشجيع)</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Church attendance + Monthly Confession (سر الاعتراف) + Custom points for Pope Saweros class.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setTempSettings(pointSettings);
              setIsSettingsOpen(!isSettingsOpen);
            }}
            className={`btn btn-sm ${isSettingsOpen ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Choose which activities earn scores and how many points"
          >
            <Sliders size={15} /> Customize Activity Points & Rules (تحديد الأنشطة والنقاط)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStudentForPoints(students[0]?.id || '');
              setIsAddPointsModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} /> Add Custom Points
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div
        className="scoring-tabs-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border-light)',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Trophy size={16} />
          <span>Score Leaderboard (ترتيب النقاط العام)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('confession')}
          className={`btn ${activeTab === 'confession' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            background: activeTab === 'confession' ? '#86198f' : undefined,
            borderColor: activeTab === 'confession' ? '#86198f' : undefined,
            color: activeTab === 'confession' ? 'white' : '#86198f',
          }}
        >
          <Church size={16} />
          <span>Monthly Confession Tracker (متابعة سر الاعتراف الشهري)</span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.1rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              background: activeTab === 'confession' ? 'rgba(255,255,255,0.25)' : '#fdf4ff',
              color: activeTab === 'confession' ? 'white' : '#a21caf',
              fontWeight: 700,
            }}
          >
            {attendedThisMonthCount}/{totalBoysCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <History size={16} />
          <span>Points Log (سجل النقاط)</span>
          {customPoints.length > 0 && (
            <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>({customPoints.length})</span>
          )}
        </button>
      </div>

      {/* Activity Scoring Rules Customizer Panel */}
      {isSettingsOpen && (
        <div
          className="card"
          style={{
            background: '#ffffff',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-light)',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Activity Scoring & Rules Configuration (تحديد الأنشطة واحتساب النقاط)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Choose which activities earn points, turn off activities that should not award points, and set the exact points per attendance.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: activeActivitiesCount > 0 ? '#ecfdf5' : '#fef2f2',
                  color: activeActivitiesCount > 0 ? '#059669' : '#dc2626',
                  border: `1px solid ${activeActivitiesCount > 0 ? '#a7f3d0' : '#fecaca'}`,
                }}
              >
                {activeActivitiesCount} of {activitiesConfig.length} activities active ({activeActivitiesCount} نشط)
              </span>

              <button
                type="button"
                onClick={handleEnableAllActivities}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title="Enable all activities"
              >
                <CheckSquare size={13} /> Enable All (تفعيل الكل)
              </button>

              <button
                type="button"
                onClick={handleDisableAllActivities}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title="Disable all activities"
              >
                <XSquare size={13} /> Disable All (تعطيل الكل)
              </button>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title="Reset points to default values"
              >
                <RotateCcw size={13} /> Reset Defaults (الافتراضي)
              </button>
            </div>
          </div>

          {/* Activities Grid */}
          <form onSubmit={handleSaveRules}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              {activitiesConfig.map((item) => {
                const isEnabled = tempSettings[item.enabledKey] !== false;
                const pointsVal: number = item.pointsKey ? Number(tempSettings[item.pointsKey] ?? item.defaultPoints ?? 0) : 0;
                const IconComp = item.icon;

                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: isEnabled ? '1.5px solid #cbd5e1' : '1.5px dashed #cbd5e1',
                      background: isEnabled ? '#ffffff' : '#f8fafc',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isEnabled ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      opacity: isEnabled ? 1 : 0.75,
                    }}
                  >
                    {/* Activity Top Row: Icon + Names + Toggle Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 'var(--radius-md)',
                            background: isEnabled ? item.iconBg : '#f1f5f9',
                            color: isEnabled ? item.iconColor : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {item.categoryLabel}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '0.925rem', color: isEnabled ? 'var(--text-dark)' : '#64748b' }}>
                            {item.arabicName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: isEnabled ? 'var(--text-muted)' : '#94a3b8' }}>
                            {item.name}
                          </div>
                        </div>
                      </div>

                      {/* Interactive ON / OFF Switch */}
                      <button
                        type="button"
                        onClick={() => toggleActivity(item.enabledKey)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: isEnabled ? '1px solid #059669' : '1px solid #cbd5e1',
                          background: isEnabled ? '#059669' : '#f1f5f9',
                          color: isEnabled ? '#ffffff' : '#64748b',
                          flexShrink: 0,
                        }}
                        title={isEnabled ? 'Click to disable scoring for this activity' : 'Click to enable scoring for this activity'}
                      >
                        {isEnabled ? (
                          <>
                            <Check size={13} strokeWidth={3} />
                            <span>يحتسب درجات</span>
                          </>
                        ) : (
                          <>
                            <X size={13} strokeWidth={2.5} />
                            <span>معطّل (0 درجات)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Short Description */}
                    <div style={{ fontSize: '0.72rem', color: isEnabled ? '#475569' : '#94a3b8', lineHeight: 1.35 }}>
                      {item.description}
                    </div>

                    {/* Points Stepper / Value Controller */}
                    <div
                      style={{
                        paddingTop: '0.65rem',
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      {item.pointsKey ? (
                        <>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isEnabled ? 'var(--text-dark)' : '#94a3b8' }}>
                            {isEnabled ? 'Points (النقاط لكل مرة):' : 'Scoring disabled (لا درجات):'}
                          </span>

                          {isEnabled ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => stepActivityPoints(item.pointsKey!, -5)}
                                className="btn btn-secondary btn-sm"
                                style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Decrease 5 points"
                              >
                                <Minus size={13} />
                              </button>

                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={pointsVal}
                                onChange={(e) => updateActivityPoints(item.pointsKey!, Number(e.target.value))}
                                className="form-input"
                                style={{
                                  width: 60,
                                  height: 30,
                                  textAlign: 'center',
                                  padding: '0.2rem',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  color: 'var(--color-primary)',
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => stepActivityPoints(item.pointsKey!, 5)}
                                className="btn btn-secondary btn-sm"
                                style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Increase 5 points"
                              >
                                <Plus size={13} />
                              </button>

                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                pts
                              </span>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#94a3b8',
                                background: '#e2e8f0',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              0 نقطة
                            </span>
                          )}
                        </>
                      ) : (
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isEnabled ? 'var(--text-dark)' : '#94a3b8' }}>
                            {isEnabled ? '✅ تشجيع الخدام مفعّل في المجموع' : '⛔ بونص الخدام معطل من المجموع'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: isEnabled ? '#7c3aed' : '#94a3b8',
                              background: isEnabled ? '#faf5ff' : '#e2e8f0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {isEnabled ? 'نقاط مرنة' : '0 نقطة'}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.id === 'fridayClass' && isEnabled && (
                      <div
                        style={{
                          paddingTop: '0.65rem',
                          borderTop: '1px dashed #cbd5e1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                          background: '#f8fafc',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3730a3' }}>
                            ⏱️ Friday Timer & Late Auto-Decrease (مؤقت الحضور والتأخير):
                          </span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={tempSettings.fridayLateDeductionEnabled !== false}
                              onChange={(e) => setTempSettings((prev) => ({ ...prev, fridayLateDeductionEnabled: e.target.checked }))}
                            />
                            <span>خصم التأخير مفعّل</span>
                          </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.45rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Grace:</span>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={tempSettings.fridayLateCutoffMinutes ?? 15}
                              onChange={(e) => setTempSettings((prev) => ({ ...prev, fridayLateCutoffMinutes: Number(e.target.value) }))}
                              className="form-input"
                              style={{ width: 44, height: 26, fontSize: '0.75rem', padding: '0.1rem', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>min</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Every:</span>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={tempSettings.fridayLateIntervalMinutes ?? 2}
                              onChange={(e) => setTempSettings((prev) => ({ ...prev, fridayLateIntervalMinutes: Number(e.target.value) }))}
                              className="form-input"
                              style={{ width: 44, height: 26, fontSize: '0.75rem', padding: '0.1rem', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>min</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Deduct:</span>
                            <input
                              type="number"
                              min="1"
                              max={pointsVal}
                              value={tempSettings.fridayLateIntervalPoints ?? 1}
                              onChange={(e) => setTempSettings((prev) => ({ ...prev, fridayLateIntervalPoints: Number(e.target.value) }))}
                              className="form-input"
                              style={{ width: 44, height: 26, fontSize: '0.75rem', padding: '0.1rem', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>pt(s)</span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          Grace cutoff {tempSettings.fridayLateCutoffMinutes ?? 15}m • Deducts{' '}
                          <strong style={{ color: '#d97706' }}>
                            {tempSettings.fridayLateIntervalPoints ?? 1} pt every {tempSettings.fridayLateIntervalMinutes ?? 2}m late
                          </strong>. Protected by Touch ID. If timer not started, full points!
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Form Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                💡 Click "Save Activity Rules" to recalculate total scores for all {students.length} boys immediately.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel (إلغاء)
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <Save size={15} /> Save Activity Rules (حفظ إعدادات الأنشطة والنقاط)
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {settingsSavedMessage && (
        <div
          style={{
            padding: '0.65rem 1rem',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          ✓ Scoring rules updated! Confession & attendance scores recalculated for all boys.
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MONTHLY CONFESSION TRACKER (سر الاعتراف الشهري)                     */}
      {/* ========================================================================= */}
      {activeTab === 'confession' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Month Navigator & Summary Stats Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
              border: '1px solid #f0abfc',
              padding: '1rem 1.25rem',
            }}
          >
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
              {/* Month Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', width: 34, height: 34, padding: 0 }}
                  title="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="#a21caf" />
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#701a75', lineHeight: 1.2 }}>
                      {formatMonthYear(selectedConfessionMonth, 'en')}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#a21caf', fontWeight: 600 }}>
                      {formatMonthYear(selectedConfessionMonth, 'ar')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', width: 34, height: 34, padding: 0 }}
                  title="Next Month"
                >
                  <ChevronRight size={18} />
                </button>

                {selectedConfessionMonth !== getCurrentMonthString() && (
                  <button
                    type="button"
                    onClick={() => setSelectedConfessionMonth(getCurrentMonthString())}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', borderColor: '#f0abfc', color: '#86198f' }}
                  >
                    Current Month
                  </button>
                )}
              </div>

              {/* Quick stats pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    background: 'white',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #f0abfc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <UserCheck size={18} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      CONFESSED THIS MONTH
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                      {attendedThisMonthCount} / {totalBoysCount} ({monthCompletionPercent}%)
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'white',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #f0abfc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Sparkles size={18} color="#a21caf" />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      SCORE REWARD (النقاط عند الحضور)
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#86198f' }}>
                      {pointSettings.confessionEnabled !== false ? `+${pointSettings.confessionPoints ?? 20} Points` : '0 Points (معطل)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 8, background: '#f5d0fe', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${monthCompletionPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #c026d3, #10b981)',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Search & Priest Filter for Confession Tracker */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1, maxWidth: 540 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <Search
                  size={15}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search boys or confession father..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                />
              </div>

              {uniquePriests.length > 0 && (
                <select
                  value={selectedPriestFilter}
                  onChange={(e) => setSelectedPriestFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', minWidth: 170, fontSize: '0.8rem' }}
                >
                  <option value="ALL">كل آباء الاعتراف (All Priests)</option>
                  {uniquePriests.map((priest) => (
                    <option key={priest} value={priest}>
                      {priest}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filteredConfessionBoys.length} boys
            </div>
          </div>

          {/* Boys Confession List Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '0.85rem 1.15rem',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                MONTHLY CONFESSION SCHEDULE & ATTENDANCE ({formatMonthYear(selectedConfessionMonth)})
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {pointSettings.confessionEnabled !== false
                  ? `Click button to award +${pointSettings.confessionPoints ?? 20} pts when boy goes to confession`
                  : 'Monthly confession attendance tracking (Points scoring is currently disabled)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredConfessionBoys.map((student) => {
                const confessionRecord = monthConfessions.find((c) => c.studentId === student.id);
                const isAttended = Boolean(confessionRecord?.attended);
                const scheduledDay = confessionRecord?.scheduledDay || student.confessionMonthlyDay || 15;
                const confessionPriest = confessionRecord?.confessionFather || student.confessionFather || 'أبونا غير محدد';

                return (
                  <div
                    key={student.id}
                    className="confession-student-row"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.9rem 1.15rem',
                      borderBottom: '1px solid var(--border-light)',
                      gap: '0.85rem',
                      background: isAttended ? 'rgba(240, 253, 244, 0.6)' : 'transparent',
                    }}
                  >
                    {/* Boy Identity */}
                    <div
                      onClick={() => onSelectStudent(student)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        flex: '1 1 240px',
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 'var(--radius-full)',
                          background: isAttended ? '#dcfce7' : '#f3e8ff',
                          color: isAttended ? '#15803d' : '#7e22ce',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          overflow: 'hidden',
                          border: `2px solid ${isAttended ? '#86efac' : '#d8b4fe'}`,
                          flexShrink: 0,
                        }}
                      >
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          student.name.charAt(0)
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{student.name}</span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                            {student.id}
                          </span>
                        </div>

                        {/* Father of Confession Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '3px' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#701a75',
                              background: '#fdf4ff',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid #f0abfc',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 600,
                            }}
                          >
                            <Church size={12} color="#a21caf" /> أب الاعتراف: {confessionPriest}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls Container (Day Selector & Confession Button) */}
                    <div className="confession-student-controls">
                      {/* Monthly Assigned Day Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '0 0 auto' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          اليوم الشهري:
                        </span>
                        <select
                          value={scheduledDay}
                          onChange={(e) => {
                            const newDay = Number(e.target.value);
                            if (onUpdateStudentConfessionDay) {
                              onUpdateStudentConfessionDay(student.id, newDay, student.confessionFather);
                            }
                            // Also sync into confession record
                            if (onToggleConfession) {
                              onToggleConfession(
                                student.id,
                                selectedConfessionMonth,
                                isAttended,
                                newDay,
                                confessionRecord?.confessionDate,
                                student.confessionFather,
                                confessionRecord?.notes
                              );
                            }
                          }}
                          className="form-select"
                          style={{
                            width: 'auto',
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            borderColor: '#f0abfc',
                            fontWeight: 700,
                            color: '#701a75',
                          }}
                          title="Choose monthly confession day for this boy"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                              يوم {day} (Day {day})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Confession Action Button & Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '0 0 auto' }}>
                        {isAttended ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleQuickToggleConfession(student, true)}
                              className="btn btn-sm"
                              style={{
                                background: '#10b981',
                                borderColor: '#059669',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                              title="Click to toggle / unmark"
                            >
                              <Check size={14} /> تم الاعتراف{pointSettings.confessionEnabled !== false ? ` (+${pointSettings.confessionPoints ?? 20}p)` : ''}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingConfessionModal({
                                  open: true,
                                  student,
                                  record: confessionRecord,
                                  customDate: confessionRecord?.confessionDate || `${selectedConfessionMonth}-${String(scheduledDay).padStart(2, '0')}`,
                                  customNotes: confessionRecord?.notes || '',
                                })
                              }
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              title="Edit date or add confession pastoral note"
                            >
                              {confessionRecord?.confessionDate ? confessionRecord.confessionDate.slice(5) : 'Date'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickToggleConfession(student, false)}
                            className="btn btn-primary btn-sm"
                            style={{
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                            }}
                          >
                            <CheckCircle2 size={15} /> راح الاعتراف{pointSettings.confessionEnabled !== false ? ` (+${pointSettings.confessionPoints ?? 20} pts)` : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OVERALL SCORE LEADERBOARD (ترتيب النقاط العام)                      */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search boys in scoreboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Score Leaderboard Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '0.85rem 1.15rem',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                CLASS SCOREBOARD ({filteredScoredStudents.length} BOYS)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ranked by total points (includes Confession + Attendance + Activities)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredScoredStudents.map((item, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const rankBadgeColor =
                  rank === 1
                    ? { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }
                    : rank === 2
                    ? { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
                    : rank === 3
                    ? { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }
                    : { bg: 'var(--bg-subtle)', text: 'var(--text-muted)', border: 'transparent' };

                return (
                  <div
                    key={item.student.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderBottom: '1px solid var(--border-light)',
                      gap: '0.75rem',
                      background: isTop3 ? 'rgba(254, 243, 199, 0.1)' : 'transparent',
                    }}
                  >
                    {/* Rank & Student Info */}
                    <div
                      onClick={() => onSelectStudent(item.student)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        cursor: 'pointer',
                        flex: '1 1 240px',
                      }}
                    >
                      {/* Rank Number */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: rankBadgeColor.bg,
                          color: rankBadgeColor.text,
                          border: `1px solid ${rankBadgeColor.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        #{rank}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.student.name}</span>
                          {item.student.arabicName && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ({item.student.arabicName})
                            </span>
                          )}
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {item.student.id}
                          </span>
                        </div>

                        {/* Breakdown Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '3px' }}>
                          {pointSettings.fridayClassEnabled !== false && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>
                              Fri: +{item.fridayPoints}
                            </span>
                          )}
                          {pointSettings.odasEnabled !== false && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                              Odas: +{item.odasPoints}
                            </span>
                          )}
                          {pointSettings.darsKtabEnabled !== false && (
                            <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                              Dars: +{item.darsKtabPoints}
                            </span>
                          )}
                          {pointSettings.ashyaEnabled !== false && item.ashyaPoints > 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                              Ashya: +{item.ashyaPoints}
                            </span>
                          )}
                          {(pointSettings.mal3abEnabled !== false || pointSettings.mal3abMatchEnabled !== false) &&
                            (item.mal3abPoints + item.mal3abMatchPoints > 0) && (
                              <span style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600 }}>
                                Mal3ab: +{item.mal3abPoints + item.mal3abMatchPoints}
                              </span>
                            )}
                          {(pointSettings.summerClubEnabled !== false || pointSettings.summerClubActivityEnabled !== false) &&
                            (item.summerClubPoints + item.summerClubActivityPoints > 0) && (
                              <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600 }}>
                                Club: +{item.summerClubPoints + item.summerClubActivityPoints}
                              </span>
                            )}
                          {/* Confession Points Badge */}
                          {pointSettings.confessionEnabled !== false && item.confessionPoints > 0 && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#86198f',
                                background: '#fdf4ff',
                                border: '1px solid #f0abfc',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.1rem 0.35rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                              title={`${item.confessionCount} monthly confession(s) attended`}
                            >
                              <Church size={11} /> Confession: +{item.confessionPoints} ({item.confessionCount})
                            </span>
                          )}
                          {pointSettings.customEventsEnabled !== false && item.eventPoints > 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                              Events: +{item.eventPoints}
                            </span>
                          )}
                          {pointSettings.customPointsEnabled !== false && item.customPointsTotal !== 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600 }}>
                              Bonus: {item.customPointsTotal > 0 ? `+${item.customPointsTotal}` : item.customPointsTotal}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score Value & Quick Add Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Total Score Badge */}
                      <div
                        style={{
                          minWidth: '85px',
                          textAlign: 'center',
                          padding: '0.4rem 0.75rem',
                          background: 'var(--color-primary)',
                          color: 'white',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85 }}>TOTAL SCORE</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{item.totalScore}</div>
                      </div>

                      {/* Fast Quick Points Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button
                          type="button"
                          onClick={() => openQuickAddPoints(item.student.id, 5, 'Bible & Alhan Participation')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                          title="Quick +5 points"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => openQuickAddPoints(item.student.id, 10, 'Excellent Participation')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                          title="Quick +10 points"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForPoints(item.student.id);
                            setIsAddPointsModalOpen(true);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          Custom...
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOM POINTS LOG (سجل النقاط)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <History size={16} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Manual Points History (سجل النقاط اليدوية)</h3>
          </div>

          {customPoints.length === 0 ? (
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              No custom point entries added yet. Use "Add Custom Points" above to award points.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {customPoints.slice(0, 15).map((entry) => {
                const student = students.find((s) => s.id === entry.studentId);
                const isPositive = entry.points >= 0;

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700 }}>{student?.name || 'Student'}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.78rem' }}>
                        {entry.date} • {entry.reason}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
                      >
                        {isPositive ? `+${entry.points}` : entry.points} pts
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomPoint(entry.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.4rem', color: '#ef4444' }}
                        title="Delete this entry"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Points Modal */}
      {isAddPointsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPointsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Score to Boy</h3>
              <button
                type="button"
                onClick={() => setIsAddPointsModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPointsSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Boy *</label>
                  <select
                    value={selectedStudentForPoints}
                    onChange={(e) => setSelectedStudentForPoints(e.target.value)}
                    className="form-select"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Points to Add (or Deduct with -) *</label>
                  <input
                    type="number"
                    required
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: 800 }}
                  />
                  {/* Preset quick chips */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {[5, 10, 15, 20, 25, 50, -5].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPointsAmount(preset)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        {preset > 0 ? `+${preset}` : preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Activity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memorized Coptic hymn, Bible competition, Class participation"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="form-input"
                  />
                  {/* Quick Reason chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                    {[
                      'Answered Bible question',
                      'Memorized Alhan hymn',
                      'Active participation',
                      'Brought Agpeya & Bible',
                      'Good behavior',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setPointsReason(chip)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={pointsDate}
                    onChange={(e) => setPointsDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddPointsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Award Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Confession Date & Note Modal */}
      {editingConfessionModal?.open && (
        <div className="modal-overlay" onClick={() => setEditingConfessionModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Church size={18} color="#a21caf" />
                <h3 className="modal-title">
                  تفاصيل الاعتراف: {editingConfessionModal.student.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingConfessionModal(null)}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDetailedConfession}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#fdf4ff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f0abfc' }}>
                  <div style={{ fontSize: '0.8rem', color: '#701a75', fontWeight: 700 }}>
                    أب الاعتراف: {editingConfessionModal.student.confessionFather || 'غير محدد'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a21caf' }}>
                    الشهر: {formatMonthYear(selectedConfessionMonth)} • اليوم الشهري المحدد: يوم {editingConfessionModal.student.confessionMonthlyDay || 15}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ يوم الاعتراف الفعلي (Actual Confession Date) *</label>
                  <input
                    type="date"
                    required
                    value={editingConfessionModal.customDate}
                    onChange={(e) =>
                      setEditingConfessionModal({
                        ...editingConfessionModal,
                        customDate: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ملاحظات روحية / افتقادية (Pastoral Confession Notes)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. اعترف وتناول، تشجيع على صلاة باكر والغروب..."
                    value={editingConfessionModal.customNotes}
                    onChange={(e) =>
                      setEditingConfessionModal({
                        ...editingConfessionModal,
                        customNotes: e.target.value,
                      })
                    }
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingConfessionModal(null)}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#86198f', borderColor: '#86198f' }}>
                  <Check size={14} /> حفظ تسجيل الاعتراف (+{pointSettings.confessionPoints ?? 20} نقطة)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
