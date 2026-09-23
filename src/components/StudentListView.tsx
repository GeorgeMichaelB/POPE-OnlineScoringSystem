import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  MessageCircle,
  Play,
  Heart,
  AlertTriangle,
  QrCode,
  FileText,
  Trophy,
  Church,
  CheckCircle2,
  Clock
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
  PointSettings,
  VisitRecord
} from '../types';
import { DEFAULT_POINT_SETTINGS } from '../services/db';
import {
  calculateAge,
  calculateAttendanceStats,
  calculateStudentScore,
  getStudentVisits,
  getCurrentMonthString
} from '../utils/helpers';

interface StudentListViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  darsKtab?: DarsKtabRecord[];
  mal3ab?: Mal3abRecord[];
  summerClub?: SummerClubRecord[];
  confessions?: ConfessionRecord[];
  customEvents?: CustomEvent[];
  customPoints?: CustomPointEntry[];
  pointSettings?: PointSettings;
  visits: VisitRecord[];
  onSelectStudent: (student: Student) => void;
  onAddNewStudent: () => void;
  onScanNewPassport: () => void;
  onStartVisit: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  attendance,
  darsKtab = [],
  mal3ab = [],
  summerClub = [],
  confessions = [],
  customEvents = [],
  customPoints = [],
  pointSettings = DEFAULT_POINT_SETTINGS,
  visits,
  onSelectStudent,
  onAddNewStudent,
  onScanNewPassport,
  onStartVisit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriestFilter, setSelectedPriestFilter] = useState('ALL');

  const currentMonth = getCurrentMonthString();
  const uniquePriests = Array.from(
    new Set(students.map((s) => s.confessionFather).filter(Boolean) as string[])
  );

  const q = searchQuery.toLowerCase().trim();
  const filteredStudents = students.filter((s) => {
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.arabicName && s.arabicName.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q) ||
      (s.series && s.series.toLowerCase().includes(q)) ||
      s.school.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      Boolean(s.isDeacon && ('شماس'.includes(q) || 'deacon'.includes(q))) ||
      Boolean(s.confessionFather && s.confessionFather.toLowerCase().includes(q));

    const matchesPriest =
      selectedPriestFilter === 'ALL' || s.confessionFather === selectedPriestFilter;

    return matchesQuery && matchesPriest;
  });

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    return `https://wa.me/${intlPhone}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sunday School Boys Roster</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Pope Saweros Class (Grade 4) • Total registered boys: {students.length}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onScanNewPassport}
            className="btn btn-secondary"
            title="Scan a new passport QR code to register a boy"
          >
            <QrCode size={16} /> Scan New Passport
          </button>

          <button
            type="button"
            onClick={onAddNewStudent}
            className="btn btn-primary"
          >
            <UserPlus size={16} /> Add Boy
          </button>
        </div>
      </div>

      {/* Search & Priest Filter Bar */}
      <div className="student-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360, minWidth: 220 }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by English/Arabic name, ID, series, father..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>

        {uniquePriests.length > 0 && (
          <select
            value={selectedPriestFilter}
            onChange={(e) => setSelectedPriestFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: 170, fontSize: '0.85rem' }}
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

      {/* Grid of Student Cards */}
      {filteredStudents.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No students found matching your criteria.
        </div>
      ) : (
        <div
          className="student-list-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '1rem',
          }}
        >
          {filteredStudents.map((student) => {
            const age = calculateAge(student.dob);
            const stats = calculateAttendanceStats(student.id, attendance, darsKtab, customEvents, mal3ab, summerClub, confessions);
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
            const thisMonthConfession = confessions.find((c) => c.studentId === student.id && c.month === currentMonth);
            const visitsInfo = getStudentVisits(student.id, visits);

            return (
              <div
                key={student.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  padding: '1.15rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => onSelectStudent(student)}
              >
                {/* Header: Photo, Name, Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-full)',
                        objectFit: 'cover',
                        border: '1px solid var(--border-medium)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.15rem',
                        flexShrink: 0,
                      }}
                    >
                      {student.name.charAt(0)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                      <h4
                        style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {student.name}
                        {student.arabicName && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '6px' }}>
                            ({student.arabicName})
                          </span>
                        )}
                      </h4>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {student.id}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Pope Saweros Class • {age > 0 ? `${age} yrs` : 'Age N/A'}
                    </p>

                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {student.school || student.address || 'Cairo'}
                    </p>
                  </div>
                </div>

                {/* Score & Tags Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                  {/* Live Total Score Pill */}
                  <span
                    className="badge"
                    style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    <Trophy size={12} /> {scoreData.totalScore} Points
                  </span>

                  {student.isDeacon && (
                    <span
                      className="badge"
                      style={{
                        background: '#ede9fe',
                        color: '#6d28d9',
                        border: '1px solid #ddd6fe',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      ✝️ شماس
                    </span>
                  )}

                  {student.loveLanguage && (
                    <span
                      className="badge"
                      style={{
                        background: '#fdf2f8',
                        color: '#db2777',
                        border: '1px solid #fbcfe8',
                        fontSize: '0.7rem',
                      }}
                    >
                      <Heart size={11} /> {student.loveLanguage}
                    </span>
                  )}

                  {visitsInfo.needsEftekad && (
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                      <AlertTriangle size={11} /> Needs Visit
                    </span>
                  )}
                </div>

                {/* Confession Father & Monthly Schedule Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    background: '#fdf4ff',
                    border: '1px solid #f0abfc',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#86198f', fontWeight: 700 }}>
                    <Church size={13} color="#a21caf" />
                    <span>أب الاعتراف: {student.confessionFather || 'لم يحدد'}</span>
                  </div>

                  {thisMonthConfession?.attended ? (
                    <span
                      style={{
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <CheckCircle2 size={12} /> تم الاعتراف{pointSettings.confessionEnabled !== false ? ` (+${pointSettings.confessionPoints ?? 20}p)` : ''}
                    </span>
                  ) : (
                    <span
                      style={{
                        color: '#a21caf',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Clock size={12} /> ميعاده: {student.confessionMonthlyDay ? `يوم ${student.confessionMonthlyDay}` : 'يوم 15'}
                    </span>
                  )}
                </div>

                {/* Attendance Mini Bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    background: 'var(--bg-subtle)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Friday Class</span>
                    <strong style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>
                      {stats.sundaySchoolPercent}%
                    </strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      ({stats.sundaySchoolPresent}/{stats.totalSessions})
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Odas / Liturgy</span>
                    <strong style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>
                      {stats.odasPercent}%
                    </strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      ({stats.odasPresent}/{stats.totalSessions})
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  className="student-card-footer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-light)',
                    gap: '0.5rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {student.boyPhone && (
                      <a
                        href={`tel:${student.boyPhone}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.5rem', textDecoration: 'none', background: '#eff6ff', borderColor: '#bfdbfe' }}
                        title={`Call Boy: ${student.boyPhone}`}
                      >
                        <Phone size={13} color="#2563eb" />
                      </a>
                    )}
                    {student.boyPhone && (
                      <a
                        href={getWhatsAppLink(student.boyPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.5rem', textDecoration: 'none', color: '#16a34a', background: '#f0fdf4' }}
                        title="WhatsApp Boy"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}
                    {student.dadPhone && (
                      <a
                        href={`tel:${student.dadPhone}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.5rem', textDecoration: 'none' }}
                        title={`Call Dad: ${student.dadPhone}`}
                      >
                        <Phone size={13} />
                      </a>
                    )}
                    {student.dadPhone && (
                      <a
                        href={getWhatsAppLink(student.dadPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.5rem', textDecoration: 'none', color: '#16a34a' }}
                        title="WhatsApp Dad"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => onStartVisit(student)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                      title="Start live home visit session"
                    >
                      <Play size={12} /> Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectStudent(student)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <FileText size={12} /> Dossier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
