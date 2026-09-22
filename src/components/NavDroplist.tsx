import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarCheck,
  BookOpen,
  Trophy,
  Sparkles,
  CalendarDays,
  Users,
  ShieldCheck,
  Crown,
  ChevronDown,
  Check,
  Flame,
  Sun,
  Cake
} from 'lucide-react';

export type AppView =
  | 'heroes'
  | 'attendance'
  | 'dars_ktab'
  | 'mal3ab'
  | 'summer_club'
  | 'events'
  | 'scoring'
  | 'visits'
  | 'students'
  | 'birthdays'
  | 'log';

interface NavDroplistProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  customEventsCount: number;
  studentsCount: number;
  auditLogsCount: number;
  birthdayAlertCount: number;
  isAdmin: boolean;
}

interface NavItem {
  id: AppView;
  labelEn: string;
  labelAr: string;
  badge?: string | number;
  badgeColor?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

interface NavGroup {
  groupNameEn: string;
  groupNameAr: string;
  items: NavItem[];
}

export const NavDroplist: React.FC<NavDroplistProps> = ({
  currentView,
  onChangeView,
  customEventsCount,
  studentsCount,
  auditLogsCount,
  birthdayAlertCount,
  isAdmin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const navGroups: NavGroup[] = [
    {
      groupNameEn: 'Weekly Church Sessions',
      groupNameAr: 'الخدمات والأنشطة الأسبوعية',
      items: [
        {
          id: 'attendance',
          labelEn: 'Friday Class & Liturgy',
          labelAr: 'خدمة الجمعة والقداس',
          badge: 'Fri',
          icon: <CalendarCheck size={16} color="#059669" />,
        },
        {
          id: 'dars_ktab',
          labelEn: 'Dars Ktab & Ashya',
          labelAr: 'عشية ودرس كتاب السبت',
          badge: 'Sat',
          icon: <BookOpen size={16} color="#2563eb" />,
        },
        {
          id: 'mal3ab',
          labelEn: 'Mal3ab (Sports & Pitch)',
          labelAr: 'الملعب والنشاط الرياضي',
          badge: 'Thu',
          badgeColor: '#16a34a',
          icon: <Flame size={16} color="#16a34a" />,
          highlight: true,
        },
        {
          id: 'summer_club',
          labelEn: 'Summer Club',
          labelAr: 'النادي الصيفي (يومين)',
          badge: '2 Days',
          badgeColor: '#ea580c',
          icon: <Sun size={16} color="#ea580c" />,
          highlight: true,
        },
      ],
    },
    {
      groupNameEn: 'Honors & Motivation',
      groupNameAr: 'لوحة الأبطال ونظام النقاط',
      items: [
        {
          id: 'heroes',
          labelEn: 'Hall of Champions',
          labelAr: 'لوحة الشرف والأبطال',
          badge: 'Live',
          badgeColor: '#d97706',
          icon: <Crown size={16} color="#d97706" />,
          highlight: true,
        },
        {
          id: 'scoring',
          labelEn: 'Scoring System',
          labelAr: 'نظام النقاط والمكافآت',
          icon: <Trophy size={16} color="#b45309" />,
        },
        {
          id: 'events',
          labelEn: 'Events & Trips',
          labelAr: 'الرحلات والمناسبات',
          badge: customEventsCount > 0 ? customEventsCount : undefined,
          icon: <Sparkles size={16} color="#7c3aed" />,
        },
      ],
    },
    {
      groupNameEn: 'Pastoral Care & Records',
      groupNameAr: 'الافتقاد والسجلات',
      items: [
        {
          id: 'birthdays',
          labelEn: 'Birthdays & Alerts',
          labelAr: 'أعياد الميلاد والتنبيهات',
          badge: birthdayAlertCount > 0 ? `${birthdayAlertCount} Soon!` : 'Calendar',
          badgeColor: birthdayAlertCount > 0 ? '#dc2626' : undefined,
          icon: <Cake size={16} color="#e11d48" />,
          highlight: birthdayAlertCount > 0,
        },
        {
          id: 'visits',
          labelEn: 'Eftekad & Home Visits',
          labelAr: 'الافتقاد وزيارات البيوت',
          icon: <CalendarDays size={16} color="#0d9488" />,
        },
        {
          id: 'students',
          labelEn: 'Boys Roster',
          labelAr: 'سجل مخدومي الفصل',
          badge: studentsCount,
          icon: <Users size={16} color="#475569" />,
        },
      ],
    },
  ];

  if (isAdmin) {
    navGroups.push({
      groupNameEn: 'Administration',
      groupNameAr: 'الإدارة وسجل النشاط',
      items: [
        {
          id: 'log',
          labelEn: 'Audit Log',
          labelAr: 'سجل النشاط والأمان',
          badge: auditLogsCount,
          icon: <ShieldCheck size={16} color="#2563eb" />,
        },
      ],
    });
  }

  // Find current item details
  const allItems = navGroups.flatMap((g) => g.items);
  const currentItem = allItems.find((i) => i.id === currentView) || allItems[0];

  const handleSelect = (view: AppView) => {
    onChangeView(view);
    setIsOpen(false);
  };

  return (
    <div className="nav-droplist-container" ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`nav-droplist-trigger ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Choose Section / تغيير الصفحة"
      >
        <div className="nav-droplist-current">
          <div className="nav-droplist-icon">{currentItem.icon}</div>
          <div className="nav-droplist-text">
            <span className="nav-droplist-title">{currentItem.labelEn}</span>
            <span className="nav-droplist-subtitle">{currentItem.labelAr}</span>
          </div>
          {currentItem.badge !== undefined && (
            <span
              className="nav-droplist-badge"
              style={{
                backgroundColor: currentItem.badgeColor ? `${currentItem.badgeColor}20` : 'var(--bg-subtle)',
                color: currentItem.badgeColor || 'var(--text-secondary)',
                borderColor: currentItem.badgeColor ? `${currentItem.badgeColor}40` : 'var(--border-light)',
              }}
            >
              {currentItem.badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className="nav-droplist-chevron"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="nav-droplist-menu" role="listbox">
          <div className="nav-droplist-menu-header">
            <span>Navigation Menu (اختر الصفحة)</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>10 Sections</span>
          </div>

          <div className="nav-droplist-menu-scroll">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="nav-droplist-group">
                <div className="nav-droplist-group-header">
                  <span>{group.groupNameEn}</span>
                  <span className="ar-text">{group.groupNameAr}</span>
                </div>

                <div className="nav-droplist-group-items">
                  {group.items.map((item) => {
                    const isSelected = item.id === currentView;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={`nav-droplist-item ${isSelected ? 'selected' : ''}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="nav-droplist-item-icon">{item.icon}</div>
                        <div className="nav-droplist-item-content">
                          <span className="nav-droplist-item-title">{item.labelEn}</span>
                          <span className="nav-droplist-item-subtitle">{item.labelAr}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span
                            className="nav-droplist-item-badge"
                            style={{
                              backgroundColor: item.badgeColor ? `${item.badgeColor}18` : 'var(--bg-subtle)',
                              color: item.badgeColor || 'var(--text-muted)',
                              border: `1px solid ${item.badgeColor ? `${item.badgeColor}35` : 'var(--border-light)'}`,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}

                        {isSelected && <Check size={16} className="nav-droplist-item-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
