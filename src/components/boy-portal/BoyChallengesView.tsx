import React, { useState } from 'react';
import {
  Flame,
  CheckCircle,
} from 'lucide-react';
import type { BoyChallenge, Student } from '../../types';
import { TIER_STYLES } from '../../services/badgesEngine';
import { renderBadgeIcon } from '../BadgePickerModal';
import { sound } from '../../services/sound';

interface BoyChallengesViewProps {
  student: Student;
  challenges: BoyChallenge[];
  onClaimChallenge: (challengeId: string) => Promise<void>;
}

export const BoyChallengesView: React.FC<BoyChallengesViewProps> = ({
  student,
  challenges,
  onClaimChallenge,
}) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleClaim = async (id: string) => {
    setSubmittingId(id);
    try {
      await onClaimChallenge(id);
      sound.playSuccessChime();
    } finally {
      setSubmittingId(null);
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
          border: '1px solid rgba(245, 158, 11, 0.3)',
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
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)',
            }}
          >
            <Flame size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
              التحديات والمهام الأسبوعية
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              أكمل التحديات لتفوز بنقاط إضافية وأوسمة فريدة ومميزة في ملفك! 🔥
            </p>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {challenges.map((chal) => {
          const isCompleted = (chal.completedStudentIds || []).includes(student.id);
          const isPending = (chal.pendingStudentIds || []).includes(student.id);
          const tierStyle = TIER_STYLES[chal.badgeTier || 'gold'];

          return (
            <div
              key={chal.id}
              style={{
                background: '#1e293b',
                border: isCompleted
                  ? '1px solid #10b981'
                  : isPending
                  ? '1px solid #f59e0b'
                  : '1px solid #334155',
                borderRadius: '18px',
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
              }}
            >
              <div>
                {/* Status & Category */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
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
                    {chal.category === 'attendance'
                      ? 'حضور والتزام'
                      : chal.category === 'spiritual'
                      ? 'صلاة وحياة روحية'
                      : chal.category === 'service'
                      ? 'خدمة ومحبة'
                      : chal.category === 'study'
                      ? 'دراسة وإنجيل'
                      : 'نشاط رياضي'}
                  </span>

                  {isCompleted ? (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      أُنجز بنجاح 🏆
                    </span>
                  ) : isPending ? (
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      قيد المراجعة ⏳
                    </span>
                  ) : null}
                </div>

                {/* Challenge Image */}
                {chal.imageUrl && (
                  <div
                    style={{
                      width: '100%',
                      height: '130px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '0.85rem',
                      background: '#090d16',
                      border: '1px solid #334155',
                    }}
                  >
                    <img
                      src={chal.imageUrl}
                      alt={chal.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Challenge Title */}
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.4 }}>
                  {chal.title}
                </h4>

                <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {chal.description}
                </p>

                {/* Badge & Points Reward Showcase Card */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: `1px solid ${tierStyle.borderColor}40`,
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: tierStyle.bgGradient,
                      border: `1px solid ${tierStyle.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 12px ${tierStyle.glowColor}`,
                      flexShrink: 0,
                    }}
                  >
                    {renderBadgeIcon(chal.badgeIcon, 22, tierStyle.textColor)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>الجائزة والوسام الممنوح:</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                      {chal.badgeName}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24' }}>
                      +{chal.scoreReward} نقطة
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCompleted ? (
                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      color: '#34d399',
                      padding: '0.55rem',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    تم الحصول على الوسام والنقاط! 🌟
                  </div>
                ) : isPending ? (
                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #f59e0b',
                      color: '#fbbf24',
                      padding: '0.55rem',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    تم الإرسال للخادم، بانتظار التأكيد ⏳
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={submittingId === chal.id}
                    onClick={() => handleClaim(chal.id)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.35)',
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle size={16} />
                    {submittingId === chal.id ? 'جاري الإرسال...' : 'أنا أنجزت هذا التحدي! ⚡'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {challenges.length === 0 && (
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
            <Flame size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>لا توجد تحديات نشطة حالياً</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>انتظروا تحديات قوية الأسبوع القادم!</p>
          </div>
        )}
      </div>
    </div>
  );
};
