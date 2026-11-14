import React from 'react';
import {
  Trophy,
  Crown,
  Lock,
  Sparkles,
  CalendarCheck,
  BookOpen,
  Flame,
  Sun,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { Student } from '../../types';

interface ScoreBreakdown {
  totalScore: number;
  fridayPoints: number;
  fridayCount: number;
  odasPoints: number;
  odasCount: number;
  darsKtabPoints: number;
  darsKtabCount: number;
  ashyaPoints: number;
  ashyaCount: number;
  mal3abPoints: number;
  mal3abAttendedCount: number;
  mal3abMatchPoints: number;
  summerClubPoints: number;
  summerClubActivityPoints: number;
  confessionPoints: number;
  confessionCount: number;
  eventPoints: number;
  eventCount: number;
  customPointsTotal: number;
}

interface BoyScoreViewProps {
  student: Student;
  scoreBreakdown: ScoreBreakdown;
  hideScores: boolean;
  hideLeaderboard?: boolean;
  classRank: number;
  totalStudentsCount: number;
}

// Calculate Gamer Level based on points
export function calculateBoyLevel(score: number): {
  level: number;
  title: string;
  nextLevelScore: number;
  prevLevelScore: number;
  progressPercent: number;
  badgeColor: string;
} {
  const levels = [
    { level: 1, title: 'مبتدئ مبارك (Blessed Novice)', min: 0, max: 100, color: '#94a3b8' },
    { level: 2, title: 'تلميذ مجتهد (Diligent Disciple)', min: 100, max: 250, color: '#38bdf8' },
    { level: 3, title: 'فارس الصليب (Knight of the Cross)', min: 250, max: 500, color: '#a855f7' },
    { level: 4, title: 'شماس بطل (Deacon Champion)', min: 500, max: 800, color: '#f59e0b' },
    { level: 5, title: 'أركون أسطوري (Archon Legend)', min: 800, max: 1200, color: '#ec4899' },
    { level: 6, title: 'حارس الإيمان الفائق (Supreme Faith Guardian)', min: 1200, max: 2000, color: '#10b981' },
  ];

  for (const lvl of levels) {
    if (score < lvl.max || lvl.level === 6) {
      const range = lvl.max - lvl.min;
      const progress = Math.min(100, Math.max(0, Math.round(((score - lvl.min) / range) * 100)));
      return {
        level: lvl.level,
        title: lvl.title,
        nextLevelScore: lvl.max,
        prevLevelScore: lvl.min,
        progressPercent: progress,
        badgeColor: lvl.color,
      };
    }
  }

  return {
    level: 6,
    title: 'حارس الإيمان الفائق',
    nextLevelScore: 2000,
    prevLevelScore: 1200,
    progressPercent: 100,
    badgeColor: '#10b981',
  };
}

export const BoyScoreView: React.FC<BoyScoreViewProps> = ({
  student,
  scoreBreakdown,
  hideScores,
  hideLeaderboard,
  classRank,
  totalStudentsCount,
}) => {
  const levelInfo = calculateBoyLevel(scoreBreakdown.totalScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* If scores are hidden by servants */}
      {hideScores ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '24px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)',
              marginBottom: '1.25rem',
            }}
          >
            <Lock size={40} color="#0f172a" />
          </div>

          <span
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: '0.75rem',
            }}
          >
            المنافسة مشتعلة! 🔒
          </span>

          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.65rem', fontWeight: 900, color: '#f8fafc' }}>
            النقاط مخفية مؤقتاً بأمر الخدام
          </h2>

          <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', maxWidth: '440px', lineHeight: 1.6 }}>
            الخدام قاموا بإخفاء تفاصيل النقاط مؤقتاً لإشعال الحماس والمفاجآت في الحفلة الكبرى وتوزيع الهدايا!
            استمر في التبكير وحفظ المزامير ومساعدة أصحابك! 🌟
          </p>

          <div
            style={{
              marginTop: '1.5rem',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid #334155',
              padding: '0.75rem 1.5rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Crown size={20} color={levelInfo.badgeColor} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              رتبتك الشرفية الحالية: <span style={{ color: levelInfo.badgeColor }}>{levelInfo.title}</span>
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Main Gamer Hero Score Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '24px',
              padding: '2rem 1.5rem',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Student Name */}
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem' }}>
              نقاط البطل {student.name}
            </div>

            {/* Level Tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: `${levelInfo.badgeColor}20`,
                border: `1px solid ${levelInfo.badgeColor}`,
                color: levelInfo.badgeColor,
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                marginBottom: '1rem',
              }}
            >
              <Zap size={14} />
              المستوى {levelInfo.level}: {levelInfo.title}
            </div>

            {/* Giant Score Display */}
            <div
              style={{
                fontSize: '4.5rem',
                fontWeight: 900,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #f59e0b 0%, #fde047 50%, #ca8a04 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(245, 158, 11, 0.3)',
                margin: '0.25rem 0',
                fontFamily: 'monospace',
              }}
            >
              {scoreBreakdown.totalScore}
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              نقطة مسجلة في رصيدك
            </span>

            {/* Progress to Next Level */}
            <div style={{ width: '100%', maxWidth: '360px', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.35rem' }}>
                <span>المستوى {levelInfo.level}</span>
                <span>باقي {Math.max(0, levelInfo.nextLevelScore - scoreBreakdown.totalScore)} نقطة للمستوى التالي</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  background: '#1e293b',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  border: '1px solid #334155',
                }}
              >
                <div
                  style={{
                    width: `${levelInfo.progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #f59e0b 100%)',
                    borderRadius: '999px',
                    transition: 'width 0.8s ease',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
                  }}
                />
              </div>
            </div>

            {/* Class Rank Pill */}
            <div
              style={{
                marginTop: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 16px',
                borderRadius: '12px',
              }}
            >
              <Crown size={16} color="#f59e0b" />
              <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700 }}>
                {hideLeaderboard ? (
                  <>ترتيبك بالفصل: <span style={{ color: '#94a3b8', fontWeight: 700 }}>🔒 مخفي مؤقتاً بواسطة الخدام</span></>
                ) : (
                  <>ترتيبك بالفصل: <span style={{ color: '#38bdf8', fontWeight: 900 }}>#{classRank}</span> من أصل {totalStudentsCount} بطلاً</>
                )}
              </span>
            </div>
          </div>

          {/* Breakdown by Church Activities Grid */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              تفاصيل النقاط حسب الأنشطة والخدمات
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
              {/* Friday School */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(5, 150, 105, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>خدمة الجمعة ({scoreBreakdown.fridayCount} حضور)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                    +{scoreBreakdown.fridayPoints} نقطة
                  </div>
                </div>
              </div>

              {/* Liturgy & Odas */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(217, 119, 6, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <Trophy size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>القداس الإلهي ({scoreBreakdown.odasCount} قداس)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>
                    +{scoreBreakdown.odasPoints} نقطة
                  </div>
                </div>
              </div>

              {/* Saturday Dars Ktab & Ashya */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>درس كتاب وعشية السبت</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa' }}>
                    +{scoreBreakdown.darsKtabPoints + scoreBreakdown.ashyaPoints} نقطة
                  </div>
                </div>
              </div>

              {/* Thursday Mal3ab */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(22, 163, 74, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ade80',
                  }}
                >
                  <Flame size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>الملعب وماتش الخميس</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>
                    +{scoreBreakdown.mal3abPoints + scoreBreakdown.mal3abMatchPoints} نقطة
                  </div>
                </div>
              </div>

              {/* Confessions */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(147, 51, 234, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>الاعتراف الشهري ({scoreBreakdown.confessionCount} مرة)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc' }}>
                    +{scoreBreakdown.confessionPoints} نقطة
                  </div>
                </div>
              </div>

              {/* Summer Club & Events */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(234, 88, 12, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fb923c',
                  }}
                >
                  <Sun size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>النادي الصيفي والرحلات</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fb923c' }}>
                    +{scoreBreakdown.summerClubPoints + scoreBreakdown.summerClubActivityPoints + scoreBreakdown.eventPoints} نقطة
                  </div>
                </div>
              </div>

              {/* Psalms, Challenges & Quizzes Bonuses */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  gridColumn: '1 / -1',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(236, 72, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f472b6',
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>المزامير المحفوظة، التحديات، الكويزات والجوائز المشتراة</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: scoreBreakdown.customPointsTotal >= 0 ? '#f472b6' : '#ef4444' }}>
                    {scoreBreakdown.customPointsTotal >= 0 ? `+${scoreBreakdown.customPointsTotal}` : scoreBreakdown.customPointsTotal} نقطة
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
