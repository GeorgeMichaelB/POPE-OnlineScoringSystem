import React, { useState } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Church,
  UserCheck,
  Play,
  RotateCcw,
  Clock,
  Check,
  Maximize2,
  Fingerprint,
} from 'lucide-react';
import type { Student, AttendanceRecord, PointSettings } from '../types';
import { getFridaysList, getNearestFridayDateString, calculateFridayLateDeduction } from '../utils/helpers';
import { WeekdayPicker } from './WeekdayPicker';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onToggleAttendance: (studentId: string, type: 'sundaySchool' | 'odas', value: boolean) => void;
  onToggleLateStatus?: (studentId: string) => void;
  onOpenQRScanner: () => void;
  onOpenFullscreenScanner?: () => void;
  onSelectStudent: (student: Student) => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  lastScannedStudent: Student | null;
  lastScanResult?: {
    student: Student;
    date: string;
    isLate: boolean;
    pointsAwarded: number;
    checkInMinutes?: number;
    timerActive: boolean;
  } | null;
  pointSettings: PointSettings;
  fridayTimerStartTime: number | null;
  fridayTimerRunning: boolean;
  fridayTimerElapsedSeconds: number;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  onToggleAttendance,
  onToggleLateStatus,
  onOpenQRScanner,
  onOpenFullscreenScanner,
  onSelectStudent,
  selectedDate,
  onChangeDate,
  lastScannedStudent,
  lastScanResult,
  pointSettings,
  fridayTimerStartTime,
  fridayTimerRunning,
  fridayTimerElapsedSeconds,
  onStartTimer,
  onStopTimer,
  onResetTimer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Rules from settings
  const cutoffMinutes = pointSettings.fridayLateCutoffMinutes ?? 15;
  const cutoffSeconds = cutoffMinutes * 60;
  const intervalMinutes = pointSettings.fridayLateIntervalMinutes ?? 2;
  const intervalPoints = pointSettings.fridayLateIntervalPoints ?? 1;
  const fullPoints = pointSettings.fridayClassPoints || 10;
  const defaultLatePoints = Math.max(0, fullPoints - intervalPoints);
  const isLateDeductionActive = pointSettings.fridayLateDeductionEnabled !== false;

  const isTimerStarted = Boolean(fridayTimerStartTime);
  const isLatePeriod = isTimerStarted && isLateDeductionActive && fridayTimerElapsedSeconds >= cutoffSeconds;
  const elapsedMinutes = Math.floor(fridayTimerElapsedSeconds / 60);
  const currentDeduction = calculateFridayLateDeduction(elapsedMinutes, pointSettings);
  const liveAwardedPoints = currentDeduction.awardedPoints;

  const remainingSeconds = Math.max(0, cutoffSeconds - fridayTimerElapsedSeconds);
  const remMins = Math.floor(remainingSeconds / 60);
  const remSecs = remainingSeconds % 60;

  const formatTimerSeconds = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins < 60) {
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Records for current date
  const dateRecords = attendance.filter((r) => r.date === selectedDate);
  const recordsMap = new Map<string, AttendanceRecord>();
  dateRecords.forEach((r) => recordsMap.set(r.studentId, r));

  // Filter students by name, arabicName, series, ID, or school or deacon
  const q = searchQuery.toLowerCase().trim();
  const filteredStudents = students.filter((s) => {
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.arabicName && s.arabicName.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q) ||
      (s.series && s.series.toLowerCase().includes(q)) ||
      s.school.toLowerCase().includes(q) ||
      Boolean(s.isDeacon && ('شماس'.includes(q) || 'deacon'.includes(q)))
    );
  });

  // Calculate metrics for selected date
  const totalStudents = students.length;
  const sundaySchoolPresentCount = dateRecords.filter((r) => r.sundaySchool).length;
  const odasPresentCount = dateRecords.filter((r) => r.odas).length;
  const ssPercent = totalStudents > 0 ? Math.round((sundaySchoolPresentCount / totalStudents) * 100) : 0;
  const odasPercent = totalStudents > 0 ? Math.round((odasPresentCount / totalStudents) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Date, Fast QR Scan & Metrics */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '1rem',
            marginBottom: '1rem',
          }}
        >
          {/* WeekdayPicker - Fridays Only */}
          <WeekdayPicker
            label="FRIDAY SESSION (خدمة الجمعة والقداس)"
            selectedDate={selectedDate}
            availableDates={getFridaysList()}
            onChangeDate={onChangeDate}
            currentDefaultDate={getNearestFridayDateString()}
          />

          {/* Action Buttons: Fullscreen Scanner & Standard QR Scan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {onOpenFullscreenScanner && (
              <button
                type="button"
                onClick={onOpenFullscreenScanner}
                className="btn btn-secondary"
                style={{
                  padding: '0.65rem 1.15rem',
                  borderColor: '#818cf8',
                  color: '#4f46e5',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
                title="Launch live mirrored camera and full screen digital timer HUD"
              >
                <Maximize2 size={17} />
                <span>Fullscreen Scanner 🪞</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenQRScanner}
              className="btn btn-primary"
              style={{
                boxShadow: 'var(--shadow-md)',
                padding: '0.65rem 1.25rem',
              }}
            >
              <QrCode size={18} />
              <span>Scan Passport QR (Friday)</span>
            </button>
          </div>
        </div>

        {/* Friday Class Timer Bar (User enters class & sees Start Button) */}
        {!isTimerStarted ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.07), rgba(99, 102, 241, 0.03))',
              border: '1.5px dashed #c7d2fe',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1.15rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onStartTimer}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  padding: '0.65rem 1.35rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Play size={17} fill="currentColor" />
                <span>Start Class Timer (بدء وقت الفصل)</span>
              </button>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Grace Period: <span style={{ color: '#4f46e5' }}>{cutoffMinutes} min</span> • Interval Deduction:{' '}
                  <span style={{ color: '#d97706' }}>-{intervalPoints} pt every {intervalMinutes}m late</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  If timer is not started, scanning awards full {fullPoints} pts. Starts fullscreen mirrored camera scanner automatically.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Configured in Settings ⚙️
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Fingerprint size={12} />
                <span>Biometrics / Screen Lock Protected</span>
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem',
              background: isLatePeriod
                ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.6), rgba(253, 230, 138, 0.3))'
                : 'linear-gradient(135deg, rgba(236, 253, 245, 0.7), rgba(209, 250, 229, 0.4))',
              border: isLatePeriod ? '1.5px solid #f59e0b' : '1.5px solid #10b981',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.15rem',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              {/* Digital Timer Clock Display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-card)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'monospace',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: isLatePeriod ? '#b45309' : '#047857',
                  letterSpacing: '1px',
                }}
              >
                <Clock size={19} className={fridayTimerRunning ? 'timer-pulse' : ''} />
                <span>{formatTimerSeconds(fridayTimerElapsedSeconds)}</span>
              </div>

              {/* Status Indicator */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {isLatePeriod ? (
                    <span
                      className="badge badge-warning"
                      style={{ fontWeight: 800, fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                    >
                      ⏱️ LATE SCANNING ACTIVE • Now awarding {liveAwardedPoints} pts (-{currentDeduction.totalDeduction} pts)
                    </span>
                  ) : (
                    <span
                      className="badge badge-success"
                      style={{ fontWeight: 800, fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                    >
                      🟢 ON-TIME PERIOD (Full +{fullPoints} pts)
                    </span>
                  )}

                  <span style={{ fontSize: '0.78rem', color: isLatePeriod ? '#92400e' : '#065f46', fontWeight: 700 }}>
                    {isLatePeriod
                      ? `Late by ${currentDeduction.lateMinutes}m • (-${intervalPoints} pt every ${intervalMinutes}m)`
                      : `${remMins}m ${remSecs}s until late cutoff`}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Timer active for session {selectedDate} • Grace threshold {cutoffMinutes}m • Biometrics / Screen Lock required to stop
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {onOpenFullscreenScanner && (
                <button
                  type="button"
                  onClick={onOpenFullscreenScanner}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                    padding: '0.4rem 0.8rem',
                  }}
                  title="Open Fullscreen Mirrored Camera Scanner & Live Timer HUD"
                >
                  <Maximize2 size={13} />
                  <span>Fullscreen Scanner 🪞</span>
                </button>
              )}

              {fridayTimerRunning ? (
                <button
                  type="button"
                  onClick={onStopTimer}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#dc2626',
                    borderColor: '#fca5a5',
                  }}
                  title="Stop timer (Requires Phone/Device Biometrics or Screen Lock)"
                >
                  <Fingerprint size={13} />
                  <span>Stop Timer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartTimer}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.4rem 0.75rem', fontWeight: 600 }}
                  title="Resume timer & open fullscreen scanner"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Resume</span>
                </button>
              )}

              <button
                type="button"
                onClick={onResetTimer}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.65rem' }}
                title="Reset timer to 00:00"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              padding: '0.85rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Users size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TOTAL ROSTER</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {totalStudents} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>kids</span>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: 'var(--color-success-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-success-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)' }}>
              <UserCheck size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>FRIDAY CLASS</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>
              {sundaySchoolPresentCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({ssPercent}%)</span>
            </div>
            {dateRecords.some((r) => r.sundaySchool && r.isLate) && (
              <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600, marginTop: '0.15rem' }}>
                {sundaySchoolPresentCount - dateRecords.filter((r) => r.sundaySchool && r.isLate).length} on-time •{' '}
                {dateRecords.filter((r) => r.sundaySchool && r.isLate).length} late
              </div>
            )}
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: 'var(--color-warning-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-warning-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)' }}>
              <Church size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ODAS / LITURGY</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
              {odasPresentCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({odasPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Just-Scanned Kid Confirmation Banner */}
      {lastScannedStudent && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: lastScanResult?.isLate ? '2px solid #f59e0b' : '2px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: lastScanResult?.isLate ? '#fef3c7' : 'var(--color-success-bg)',
                color: lastScanResult?.isLate ? '#b45309' : 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              {lastScanResult?.isLate ? '⏱️' : '✓'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{lastScannedStudent.name}</span>
                <span className="badge badge-neutral">{lastScannedStudent.id}</span>
                {lastScanResult?.timerActive ? (
                  lastScanResult.isLate ? (
                    <span
                      className="badge"
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    >
                      ⏱️ Scanned Late ({lastScanResult.checkInMinutes ?? 0}m) • Decreased to +{lastScanResult.pointsAwarded} pts (-{fullPoints - lastScanResult.pointsAwarded} pts)
                    </span>
                  ) : (
                    <span
                      className="badge"
                      style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    >
                      ✓ On-Time ({lastScanResult.checkInMinutes ?? 0}m) • Full +{lastScanResult.pointsAwarded} pts awarded
                    </span>
                  )
                ) : (
                  <span
                    className="badge"
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    ✓ Full +{lastScanResult?.pointsAwarded ?? fullPoints} pts awarded (Timer was not started)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                {lastScannedStudent.category || 'Pope Saweros Class'} • Friday Session {selectedDate}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onSelectStudent(lastScannedStudent)}
              className="btn btn-secondary btn-sm"
            >
              View Profile & Eftekad
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search
          size={16}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Search by boy English or Arabic name, ID, series..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '2.2rem' }}
        />
      </div>

      {/* Attendance Student Roster Table / Card List */}
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
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            STUDENT LIST ({filteredStudents.length})
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tap badges to toggle attendance
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No students found matching your search.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredStudents.map((student) => {
              const record = recordsMap.get(student.id);
              const isSundaySchoolPresent = record?.sundaySchool ?? false;
              const isOdasPresent = record?.odas ?? false;

              return (
                <div
                  key={student.id}
                  className="roster-card-row"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    borderBottom: '1px solid var(--border-light)',
                    gap: '0.75rem',
                    background: isSundaySchoolPresent ? 'rgba(236, 253, 245, 0.3)' : 'transparent',
                  }}
                >
                  {/* Student Details */}
                  <div
                    onClick={() => onSelectStudent(student)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      flex: '1 1 200px',
                    }}
                  >
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-full)',
                          objectFit: 'cover',
                          border: '1px solid var(--border-medium)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {student.name.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {student.name}
                        </span>
                        {student.arabicName && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            ({student.arabicName})
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {student.id}
                        </span>
                        {student.isDeacon && (
                          <span
                            className="badge"
                            style={{
                              background: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #ddd6fe',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem',
                            }}
                          >
                            ✝️ شماس
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {student.school || 'St. Joseph School'}
                      </div>
                    </div>
                  </div>

                  {/* Dual Attendance Action Buttons */}
                  <div className="roster-card-actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {/* Sunday School Attendance Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleAttendance(student.id, 'sundaySchool', !isSundaySchoolPresent)}
                      className={`btn btn-sm ${isSundaySchoolPresent ? 'badge-success' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        borderWidth: isSundaySchoolPresent ? '1px' : '1px',
                      }}
                      title="Toggle Sunday School attendance"
                    >
                      {isSundaySchoolPresent ? (
                        <>
                          <CheckCircle2 size={14} /> <span><span className="hide-on-mobile">Sunday </span>Class: Attended</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} color="var(--text-muted)" /> <span><span className="hide-on-mobile">Sunday </span>Class: Absent</span>
                        </>
                      )}
                    </button>

                    {/* On-Time / Late Status Badge (clickable to excuse or mark late) */}
                    {isSundaySchoolPresent && (
                      <button
                        type="button"
                        onClick={() => onToggleLateStatus && onToggleLateStatus(student.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: onToggleLateStatus ? 'pointer' : 'default',
                          border: record?.isLate ? '1px solid #fcd34d' : '1px solid #a7f3d0',
                          background: record?.isLate ? '#fef3c7' : '#ecfdf5',
                          color: record?.isLate ? '#92400e' : '#065f46',
                          transition: 'all 0.15s ease',
                        }}
                        title={
                          record?.isLate
                            ? 'Marked Late (decreased points). Click to change to On-Time'
                            : 'Marked On-Time (full points). Click to change to Late'
                        }
                      >
                        {record?.isLate ? (
                          <>
                            <Clock size={12} />
                            <span>Late (+{record?.pointsAwarded ?? defaultLatePoints} pts)</span>
                          </>
                        ) : (
                          <>
                            <Check size={12} strokeWidth={2.5} />
                            <span>On-Time (+{fullPoints} pts)</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Odas / Liturgy Attendance Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleAttendance(student.id, 'odas', !isOdasPresent)}
                      className={`btn btn-sm ${isOdasPresent ? 'badge-warning' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        borderWidth: isOdasPresent ? '1px' : '1px',
                      }}
                      title="Toggle Holy Liturgy (Odas) attendance"
                    >
                      {isOdasPresent ? (
                        <>
                          <CheckCircle2 size={14} /> <span>Liturgy: Attended</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} color="var(--text-muted)" /> <span>Liturgy: Absent</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
