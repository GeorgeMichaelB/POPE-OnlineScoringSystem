import React, { useState } from 'react';
import {
  ShoppingBag,
  Trophy,
  Package,
  CheckCircle,
  Sparkles,
  BookOpen,
  Cross,
  Heart,
  Zap,
} from 'lucide-react';
import type { ShopItem, ShopOrder, Student } from '../../types';
import { sound } from '../../services/sound';

interface BoyShopViewProps {
  student: Student;
  items: ShopItem[];
  orders: ShopOrder[];
  studentScore: number;
  hideScores: boolean;
  isShopEnabled: boolean;
  onBuyItem: (item: ShopItem) => Promise<ShopOrder>;
}

export const BoyShopView: React.FC<BoyShopViewProps> = ({
  student,
  items,
  orders,
  studentScore,
  hideScores,
  isShopEnabled,
  onBuyItem,
}) => {
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<ShopItem | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_orders'>('catalog');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPurchasedOrder, setLastPurchasedOrder] = useState<ShopOrder | null>(null);

  // Filter orders for this student
  const studentOrders = orders.filter((o) => o.studentId === student.id);

  // Helper for item icons
  const renderItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen size={28} color="#38bdf8" />;
      case 'Cross':
        return <Cross size={28} color="#fbbf24" />;
      case 'Trophy':
        return <Trophy size={28} color="#f59e0b" />;
      case 'Heart':
        return <Heart size={28} color="#f472b6" />;
      case 'Zap':
        return <Zap size={28} color="#eab308" />;
      case 'Sparkles':
        return <Sparkles size={28} color="#a855f7" />;
      default:
        return <Package size={28} color="#38bdf8" />;
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItemForPurchase) return;
    setIsProcessing(true);
    try {
      const newOrder = await onBuyItem(selectedItemForPurchase);
      sound.playSuccessChime();
      setLastPurchasedOrder(newOrder);
      setSelectedItemForPurchase(null);
    } catch {
      sound.playAlertChime();
    } finally {
      setIsProcessing(false);
    }
  };

  // If shop is disabled by servants
  if (!isShopEnabled) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          borderRadius: '24px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '22px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            marginBottom: '1.25rem',
          }}
        >
          <ShoppingBag size={38} />
        </div>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>
          متجر الجوائز مغلق حالياً
        </h2>
        <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.6 }}>
          الخدام يقومون بتحديث الجوائز وإضافة هدايا جديدة ومميزة! ترقبوا افتتاح المتجر قريباً للمنافسة والشراء بالنقاط. 🎁
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Balance Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
              متجر الجوائز والهدايا الكنسية
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
              استبدل نقاطك بهدايا حقيقية مميزة يسلّمها لك الخدام! 🛍️
            </p>
          </div>
        </div>

        {/* Score Balance Pill */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            padding: '0.5rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <Trophy size={18} color="#fbbf24" />
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>رصيدك المتاح:</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24' }}>
            {hideScores ? '🔒 سرّي' : `${studentScore} نقطة`}
          </span>
        </div>
      </div>

      {/* Tabs Switcher: Catalog vs My Orders */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            background: activeTab === 'catalog' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'catalog' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'catalog' ? '#38bdf8' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          قائمة الجوائز ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_orders')}
          style={{
            background: activeTab === 'my_orders' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'my_orders' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'my_orders' ? '#38bdf8' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          مشترياتي وتذاكر الاستلام ({studentOrders.length})
        </button>
      </div>

      {/* TAB 1: Items Catalog Grid */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {items.map((item) => {
            const isOutOfStock = (item.stock || 0) <= 0;
            const canAfford = !hideScores && studentScore >= item.price;
            const isDisabled = !item.isEnabled || isOutOfStock;

            return (
              <div
                key={item.id}
                style={{
                  background: '#1e293b',
                  border: isOutOfStock ? '1px dashed #64748b' : '1px solid #334155',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                  opacity: isDisabled ? 0.75 : 1,
                  position: 'relative',
                }}
              >
                <div>
                  {/* Category & Stock Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {item.category || 'جوائز عامة'}
                    </span>

                    <span
                      style={{
                        background: isOutOfStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isOutOfStock ? '#f87171' : '#34d399',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {isOutOfStock ? 'نفدت الكمية ⚠️' : `متبقي ${item.stock} قطع`}
                    </span>
                  </div>

                  {/* Product Image or Fallback Icon Emblem */}
                  {item.imageUrl ? (
                    <div
                      style={{
                        width: '100%',
                        height: '130px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        marginBottom: '0.85rem',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0.5rem auto 1rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      {renderItemIcon(item.icon)}
                    </div>
                  )}

                  {/* Title & Description */}
                  <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', textAlign: 'center' }}>
                    {item.title}
                  </h4>

                  <p
                    style={{
                      margin: '0 0 1rem',
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                      lineHeight: 1.5,
                      textAlign: 'center',
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Price & Buy Button */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fbbf24' }}>
                      {item.price}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                      نقطة
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isDisabled || (!hideScores && !canAfford)}
                    onClick={() => setSelectedItemForPurchase(item)}
                    style={{
                      background:
                        isDisabled || (!hideScores && !canAfford)
                          ? '#334155'
                          : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      color: isDisabled || (!hideScores && !canAfford) ? '#64748b' : '#0f172a',
                      fontWeight: 800,
                      padding: '0.55rem 1.15rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      cursor: isDisabled || (!hideScores && !canAfford) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isOutOfStock ? 'نفدت' : !item.isEnabled ? 'معطل' : !hideScores && !canAfford ? 'نقاط غير كافية' : 'شراء الآن 🛍️'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: My Purchases & Redemptions */}
      {activeTab === 'my_orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {studentOrders.map((ord) => {
            const isDelivered = ord.status === 'delivered';

            return (
              <div
                key={ord.id}
                style={{
                  background: '#1e293b',
                  border: isDelivered ? '1px solid #10b981' : '1px solid #f59e0b',
                  borderRadius: '16px',
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
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDelivered ? '#10b981' : '#f59e0b',
                    }}
                  >
                    <Package size={24} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span
                        style={{
                          background: isDelivered ? '#10b981' : '#f59e0b',
                          color: '#0f172a',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}
                      >
                        {isDelivered ? 'تم الاستلام ✅' : 'قيد التجهيز ⏳'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(ord.orderedAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                      {ord.itemTitle}
                    </h4>

                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      تم الدفع: {ord.pricePaid} نقطة
                    </span>
                  </div>
                </div>

                {/* Redemption Ticket Code */}
                <div
                  style={{
                    background: '#090d16',
                    border: '1px dashed #475569',
                    borderRadius: '10px',
                    padding: '0.55rem 1rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.15rem' }}>
                    كود الاستلام للخدام
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {ord.redemptionCode}
                  </div>
                </div>
              </div>
            );
          })}

          {studentOrders.length === 0 && (
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
              <Package size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>لم تقم بشراء جوائز بعد</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>اجمع النقاط من حفظ المزامير وحضور الخدمات واشترِ هديتك الأولى!</p>
            </div>
          )}
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {selectedItemForPurchase && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: '460px',
              width: '95%',
              background: '#0f172a',
              border: '2px solid #38bdf8',
              borderRadius: '20px',
              padding: '1.75rem',
              color: '#f8fafc',
              textAlign: 'center',
            }}
          >
            {selectedItemForPurchase.imageUrl ? (
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  background: '#020617',
                }}
              >
                <img
                  src={selectedItemForPurchase.imageUrl}
                  alt={selectedItemForPurchase.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  marginBottom: '1rem',
                }}
              >
                <ShoppingBag size={30} />
              </div>
            )}

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800 }}>
              تأكيد شراء الجائزة
            </h3>

            <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              هل ترغب في شراء "<b>{selectedItemForPurchase.title}</b>" مقابل{' '}
              <span style={{ color: '#fbbf24', fontWeight: 800 }}>{selectedItemForPurchase.price} نقطة</span>؟
            </p>

            <div
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                padding: '0.85rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: '#94a3b8',
              }}
            >
              سيتم خصم النقاط فوراً وإصدار كود استلام خاص بك لتسلمه للخادم في موعد الخدمة.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedItemForPurchase(null)}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#0f172a',
                  border: 'none',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: isProcessing ? 'wait' : 'pointer',
                }}
              >
                {isProcessing ? 'جاري الشراء...' : 'تأكيد الخصم والشراء ⚡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {lastPurchasedOrder && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: '440px',
              width: '95%',
              background: '#0f172a',
              border: '2px solid #10b981',
              borderRadius: '20px',
              padding: '2rem 1.5rem',
              color: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 0 25px #10b981',
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 900, color: '#34d399' }}>
              مبروك يا بطل! تم الشراء بنجاح 🎁
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
              تم حجز <b>{lastPurchasedOrder.itemTitle}</b>
            </p>

            <div
              style={{
                background: '#090d16',
                border: '2px dashed #38bdf8',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                كود الاستلام المباشر من الخدام
              </div>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                }}
              >
                {lastPurchasedOrder.redemptionCode}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
                أظهر هذا الكود لأحد خدام الفصل لتستلم هديتك
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLastPurchasedOrder(null);
                setActiveTab('my_orders');
              }}
              style={{
                width: '100%',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
              }}
            >
              تم، عرض مشترياتي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
