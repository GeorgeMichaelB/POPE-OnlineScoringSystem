import React, { useState } from 'react';
import {
  Megaphone,
  Pin,
  Calendar,
  Trophy,
  BookOpen,
  ShoppingBag,
  Flame,
  Award,
} from 'lucide-react';
import type { Announcement, Student } from '../../types';

interface BoyAnnouncementsViewProps {
  student: Student;
  announcements: Announcement[];
  score: number;
  hideScores: boolean;
  activePsalmsCount: number;
  activeChallengesCount: number;
  badgesCount: number;
  onNavigateTab: (tab: string) => void;
}

export const BoyAnnouncementsView: React.FC<BoyAnnouncementsViewProps> = ({
  student,
  announcements,
  score,
  hideScores,
  activePsalmsCount,
  activeChallengesCount,
  badgesCount,
  onNavigateTab,
}) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Sort announcements: pinned first, then newest
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#0f172a',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)',
              }}
            >
              {(student.arabicName || student.name).charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                <span
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #f59e0b',
                    color: '#fbbf24',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  بطل أسرة البابا ساويرس ⚡
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {student.id}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc' }}>
                أهلاً بك يا {student.arabicName || student.name}!
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>
                جاهز لجمع أوسمة جديدة ونقاط اليوم؟
              </p>
            </div>
          </div>

          {/* Quick Score Pill */}
          <div
            onClick={() => onNavigateTab('score')}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '14px',
              padding: '0.65rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Trophy size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                رصيدك الحالي
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24' }}>
                {hideScores ? '🔒 سرّي' : `${score} نقطة`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <button
            type="button"
            onClick={() => onNavigateTab('mzamer')}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '0.55rem 0.75rem',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={16} color="#38bdf8" />
            <span>المزامير ({activePsalmsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('challenges')}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '10px',
              padding: '0.55rem 0.75rem',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <Flame size={16} color="#eab308" />
            <span>التحديات ({activeChallengesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('badges')}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              borderRadius: '10px',
              padding: '0.55rem 0.75rem',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <Award size={16} color="#ec4899" />
            <span>أوسمتي ({badgesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('shop')}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              padding: '0.55rem 0.75rem',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <ShoppingBag size={16} color="#10b981" />
            <span>المتجر والجوائز</span>
          </button>
        </div>
      </div>

      {/* Announcements Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <Megaphone size={18} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            لوحة الإعلانات والتنبيهات (للأبطال وأولياء الأمور)
          </h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          {announcements.length} إعلان
        </span>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedAnnouncements.map((ann) => {
          const isUrgent = ann.priority === 'urgent';
          const isCelebration = ann.priority === 'celebration';

          return (
            <div
              key={ann.id}
              style={{
                background: ann.isPinned
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : '#1e293b',
                border: ann.isPinned
                  ? '1px solid #38bdf8'
                  : isUrgent
                  ? '1px solid #ef4444'
                  : '1px solid #334155',
                borderRadius: '16px',
                padding: '1.25rem 1.4rem',
                boxShadow: ann.isPinned ? '0 4px 15px rgba(56, 189, 248, 0.15)' : 'none',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ann.isPinned && (
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Pin size={11} />
                      مثبت
                    </span>
                  )}

                  {isUrgent && (
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#f87171',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      تنبيه عاجل ⚠️
                    </span>
                  )}

                  {isCelebration && (
                    <span
                      style={{
                        background: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid #eab308',
                        color: '#fde047',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      احتفال وتشجيع 🌟
                    </span>
                  )}

                  <span
                    style={{
                      background: 'rgba(148, 163, 184, 0.1)',
                      color: '#94a3b8',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    {ann.targetAudience === 'boys' ? 'خاص بالمخدومين' : ann.targetAudience === 'parents' ? 'خاص بأولياء الأمور' : 'عام للجميع'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.72rem' }}>
                  <Calendar size={12} />
                  <span>{new Date(ann.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.4 }}>
                {ann.title}
              </h4>

              {/* Uploaded Announcement Image */}
              {ann.imageUrl && (
                <div
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '0.85rem',
                    maxHeight: '260px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#090d16',
                    cursor: 'pointer',
                  }}
                  onClick={() => setLightboxImage(ann.imageUrl!)}
                  title="اضغط للتكبير"
                >
                  <img
                    src={ann.imageUrl}
                    alt={ann.title}
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  color: '#cbd5e1',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {ann.content}
              </p>

              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.75rem', color: '#64748b' }}>
                <span>بواسطة: {ann.authorServant}</span>
              </div>
            </div>
          );
        })}

        {sortedAnnouncements.length === 0 && (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              color: '#94a3b8',
            }}
          >
            <Megaphone size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>لا توجد إعلانات حالياً</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>ترقبوا إعلانات الخدام والأنشطة القادمة!</p>
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          style={{ zIndex: 11000, background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Announcement Expanded"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block', borderRadius: '16px' }}
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: '1rem',
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
