import React from 'react';
import {
  Bell,
  X,
  BookOpen,
  ShoppingBag,
  Flame,
  Award,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import type { BoyNotification } from '../../types';

interface BoyNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: BoyNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigateTab: (tab: string) => void;
  onRequestBrowserNotification: () => void;
  browserPermission: NotificationPermission;
}

export const BoyNotificationsModal: React.FC<BoyNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigateTab,
  onRequestBrowserNotification,
  browserPermission,
}) => {
  if (!isOpen) return null;

  const getNotifIcon = (type: BoyNotification['type']) => {
    switch (type) {
      case 'mazmour':
        return <BookOpen size={18} color="#38bdf8" />;
      case 'shop':
        return <ShoppingBag size={18} color="#10b981" />;
      case 'challenge':
        return <Flame size={18} color="#f97316" />;
      case 'badge':
        return <Award size={18} color="#ec4899" />;
      case 'quiz':
        return <Sparkles size={18} color="#a855f7" />;
      default:
        return <Megaphone size={18} color="#fbbf24" />;
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '520px',
          width: '95%',
          maxHeight: '85vh',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                مركز الإشعارات والتنبيهات
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                آخر المستجدات وإشعارات الخدام الخاصة بك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '4px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        {browserPermission !== 'granted' && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(56, 189, 248, 0.1)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              فعّل إشعارات الجهاز لتصلك التنبيهات فوراً عند اعتماد مزاميرك أو نزول كويز جديد!
            </span>
            <button
              type="button"
              onClick={onRequestBrowserNotification}
              style={{
                background: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              تفعيل الآن
            </button>
          </div>
        )}

        {/* Actions bar */}
        <div style={{ padding: '0.65rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', fontSize: '0.75rem' }}>
          <span style={{ color: '#94a3b8' }}>
            {notifications.filter((n) => !n.read).length} غير مقروء
          </span>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              style={{ color: '#38bdf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {notifications.map((n) => {
            return (
              <div
                key={n.id}
                onClick={() => {
                  onMarkRead(n.id);
                  if (n.linkView) {
                    onNavigateTab(n.linkView);
                    onClose();
                  }
                }}
                style={{
                  background: n.read ? '#1e293b' : 'rgba(30, 41, 59, 0.95)',
                  border: n.read ? '1px solid #334155' : '1px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  cursor: n.linkView ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                {!n.read && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                    }}
                  />
                )}

                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getNotifIcon(n.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      {n.title}
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <Bell size={36} color="#475569" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>صندوق الإشعارات فارغ</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>ستصلك التنبيهات هنا فوراً عند حدوث جديد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
