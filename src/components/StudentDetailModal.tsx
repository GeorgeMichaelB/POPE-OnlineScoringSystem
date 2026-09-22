import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit2,
  Trash2,
  Play,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Heart,
  ShieldAlert,
  Sparkles,
  FileText,
  Church,
  UserCheck,
  MapPin,
  School,
  BookOpen,
  Flame,
  Award,
  Trophy
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings,
  VisitRecord
} from '../types';
import {
  calculateAge,
  calculateAttendanceStats,
  calculateStudentScore,
  formatDuration,
  getStudentVisits,
} from '../utils/helpers';

interface StudentDetailModalProps {
  student: Student;
  attendance: AttendanceRecord[];
  darsKtab?: DarsKtabRecord[];
  customEvents?: CustomEvent[];
  customPoints?: CustomPointEntry[];
  pointSettings?: PointSettings;
  visits: VisitRecord[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onStartVisit: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  attendance,
  darsKtab = [],
  customEvents = [],
  customPoints = [],
  pointSettings = {
    fridayClassPoints: 10,
    odasPoints: 15,
    darsKtabPoints: 10,
    ashyaPoints: 5,
    customEventPoints: 20,
  },
  visits,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStartVisit,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'visits' | 'report'>('profile');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const age = calculateAge(student.dob);
  const attendanceStats = calculateAttendanceStats(student.id, attendance, darsKtab, customEvents);
  const scoreData = calculateStudentScore(
    student.id,
    attendance,
    darsKtab,
    customEvents,
    customPoints,
    pointSettings
  );
  const visitStats = getStudentVisits(student.id, visits);

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    return `https://wa.me/${intlPhone}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 800, maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Hidden in Print) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--border-medium)',
                }}
              />
            ) : (
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
                {student.name.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="modal-title">{student.name}</h3>
                <span className="badge badge-neutral">{student.id}</span>
                <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 }}>
                  <Trophy size={11} /> {scoreData.totalScore} pts
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Pope Saweros Class • {age > 0 ? `${age} years old` : 'Age unlisted'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              title="Print or Save PDF Report"
            >
              <Printer size={15} /> Print Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-subtle)',
            padding: '0 1rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            Profile & Pastoral Care
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'attendance' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'attendance' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            Attendance & Statistics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'visits' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'visits' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            Eftekad / Visits ({visitStats.completed.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'report' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'report' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            Full Report Preview
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* TAB 1: Profile & Pastoral Care */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick Actions Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {/* Boy's Direct Contact */}
                  {student.boyPhone && (
                    <a
                      href={`tel:${student.boyPhone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                    >
                      <Phone size={13} /> Call Boy ({student.boyPhone})
                    </a>
                  )}
                  {student.boyPhone && (
                    <a
                      href={getWhatsAppLink(student.boyPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none', color: '#16a34a', background: '#f0fdf4' }}
                    >
                      <MessageCircle size={13} /> WhatsApp Boy
                    </a>
                  )}

                  {/* Dad's Contact */}
                  {student.dadPhone && (
                    <a
                      href={`tel:${student.dadPhone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone size={13} /> Call Dad
                    </a>
                  )}
                  {student.dadPhone && (
                    <a
                      href={getWhatsAppLink(student.dadPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none', color: '#16a34a' }}
                    >
                      <MessageCircle size={13} /> WhatsApp Dad
                    </a>
                  )}

                  {/* Mom's Contact */}
                  {student.momPhone && (
                    <a
                      href={`tel:${student.momPhone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone size={13} /> Call Mom
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartVisit(student);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Play size={13} /> Start Home Visit
                </button>
              </div>

              {/* Personal & Family Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} /> DATE OF BIRTH
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                    {student.dob || 'Not specified'} {age > 0 ? `(${age} yrs)` : ''}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <School size={13} /> SCHOOL & GRADE
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                    {student.school || 'Not specified'}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={13} /> ADDRESS
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                    {student.address || 'Not specified'}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Heart size={13} color="var(--color-danger)" /> LOVE LANGUAGE
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-danger)', marginTop: '2px' }}>
                    {student.loveLanguage || 'Not determined'}
                  </div>
                </div>
              </div>

              {/* Pastoral Insights: Weak Points, Hobbies, Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--color-warning-border)',
                    background: 'var(--color-warning-bg)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                    <ShieldAlert size={15} /> Weak Points & Pastoral Follow-up (نقاط الضعف والمتابعة)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                    {student.weakPoints || 'None recorded.'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: '#1d4ed8' }}>
                    <Sparkles size={15} /> Hobbies, Interests & Talents (الهوايات والمواهب)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                    {student.hobbies || 'None recorded.'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <FileText size={15} /> General Servant Notes (ملاحظات الخدام)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    {student.notes || 'No notes added yet.'}
                  </p>
                </div>
              </div>

              {/* Edit / Delete actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <button
                  type="button"
                  onClick={() => onDelete(student.id)}
                  className="btn btn-sm btn-danger"
                >
                  <Trash2 size={13} /> Delete Student
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(student)}
                  className="btn btn-sm btn-secondary"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Attendance & Statistics */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Comprehensive Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {/* Friday Main Class */}
                <div
                  style={{
                    padding: '0.85rem',
                    background: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)' }}>
                    <UserCheck size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>FRIDAY CLASS</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                    {attendanceStats.sundaySchoolPercent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {attendanceStats.sundaySchoolPresent} of {attendanceStats.totalSessions} sessions
                  </div>
                </div>

                {/* Liturgy / Odas */}
                <div
                  style={{
                    padding: '0.85rem',
                    background: 'var(--color-warning-bg)',
                    border: '1px solid var(--color-warning-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)' }}>
                    <Church size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ODAS / LITURGY</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
                    {attendanceStats.odasPercent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {attendanceStats.odasPresent} of {attendanceStats.totalSessions} liturgies
                  </div>
                </div>

                {/* Saturday Dars Ktab */}
                <div
                  style={{
                    padding: '0.85rem',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8' }}>
                    <BookOpen size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>SATURDAY DARS KTAB</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
                    {attendanceStats.darsKtabPercent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {attendanceStats.darsKtabPresent} of {attendanceStats.totalSaturdaySessions} sessions
                  </div>
                </div>

                {/* Saturday Ashya */}
                <div
                  style={{
                    padding: '0.85rem',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309' }}>
                    <Flame size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>SATURDAY ASHYA</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
                    {attendanceStats.ashyaPercent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {attendanceStats.ashyaPresent} of {attendanceStats.totalSaturdaySessions} vespers
                  </div>
                </div>

                {/* Custom Events */}
                <div
                  style={{
                    padding: '0.85rem',
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6d28d9' }}>
                    <Award size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>EVENTS & TRIPS</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6d28d9', marginTop: '0.25rem' }}>
                    {attendanceStats.eventsPercent}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Attended {attendanceStats.eventsAttended} of {attendanceStats.totalCustomEvents} events
                  </div>
                </div>
              </div>

              {/* Attendance Log Table */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Friday Class Session Logs</h4>
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {attendance.filter((r) => r.studentId === student.id).length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No Friday attendance logged for this boy yet.
                    </div>
                  ) : (
                    attendance
                      .filter((r) => r.studentId === student.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 1rem',
                            borderBottom: '1px solid var(--border-light)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{rec.date} (Friday)</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className={`badge ${rec.sundaySchool ? 'badge-success' : 'badge-neutral'}`}>
                              Friday Class: {rec.sundaySchool ? 'Present' : 'Absent'}
                            </span>
                            <span className={`badge ${rec.odas ? 'badge-warning' : 'badge-neutral'}`}>
                              Odas: {rec.odas ? 'Attended' : 'Absent'}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Eftekad / Visits History */}
          {activeTab === 'visits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Pastoral Visits (الافتقاد)</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {visitStats.completed.length} completed visits recorded
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartVisit(student);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Play size={12} /> Start New Visit
                </button>
              </div>

              {visitStats.completed.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1rem',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No visits recorded for {student.name} yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartVisit(student);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem' }}
                  >
                    Start First Home Visit Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {visitStats.completed.map((visit) => (
                    <div
                      key={visit.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                          borderBottom: '1px solid var(--border-light)',
                          paddingBottom: '0.5rem',
                          marginBottom: '0.65rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Calendar size={14} color="var(--color-primary)" />
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {visit.scheduledDate} {visit.scheduledTime ? `(${visit.scheduledTime})` : ''}
                          </span>
                          <span className="badge badge-success">Completed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={13} />
                          <span>Duration: {formatDuration(visit.durationSeconds)}</span>
                          <span>• By {visit.servantName}</span>
                        </div>
                      </div>

                      {/* Visit Notes */}
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                        {visit.notes}
                      </p>

                      {/* Embedded Photos from Visit */}
                      {visit.photos && visit.photos.length > 0 && (
                        <div style={{ marginTop: '0.85rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Visit Photos ({visit.photos.length}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {visit.photos.map((p, pIdx) => (
                              <img
                                key={pIdx}
                                src={p}
                                alt="Visit"
                                onClick={() => setSelectedPhotoPreview(p)}
                                style={{
                                  width: 70,
                                  height: 70,
                                  borderRadius: 'var(--radius-sm)',
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  border: '1px solid var(--border-medium)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Official Printable Dossier / Report View */}
          {activeTab === 'report' && (
            <div className="report-sheet" style={{ background: '#ffffff', color: '#0f172a' }}>
              {/* Report Header */}
              <div
                style={{
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pope Saweros Sunday School
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                    Official Student Pastoral & Attendance Dossier (تقرير متابعة الطالب وافتقاد الخادم)
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>PASSPORT: {student.id}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Report Date: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Student Demographics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.65rem',
                  background: '#f8fafc',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <strong>Student Full Name:</strong> {student.name}
                </div>
                <div>
                  <strong>Class:</strong> Pope Saweros Class (Grade 4)
                </div>
                <div>
                  <strong>Date of Birth:</strong> {student.dob} ({age} years old)
                </div>
                <div>
                  <strong>School:</strong> {student.school || 'N/A'}
                </div>
                <div>
                  <strong>Home Address:</strong> {student.address || 'N/A'}
                </div>
                <div>
                  <strong>Boy's Phone:</strong> {student.boyPhone || 'N/A'}
                </div>
                <div>
                  <strong>Dad Phone:</strong> {student.dadPhone || 'N/A'}
                </div>
                <div>
                  <strong>Mom Phone:</strong> {student.momPhone || 'N/A'}
                </div>
              </div>

              {/* Total Score Banner in Report */}
              <div
                style={{
                  border: '1px solid #fde68a',
                  background: '#fefce8',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={20} color="#b45309" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e' }}>
                      TOTAL REWARD SCORE: {scoreData.totalScore} POINTS
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                      Friday: +{scoreData.fridayPoints} • Odas: +{scoreData.odasPoints} • Dars Ktab: +{scoreData.darsKtabPoints} • Ashya: +{scoreData.ashyaPoints} • Bonus: {scoreData.customPointsTotal >= 0 ? `+${scoreData.customPointsTotal}` : scoreData.customPointsTotal}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pastoral & Psychological Insights */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                <h4 style={{ fontWeight: 700, marginBottom: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                  Pastoral Insights & Personal Character
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem', marginTop: '0.45rem' }}>
                  <div>
                    <strong>Primary Love Language:</strong> {student.loveLanguage}
                  </div>
                  <div>
                    <strong>Hobbies & Talents:</strong> {student.hobbies || 'None recorded'}
                  </div>
                  <div>
                    <strong>Weak Points / Areas for Spiritual Guidance:</strong>{' '}
                    {student.weakPoints || 'None recorded'}
                  </div>
                  <div>
                    <strong>Servant Notes:</strong> {student.notes || 'None recorded'}
                  </div>
                </div>
              </div>

              {/* Attendance Analytics Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    border: '1px solid #10b981',
                    background: '#f0fdf4',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857' }}>
                    FRIDAY CLASS
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>
                    {attendanceStats.sundaySchoolPercent}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#047857' }}>
                    {attendanceStats.sundaySchoolPresent}/{attendanceStats.totalSessions}
                  </div>
                </div>

                <div
                  style={{
                    border: '1px solid #f59e0b',
                    background: '#fffbeb',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309' }}>
                    ODAS / LITURGY
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#92400e' }}>
                    {attendanceStats.odasPercent}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#b45309' }}>
                    {attendanceStats.odasPresent}/{attendanceStats.totalSessions}
                  </div>
                </div>

                <div
                  style={{
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8' }}>
                    DARS KTAB
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1d4ed8' }}>
                    {attendanceStats.darsKtabPercent}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#1d4ed8' }}>
                    {attendanceStats.darsKtabPresent}/{attendanceStats.totalSaturdaySessions}
                  </div>
                </div>

                <div
                  style={{
                    border: '1px solid #fde68a',
                    background: '#fef3c7',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309' }}>
                    ASHYA
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b45309' }}>
                    {attendanceStats.ashyaPercent}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#b45309' }}>
                    {attendanceStats.ashyaPresent}/{attendanceStats.totalSaturdaySessions}
                  </div>
                </div>
              </div>

              {/* Eftekad / Visits History Report */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.85rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                  Visits & Eftekad History ({visitStats.completed.length})
                </h4>

                {visitStats.completed.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No pastoral visits logged.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {visitStats.completed.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          background: '#f8fafc',
                          padding: '0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.825rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                          <span>Date: {v.scheduledDate} {v.scheduledTime ? `(${v.scheduledTime})` : ''}</span>
                          <span>Servant: {v.servantName} | Duration: {formatDuration(v.durationSeconds)}</span>
                        </div>
                        <p style={{ color: '#1e293b', whiteSpace: 'pre-line' }}>{v.notes}</p>
                        {v.photos && v.photos.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                            {v.photos.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="Visit"
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="modal-footer no-print">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-primary">
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Expanded Photo Preview Modal */}
      {selectedPhotoPreview && (
        <div
          className="modal-overlay"
          style={{ zIndex: 120 }}
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={selectedPhotoPreview}
              alt="Enlarged visit preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
              }}
            />
            <button
              type="button"
              onClick={() => setSelectedPhotoPreview(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
