import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Trophy,
  Crown,
  Flame,
  Star,
  Cross,
  Shield,
  Award,
  Sparkles,
  UserCheck
} from 'lucide-react';
import type { Student, ClassHero, HeroBadgeIcon } from '../types';
import { getTodayDateString } from '../utils/helpers';

interface HeroManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  heroes: ClassHero[];
  onSaveHero: (hero: ClassHero) => void;
  onDeleteHero: (id: string) => void;
  servantName: string;
}

const PRESET_TITLES = [
  'بطل المذبح والألحان (Altar & Hymns Champion)',
  'بطل مسابقة الإنجيل (Bible Master)',
  'بطل الأسبوع الروحي (Spiritual Hero of the Week)',
  'بطل المحبة ومساعدة أصحابه (Brotherhood & Kindness Hero)',
  'بطل حفظ الأجبية والمزامير (Agpeya Prayer Star)',
  'بطل الالتزام والتفوق (Excellence & Commitment Hero)',
];

const BADGE_OPTIONS: { type: HeroBadgeIcon; label: string; icon: React.ReactNode }[] = [
  { type: 'crown', label: 'Crown (تاج)', icon: <Crown size={16} /> },
  { type: 'star', label: 'Star (نجم)', icon: <Star size={16} /> },
  { type: 'flame', label: 'Flame (شعلة)', icon: <Flame size={16} /> },
  { type: 'cross', label: 'Cross (صليب)', icon: <Cross size={16} /> },
  { type: 'shield', label: 'Shield (درع)', icon: <Shield size={16} /> },
  { type: 'trophy', label: 'Trophy (كأس)', icon: <Trophy size={16} /> },
];

export const HeroManageModal: React.FC<HeroManageModalProps> = ({
  isOpen,
  onClose,
  students,
  heroes,
  onSaveHero,
  onDeleteHero,
  servantName,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [customTitle, setCustomTitle] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<HeroBadgeIcon>('crown');
  const [awardedDate, setAwardedDate] = useState<string>(getTodayDateString());
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleAddHero = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg('Please select a student.');
      return;
    }
    if (!customTitle.trim()) {
      setErrorMsg('Please enter or select a hero title.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please write a short reason why this boy is a hero.');
      return;
    }

    const newHero: ClassHero = {
      id: `hero-${Date.now()}`,
      studentId: selectedStudentId,
      title: customTitle.trim(),
      reason: reason.trim(),
      badgeIcon: selectedBadge,
      awardedDate,
      servantName: servantName || 'Servant',
      createdAt: new Date().toISOString(),
    };

    onSaveHero(newHero);
    setCustomTitle('');
    setReason('');
    setErrorMsg('');
  };

  const getStudentName = (id: string) => {
    return students.find((s) => s.id === id)?.name || id;
  };

  const getStudentPhoto = (id: string) => {
    return students.find((s) => s.id === id)?.photoUrl;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '94%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-main)' }}>
                Manage Class Heroes (إدارة أبطال الفصل)
              </h2>
              <p style={{ fontSize: '0.78rem', margin: 0, color: 'var(--text-muted)' }}>
                Spotlight boys on the weekly board for any spiritual, behavioral, or academic achievement.
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Form to Add New Hero */}
          <form
            onSubmit={handleAddHero}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
              <Sparkles size={16} color="#d97706" /> Add a Class Hero (تتويج بطل جديد)
            </div>

            {errorMsg && (
              <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.82rem' }}>
                {errorMsg}
              </div>
            )}

            {/* Select Boy */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                Select Boy (اختر الولد)
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Hero Title Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                Hero Title / Badge (لقب البطل)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {PRESET_TITLES.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setCustomTitle(title)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: customTitle === title ? '1px solid #d97706' : '1px solid var(--border-color)',
                      background: customTitle === title ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-main)',
                      color: customTitle === title ? '#b45309' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Or type any custom title (e.g. بطل الألحان القبطية)..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                Why is he a Hero? (سبب التتويج والقصة الملهمة)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Describe what he accomplished (e.g. arrived early, helped his peers, memorized Psalm 50, served at the altar)..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Badge Icon & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  Hero Crest Icon (رمز الشارة)
                </label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {BADGE_OPTIONS.map((badge) => (
                    <button
                      key={badge.type}
                      type="button"
                      onClick={() => setSelectedBadge(badge.type)}
                      title={badge.label}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: selectedBadge === badge.type ? '2px solid #d97706' : '1px solid var(--border-color)',
                        background: selectedBadge === badge.type ? 'rgba(217, 119, 6, 0.15)' : 'var(--bg-main)',
                        color: selectedBadge === badge.type ? '#d97706' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {badge.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  Date (التاريخ)
                </label>
                <input
                  type="date"
                  value={awardedDate}
                  onChange={(e) => setAwardedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: '#d97706',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginTop: '0.3rem',
              }}
            >
              <Plus size={16} /> Add Hero to Weekly Board (تتويج البطل)
            </button>
          </form>

          {/* Current Active Heroes List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>
                Active Heroes of the Week ({heroes.length})
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Shown prominently at top of the boys' board
              </span>
            </div>

            {heroes.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No custom heroes spotlighted yet this week. The board will showcase the top leaderboard champions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {heroes.map((hero) => {
                  const studentName = getStudentName(hero.studentId);
                  const studentPhoto = getStudentPhoto(hero.studentId);
                  return (
                    <div
                      key={hero.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: '#1e293b',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(217, 119, 6, 0.4)',
                          }}
                        >
                          {studentPhoto ? (
                            <img
                              src={studentPhoto}
                              alt={studentName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <UserCheck size={20} color="#d97706" />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                              {studentName}
                            </strong>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#b45309',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              <Award size={12} /> {hero.title}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                            "{hero.reason}"
                          </p>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            By {hero.servantName} • {hero.awardedDate}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteHero(hero.id)}
                        title="Remove Hero"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: '6px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.85rem 1.25rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Done (إغلاق)
          </button>
        </div>
      </div>
    </div>
  );
};
