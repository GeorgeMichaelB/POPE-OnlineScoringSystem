import React, { useState } from 'react';
import {
  BookOpen,
  QrCode,
  Search,
  Flame,
  Users
} from 'lucide-react';
import type { Student, DarsKtabRecord } from '../types';
import { getSaturdaysList, getNearestSaturdayDateString } from '../utils/helpers';
import { WeekdayPicker } from './WeekdayPicker';

interface DarsKtabViewProps {
  students: Student[];
  records: DarsKtabRecord[];
  onToggleRecord: (studentId: string, type: 'ashya' | 'darsKtab', value: boolean) => void;
  onOpenQRScanner: () => void;
  onSelectStudent: (student: Student) => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  lastScannedStudent: Student | null;
}

export const DarsKtabView: React.FC<DarsKtabViewProps> = ({
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

  // Records for currently selected Saturday
  const dateRecords = records.filter((r) => r.date === selectedDate);
  const recordsMap = new Map<string, DarsKtabRecord>();
  dateRecords.forEach((r) => recordsMap.set(r.studentId, r));

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

  const totalStudents = students.length;
  const ashyaCount = dateRecords.filter((r) => r.ashya).length;
  const darsKtabCount = dateRecords.filter((r) => r.darsKtab).length;
  const ashyaPercent = totalStudents > 0 ? Math.round((ashyaCount / totalStudents) * 100) : 0;
  const darsKtabPercent = totalStudents > 0 ? Math.round((darsKtabCount / totalStudents) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Saturday Session, Stats & QR Scan */}
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
          {/* WeekdayPicker - Saturdays Only */}
          <WeekdayPicker
            label="SATURDAY SESSION (عشية ودرس كتاب السبت)"
            selectedDate={selectedDate}
            availableDates={getSaturdaysList()}
            onChangeDate={onChangeDate}
            currentDefaultDate={getNearestSaturdayDateString()}
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
            <span>Scan Passport for Dars Ktab</span>
          </button>
        </div>

        {/* Stats Row: Ashya & Dars Ktab */}
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
              {totalStudents} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>kids</span>
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
              <Flame size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>1. ASHYA (العشية)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
              {ashyaCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({ashyaPercent}%)</span>
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
              <BookOpen size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>2. DARS KTAB (درس الكتاب)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.25rem' }}>
              {darsKtabCount} / {totalStudents}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>({darsKtabPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Just Scanned Banner */}
      {lastScannedStudent && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--color-accent)',
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
                background: '#eff6ff',
                color: '#2563eb',
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
                Dars Ktab & Ashya check-in for {selectedDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectStudent(lastScannedStudent)}
            className="btn btn-secondary btn-sm"
          >
            View Dossier
          </button>
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

      {/* Roster with Split Sections: Ashya + Dars Ktab */}
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
            SATURDAY ROSTER ({filteredStudents.length})
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Track Ashya (عشية) & Dars Ktab (درس كتاب) separately
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No students found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredStudents.map((student) => {
              const record = recordsMap.get(student.id);
              const isAshyaPresent = record?.ashya ?? false;
              const isDarsKtabPresent = record?.darsKtab ?? false;

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
                    background:
                      isDarsKtabPresent && isAshyaPresent
                        ? 'rgba(239, 246, 255, 0.4)'
                        : isDarsKtabPresent || isAshyaPresent
                        ? 'rgba(255, 251, 235, 0.3)'
                        : 'transparent',
                  }}
                >
                  {/* Student Info */}
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
                        {student.school || 'Pope Saweros Class'}
                        {student.boyPhone ? ` • 📱 ${student.boyPhone}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Dual Action: Ashya & Dars Ktab Toggles */}
                  <div className="roster-card-actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {/* Ashya Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleRecord(student.id, 'ashya', !isAshyaPresent)}
                      className={`btn btn-sm ${isAshyaPresent ? 'badge-warning' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                      }}
                      title="Toggle Ashya (Vespers) Attendance"
                    >
                      <Flame size={14} />
                      <span>{isAshyaPresent ? 'Ashya: Attended' : 'Ashya: Absent'}</span>
                    </button>

                    {/* Dars Ktab Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleRecord(student.id, 'darsKtab', !isDarsKtabPresent)}
                      className={`btn btn-sm ${
                        isDarsKtabPresent
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        background: isDarsKtabPresent ? '#2563eb' : undefined,
                        borderColor: isDarsKtabPresent ? '#1d4ed8' : undefined,
                      }}
                      title="Toggle Dars Ktab (Bible Study) Attendance"
                    >
                      <BookOpen size={14} />
                      <span>{isDarsKtabPresent ? 'Dars: Attended' : 'Dars: Absent'}</span>
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
