import React, { useState, useMemo } from 'react';
import {
  Award,
  Lock,
} from 'lucide-react';
import type { StudentBadge, Student } from '../../types';
import {
  ALL_1000_BADGES,
  TIER_STYLES,
} from '../../services/badgesEngine';
import { renderBadgeIcon, renderBadgeIconOrImage } from '../BadgePickerModal';

interface BoyBadgesViewProps {
  student: Student;
  studentBadges: StudentBadge[];
}

export const BoyBadgesView: React.FC<BoyBadgesViewProps> = ({
  student,
  studentBadges,
}) => {
  const [selectedBadgeToInspect, setSelectedBadgeToInspect] = useState<StudentBadge | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'unlocked' | 'locked_explorer'>('unlocked');

  // Filter badges for this student
  const myBadges = useMemo(() => {
    return studentBadges.filter((b) => b.studentId === student.id);
  }, [studentBadges, student.id]);

  // Counts by tier
  const goldCount = myBadges.filter((b) => b.badgeTier === 'gold').length;
  const silverCount = myBadges.filter((b) => b.badgeTier === 'silver').length;
  const bronzeCount = myBadges.filter((b) => b.badgeTier === 'bronze').length;
  const eliteCount = myBadges.filter((b) => b.badgeTier === 'platinum' || b.badgeTier === 'diamond' || b.badgeTier === 'legendary').length;

  const filteredMyBadges = useMemo(() => {
    if (activeCategoryFilter === 'all') return myBadges;
    return myBadges.filter((b) => b.category === activeCategoryFilter);
  }, [myBadges, activeCategoryFilter]);

  // Locked Explorer (badges not yet earned)
  const earnedBadgeIds = useMemo(() => new Set(myBadges.map((b) => b.badgeId)), [myBadges]);
  const lockedSampleBadges = useMemo(() => {
    return ALL_1000_BADGES.filter((b) => !earnedBadgeIds.has(b.id)).slice(0, 36);
  }, [earnedBadgeIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Trophy Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(236, 72, 153, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(236, 72, 153, 0.5)',
            }}
          >
            <Award size={30} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc' }}>
              خزانة الأوسمة والجوائز الشرفية
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              كل مزمور تحفظه أو تحدي تنجزه ينضم إلى أوسمتك هنا لتفخر بها! 🎖️
            </p>
          </div>
        </div>

        {/* Tier Stats Counter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid #eab308',
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#fde047',
            }}
          >
            🥇 {goldCount} ذهبي
          </div>
          <div
            style={{
              background: 'rgba(203, 213, 225, 0.15)',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#f8fafc',
            }}
          >
            🥈 {silverCount} فضي
          </div>
          <div
            style={{
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid #d97706',
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#fcd34d',
            }}
          >
            🥉 {bronzeCount} برونزي
          </div>
          {eliteCount > 0 && (
            <div
              style={{
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid #ec4899',
                borderRadius: '10px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#f472b6',
              }}
            >
              💎 {eliteCount} أسطوري/ماسي
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Unlocked vs Locked Explorer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('unlocked')}
            style={{
              background: activeTab === 'unlocked' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              border: activeTab === 'unlocked' ? '1px solid #ec4899' : '1px solid transparent',
              color: activeTab === 'unlocked' ? '#f472b6' : '#94a3b8',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            أوسمتي المحققة ({myBadges.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('locked_explorer')}
            style={{
              background: activeTab === 'locked_explorer' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: activeTab === 'locked_explorer' ? '1px solid #38bdf8' : '1px solid transparent',
              color: activeTab === 'locked_explorer' ? '#38bdf8' : '#94a3b8',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            استكشاف الأوسمة المغلقة (١٠٠٠+ وسام)
          </button>
        </div>

        {activeTab === 'unlocked' && (
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {['all', 'mazamer', 'challenge', 'quiz', 'spiritual', 'attendance'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                style={{
                  background: activeCategoryFilter === cat ? '#334155' : 'transparent',
                  color: activeCategoryFilter === cat ? '#f8fafc' : '#94a3b8',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat === 'all' ? 'الكل' : cat === 'mazamer' ? 'المزامير' : cat === 'challenge' ? 'التحديات' : cat === 'quiz' ? 'الكويزات' : cat === 'spiritual' ? 'روحيات' : 'حضور'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: My Badges Grid */}
      {activeTab === 'unlocked' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
          {filteredMyBadges.map((badge) => {
            const tierStyle = TIER_STYLES[badge.badgeTier || 'gold'];

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadgeToInspect(badge)}
                style={{
                  background: '#1e293b',
                  border: `1px solid ${tierStyle.borderColor}60`,
                  borderRadius: '16px',
                  padding: '1rem 0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px rgba(0, 0, 0, 0.3), 0 0 10px ${tierStyle.glowColor}`,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${tierStyle.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.3), 0 0 10px ${tierStyle.glowColor}`;
                }}
              >
                {/* Emblem */}
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    background: tierStyle.bgGradient,
                    border: `2px solid ${tierStyle.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 15px ${tierStyle.glowColor}`,
                    marginBottom: '0.65rem',
                  }}
                >
                  {renderBadgeIconOrImage(badge, 26, tierStyle.textColor)}
                </div>

                {/* Badge Name */}
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#f8fafc',
                    lineHeight: 1.25,
                    marginBottom: '0.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={badge.badgeName}
                >
                  {badge.badgeName}
                </span>

                {/* Tier Pill */}
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: tierStyle.borderColor,
                    background: `${tierStyle.borderColor}15`,
                    padding: '1px 6px',
                    borderRadius: '999px',
                  }}
                >
                  {tierStyle.labelAr}
                </span>
              </div>
            );
          })}

          {filteredMyBadges.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                background: '#1e293b',
                borderRadius: '16px',
                border: '1px solid #334155',
                color: '#94a3b8',
              }}
            >
              <Award size={40} color="#475569" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>لم تفز بأوسمة في هذا التصنيف بعد</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>ابدأ بحفظ مزمور في صفحة المزامير أو حل المسابقات لتربح أوسمتك الأولى!</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Locked Badges Explorer */}
      {activeTab === 'locked_explorer' && (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
            عينة من أوسمة الفصل التي تنتظرك لتفتحها عند إتمام المزامير والتحديات والمشاركات الكنسية! 🔒
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
            {lockedSampleBadges.map((badge) => {
              const tierStyle = TIER_STYLES[badge.tier];

              return (
                <div
                  key={badge.id}
                  style={{
                    background: '#0b1120',
                    border: '1px dashed #334155',
                    borderRadius: '16px',
                    padding: '1rem 0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    opacity: 0.75,
                    position: 'relative',
                  }}
                >
                  {/* Lock Indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      color: '#64748b',
                    }}
                  >
                    <Lock size={12} />
                  </div>

                  {/* Emblem */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      marginBottom: '0.65rem',
                    }}
                  >
                    {renderBadgeIcon(badge.icon, 22, '#64748b')}
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      lineHeight: 1.25,
                      marginBottom: '0.25rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {badge.name}
                  </span>

                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: '#64748b',
                    }}
                  >
                    {tierStyle.labelAr} (مغلق)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inspect Badge Modal */}
      {selectedBadgeToInspect && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: '440px',
              width: '95%',
              background: '#0f172a',
              border: `2px solid ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].borderColor}`,
              borderRadius: '24px',
              padding: '2rem 1.5rem',
              color: '#f8fafc',
              textAlign: 'center',
              boxShadow: `0 0 35px ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].glowColor}`,
            }}
          >
            {/* Big 3D Badge Emblem */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '22px',
                background: TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].bgGradient,
                border: `3px solid ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].borderColor}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 30px ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].glowColor}`,
                marginBottom: '1.25rem',
              }}
            >
              {renderBadgeIconOrImage(selectedBadgeToInspect, 40, TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].textColor)}
            </div>

            <div
              style={{
                display: 'inline-block',
                background: `${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].borderColor}20`,
                border: `1px solid ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].borderColor}`,
                color: TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].borderColor,
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
              }}
            >
              وسام {TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].labelAr}
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc' }}>
              {selectedBadgeToInspect.badgeName}
            </h3>

            {/* Award Reason */}
            <div
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                color: '#cbd5e1',
                lineHeight: 1.6,
              }}
            >
              <b>سبب المنح:</b> {selectedBadgeToInspect.reason || 'التميز في أنشطة وخدمات الفصل'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
              <span>تاريخ الإنجاز: {new Date(selectedBadgeToInspect.awardedAt).toLocaleDateString('ar-EG')}</span>
              {selectedBadgeToInspect.pointsAwarded && (
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                  +{selectedBadgeToInspect.pointsAwarded} نقطة
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadgeToInspect(null)}
              style={{
                width: '100%',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 800,
                padding: '0.65rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
              }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
