import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Plus,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import type { Student, CustomEvent } from '../types';
import { getTodayDateString, formatFriendlyDate } from '../utils/helpers';

interface CustomEventsViewProps {
  students: Student[];
  events: CustomEvent[];
  onSaveEvent: (event: CustomEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleAttendance: (eventId: string, studentId: string) => void;
  onOpenQRScanner: () => void;
  onSelectStudent: (student: Student) => void;
  lastScannedStudent: Student | null;
  selectedEventId: string | null;
  onSelectEventId: (id: string) => void;
}

export const CustomEventsView: React.FC<CustomEventsViewProps> = ({
  students,
  events,
  onSaveEvent,
  onDeleteEvent,
  onToggleAttendance,
  onOpenQRScanner,
  onSelectStudent,
  lastScannedStudent,
  selectedEventId,
  onSelectEventId,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar state for events
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Form states for creating event
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  // Map events by date
  const eventsByDate = new Map<string, CustomEvent[]>();
  events.forEach((ev) => {
    const list = eventsByDate.get(ev.date) || [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  });

  // Currently active event
  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvent: CustomEvent = {
      id: `event-${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      location: newLocation.trim(),
      description: newDescription.trim(),
      attendeeIds: [],
      createdAt: new Date().toISOString(),
    };

    onSaveEvent(newEvent);
    onSelectEventId(newEvent.id);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
  };

  const openCreateForDate = (dateStr: string) => {
    setNewDate(dateStr);
    setIsCreateModalOpen(true);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const attendeeCount = activeEvent ? activeEvent.attendeeIds.length : 0;
  const totalStudents = students.length;
  const attendeePercent = totalStudents > 0 ? Math.round((attendeeCount / totalStudents) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Events & Trips Calendar (المناسبات والرحلات)</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Full calendar for planning trips, retreats, and spiritual days for Pope Saweros class.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {activeEvent && (
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="btn btn-secondary"
              title="Scan passport QR to check in for selected event"
            >
              <QrCode size={16} /> Scan QR for Event
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setNewDate(getTodayDateString());
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add New Event
          </button>
        </div>
      </div>

      {/* FULL CALENDAR VIEW FOR EVENTS */}
      <div className="card">
        {/* Calendar Navigation */}
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
              onClick={() => setCalendarDate(new Date())}
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

        {/* Weekday Names */}
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

        {/* Days Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
          }}
        >
          {/* Empty Offset Days */}
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

          {/* Real Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = eventsByDate.get(dateStr) || [];
            const isToday = dateStr === getTodayDateString();

            return (
              <div
                key={dateStr}
                onClick={() => openCreateForDate(dateStr)}
                style={{
                  minHeight: '76px',
                  padding: '4px 6px',
                  background: isToday ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-card)',
                  border: isToday ? '2px solid var(--color-accent)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  cursor: 'pointer',
                }}
                title={`Click to add event on ${dateStr}`}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--color-accent)' : 'var(--text-secondary)',
                  }}
                >
                  {dayNum}
                </div>

                {/* Event Chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  {dayEvents.map((ev) => {
                    const isSelected = activeEvent?.id === ev.id;
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEventId(ev.id);
                        }}
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 4px',
                          borderRadius: '3px',
                          background: isSelected ? 'var(--color-primary)' : '#ede9fe',
                          color: isSelected ? 'white' : '#6d28d9',
                          border: isSelected ? 'none' : '1px solid #ddd6fe',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event Details & Attendance Panel */}
      {activeEvent ? (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{activeEvent.title}</h3>
                <span className="badge badge-neutral">{formatFriendlyDate(activeEvent.date)}</span>
              </div>
              {activeEvent.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '4px' }}>
                  <MapPin size={13} /> {activeEvent.location}
                </div>
              )}
              {activeEvent.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {activeEvent.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-success)' }}>
                  ATTENDING BOYS
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)' }}>
                  {attendeeCount} / {totalStudents}{' '}
                  <span style={{ fontSize: '0.85rem' }}>({attendeePercent}%)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteEvent(activeEvent.id)}
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444' }}
                title="Delete Event"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Just Scanned Banner */}
          {lastScannedStudent && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--color-success)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>✓ {lastScannedStudent.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  recorded for {activeEvent.title}
                </span>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: 360, marginBottom: '1rem' }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search boys for this event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Event Attendees Checklist */}
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              <span>BOY NAME ({filteredStudents.length})</span>
              <span>EVENT ATTENDANCE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredStudents.map((student) => {
                const isAttending = activeEvent.attendeeIds.includes(student.id);

                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-light)',
                      background: isAttending ? 'rgba(236, 253, 245, 0.4)' : 'transparent',
                    }}
                  >
                    <div
                      onClick={() => onSelectStudent(student)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'var(--bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {student.id} • {student.school || 'Pope Saweros Class'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleAttendance(activeEvent.id, student.id)}
                      className={`btn btn-sm ${isAttending ? 'badge-success' : 'btn-secondary'}`}
                      style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                      }}
                    >
                      {isAttending ? (
                        <>
                          <CheckCircle2 size={14} /> Attended
                        </>
                      ) : (
                        <>
                          <XCircle size={14} color="var(--text-muted)" /> Absent
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Info size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No events scheduled yet.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Click on any day in the calendar above or click "Add New Event" to schedule.
          </p>
          <button
            type="button"
            onClick={() => {
              setNewDate(getTodayDateString());
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '1rem' }}
          >
            <Plus size={14} /> Create Event
          </button>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Church Event / Trip</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Event Title (اسم المناسبة أو الرحلة) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Mina Monastery Spiritual Trip"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Date (التاريخ) *</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location (المكان)</label>
                    <input
                      type="text"
                      placeholder="e.g. Maryut / Church Hall"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Schedule (البرنامج والملاحظات)</label>
                  <textarea
                    rows={3}
                    placeholder="Liturgy time, meeting point, competition details, servant instructions..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
