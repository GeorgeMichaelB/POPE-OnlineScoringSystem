import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Users,
  Trophy,
  CheckCircle2,
  XCircle,
  Filter,
  CheckCheck
} from 'lucide-react';
import type { Student, Mal3abRecord } from '../types';
import { getThursdaysList, getNearestThursdayDateString, calculateAge } from '../utils/helpers';
import { WeekdayPicker } from './WeekdayPicker';

interface Mal3abViewProps {
  students: Student[];
  records: Mal3abRecord[];
  onToggleRecord: (studentId: string, type: 'attended' | 'matchPlayed', value: boolean) => void;
  onOpenQRScanner: () => void;
  onSelectStudent: (student: Student) => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  lastScannedStudent: Student | null;
}

export const Mal3abView: React.FC<Mal3abViewProps> = ({
  students,
  records,
  onToggleRecord,
  onOpenQRScanner,
  onSelectStudent,
  selectedDate,
  onChangeDate,
  lastScannedStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'attended' | 'absent'>('all');

  // Records for currently selected Thursday
  const dateRecords = records.filter((r) => r.date === selectedDate);
  const recordsMap = new Map<string, Mal3abRecord>();
  dateRecords.forEach((r) => recordsMap.set(r.studentId, r));

  const totalStudents = students.length;
  const attendedCount = dateRecords.filter((r) => r.attended).length;
  const matchCount = dateRecords.filter((r) => r.matchPlayed).length;
  const attendedPercent = totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0;
  const matchPercent = totalStudents > 0 ? Math.round((matchCount / totalStudents) * 100) : 0;

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

  const handleMarkAllAttended = () => {
    if (confirm(`Mark all ${students.length} boys as ATTENDED for Thursday (${selectedDate})?`)) {
      students.forEach((s) => {
        const rec = recordsMap.get(s.id);
        if (!rec?.attended) {
          onToggleRecord(s.id, 'attended', true);
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Thursday Session, Stats & QR Scan */}
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
          {/* WeekdayPicker - Thursdays Only */}
          <WeekdayPicker
            label="THURSDAY SESSION (ملعب الخميس والنشاط الرياضي)"
            selectedDate={selectedDate}
            availableDates={getThursdaysList()}
            onChangeDate={onChangeDate}
            currentDefaultDate={getNearestThursdayDateString()}
          />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleMarkAllAttended}
              className="btn btn-secondary btn-sm"
              title="Mark all boys as attended"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCheck size={16} color="var(--color-success)" />
              <span>Mark All Attended</span>
            </button>

            <button
              type="button"
              onClick={onOpenQRScanner}
              className="btn btn-primary"
              style={{
                boxShadow: 'var(--shadow-md)',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#16a34a',
                borderColor: '#16a34a',
              }}
            >
              <QrCode size={18} />
              <span>Scan Passport for Mal3ab</span>
            </button>
          </div>
        </div>

        {/* Stats Row: Attendance & Match Participation */}
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
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>1. MAL3AB ATTENDED (حضور الملعب)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>
              {attendedCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({attendedPercent}%)</span>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: '#fffbeb',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #fde68a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309' }}>
              <Trophy size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>2. MATCH & SPORTSMANSHIP (الماتش والروح الرياضية)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#b45309', marginTop: '0.25rem' }}>
              {matchCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({matchPercent}%)</span>
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

      {/* Students List for Thursday Mal3ab */}
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
            const isMatchPlayed = record?.matchPlayed ?? false;
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

                {/* Two Action Toggles: 1. Mal3ab Attendance, 2. Match Played */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Toggle 1: Attended Mal3ab */}
                  <button
                    type="button"
                    onClick={() => onToggleRecord(student.id, 'attended', !isAttended)}
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
                    <span>حضور الملعب</span>
                  </button>

                  {/* Toggle 2: Match Played / Sportsmanship */}
                  <button
                    type="button"
                    onClick={() => onToggleRecord(student.id, 'matchPlayed', !isMatchPlayed)}
                    className="btn btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      border: isMatchPlayed ? '1px solid #fde68a' : '1px solid var(--border-medium)',
                      backgroundColor: isMatchPlayed ? '#fffbeb' : 'transparent',
                      color: isMatchPlayed ? '#b45309' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Trophy size={16} color={isMatchPlayed ? '#b45309' : 'var(--text-muted)'} />
                    <span>الماتش والروح الرياضية</span>
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
