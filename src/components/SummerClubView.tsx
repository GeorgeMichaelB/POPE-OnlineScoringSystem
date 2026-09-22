import React, { useState } from 'react';
import {
  Sun,
  QrCode,
  Search,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  Filter,
  CheckCheck,
  Calendar,
  Save,
  Check
} from 'lucide-react';
import type { Student, SummerClubRecord, SummerClubSettings } from '../types';
import {
  getWeekdayDatesList,
  getNearestWeekdayDateString,
  WEEKDAY_OPTIONS,
  getWeekdayName,
  calculateAge
} from '../utils/helpers';
import { WeekdayPicker } from './WeekdayPicker';

interface SummerClubViewProps {
  students: Student[];
  records: SummerClubRecord[];
  settings: SummerClubSettings;
  onUpdateSettings: (newSettings: SummerClubSettings) => void;
  onToggleRecord: (
    studentId: string,
    subpage: 'day1' | 'day2',
    type: 'attended' | 'activity',
    value: boolean
  ) => void;
  onOpenQRScanner: (subpage: 'day1' | 'day2') => void;
  onSelectStudent: (student: Student) => void;
  activeSubpage: 'day1' | 'day2';
  onChangeSubpage: (subpage: 'day1' | 'day2') => void;
  day1Date: string;
  onChangeDay1Date: (date: string) => void;
  day2Date: string;
  onChangeDay2Date: (date: string) => void;
  lastScannedStudent: Student | null;
}

export const SummerClubView: React.FC<SummerClubViewProps> = ({
  students,
  records,
  settings,
  onUpdateSettings,
  onToggleRecord,
  onOpenQRScanner,
  onSelectStudent,
  activeSubpage,
  onChangeSubpage,
  day1Date,
  onChangeDay1Date,
  day2Date,
  onChangeDay2Date,
  lastScannedStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'attended' | 'absent'>('all');
  const [savedWeekdayNotice, setSavedWeekdayNotice] = useState<string | null>(null);

  // Active configuration depending on subpage
  const currentWeekday = activeSubpage === 'day1' ? settings.day1Weekday : settings.day2Weekday;
  const currentDate = activeSubpage === 'day1' ? day1Date : day2Date;
  const onChangeCurrentDate = activeSubpage === 'day1' ? onChangeDay1Date : onChangeDay2Date;

  // Available dates for the active subpage's chosen weekday
  const availableDates = getWeekdayDatesList(currentWeekday);
  const defaultDate = getNearestWeekdayDateString(currentWeekday);

  // Filter records for active subpage and current selected date
  const dateRecords = records.filter(
    (r) => r.subpage === activeSubpage && r.date === currentDate
  );
  const recordsMap = new Map<string, SummerClubRecord>();
  dateRecords.forEach((r) => recordsMap.set(r.studentId, r));

  const totalStudents = students.length;
  const attendedCount = dateRecords.filter((r) => r.attended).length;
  const activityCount = dateRecords.filter((r) => r.activity).length;
  const attendedPercent = totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0;
  const activityPercent = totalStudents > 0 ? Math.round((activityCount / totalStudents) * 100) : 0;

  // Filter students
  const q = searchQuery.toLowerCase().trim();
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.arabicName && s.arabicName.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q) ||
      (s.series && s.series.toLowerCase().includes(q)) ||
      s.school.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const rec = recordsMap.get(s.id);
    const isAttended = rec?.attended ?? false;

    if (filterMode === 'attended') return isAttended;
    if (filterMode === 'absent') return !isAttended;
    return true;
  });

  // Handle changing the weekday and saving as default
  const handleWeekdayChange = (newWeekdayValue: number) => {
    const updatedSettings: SummerClubSettings = {
      ...settings,
      [activeSubpage === 'day1' ? 'day1Weekday' : 'day2Weekday']: newWeekdayValue,
    };
    onUpdateSettings(updatedSettings);

    // Also update the currently selected date to the nearest date of this new weekday
    const newNearestDate = getNearestWeekdayDateString(newWeekdayValue);
    onChangeCurrentDate(newNearestDate);

    const weekdayName = getWeekdayName(newWeekdayValue, 'en');
    const dayLabel = activeSubpage === 'day1' ? 'First Day' : 'Second Day';
    setSavedWeekdayNotice(`${weekdayName} is now saved as the default weekday for ${dayLabel}!`);
    setTimeout(() => setSavedWeekdayNotice(null), 4000);
  };

  const handleMarkAllAttended = () => {
    const subpageTitle = activeSubpage === 'day1' ? 'First Day' : 'Second Day';
    if (confirm(`Mark all ${students.length} boys as ATTENDED for Summer Club ${subpageTitle} (${currentDate})?`)) {
      students.forEach((s) => {
        const rec = recordsMap.get(s.id);
        if (!rec?.attended) {
          onToggleRecord(s.id, activeSubpage, 'attended', true);
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 2 Subpages Tabs Navigation */}
      <div
        className="card"
        style={{
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <button
          type="button"
          onClick={() => onChangeSubpage('day1')}
          className="btn"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeSubpage === 'day1' ? 'var(--bg-card)' : 'transparent',
            color: activeSubpage === 'day1' ? '#ea580c' : 'var(--text-secondary)',
            boxShadow: activeSubpage === 'day1' ? 'var(--shadow-sm)' : 'none',
            border: activeSubpage === 'day1' ? '1px solid var(--border-light)' : '1px solid transparent',
          }}
        >
          <Sun size={18} color="#ea580c" />
          <span>FIRST DAY (اليوم الأول)</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: activeSubpage === 'day1' ? '#ffedd5' : 'rgba(0,0,0,0.05)',
              color: '#c2410c',
            }}
          >
            Every {getWeekdayName(settings.day1Weekday, 'en')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubpage('day2')}
          className="btn"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeSubpage === 'day2' ? 'var(--bg-card)' : 'transparent',
            color: activeSubpage === 'day2' ? '#0284c7' : 'var(--text-secondary)',
            boxShadow: activeSubpage === 'day2' ? 'var(--shadow-sm)' : 'none',
            border: activeSubpage === 'day2' ? '1px solid var(--border-light)' : '1px solid transparent',
          }}
        >
          <Sun size={18} color="#0284c7" />
          <span>SECOND DAY (اليوم الثاني)</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: activeSubpage === 'day2' ? '#e0f2fe' : 'rgba(0,0,0,0.05)',
              color: '#0369a1',
            }}
          >
            Every {getWeekdayName(settings.day2Weekday, 'en')}
          </span>
        </button>
      </div>

      {/* Weekday Configuration Notice */}
      {savedWeekdayNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-sm)',
            color: '#047857',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <Check size={16} />
          <span>{savedWeekdayNotice}</span>
        </div>
      )}

      {/* Weekday Configuration & Session Picker Header */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* Top Controls Row */}
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
          {/* Weekday Picker for this subpage */}
          <WeekdayPicker
            label={`SUMMER CLUB ${activeSubpage === 'day1' ? 'DAY 1' : 'DAY 2'} (${getWeekdayName(currentWeekday, 'en').toUpperCase()}S)`}
            selectedDate={currentDate}
            availableDates={availableDates}
            onChangeDate={onChangeCurrentDate}
            currentDefaultDate={defaultDate}
          />

          {/* Configurable Weekday Selector & QR Scanner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Weekday Selector (Configurable Default) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--bg-subtle)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
              }}
              title="Change the recurring weekday for this subpage. It will be saved as your default."
            >
              <Calendar size={15} color="var(--text-secondary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Weekday:
              </span>
              <select
                value={currentWeekday}
                onChange={(e) => handleWeekdayChange(Number(e.target.value))}
                className="form-select"
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-medium)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                {WEEKDAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelEn} ({opt.labelAr})
                  </option>
                ))}
              </select>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--color-success)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Save size={11} />
                Default
              </span>
            </div>

            {/* Mark All Attended */}
            <button
              type="button"
              onClick={handleMarkAllAttended}
              className="btn btn-secondary btn-sm"
              title="Mark all boys as attended"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCheck size={16} color="var(--color-success)" />
              <span>Mark All</span>
            </button>

            {/* QR Scan Button */}
            <button
              type="button"
              onClick={() => onOpenQRScanner(activeSubpage)}
              className="btn btn-primary"
              style={{
                boxShadow: 'var(--shadow-md)',
                padding: '0.55rem 1.1rem',
                backgroundColor: activeSubpage === 'day1' ? '#ea580c' : '#0284c7',
                borderColor: activeSubpage === 'day1' ? '#ea580c' : '#0284c7',
              }}
            >
              <QrCode size={18} />
              <span>Scan for {activeSubpage === 'day1' ? 'Day 1' : 'Day 2'}</span>
            </button>
          </div>
        </div>

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
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ROSTER</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {totalStudents} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>boys</span>
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
              <CheckCircle2 size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>1. CLUB ATTENDED (حضور النادي)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>
              {attendedCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({attendedPercent}%)</span>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: '#eff6ff',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #bfdbfe',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8' }}>
              <Sparkles size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>2. WORKSHOP & ACTIVITY (الورشة والنشاط)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.25rem' }}>
              {activityCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({activityPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Scanned Feedback Banner */}
      {lastScannedStudent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color="var(--color-success)" />
            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Checked In: </span>
              <strong>{lastScannedStudent.name}</strong> ({lastScannedStudent.id})
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectStudent(lastScannedStudent)}
            className="btn btn-secondary btn-sm"
          >
            View Details
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by boy English or Arabic name, ID, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All ({totalStudents})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('attended')}
            className={`btn btn-sm ${filterMode === 'attended' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderColor: filterMode === 'attended' ? 'var(--color-success)' : undefined,
              backgroundColor: filterMode === 'attended' ? 'var(--color-success)' : undefined,
            }}
          >
            Present ({attendedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('absent')}
            className={`btn btn-sm ${filterMode === 'absent' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderColor: filterMode === 'absent' ? 'var(--color-danger)' : undefined,
              backgroundColor: filterMode === 'absent' ? 'var(--color-danger)' : undefined,
            }}
          >
            Absent ({totalStudents - attendedCount})
          </button>
        </div>
      </div>

      {/* Students List for Summer Club */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredStudents.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <p>No students found matching "{searchQuery}".</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const record = recordsMap.get(student.id);
            const isAttended = record?.attended ?? false;
            const isActivity = record?.activity ?? false;
            const age = calculateAge(student.dob);

            return (
              <div
                key={student.id}
                className="card"
                style={{
                  padding: '0.9rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderLeft: isAttended
                    ? '4px solid var(--color-success)'
                    : '4px solid var(--border-medium)',
                  backgroundColor: isAttended ? 'rgba(5, 150, 105, 0.02)' : 'var(--bg-card)',
                }}
              >
                {/* Student Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    minWidth: '220px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectStudent(student)}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      student.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {student.name}
                      </span>
                      {student.arabicName && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          ({student.arabicName})
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.15rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: 'var(--bg-subtle)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                        }}
                      >
                        {student.id}
                      </span>
                      <span>• {age} yrs</span>
                      <span>• {student.school}</span>
                    </div>
                  </div>
                </div>

                {/* Two Action Toggles: 1. Club Attendance, 2. Workshop Activity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Toggle 1: Attended Club */}
                  <button
                    type="button"
                    onClick={() =>
                      onToggleRecord(student.id, activeSubpage, 'attended', !isAttended)
                    }
                    className="btn btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      border: isAttended
                        ? '1px solid var(--color-success-border)'
                        : '1px solid var(--border-medium)',
                      backgroundColor: isAttended ? 'var(--color-success-bg)' : 'transparent',
                      color: isAttended ? 'var(--color-success)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isAttended ? (
                      <CheckCircle2 size={16} color="var(--color-success)" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    <span>حضور النادي</span>
                  </button>

                  {/* Toggle 2: Workshop / Activity */}
                  <button
                    type="button"
                    onClick={() =>
                      onToggleRecord(student.id, activeSubpage, 'activity', !isActivity)
                    }
                    className="btn btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      border: isActivity ? '1px solid #bfdbfe' : '1px solid var(--border-medium)',
                      backgroundColor: isActivity ? '#eff6ff' : 'transparent',
                      color: isActivity ? '#1d4ed8' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Sparkles size={16} color={isActivity ? '#1d4ed8' : 'var(--text-muted)'} />
                    <span>الورشة والنشاط</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
