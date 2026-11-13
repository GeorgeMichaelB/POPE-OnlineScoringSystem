import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Trophy,
  Crown,
  Flame,
  Shield,
  Star,
  Cross,
  Sparkles,
  BookOpen,
  Heart,
  Zap,
  Award,
  Gem,
  Compass,
  Sun,
  Moon,
  Target,
  Anchor,
  Feather,
  Bell,
  Key,
  Sword,
  Music,
  Eye,
  Flag,
  CheckCircle2,
  Filter,
  Image as ImageIcon,
} from 'lucide-react';
import type { BadgeDefinition, BadgeTier, BadgeCategory } from '../types';
import {
  ALL_1000_BADGES,
  TIER_STYLES,
  CATEGORY_LABELS,
  searchBadges,
} from '../services/badgesEngine';
import { ImageUploadInput } from './ImageUploadInput';

interface BadgePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBadge: (badge: BadgeDefinition) => void;
  selectedBadgeId?: string;
  title?: string;
  defaultCategory?: BadgeCategory;
}

// Icon helper renderer
export const renderBadgeIcon = (iconName: string, size = 20, color = 'currentColor') => {
  switch (iconName) {
    case 'Crown':
      return <Crown size={size} color={color} />;
    case 'Flame':
      return <Flame size={size} color={color} />;
    case 'Shield':
      return <Shield size={size} color={color} />;
    case 'Star':
      return <Star size={size} color={color} />;
    case 'Cross':
      return <Cross size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    case 'BookOpen':
      return <BookOpen size={size} color={color} />;
    case 'Heart':
      return <Heart size={size} color={color} />;
    case 'Zap':
      return <Zap size={size} color={color} />;
    case 'Award':
      return <Award size={size} color={color} />;
    case 'Gem':
      return <Gem size={size} color={color} />;
    case 'Compass':
      return <Compass size={size} color={color} />;
    case 'Sun':
      return <Sun size={size} color={color} />;
    case 'Moon':
      return <Moon size={size} color={color} />;
    case 'Target':
      return <Target size={size} color={color} />;
    case 'Anchor':
      return <Anchor size={size} color={color} />;
    case 'Feather':
      return <Feather size={size} color={color} />;
    case 'Bell':
      return <Bell size={size} color={color} />;
    case 'Key':
      return <Key size={size} color={color} />;
    case 'Sword':
      return <Sword size={size} color={color} />;
    case 'Music':
      return <Music size={size} color={color} />;
    case 'Eye':
      return <Eye size={size} color={color} />;
    case 'Flag':
      return <Flag size={size} color={color} />;
    case 'CheckCircle2':
      return <CheckCircle2 size={size} color={color} />;
    default:
      return <Trophy size={size} color={color} />;
  }
};

// Render badge icon or custom image
export const renderBadgeIconOrImage = (
  badge: { icon?: string; imageUrl?: string; textColor?: string; name?: string },
  size = 22,
  defaultColor = 'currentColor'
) => {
  if (badge.imageUrl) {
    return (
      <img
        src={badge.imageUrl}
        alt={badge.name || 'Badge'}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          borderRadius: '50%',
        }}
      />
    );
  }
  return renderBadgeIcon(badge.icon || 'Award', size, badge.textColor || defaultColor);
};

export const BadgePickerModal: React.FC<BadgePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectBadge,
  selectedBadgeId,
  title = 'اختر وساماً من مكتبة الأوسمة الكبرى (١٠٠٠+ وسام)',
  defaultCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory || 'all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 48;

  // Custom badge state
  const [customName, setCustomName] = useState('');
  const [customNameEn, setCustomNameEn] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customTier, setCustomTier] = useState<BadgeTier>('gold');
  const [customCategory, setCustomCategory] = useState<BadgeCategory>('special');

  // Filter badges
  const filteredBadges = useMemo(() => {
    return searchBadges(searchTerm, selectedCategory, selectedTier);
  }, [searchTerm, selectedCategory, selectedTier]);

  const paginatedBadges = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBadges.slice(start, start + pageSize);
  }, [filteredBadges, page]);

  const totalPages = Math.ceil(filteredBadges.length / pageSize);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div
        className="modal-container badge-picker-modal"
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Trophy size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {title}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                اختر من ١٠٠٠ وسام أو ارفع صورة وسامك الخاص
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon"
            style={{ color: '#94a3b8', background: '#1e293b', borderRadius: '8px', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: Library vs Custom Badge with Image */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1e293b',
            background: '#090d16',
            padding: '0 1.5rem',
            gap: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            style={{
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'library' ? '#38bdf8' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'library' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Trophy size={16} />
            <span>مكتبة الألف وسام ({ALL_1000_BADGES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'custom' ? '#fbbf24' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'custom' ? '2.5px solid #fbbf24' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <ImageIcon size={16} />
            <span>رفع وسام بصورة مخصصة 🖼️</span>
          </button>
        </div>

        {activeTab === 'custom' ? (
          /* Custom Image Badge Designer */
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '0.9rem 1.25rem',
                color: '#fbbf24',
                fontSize: '0.84rem',
                lineHeight: 1.5,
              }}
            >
              🌟 <b>ميزة حصرية:</b> يمكنك رفع أي صورة أو أيقونة من جهازك لتكون وساماً مخصصاً لهذا العنصر، وتحديد رتبته ولونه!
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <ImageUploadInput
                  label="صورة الوسام المخصص *"
                  value={customImageUrl}
                  onChange={(img) => setCustomImageUrl(img)}
                  aspectRatio="square"
                  helperText="ارفع صورة الأيقونة أو الشعار (مربعة أو دائرية)"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    اسم الوسام (بالعربي) *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: بطل مسابقة داود النبي"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '0.65rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    اسم الوسام (بالإنجليزي)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. David The Champion"
                    value={customNameEn}
                    onChange={(e) => setCustomNameEn(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '0.65rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    رتبة الوسام ولونه
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(Object.keys(TIER_STYLES) as BadgeTier[]).map((tierKey) => {
                      const style = TIER_STYLES[tierKey];
                      const active = customTier === tierKey;
                      return (
                        <button
                          key={tierKey}
                          type="button"
                          onClick={() => setCustomTier(tierKey)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: active ? style.bgGradient : '#1e293b',
                            color: active ? '#ffffff' : '#94a3b8',
                            border: active ? `1.5px solid ${style.borderColor}` : '1px solid #334155',
                            boxShadow: active ? `0 0 10px ${style.glowColor}` : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {style.labelAr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    تصنيف الوسام
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as BadgeCategory)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '0.65rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="special">شرفي خاص (Special)</option>
                    <option value="spiritual">روحي كنسي (Spiritual)</option>
                    <option value="mazamer">مزامير وتسميع (Mazamer)</option>
                    <option value="challenge">تحديات أسبوعية (Challenge)</option>
                    <option value="quiz">مسابقات وكويزات (Quiz)</option>
                    <option value="attendance">حضور والتزام (Attendance)</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={!customName.trim() || !customImageUrl}
                  onClick={() => {
                    const customBadge: BadgeDefinition = {
                      id: `custom_badge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      name: customName.trim(),
                      nameEn: customNameEn.trim() || customName.trim(),
                      description: 'وسام مخصص تم تصميمه بصورة مخصصة',
                      category: customCategory,
                      tier: customTier,
                      icon: 'Award',
                      imageUrl: customImageUrl,
                      bgGradient: TIER_STYLES[customTier].bgGradient,
                      borderColor: TIER_STYLES[customTier].borderColor,
                      textColor: TIER_STYLES[customTier].textColor,
                      rarityScore: customTier === 'legendary' ? 100 : customTier === 'diamond' ? 85 : 60,
                    };
                    onSelectBadge(customBadge);
                  }}
                  style={{
                    marginTop: '0.5rem',
                    background: customName.trim() && customImageUrl ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#334155',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: customName.trim() && customImageUrl ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: customName.trim() && customImageUrl ? '0 4px 15px rgba(245, 158, 11, 0.35)' : 'none',
                  }}
                >
                  <Check size={18} />
                  <span>اعتماد الوسام المخصص واختياره</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search & Filters */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#0b1120',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              color="#94a3b8"
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="ابحث بالاسم العربي، الإنجليزي، الرمز أو التصنيف... (مثلاً: فارس، تاج، ذهبي، مزمور)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 2.5rem 0.65rem 1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Pills (Tier & Category) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {/* Tiers */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTier('all');
                  setPage(1);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: selectedTier === 'all' ? '#3b82f6' : '#1e293b',
                  color: selectedTier === 'all' ? '#fff' : '#94a3b8',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                كل الرتب ({filteredBadges.length})
              </button>
              {(Object.keys(TIER_STYLES) as BadgeTier[]).map((tierKey) => {
                const style = TIER_STYLES[tierKey];
                const active = selectedTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tierKey);
                      setPage(1);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: active ? style.bgGradient : '#1e293b',
                      color: active ? '#ffffff' : '#94a3b8',
                      border: active ? `1px solid ${style.borderColor}` : '1px solid #334155',
                      boxShadow: active ? `0 0 10px ${style.glowColor}` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {style.labelAr}
                  </button>
                );
              })}
            </div>

            {/* Category Select */}
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} color="#94a3b8" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
              >
                <option value="all">كافة التصنيفات</option>
                {Object.entries(CATEGORY_LABELS).map(([catKey, labels]) => (
                  <option key={catKey} value={catKey}>
                    {labels.ar} ({labels.en})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '0.85rem',
            alignContent: 'start',
            minHeight: '340px',
          }}
        >
          {paginatedBadges.map((badge) => {
            const isSelected = selectedBadgeId === badge.id;
            const tierStyle = TIER_STYLES[badge.tier];

            return (
              <div
                key={badge.id}
                onClick={() => onSelectBadge(badge)}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#1e293b',
                  border: isSelected
                    ? '2px solid #38bdf8'
                    : `1px solid ${tierStyle.borderColor}40`,
                  borderRadius: '12px',
                  padding: '0.85rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  boxShadow: isSelected
                    ? '0 0 16px rgba(56, 189, 248, 0.5)'
                    : '0 2px 4px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 14px ${tierStyle.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSelected
                    ? '0 0 16px rgba(56, 189, 248, 0.5)'
                    : '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                {/* Selected Checkmark */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: '#38bdf8',
                      color: '#0f172a',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}

                {/* Badge Emblem */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: badge.bgGradient,
                    border: `2px solid ${badge.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${tierStyle.glowColor}`,
                    marginBottom: '0.55rem',
                    overflow: 'hidden',
                  }}
                >
                  {badge.imageUrl ? (
                    <img
                      src={badge.imageUrl}
                      alt={badge.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    renderBadgeIcon(badge.icon, 22, badge.textColor)
                  )}
                </div>

                {/* Badge Name */}
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    lineHeight: 1.25,
                    marginBottom: '0.2rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={badge.name}
                >
                  {badge.name}
                </span>

                {/* Tier & Category Pill */}
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

          {filteredBadges.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#94a3b8',
              }}
            >
              <Trophy size={40} color="#475569" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>لم نجد أوسمة مطابقة لبحثك</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>جرب البحث بكلمة أخرى أو مسح الفلاتر</p>
            </div>
          )}
        </div>

        {/* Modal Footer with Pagination */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: '#0b1120',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            عرض {paginatedBadges.length} من أصل {filteredBadges.length} وسام
          </span>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-sm"
                style={{
                  background: '#1e293b',
                  color: page <= 1 ? '#475569' : '#f8fafc',
                  border: '1px solid #334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                السابق
              </button>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-sm"
                style={{
                  background: '#1e293b',
                  color: page >= totalPages ? '#475569' : '#f8fafc',
                  border: '1px solid #334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                التالي
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-secondary"
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            إغلاق
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};
