import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Shield,
  Crown,
  Check,
} from 'lucide-react';
import type { MazmourDefinition, MazmourRequest, Student } from '../../types';
import { TIER_STYLES } from '../../services/badgesEngine';
import { sound } from '../../services/sound';

interface BoyMzamerViewProps {
  student: Student;
  mazamer: MazmourDefinition[];
  requests: MazmourRequest[];
  onRequestPsalm: (mazmour: MazmourDefinition) => Promise<void>;
  onMarkReadyForTest: (requestId: string) => Promise<void>;
}

export const BoyMzamerView: React.FC<BoyMzamerViewProps> = ({
  student,
  mazamer,
  requests,
  onRequestPsalm,
  onMarkReadyForTest,
}) => {
  const [selectedPsalmForReading, setSelectedPsalmForReading] = useState<MazmourDefinition | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter requests for this student
  const studentRequests = requests.filter((r) => r.studentId === student.id);

  // Active Psalm (requested or approved or ready_for_test)
  const activeRequest = studentRequests.find(
    (r) => r.status === 'requested' || r.status === 'approved' || r.status === 'ready_for_test'
  );

  const activeMazmour = activeRequest
    ? mazamer.find((m) => m.id === activeRequest.mazmourId) || null
    : null;

  // Completed requests
  const completedRequests = studentRequests.filter((r) => r.status === 'completed');

  // Calculate elapsed days for active request
  let elapsedDays = 0;
  let remainingDaysToDrop = 0;
  let currentTierTarget: 'gold' | 'silver' | 'bronze' | 'dropped' = 'gold';

  if (activeRequest && activeRequest.approvedAt && activeMazmour) {
    const approvedDate = new Date(activeRequest.approvedAt).getTime();
    const now = Date.now();
    elapsedDays = Math.max(0, Math.floor((now - approvedDate) / (1000 * 60 * 60 * 24)));
    const maxDrop = activeMazmour.maxDropDays || 21;
    remainingDaysToDrop = Math.max(0, maxDrop - elapsedDays);

    if (elapsedDays <= 7) {
      currentTierTarget = 'gold';
    } else if (elapsedDays <= 14) {
      currentTierTarget = 'silver';
    } else if (remainingDaysToDrop > 0) {
      currentTierTarget = 'bronze';
    } else {
      currentTierTarget = 'dropped';
    }
  }

  const handleRequestClick = async (m: MazmourDefinition) => {
    if (activeRequest) return;
    setIsSubmitting(true);
    try {
      await onRequestPsalm(m);
      sound.playSuccessChime();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadyClick = async () => {
    if (!activeRequest) return;
    setIsSubmitting(true);
    try {
      await onMarkReadyForTest(activeRequest.id);
      sound.playSuccessChime();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
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
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            }}
          >
            <BookOpen size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
              مزامير داود النبي والصلوات
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              احفظ المزمور في الأسبوع الأول لتربح الوسام الذهبي والنقاط الكاملة! 🥇
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span
            style={{
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid #eab308',
              color: '#fde047',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            🥇 أسبوع أول = ذهبي
          </span>
          <span
            style={{
              background: 'rgba(203, 213, 225, 0.15)',
              border: '1px solid #cbd5e1',
              color: '#f8fafc',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            🥈 أسبوعين = فضي
          </span>
          <span
            style={{
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid #d97706',
              color: '#fcd34d',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            🥉 بعد أسبوعين = برونزي
          </span>
        </div>
      </div>

      {/* Active Requested / In-Progress Psalm Card */}
      {activeRequest && activeMazmour ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border:
              activeRequest.status === 'ready_for_test'
                ? '2px solid #10b981'
                : activeRequest.status === 'approved'
                ? '2px solid #38bdf8'
                : '2px solid #f59e0b',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  background:
                    activeRequest.status === 'ready_for_test'
                      ? '#10b981'
                      : activeRequest.status === 'approved'
                      ? '#0284c7'
                      : '#d97706',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                {activeRequest.status === 'ready_for_test'
                  ? 'جاهز للتسميع ✋'
                  : activeRequest.status === 'approved'
                  ? 'جاري الحفظ 📖'
                  : 'في انتظار موافقة الخادم ⏳'}
              </span>

              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                {activeMazmour.reference}
              </span>
            </div>

            {/* Live Interval Reward Eligibility Pill */}
            {activeRequest.status === 'approved' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #334155',
                  padding: '4px 12px',
                  borderRadius: '10px',
                }}
              >
                <Clock size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  مر {elapsedDays} يوم منذ الاستلام
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color:
                      currentTierTarget === 'gold'
                        ? '#fbbf24'
                        : currentTierTarget === 'silver'
                        ? '#cbd5e1'
                        : '#d97706',
                  }}
                >
                  (مؤهل لـ: {currentTierTarget === 'gold' ? 'الذهبي 🥇' : currentTierTarget === 'silver' ? 'الفضي 🥈' : 'البرونزي 🥉'})
                </span>
              </div>
            )}
          </div>

          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
            {activeMazmour.title}
          </h3>

          {/* Reader Window */}
          <div
            style={{
              background: '#090d16',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #1e293b',
              marginTop: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                نص المزمور للحفظ والتلاوة
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                  style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                  }}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                  style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                  }}
                >
                  A+
                </button>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: `${fontSize}px`,
                color: '#e2e8f0',
                lineHeight: 1.85,
                fontFamily: 'serif',
                textAlign: 'justify',
                direction: 'rtl',
              }}
            >
              {activeMazmour.textArabic}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {currentTierTarget === 'gold' && `🥇 احفظ قبل اليوم السابع لتحصل على ${activeMazmour.week1Score} نقطة والوسام الذهبي!`}
              {currentTierTarget === 'silver' && `🥈 احفظ قبل اليوم الـ١٤ لتحصل على ${activeMazmour.week2Score} نقطة والوسام الفضي!`}
              {currentTierTarget === 'bronze' && `🥉 احفظ قبل مهلة الإسقاط (باقي ${remainingDaysToDrop} يوم) لتحصل على ${activeMazmour.afterTimeScore} نقطة!`}
              {currentTierTarget === 'dropped' && `⚠️ انتهت المهلة المحددة للمزمور. يرجى مراجعة الخادم.`}
            </div>

            {activeRequest.status === 'approved' && (
              <button
                type="button"
                onClick={handleReadyClick}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer',
                }}
              >
                <CheckCircle size={18} />
                أنا حفظت وجاهز للتسميع! ✋
              </button>
            )}

            {activeRequest.status === 'ready_for_test' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                <Check size={18} />
                <span>تم إشعار الخادم بأنك جاهز للتسميع! تعال وسمّع في موعد الخدمة القادم.</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Psalms Catalog List */}
      <div>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
          قائمة المزامير المتاحة للحفظ والتسليم ({mazamer.length} مزمور)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {mazamer.map((m) => {
            const isCompleted = completedRequests.some((r) => r.mazmourId === m.id);
            const isCurrent = activeRequest?.mazmourId === m.id;

            return (
              <div
                key={m.id}
                style={{
                  background: '#1e293b',
                  border: isCompleted ? '1px solid #10b981' : isCurrent ? '1px solid #38bdf8' : '1px solid #334155',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
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
                      {m.reference}
                    </span>

                    {isCompleted && (
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Check size={12} />
                        تم حفظه 🏆
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.4 }}>
                    {m.title}
                  </h4>

                  <p
                    style={{
                      margin: '0 0 0.85rem',
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      direction: 'rtl',
                    }}
                  >
                    {m.textArabic}
                  </p>

                  {/* Rewards Pills */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.35rem',
                      fontSize: '0.7rem',
                      color: '#cbd5e1',
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '6px',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                    }}
                  >
                    <span>🥇 ذهبي: <b>+{m.week1Score}</b></span>
                    <span>•</span>
                    <span>🥈 فضي: <b>+{m.week2Score}</b></span>
                    <span>•</span>
                    <span>🥉 برونزي: <b>+{m.afterTimeScore}</b></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPsalmForReading(m)}
                    style={{
                      flex: 1,
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    قراءة النص 📖
                  </button>

                  {!isCompleted && !isCurrent && (
                    <button
                      type="button"
                      disabled={Boolean(activeRequest) || isSubmitting}
                      onClick={() => handleRequestClick(m)}
                      style={{
                        flex: 1,
                        background: activeRequest ? '#334155' : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                        color: activeRequest ? '#64748b' : '#0f172a',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: activeRequest ? 'not-allowed' : 'pointer',
                      }}
                      title={activeRequest ? 'لديك مزمور جاري حفظه بالفعل' : 'طلب استلام هذا المزمور'}
                    >
                      طلب استلام ⚡
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed History Section */}
      {completedRequests.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            سجل المزامير التي أتممت حفظها 🏆 ({completedRequests.length} مزمور)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {completedRequests.map((req) => {
              const tier = req.awardedTier || 'gold';
              const tierStyle = TIER_STYLES[tier];

              return (
                <div
                  key={req.id}
                  style={{
                    background: '#1e293b',
                    border: `1px solid ${tierStyle.borderColor}40`,
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: tierStyle.bgGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      {tier === 'gold' ? <Crown size={18} /> : tier === 'silver' ? <Shield size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                        {req.mazmourTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        تم الحفظ والتسميع بنجاح في {req.completedAt ? new Date(req.completedAt).toLocaleDateString('ar-EG') : 'موعد الخدمة'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span
                      style={{
                        background: `${tierStyle.borderColor}20`,
                        color: tierStyle.borderColor,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {tierStyle.labelAr} (+{req.awardedScore || 30} نقطة)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Psalm Reading Modal */}
      {selectedPsalmForReading && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: '600px',
              width: '95%',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '1.5rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                  {selectedPsalmForReading.reference}
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  {selectedPsalmForReading.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPsalmForReading(null)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                maxHeight: '60vh',
                overflowY: 'auto',
                background: '#020617',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                lineHeight: 2,
                fontSize: '1.1rem',
                fontFamily: 'serif',
                textAlign: 'justify',
                direction: 'rtl',
                color: '#e2e8f0',
              }}
            >
              {selectedPsalmForReading.textArabic}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedPsalmForReading(null)}
                style={{
                  background: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 800,
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
