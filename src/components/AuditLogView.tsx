import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Trash2,
  Download,
  User,
  Clock,
  Trophy,
  Crown,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  KeyRound,
  Flame,
  Sun
} from 'lucide-react';
import type { AuditLogEntry, LogCategory } from '../types';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
  adminUsername: string;
}

const CATEGORY_CONFIG: Record<
  LogCategory,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  auth: {
    label: 'Authentication (تسجيل ودخول)',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    icon: <KeyRound size={15} color="#3b82f6" />,
  },
  attendance: {
    label: 'Attendance (حضور وغياب)',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <CalendarCheck size={15} color="#059669" />,
  },
  mal3ab: {
    label: 'Mal3ab (الملعب والرياضة)',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
    icon: <Flame size={15} color="#16a34a" />,
  },
  summer_club: {
    label: 'Summer Club (النادي الصيفي)',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.12)',
    icon: <Sun size={15} color="#ea580c" />,
  },
  scoring: {
    label: 'Scoring & Points (نقاط وتشجيع)',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    icon: <Trophy size={15} color="#d97706" />,
  },
  heroes: {
    label: 'Class Heroes (أبطال الفصل)',
    color: '#9333ea',
    bg: 'rgba(147, 51, 234, 0.12)',
    icon: <Crown size={15} color="#9333ea" />,
  },
  events: {
    label: 'Events & Trips (أنشطة ورحلات)',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.12)',
    icon: <Sparkles size={15} color="#0284c7" />,
  },
  visits: {
    label: 'Visits & Eftekad (افتقاد)',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.12)',
    icon: <CalendarDays size={15} color="#e11d48" />,
  },
  students: {
    label: 'Student Profiles (بيانات الأولاد)',
    color: '#475569',
    bg: 'rgba(71, 85, 105, 0.12)',
    icon: <User size={15} color="#475569" />,
  },
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  onClearLogs,
  adminUsername,
}) => {
  const [selectedServant, setSelectedServant] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Extract unique servants from logs
  const servantList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.username));
    return Array.from(set);
  }, [logs]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: logs.length,
      auth: logs.filter((l) => l.category === 'auth').length,
      attendance: logs.filter((l) => l.category === 'attendance').length,
      scoring: logs.filter((l) => l.category === 'scoring').length,
      heroes: logs.filter((l) => l.category === 'heroes').length,
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Servant filter
      if (selectedServant !== 'all' && log.username.toLowerCase() !== selectedServant.toLowerCase()) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }
      // Date filter
      if (dateFilter && !log.timestamp.startsWith(dateFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.details.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.servantName.toLowerCase().includes(q) ||
          log.username.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, selectedServant, selectedCategory, dateFilter, searchQuery]);

  // Export logs to JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pope_saweros_audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: iso, time: '' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(37, 99, 235, 0.12)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Activity Audit Log (سجل العمليات والأنشطة)
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(217, 119, 6, 0.15)',
                  color: '#b45309',
                  fontWeight: 700,
                }}
              >
                ADMIN ONLY • {adminUsername}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Real-time chronological record of all servant actions: attendance, scoring, heroes, and visits.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleExportJSON}
            className="btn btn-secondary btn-sm"
            title="Export Full Audit Log to JSON"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={15} /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear the audit activity log history?')) {
                onClearLogs();
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Clear all log entries"
          >
            <Trash2 size={15} /> Clear Log
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            TOTAL ACTIONS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {stats.total}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ATTENDANCE CHECKS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
            {stats.attendance}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            POINTS AWARDED
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>
            {stats.scoring}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #9333ea' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            HEROES CROWNED
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9333ea', marginTop: '0.2rem' }}>
            {stats.heroes}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            AUTH & LOGINS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>
            {stats.auth}
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action or servant..."
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Servant Filter */}
        <div style={{ minWidth: '150px' }}>
          <select
            value={selectedServant}
            onChange={(e) => setSelectedServant(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Servants (كل الخدام)</option>
            {servantList.map((usr) => (
              <option key={usr} value={usr}>
                {usr}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Categories (جميع الأقسام)</option>
            <option value="attendance">Friday & Saturday Attendance</option>
            <option value="scoring">Scoring & Custom Points</option>
            <option value="heroes">Class Heroes Spotlight</option>
            <option value="auth">Authentication & Logins</option>
            <option value="visits">Visits / Eftekad</option>
            <option value="events">Custom Events</option>
            <option value="students">Student Roster</option>
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ minWidth: '140px' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-main)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {(selectedServant !== 'all' || selectedCategory !== 'all' || searchQuery || dateFilter) && (
          <button
            type="button"
            onClick={() => {
              setSelectedServant('all');
              setSelectedCategory('all');
              setSearchQuery('');
              setDateFilter('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Log Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredLogs.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <Clock size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No activity records found matching your filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeInfo = formatTimestamp(log.timestamp);
            const cfg = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.students;

            return (
              <div
                key={log.id}
                className="card"
                style={{
                  padding: '0.9rem 1.15rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Left Icon + Servant + Details */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: cfg.bg,
                      color: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {cfg.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {log.servantName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.username}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          background: cfg.bg,
                          color: cfg.color,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.action}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.86rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {log.details}
                    </p>
                  </div>
                </div>

                {/* Right Timestamp */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '95px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {timeInfo.time}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {timeInfo.date}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
