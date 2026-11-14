import React, { useState, useMemo } from 'react';
import {
  Award,
  Lock,
  Layers,
} from 'lucide-react';
import type { StudentBadge, Student } from '../../types';
import {
  ALL_1000_BADGES,
  TIER_STYLES,
} from '../../services/badgesEngine';
import { renderBadgeIcon, renderBadgeIconOrImage } from '../BadgePickerModal';
import { sound } from '../../services/sound';
import './clashRoyale.css';

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
  const [activeTab, setActiveTab] = useState<'deck' | 'unlocked' | 'locked_explorer'>('deck');

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

  // The 8-Card Active Battle Deck (First 8 earned badges, or placeholders)
  const activeDeck = useMemo(() => {
    const deck = [...myBadges].slice(0, 8);
    const slots = [];
    for (let i = 0; i < 8; i++) {
      slots.push(deck[i] || null);
    }
    return slots;
  }, [myBadges]);

  // Helper for Elixir cost based on badge tier
  const getBadgeElixir = (tier: string = 'gold'): number => {
    switch (tier) {
      case 'bronze': return 2;
      case 'silver': return 3;
      case 'gold': return 5;
      case 'platinum': return 6;
      case 'diamond': return 7;
      case 'legendary': return 8;
      default: return 4;
    }
  };

  // Average Elixir Cost
  const avgElixir = useMemo(() => {
    const realCards = activeDeck.filter(Boolean);
    if (realCards.length === 0) return '0.0';
    const sum = realCards.reduce((acc, c) => acc + getBadgeElixir(c?.badgeTier), 0);
    return (sum / realCards.length).toFixed(1);
  }, [activeDeck]);

  const handleCardClick = (badge: StudentBadge | null) => {
    if (!badge) return;
    sound.playCardFlip();
    setSelectedBadgeToInspect(badge);
  };

  return (
    <div className="cr-portal" style={{ minHeight: 'auto', background: 'transparent', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Clash Royale Top Trophy & Deck Header */}
      <div
        className="cr-wood-frame"
        style={{
          padding: '1.25rem',
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
              background: 'linear-gradient(180deg, #ec4899 0%, #db2777 50%, #9d174d 100%)',
              border: '2px solid #fbcfe8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            }}
          >
            <Layers size={28} />
          </div>
          <div>
            <h2 className="cr-gold-title cr-text-shadow" style={{ margin: 0, fontSize: '1.35rem' }}>
              تشكيلة البطاقات وخزانة الأوسمة الملكية
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#fde68a', fontWeight: 600 }}>
              اختر أفضل ٨ بطاقات لمواجهة التحديات واعرض أوسمتك في الساحة! 🃏
            </p>
          </div>
        </div>

        {/* Tier Counter Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="cr-resource-pill">
            <span style={{ color: '#fde047' }}>🥇</span>
            <span>{goldCount} ذهبي</span>
          </span>
          <span className="cr-resource-pill">
            <span style={{ color: '#cbd5e1' }}>🥈</span>
            <span>{silverCount} فضي</span>
          </span>
          <span className="cr-resource-pill">
            <span style={{ color: '#f59e0b' }}>🥉</span>
            <span>{bronzeCount} برونزي</span>
          </span>
          {eliteCount > 0 && (
            <span className="cr-resource-pill" style={{ borderColor: '#ec4899' }}>
              <span style={{ color: '#f472b6' }}>💎</span>
              <span>{eliteCount} أسطوري</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs Switcher: Battle Deck vs Full Collection vs Locked Explorer */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '2px solid #334155', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            sound.playBattleClick();
            setActiveTab('deck');
          }}
          className={`cr-btn ${activeTab === 'deck' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
          style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
        >
          <Layers size={16} />
          <span>التشكيلة النشطة (Battle Deck)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playBattleClick();
            setActiveTab('unlocked');
          }}
          className={`cr-btn ${activeTab === 'unlocked' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
          style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
        >
          <Award size={16} />
          <span>جميع بطاقاتي ({myBadges.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playBattleClick();
            setActiveTab('locked_explorer');
          }}
          className={`cr-btn ${activeTab === 'locked_explorer' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
          style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
        >
          <Lock size={15} />
          <span>استكشاف الأوسمة المغلقة (١٠٠٠+)</span>
        </button>
      </div>

      {/* TAB 1: 8-Card Active Battle Deck (Clash Royale Signature) */}
      {activeTab === 'deck' && (
        <div className="cr-stone-panel" style={{ padding: '1.25rem' }}>
          {/* Deck Header Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="cr-gold-title cr-text-shadow" style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                ⚔️ تشكيلة المعركة (التشكيلة الملكية 1)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  background: 'linear-gradient(180deg, #ec4899 0%, #be185d 100%)',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>⚡ متوسط الإكسير:</span>
                <span style={{ fontSize: '0.9rem' }}>{avgElixir}</span>
              </div>
            </div>
          </div>

          {/* 4x2 Cards Grid (The Iconic 8-Card Clash Royale Deck) */}
          <div className="cr-deck-preview-grid">
            {activeDeck.map((badge, idx) => {
              if (!badge) {
                return (
                  <div
                    key={`empty_${idx}`}
                    style={{
                      aspectRatio: '0.72',
                      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                      border: '2px dashed #475569',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      padding: '0.5rem',
                      textAlign: 'center',
                    }}
                  >
                    <Lock size={18} style={{ marginBottom: '0.25rem' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>بطاقة فارغة {idx + 1}</span>
                  </div>
                );
              }

              const tierStyle = TIER_STYLES[badge.badgeTier || 'gold'];
              const elixir = getBadgeElixir(badge.badgeTier);
              const rarityClass =
                badge.badgeTier === 'legendary' || badge.badgeTier === 'diamond'
                  ? 'cr-card-legendary'
                  : badge.badgeTier === 'platinum' || badge.badgeTier === 'gold'
                  ? 'cr-card-epic'
                  : badge.badgeTier === 'silver'
                  ? 'cr-card-rare'
                  : 'cr-card-common';

              return (
                <div
                  key={badge.id}
                  onClick={() => handleCardClick(badge)}
                  className={`cr-card ${rarityClass}`}
                  title={`${badge.badgeName} - اضغط لمعاينة البطاقة`}
                >
                  {/* Elixir Drop */}
                  <div className="cr-card-elixir">
                    {elixir}
                  </div>

                  {/* Card Art / Icon */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: tierStyle.bgGradient,
                      border: `1.5px solid ${tierStyle.borderColor}`,
                      alignSelf: 'center',
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 10px ${tierStyle.glowColor}`,
                    }}
                  >
                    {renderBadgeIconOrImage(badge, 24, tierStyle.textColor)}
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      color: '#ffffff',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      textShadow: '0 1px 2px #000',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: '0.25rem 0',
                    }}
                  >
                    {badge.badgeName}
                  </div>

                  {/* Level Ribbon */}
                  <div className="cr-card-level-ribbon">
                    Lv. {elixir * 2}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            اضغط على أي بطاقة لعرض مواصفاتها الروحية، نقاطها، وتأثيرها في رصيدك! ✨
          </div>
        </div>
      )}

      {/* TAB 2: Full Card Collection */}
      {activeTab === 'unlocked' && (
        <div className="cr-stone-panel" style={{ padding: '1.25rem' }}>
          {/* Categories Pill Filters */}
          <div className="cr-subtabs-scroll" style={{ marginBottom: '1rem' }}>
            {['all', 'mazamer', 'challenge', 'quiz', 'spiritual', 'attendance'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sound.playBattleClick();
                  setActiveCategoryFilter(cat);
                }}
                className={`cr-btn ${activeCategoryFilter === cat ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {cat === 'all'
                  ? 'الكل 🌟'
                  : cat === 'mazamer'
                  ? 'مزامير 📜'
                  : cat === 'challenge'
                  ? 'تحديات ⚔️'
                  : cat === 'quiz'
                  ? 'كويزات ⚡'
                  : cat === 'spiritual'
                  ? 'روحيات ✝️'
                  : 'حضور 🏛️'}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="cr-cards-collection-grid">
            {filteredMyBadges.map((badge) => {
              const tierStyle = TIER_STYLES[badge.badgeTier || 'gold'];
              const elixir = getBadgeElixir(badge.badgeTier);
              const rarityClass =
                badge.badgeTier === 'legendary' || badge.badgeTier === 'diamond'
                  ? 'cr-card-legendary'
                  : badge.badgeTier === 'platinum' || badge.badgeTier === 'gold'
                  ? 'cr-card-epic'
                  : badge.badgeTier === 'silver'
                  ? 'cr-card-rare'
                  : 'cr-card-common';

              return (
                <div
                  key={badge.id}
                  onClick={() => handleCardClick(badge)}
                  className={`cr-card ${rarityClass}`}
                >
                  <div className="cr-card-elixir">{elixir}</div>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: tierStyle.bgGradient,
                      border: `1.5px solid ${tierStyle.borderColor}`,
                      alignSelf: 'center',
                      marginTop: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 10px ${tierStyle.glowColor}`,
                    }}
                  >
                    {renderBadgeIconOrImage(badge, 24, tierStyle.textColor)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      color: '#ffffff',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      textShadow: '0 1px 2px #000',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: '0.2rem 0',
                    }}
                  >
                    {badge.badgeName}
                  </div>
                  <div className="cr-card-level-ribbon">
                    Lv. {elixir * 2}
                  </div>
                </div>
              );
            })}

            {filteredMyBadges.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  background: '#0f172a',
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                }}
              >
                <Award size={40} color="#64748b" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ margin: '0 0 0.4rem', color: '#f8fafc' }}>لا توجد بطاقات في هذا التصنيف بعد!</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>احفظ مزموراً من المزامير أو حل المسابقات لكسب هذه البطاقة وإضافتها لتشكيلتك!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Locked Badges Explorer */}
      {activeTab === 'locked_explorer' && (
        <div className="cr-stone-panel" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
            عينة من ١٠٠٠+ بطاقة تنتظرك لفتحها عند إتمام المزامير والتحديات والمشاركات الكنسية! 🔒
          </div>

          <div className="cr-cards-collection-grid">
            {lockedSampleBadges.map((badge) => {
              return (
                <div
                  key={badge.id}
                  style={{
                    aspectRatio: '0.72',
                    background: '#090d16',
                    border: '2px dashed #334155',
                    borderRadius: '14px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.7,
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', top: '6px', left: '6px', color: '#64748b' }}>
                    <Lock size={13} />
                  </div>

                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      marginTop: '0.65rem',
                    }}
                  >
                    {renderBadgeIcon(badge.icon, 20, '#64748b')}
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textAlign: 'center',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {badge.name}
                  </span>

                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>
                    مغلق 🔒
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clash Royale Style Card Inspect Modal */}
      {selectedBadgeToInspect && (
        <div className="cr-modal-backdrop" onClick={() => setSelectedBadgeToInspect(null)}>
          <div
            className="cr-modal-card cr-wood-frame"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              width: '92%',
              padding: '1.75rem 1.25rem',
              textAlign: 'center',
            }}
          >
            {/* 3D Giant Card Preview */}
            <div
              style={{
                width: '130px',
                height: '175px',
                margin: '0 auto 1.25rem',
                borderRadius: '18px',
                background: TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].bgGradient,
                border: `3px solid ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].borderColor}`,
                boxShadow: `0 10px 25px rgba(0,0,0,0.8), 0 0 25px ${TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].glowColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div className="cr-card-elixir" style={{ top: 8, left: 8, width: 28, height: 32, fontSize: '0.85rem' }}>
                {getBadgeElixir(selectedBadgeToInspect.badgeTier)}
              </div>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {renderBadgeIconOrImage(selectedBadgeToInspect, 36, TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].textColor)}
              </div>
              <div className="cr-card-level-ribbon" style={{ position: 'absolute', bottom: 8, fontSize: '0.72rem' }}>
                Lv. {getBadgeElixir(selectedBadgeToInspect.badgeTier) * 2} • {TIER_STYLES[selectedBadgeToInspect.badgeTier || 'gold'].labelAr}
              </div>
            </div>

            <h3 className="cr-gold-title cr-text-shadow-heavy" style={{ margin: '0 0 0.5rem', fontSize: '1.35rem' }}>
              {selectedBadgeToInspect.badgeName}
            </h3>

            {/* Reason Box */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1.5px solid #334155',
                borderRadius: '14px',
                padding: '0.85rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                lineHeight: 1.5,
              }}
            >
              <b>القدرة والسبب:</b> {selectedBadgeToInspect.reason || 'التميز في مسابقات وخدمات الفصل'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#fde68a', marginBottom: '1.25rem', padding: '0 0.5rem', fontWeight: 700 }}>
              <span>تاريخ الفوز: {new Date(selectedBadgeToInspect.awardedAt).toLocaleDateString('ar-EG')}</span>
              {selectedBadgeToInspect.pointsAwarded && (
                <span>+{selectedBadgeToInspect.pointsAwarded} نقطة 🪙</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadgeToInspect(null)}
              className="cr-btn cr-btn-yellow"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              تم وموافق ⚔️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
