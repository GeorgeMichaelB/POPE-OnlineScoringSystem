import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Camera,
  Plus,
  QrCode,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Play,
  Trash2,
  FileText
} from 'lucide-react';
import type { Student, VisitRecord } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  formatTimerStopwatch,
  getStudentVisits,
  getTodayDateString,
} from '../utils/helpers';

interface VisitsViewProps {
  students: Student[];
  visits: VisitRecord[];
  onSaveVisit: (visit: VisitRecord) => void;
  onDeleteVisit: (visitId: string) => void;
  onOpenQRScanner: () => void;
  onSelectStudent: (student: Student) => void;
  activeVisitStudentId?: string | null;
  onClearActiveStudent?: () => void;
  currentServantName: string;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  students,
  visits,
  onSaveVisit,
  onDeleteVisit,
  onOpenQRScanner,
  onSelectStudent,
  activeVisitStudentId = null,
  onClearActiveStudent,
  currentServantName,
}) => {
  // Current Calendar Month
  const [currentDate, setCurrentDate] = useState(new Date());

  // Schedule Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState<string>(
    students[0]?.id || ''
  );
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [scheduleTime, setScheduleTime] = useState('18:00');
  const [scheduleServant, setScheduleServant] = useState(currentServantName);
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Active Live Visit State
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [visitTimerSeconds, setVisitTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [liveVisitNotes, setLiveVisitNotes] = useState('');
  const [liveVisitPhotos, setLiveVisitPhotos] = useState<string[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [visitStartTime, setVisitStartTime] = useState<string | null>(null);

  // If parent specified an active student ID (e.g. from QR scan)
  useEffect(() => {
    if (activeVisitStudentId) {
      const student = students.find((s) => s.id === activeVisitStudentId);
      if (student) {
        startVisitSession(student);
      }
    }
  }, [activeVisitStudentId, students]);

  // Stopwatch interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setVisitTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map visits by date
  const visitsByDate = new Map<string, VisitRecord[]>();
  visits.forEach((v) => {
    const list = visitsByDate.get(v.scheduledDate) || [];
    list.push(v);
    visitsByDate.set(v.scheduledDate, list);
  });

  // Calculate Overdue / Needs Eftekad list
  const studentsNeedingVisit = students
    .map((s) => {
      const stats = getStudentVisits(s.id, visits);
      return { student: s, ...stats };
    })
    .filter((item) => item.needsEftekad)
    .sort((a, b) => (b.daysSinceLastVisit ?? 999) - (a.daysSinceLastVisit ?? 999));

  // Start live visit session
  const startVisitSession = (student: Student) => {
    setActiveStudent(student);
    setVisitTimerSeconds(0);
    setIsTimerRunning(true);
    setLiveVisitNotes('');
    setLiveVisitPhotos([]);
    setVisitStartTime(new Date().toISOString());
  };

  // Complete and save active visit
  const handleCompleteActiveVisit = () => {
    if (!activeStudent) return;
    setIsTimerRunning(false);

    const newVisit: VisitRecord = {
      id: `visit-${Date.now()}`,
      studentId: activeStudent.id,
      servantName: currentServantName,
      scheduledDate: getTodayDateString(),
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      durationSeconds: visitTimerSeconds,
      notes: liveVisitNotes.trim() || 'Home pastoral visit completed.',
      photos: liveVisitPhotos,
      createdAt: visitStartTime || new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    onSaveVisit(newVisit);

    // Reset active session
    setActiveStudent(null);
    setVisitTimerSeconds(0);
    setLiveVisitNotes('');
    setLiveVisitPhotos([]);
    if (onClearActiveStudent) onClearActiveStudent();
  };

  const handleCancelActiveVisit = () => {
    if (confirm('Cancel this in-progress visit? Timer and notes will not be saved.')) {
      setIsTimerRunning(false);
      setActiveStudent(null);
      setVisitTimerSeconds(0);
      setLiveVisitNotes('');
      setLiveVisitPhotos([]);
      if (onClearActiveStudent) onClearActiveStudent();
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForSchedule) return;

    const newScheduledVisit: VisitRecord = {
      id: `visit-${Date.now()}`,
      studentId: selectedStudentForSchedule,
      servantName: scheduleServant.trim() || currentServantName,
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      status: 'scheduled',
      durationSeconds: 0,
      notes: scheduleNotes.trim(),
      photos: [],
      createdAt: new Date().toISOString(),
    };

    onSaveVisit(newScheduledVisit);
    setIsScheduleOpen(false);
    setScheduleNotes('');
  };

  const addQuickNote = (snippet: string) => {
    setLiveVisitNotes((prev) => (prev ? `${prev} • ${snippet}` : snippet));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ACTIVE VISIT CONTROLLER (Shown prominently when a visit is in progress) */}
      {activeStudent && (
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--color-primary)',
            boxShadow: 'var(--shadow-lg)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
            }}
          >
            {/* Student Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {activeStudent.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{activeStudent.name}</span>
                  {activeStudent.arabicName && (
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ({activeStudent.arabicName})
                    </span>
                  )}
                  <span className="badge badge-neutral">{activeStudent.id}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {activeStudent.category} • {activeStudent.address || 'Address unlisted'}
                </p>
              </div>
            </div>

            {/* Live Stopwatch Display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--bg-subtle)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Clock size={20} color="var(--color-primary)" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  VISIT DURATION
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {formatTimerStopwatch(visitTimerSeconds)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: '0.5rem' }}
                title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
              >
                {isTimerRunning ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>

          {/* Quick Contact & Info Bar during Visit */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              margin: '1rem 0',
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            {activeStudent.dadPhone && (
              <a
                href={`tel:${activeStudent.dadPhone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <Phone size={14} /> Call Dad ({activeStudent.dadPhone})
              </a>
            )}
            {activeStudent.momPhone && (
              <a
                href={`tel:${activeStudent.momPhone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginLeft: '0.5rem',
                }}
              >
                <Phone size={14} /> Call Mom ({activeStudent.momPhone})
              </a>
            )}
            {activeStudent.loveLanguage && (
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                Love Language: <strong>{activeStudent.loveLanguage}</strong>
              </span>
            )}
          </div>

          {/* Visit Notes & Camera Photo Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={15} /> Visit Notes & Prayer Requests (ملاحظات الزيارة)
              </label>

              {/* Quick Template Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {[
                  'Spiritual discussion & prayer',
                  'Encouraged early Liturgy attendance',
                  'Family blessing & prayer together',
                  'Follow up on school pressure',
                  'Needs confession follow-up',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => addQuickNote(chip)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Write notes about the visit, what was discussed, pastoral needs..."
                value={liveVisitNotes}
                onChange={(e) => setLiveVisitNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            {/* Visit Photos Gallery */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <span className="form-label" style={{ margin: 0 }}>
                  Visit Photos ({liveVisitPhotos.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <Camera size={15} /> Take Live Photo
                </button>
              </div>

              {liveVisitPhotos.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {liveVisitPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 90,
                        height: 90,
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-medium)',
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Visit photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLiveVisitPhotos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No photos captured yet. Tap "Take Live Photo" to capture memories during the visit.
                </p>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button type="button" onClick={handleCancelActiveVisit} className="btn btn-secondary">
              Cancel Visit
            </button>
            <button
              type="button"
              onClick={handleCompleteActiveVisit}
              className="btn btn-primary"
              style={{ background: 'var(--color-success)' }}
            >
              <CheckCircle size={16} /> End & Save Visit ({formatTimerStopwatch(visitTimerSeconds)})
            </button>
          </div>
        </div>
      )}

      {/* Main Visits Planner Header */}
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
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Eftekad & Home Visits</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Plan visits, schedule on shared calendar, and record live pastoral sessions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn btn-secondary"
            title="Scan passport QR code to start visit immediately"
          >
            <QrCode size={16} />
            <span>Scan Passport for Visit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* Grid: Calendar View on Left/Top, Overdue & Scheduled on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.25rem',
        }}
      >
        {/* Interactive Calendar Card */}
        <div className="card">
          {/* Calendar Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {monthNames[month]} {year}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={prevMonth}
                className="btn btn-secondary btn-sm"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="btn btn-secondary btn-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="btn btn-secondary btn-sm"
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.5rem',
            }}
          >
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Calendar Day Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: '70px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  opacity: 0.4,
                }}
              />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNumber = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayVisits = visitsByDate.get(dateString) || [];
              const isToday = dateString === getTodayDateString();

              return (
                <div
                  key={dateString}
                  onClick={() => {
                    setScheduleDate(dateString);
                    setIsScheduleOpen(true);
                  }}
                  style={{
                    minHeight: '74px',
                    padding: '4px 6px',
                    background: isToday ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
                    border: isToday ? '2px solid var(--color-accent)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  title={`Click to schedule visit on ${dateString}`}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? 'var(--color-accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {dayNumber}
                  </div>

                  {/* Visit Chips inside Day Box */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    {dayVisits.map((v) => {
                      const student = students.find((s) => s.id === v.studentId);
                      const isCompleted = v.status === 'completed';
                      return (
                        <div
                          key={v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (student) onSelectStudent(student);
                          }}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: isCompleted ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                            color: isCompleted ? 'var(--color-success)' : 'var(--color-warning)',
                            border: `1px solid ${isCompleted ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {student ? student.name.split(' ')[0] : 'Kid'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs Eftekad & Upcoming Scheduled Visits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Overdue / Needs Visit Section */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '0.85rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.65rem',
              }}
            >
              <AlertTriangle size={18} color="var(--color-danger)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                Needs Eftekad ({studentsNeedingVisit.length})
              </h3>
            </div>

            {studentsNeedingVisit.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>
                Great job! All students have had recent pastoral visits.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {studentsNeedingVisit.map(({ student, daysSinceLastVisit }) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--color-danger-bg)',
                      border: '1px solid var(--color-danger-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {student.name} {student.arabicName ? `(${student.arabicName})` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {student.category} •{' '}
                        {daysSinceLastVisit !== null
                          ? `Last visit: ${daysSinceLastVisit} days ago`
                          : 'Never visited'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startVisitSession(student)}
                      className="btn btn-sm btn-primary"
                    >
                      <Play size={12} /> Start Visit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Scheduled Visits */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '0.85rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.65rem',
              }}
            >
              <Clock size={18} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Upcoming Scheduled Visits</h3>
            </div>

            {visits.filter((v) => v.status === 'scheduled').length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No visits currently scheduled. Click "Schedule Visit" to plan.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {visits
                  .filter((v) => v.status === 'scheduled')
                  .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                  .map((v) => {
                    const student = students.find((s) => s.id === v.studentId);
                    return (
                      <div
                        key={v.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {student?.name || 'Student'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {v.scheduledDate} at {v.scheduledTime} • {v.servantName}
                          </div>
                          {v.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Note: {v.notes}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {student && (
                            <button
                              type="button"
                              onClick={() => startVisitSession(student)}
                              className="btn btn-primary btn-sm"
                              title="Start this visit now"
                            >
                              <Play size={12} /> Start
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteVisit(v.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444' }}
                            title="Delete scheduled visit"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {isScheduleOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule Eftekad Visit</h3>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Boy</label>
                  <select
                    value={selectedStudentForSchedule}
                    onChange={(e) => setSelectedStudentForSchedule(e.target.value)}
                    className="form-select"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category}) - {s.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Servant(s) Assigned</label>
                  <input
                    type="text"
                    value={scheduleServant}
                    onChange={(e) => setScheduleServant(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Servant Mina & Servant George"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Purpose / Note</label>
                  <textarea
                    rows={2}
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    className="form-textarea"
                    placeholder="Purpose of visit, what to bring, etc."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Built-in Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(photoBase64) => {
          setLiveVisitPhotos((prev) => [...prev, photoBase64]);
        }}
      />
    </div>
  );
};
