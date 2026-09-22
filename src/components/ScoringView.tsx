import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Sliders,
  Search,
  Save,
  Trash2,
  History
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings
} from '../types';
import { calculateStudentScore, getTodayDateString } from '../utils/helpers';
import { sound } from '../services/sound';

interface ScoringViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  darsKtab: DarsKtabRecord[];
  customEvents: CustomEvent[];
  customPoints: CustomPointEntry[];
  pointSettings: PointSettings;
  onSavePointSettings: (settings: PointSettings) => void;
  onAddCustomPoints: (entry: CustomPointEntry) => void;
  onDeleteCustomPoint: (id: string) => void;
  onSelectStudent: (student: Student) => void;
  currentServantName: string;
}

export const ScoringView: React.FC<ScoringViewProps> = ({
  students,
  attendance,
  darsKtab,
  customEvents,
  customPoints,
  pointSettings,
  onSavePointSettings,
  onAddCustomPoints,
  onDeleteCustomPoint,
  onSelectStudent,
  currentServantName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddPointsModalOpen, setIsAddPointsModalOpen] = useState(false);
  const [selectedStudentForPoints, setSelectedStudentForPoints] = useState<string>(students[0]?.id || '');
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [pointsReason, setPointsReason] = useState('');
  const [pointsDate, setPointsDate] = useState(getTodayDateString());

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
      pointSettings
    );
    return {
      student,
      ...scoreData,
    };
  });

  // Sort by highest total score first
  scoredStudents.sort((a, b) => b.totalScore - a.totalScore);

  const filteredStudents = scoredStudents.filter((item) =>
    item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              Automatic attendance points + custom points entered by servants for Pope Saweros class.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => {
              setTempSettings(pointSettings);
              setIsSettingsOpen(!isSettingsOpen);
            }}
            className="btn btn-secondary btn-sm"
            title="Customize automatic points for attendance"
          >
            <Sliders size={15} /> Customize Rules ({pointSettings.fridayClassPoints} / {pointSettings.odasPoints} / {pointSettings.darsKtabPoints} pts)
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

      {/* Rules Customizer Accordion Panel */}
      {isSettingsOpen && (
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sliders size={16} /> Customize Automated Attendance Points
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Points are recalculated automatically for each session attended
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
          ✓ Scoring rules updated! Total scores recalculated for all boys.
        </div>
      )}

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
            CLASS SCOREBOARD ({filteredStudents.length} BOYS)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ranked by total points
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredStudents.map((item, index) => {
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

      {/* Manual Points History Log */}
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
            {customPoints.slice(0, 10).map((entry) => {
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
    </div>
  );
};
