import React, { useState } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Church,
  UserCheck
} from 'lucide-react';
import type { Student, AttendanceRecord } from '../types';
import { getFridaysList, getNearestFridayDateString } from '../utils/helpers';
import { WeekdayPicker } from './WeekdayPicker';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onToggleAttendance: (studentId: string, type: 'sundaySchool' | 'odas', value: boolean) => void;
  onOpenQRScanner: () => void;
  onSelectStudent: (student: Student) => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  lastScannedStudent: Student | null;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  onToggleAttendance,
  onOpenQRScanner,
  onSelectStudent,
  selectedDate,
  onChangeDate,
  lastScannedStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

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

          {/* Rapid QR Scan Button */}
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
            border: '2px solid var(--color-success)',
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
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{lastScannedStudent.name}</span>
                <span className="badge badge-neutral">{lastScannedStudent.id}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {lastScannedStudent.category} • Checked in for {selectedDate}
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
                      flex: '1 1 220px',
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
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {/* Sunday School Attendance Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleAttendance(student.id, 'sundaySchool', !isSundaySchoolPresent)}
                      className={`btn btn-sm ${isSundaySchoolPresent ? 'badge-success' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        borderWidth: isSundaySchoolPresent ? '1px' : '1px',
                      }}
                      title="Toggle Sunday School attendance"
                    >
                      {isSundaySchoolPresent ? (
                        <>
                          <CheckCircle2 size={14} /> Sunday School: Attended
                        </>
                      ) : (
                        <>
                          <XCircle size={14} color="var(--text-muted)" /> Sunday School: Absent
                        </>
                      )}
                    </button>

                    {/* Odas / Liturgy Attendance Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleAttendance(student.id, 'odas', !isOdasPresent)}
                      className={`btn btn-sm ${isOdasPresent ? 'badge-warning' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                      }}
                      title="Toggle Liturgy / Communion attendance"
                    >
                      <Church size={14} />
                      <span>{isOdasPresent ? 'Odas: Attended' : 'Odas: Absent'}</span>
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
