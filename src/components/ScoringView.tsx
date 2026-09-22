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
  UserCheck
} from 'lucide-react';
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

  const filteredScoredStudents = scoredStudents.filter((item) =>
    item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.student.confessionFather && item.student.confessionFather.toLowerCase().includes(searchQuery.toLowerCase()))
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
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.confessionFather && student.confessionFather.toLowerCase().includes(searchQuery.toLowerCase()));

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

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
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
            className="btn btn-secondary btn-sm"
            title="Customize automatic points for attendance and confession"
          >
            <Sliders size={15} /> Customize Rules ({pointSettings.confessionPoints ?? 20} pts confession)
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

      {/* Rules Customizer Accordion Panel */}
      {isSettingsOpen && (
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sliders size={16} /> Customize Automated Points Rules (تعديل قواعد احتساب النقاط)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Points recalculate automatically across all boys
            </span>
          </div>

          <form onSubmit={handleSaveRules}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {/* Confession Rule (Prominent) */}
              <div style={{ background: '#fdf4ff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f0abfc' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: '#86198f', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Church size={13} /> Monthly Confession (سر الاعتراف)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.confessionPoints ?? 20}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, confessionPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 800, color: '#86198f', borderColor: '#f0abfc' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Friday Class (الجمعة)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.fridayClassPoints}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, fridayClassPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Odas / Liturgy (القداس)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.odasPoints}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, odasPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Saturday Dars Ktab (درس كتاب)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.darsKtabPoints}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, darsKtabPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Saturday Ashya (عشية)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.ashyaPoints}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, ashyaPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Thursday Mal3ab (الملعب)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.mal3abPoints ?? 10}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, mal3abPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Events & Trips (رحلات)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempSettings.customEventPoints}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, customEventPoints: Number(e.target.value) })
                  }
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={14} /> Save Point Rules
              </button>
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
                      +{pointSettings.confessionPoints ?? 20} Points
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
                Click button to award +{pointSettings.confessionPoints ?? 20} pts when boy goes to confession
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
                            <Check size={14} /> تم الاعتراف (+{pointSettings.confessionPoints ?? 20}p)
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
                          <CheckCircle2 size={15} /> راح الاعتراف (+{pointSettings.confessionPoints ?? 20} pts)
                        </button>
                      )}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.student.name}</span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {item.student.id}
                          </span>
                        </div>

                        {/* Breakdown Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '3px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>
                            Fri: +{item.fridayPoints}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                            Odas: +{item.odasPoints}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                            Dars: +{item.darsKtabPoints}
                          </span>
                          {/* Confession Points Badge */}
                          {item.confessionPoints > 0 && (
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
                          {item.customPointsTotal !== 0 && (
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
