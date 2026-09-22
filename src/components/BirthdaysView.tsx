import React, { useState } from 'react';
import {
  Cake,
  Bell,
  Calendar,
  MessageCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Gift,
  Filter
} from 'lucide-react';
import type { Student } from '../types';
import {
  getUpcomingBirthdays,
  getUrgentBirthdayAlerts,
  formatFriendlyDate
} from '../utils/helpers';

interface BirthdaysViewProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onRequestNotificationPermission?: () => void;
  notificationPermission?: NotificationPermission;
}

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({
  students,
  onSelectStudent,
  onRequestNotificationPermission,
  notificationPermission,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'urgent' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allUpcoming = getUpcomingBirthdays(students);
  const urgentAlerts = getUrgentBirthdayAlerts(students);

  // Birthdays in current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const thisMonthBirthdays = allUpcoming.filter((b) => {
    return b.nextBirthdayDate.getMonth() === currentMonth;
  });

  const q = searchQuery.toLowerCase().trim();
  const filteredBirthdays = allUpcoming.filter((info) => {
    const matchesSearch =
      !q ||
      info.student.name.toLowerCase().includes(q) ||
      (info.student.arabicName && info.student.arabicName.toLowerCase().includes(q)) ||
      info.student.id.toLowerCase().includes(q) ||
      (info.student.series && info.student.series.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterMode === 'urgent') return info.isUrgent3Days;
    if (filterMode === 'month') return info.nextBirthdayDate.getMonth() === currentMonth;
    return true;
  });

  const getWhatsAppLink = (phone: string, student: Student, turningAge: number) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const formattedPhone = clean.startsWith('0') ? `2${clean}` : clean;
    const displayName = student.arabicName ? `${student.arabicName} (${student.name})` : student.name;
    const message = `سلام ومحبة من كنيسة ربنا وفصل البابا ساويرس! ✝️\nبنهني بطلنا الجميل ${displayName} بمناسبة عيد ميلاده الـ ${turningAge}! 🎉🎂\nكل سنة وهو طيب ومفرح قلوبكم وقلب ربنا، وسنة مباركة جديدة في حضن الكنيسة! ✨🙏`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Stats & 3-Day Urgent Notifications */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#ffe4e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e11d48',
              }}
            >
              <Cake size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                Birthdays & 3-Day Advance Alerts (أعياد الميلاد)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Automated 3-day notification system & pastoral greetings for Pope Saweros boys
              </p>
            </div>
          </div>

          {/* Browser Notification Button */}
          {onRequestNotificationPermission && (
            <button
              type="button"
              onClick={onRequestNotificationPermission}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                borderColor: notificationPermission === 'granted' ? '#a7f3d0' : undefined,
                backgroundColor: notificationPermission === 'granted' ? '#ecfdf5' : undefined,
                color: notificationPermission === 'granted' ? '#047857' : undefined,
              }}
            >
              <Bell size={16} />
              <span>
                {notificationPermission === 'granted'
                  ? 'Desktop Alerts Active (مفعل)'
                  : 'Enable Desktop 3-Day Alerts'}
              </span>
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              padding: '0.85rem',
              background: urgentAlerts.length > 0 ? '#fff1f2' : 'var(--bg-subtle)',
              border: urgentAlerts.length > 0 ? '1px solid #fecdd3' : 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: urgentAlerts.length > 0 ? '#e11d48' : 'var(--text-muted)',
              }}
            >
              <AlertTriangle size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>3-DAY ALERTS (تنبيه 3 أيام)</span>
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: urgentAlerts.length > 0 ? '#be123c' : 'var(--text-primary)',
                marginTop: '0.2rem',
              }}
            >
              {urgentAlerts.length}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {urgentAlerts.length === 1 ? 'boy soon' : 'boys soon'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: '#fdf4ff',
              border: '1px solid #f5d0fe',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c026d3' }}>
              <Calendar size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>THIS MONTH (هذا الشهر)</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c026d3', marginTop: '0.2rem' }}>
              {thisMonthBirthdays.length}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                birthdays
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Gift size={15} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>TOTAL ROSTER</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {students.length}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                kids
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent 3-Day Alerts Banner Section */}
      {urgentAlerts.length > 0 && (
        <div
          style={{
            backgroundColor: '#fff1f2',
            border: '2px solid #fda4af',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#e11d48" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#9f1239' }}>
              🎉 Urgent Birthday Reminders (Next 3 Days):
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {urgentAlerts.map((item) => {
              const countdownText =
                item.daysUntil === 0
                  ? '🎂 TODAY! (اليوم)'
                  : item.daysUntil === 1
                  ? '⏰ TOMORROW! (غدًا)'
                  : `⏰ IN ${item.daysUntil} DAYS! (خلال ${item.daysUntil} أيام)`;

              return (
                <div
                  key={item.student.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fecdd3',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#ffe4e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#e11d48',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {item.student.photoUrl ? (
                        <img
                          src={item.student.photoUrl}
                          alt={item.student.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        item.student.name
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: '#be123c',
                          color: '#ffffff',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {countdownText}
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        onClick={() => onSelectStudent(item.student)}
                      >
                        {item.student.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Turning <strong>{item.turningAge}</strong> on{' '}
                        {formatFriendlyDate(item.nextBirthdayDateString)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Contact Buttons */}
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {item.student.dadPhone && (
                      <a
                        href={getWhatsAppLink(item.student.dadPhone, item.student, item.turningAge)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#22c55e',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp Dad</span>
                      </a>
                    )}

                    {item.student.momPhone && (
                      <a
                        href={getWhatsAppLink(item.student.momPhone, item.student, item.turningAge)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp Mom</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
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
          <input
            type="text"
            placeholder="Search boys by English or Arabic name, ID, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Year ({allUpcoming.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('urgent')}
            className={`btn btn-sm ${filterMode === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              backgroundColor: filterMode === 'urgent' ? '#e11d48' : undefined,
              borderColor: filterMode === 'urgent' ? '#e11d48' : undefined,
            }}
          >
            3-Day Alerts ({urgentAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('month')}
            className={`btn btn-sm ${filterMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            This Month ({thisMonthBirthdays.length})
          </button>
        </div>
      </div>

      {/* Full Upcoming Birthdays List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredBirthdays.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No birthdays found matching your filter.</p>
          </div>
        ) : (
          filteredBirthdays.map((item) => {
            const isAlert = item.isUrgent3Days;

            return (
              <div
                key={item.student.id}
                className="card"
                style={{
                  padding: '0.9rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderLeft: isAlert ? '4px solid #e11d48' : '4px solid var(--border-medium)',
                  backgroundColor: isAlert ? 'rgba(225, 29, 72, 0.03)' : 'var(--bg-card)',
                }}
              >
                {/* Boy Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    minWidth: '220px',
                  }}
                  onClick={() => onSelectStudent(item.student)}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isAlert ? '#ffe4e6' : 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: isAlert ? '#e11d48' : 'var(--text-secondary)',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {item.student.photoUrl ? (
                      <img
                        src={item.student.photoUrl}
                        alt={item.student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      item.student.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.student.name}</span>
                      {item.student.arabicName && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          ({item.student.arabicName})
                        </span>
                      )}
                      {isAlert && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px',
                            backgroundColor: '#ffe4e6',
                            color: '#be123c',
                            border: '1px solid #fecdd3',
                          }}
                        >
                          {item.daysUntil === 0 ? 'TODAY! 🎂' : `${item.daysUntil}d away!`}
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
                      <span>DOB: {item.dob}</span>
                      <span>• Turning {item.turningAge} yrs</span>
                      <span>• Next: {formatFriendlyDate(item.nextBirthdayDateString)}</span>
                    </div>
                  </div>
                </div>

                {/* Countdown & Quick Action Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isAlert ? '#fff1f2' : 'var(--bg-subtle)',
                      border: `1px solid ${isAlert ? '#fecdd3' : 'var(--border-light)'}`,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isAlert ? '#be123c' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Clock size={14} />
                    <span>
                      {item.daysUntil === 0 ? 'Today 🎉' : `In ${item.daysUntil} days`}
                    </span>
                  </div>

                  {/* WhatsApp Dad Button */}
                  {item.student.dadPhone && (
                    <a
                      href={getWhatsAppLink(item.student.dadPhone, item.student, item.turningAge)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.78rem',
                        color: '#16a34a',
                      }}
                      title="Send WhatsApp Birthday Greeting to Dad"
                    >
                      <MessageCircle size={14} />
                      <span>Dad</span>
                    </a>
                  )}

                  {/* WhatsApp Mom Button */}
                  {item.student.momPhone && (
                    <a
                      href={getWhatsAppLink(item.student.momPhone, item.student, item.turningAge)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.78rem',
                        color: '#2563eb',
                      }}
                      title="Send WhatsApp Birthday Greeting to Mom"
                    >
                      <MessageCircle size={14} />
                      <span>Mom</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
