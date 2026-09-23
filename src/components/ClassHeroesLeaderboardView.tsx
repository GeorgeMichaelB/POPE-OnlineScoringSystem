import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Trophy,
  Crown,
  Flame,
  Star,
  Cross,
  Shield,
  Church,
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  Plus,
  Zap,
  ArrowLeft
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  CustomEvent,
  PointSettings,
  Mal3abRecord,
  SummerClubRecord,
  ConfessionRecord,
  CustomPointEntry,
  ClassHero,
  HeroBadgeIcon
} from '../types';
import { calculateStudentScore } from '../utils/helpers';
import { sound } from '../services/sound';

interface ClassHeroesLeaderboardViewProps {
  students: Student[];
  fridayAttendance: AttendanceRecord[];
  darsKtabAttendance: DarsKtabRecord[];
  mal3ab?: Mal3abRecord[];
  summerClub?: SummerClubRecord[];
  confessions?: ConfessionRecord[];
  customEvents: CustomEvent[];
  pointSettings: PointSettings;
  customPoints: CustomPointEntry[];
  classHeroes: ClassHero[];
  onOpenManageHeroes: () => void;
  onOpenStudentDetail: (student: Student) => void;
  onExitToDashboard?: () => void;
}

// Confetti Particle Engine
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
}

export const ClassHeroesLeaderboardView: React.FC<ClassHeroesLeaderboardViewProps> = ({
  students,
  fridayAttendance,
  darsKtabAttendance,
  mal3ab = [],
  summerClub = [],
  confessions = [],
  customEvents,
  pointSettings,
  customPoints,
  classHeroes,
  onOpenManageHeroes,
  onOpenStudentDetail,
  onExitToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute live scores and ranks for all students
  const rankedStudents = useMemo(() => {
    return students
      .map((student) => {
        const scoreData = calculateStudentScore(
          student.id,
          fridayAttendance,
          darsKtabAttendance,
          customEvents,
          customPoints,
          pointSettings,
          mal3ab,
          summerClub,
          confessions
        );
        return {
          student,
          ...scoreData,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [students, fridayAttendance, darsKtabAttendance, customEvents, customPoints, pointSettings, mal3ab, summerClub, confessions]);

  // Top 3 Podium
  const top1 = rankedStudents[0] || null;
  const top2 = rankedStudents[1] || null;
  const top3 = rankedStudents[2] || null;
  const restStudents = rankedStudents.slice(3);

  // Filtered list for scoreboard
  const filteredScoreboard = useMemo(() => {
    if (!searchQuery.trim()) return restStudents;
    const q = searchQuery.toLowerCase();
    return rankedStudents.filter(
      (item) =>
        item.student.name.toLowerCase().includes(q) ||
        (item.student.arabicName && item.student.arabicName.toLowerCase().includes(q)) ||
        item.student.id.toLowerCase().includes(q) ||
        (item.student.series && item.student.series.toLowerCase().includes(q)) ||
        item.student.school.toLowerCase().includes(q)
    );
  }, [rankedStudents, restStudents, searchQuery]);

  // Toggle Fullscreen / TV Projector mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Launch Golden Confetti Celebration
  const triggerCelebration = () => {
    sound.playVictoryFanfare();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: ConfettiParticle[] = [];
    const colors = ['#f59e0b', '#fbbf24', '#d97706', '#60a5fa', '#3b82f6', '#34d399', '#f43f5e', '#ffffff'];

    for (let i = 0; i < 160; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 5,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // friction
        p.rotation += p.vRot;
        if (frameCount > 80) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          ctx.restore();
        }
      });

      if (frameCount < 160) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  };

  // Helper for Hero badge icon
  const renderBadgeIcon = (type: HeroBadgeIcon) => {
    switch (type) {
      case 'crown':
        return <Crown size={18} color="#f59e0b" />;
      case 'star':
        return <Star size={18} color="#f59e0b" />;
      case 'flame':
        return <Flame size={18} color="#ef4444" />;
      case 'cross':
        return <Cross size={18} color="#3b82f6" />;
      case 'shield':
        return <Shield size={18} color="#10b981" />;
      case 'trophy':
      default:
        return <Trophy size={18} color="#f59e0b" />;
    }
  };

  // Level computation (Gamified for 12yo boys)
  const getPlayerLevel = (score: number) => {
    if (score >= 120) return { title: 'Legendary Champion (أسطورة)', tier: 4, color: '#f59e0b' };
    if (score >= 80) return { title: 'Master Deacon (شماس محترف)', tier: 3, color: '#a855f7' };
    if (score >= 40) return { title: 'Spiritual Warrior (محارب روحي)', tier: 2, color: '#3b82f6' };
    return { title: 'Rising Star (بطل صاعد)', tier: 1, color: '#10b981' };
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(11, 19, 43, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%), url(/hero-bg.jpg) center/cover no-repeat fixed',
        color: '#f8fafc',
        padding: isFullscreen ? '1.5rem 2rem 4rem' : '1.5rem 1.25rem 4rem',
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Canvas for Confetti */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Arena Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                <Zap size={14} /> Official Arena Leaderboard
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pope Saweros Class • Grade 4</span>
            </div>

            <h1
              style={{
                fontSize: isFullscreen ? '2.4rem' : '2rem',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #ffffff 30%, #fde68a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              HALL OF CHAMPIONS (لوحة الشرف والأبطال)
            </h1>
            <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
              "أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي" (فيلبي 4: 13)
            </p>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={triggerCelebration}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={16} /> Celebrate Champions 🎉
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isFullscreen ? 'Exit TV Mode' : 'TV / Projector Mode'}
            </button>

            <button
              type="button"
              onClick={onOpenManageHeroes}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 0.95rem',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Manage Heroes (تتويج بطل)
            </button>

            {onExitToDashboard && (
              <button
                type="button"
                onClick={onExitToDashboard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
                title="Return to Servant Dashboard"
              >
                <ArrowLeft size={16} /> Exit to Servants Panel (لوحة الخدام)
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================
            SECTION 1: HEROES OF THE WEEK (أبطال الفصل المتميزون)
            =================================================================== */}
        <div style={{ marginBottom: '3rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.4))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                }}
              >
                <Crown size={20} color="#fbbf24" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  CLASS HEROES OF THE WEEK (أبطال الفصل هذا الأسبوع)
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Spotlighted for special spiritual, altar, or brotherhood achievements
                </p>
              </div>
            </div>

            {classHeroes.length > 0 && (
              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                }}
              >
                {classHeroes.length} Spotlighted Heroes
              </span>
            )}
          </div>

          {/* Hero Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {classHeroes.length > 0 ? (
              classHeroes.map((hero) => {
                const student = students.find((s) => s.id === hero.studentId);
                const scoreData = student
                  ? calculateStudentScore(
                      student.id,
                      fridayAttendance,
                      darsKtabAttendance,
                      customEvents,
                      customPoints,
                      pointSettings,
                      mal3ab,
                      summerClub,
                      confessions
                    )
                  : null;

                return (
                  <div
                    key={hero.id}
                    onClick={() => student && onOpenStudentDetail(student)}
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      background:
                        'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      border: '1.5px solid rgba(245, 158, 11, 0.5)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 25px rgba(245, 158, 11, 0.15)',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      cursor: student ? 'pointer' : 'default',
                      overflow: 'hidden',
                      backdropFilter: 'blur(12px)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow =
                        '0 14px 35px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 25px rgba(245, 158, 11, 0.15)';
                    }}
                  >
                    {/* Glowing Accent Top Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6)',
                      }}
                    />

                    {/* Boy Avatar + Name + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '74px',
                          height: '74px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '2.5px solid #f59e0b',
                          boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                          background: '#0f172a',
                        }}
                      >
                        {student?.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                              color: '#fbbf24',
                              fontWeight: 800,
                              fontSize: '1.4rem',
                            }}
                          >
                            {student?.name?.charAt(0) || '★'}
                          </div>
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: '#d97706',
                            color: '#fff',
                            borderRadius: '6px 0 0 0',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {renderBadgeIcon(hero.badgeIcon)}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '0.35rem',
                          }}
                        >
                          {renderBadgeIcon(hero.badgeIcon)} {hero.title}
                        </div>
                        <h3
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            margin: 0,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {student?.name || 'Class Hero'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>
                          {student?.school || 'Grade 4 Pope Saweros'}
                        </p>
                      </div>

                      {scoreData && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                            {scoreData.totalScore}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                            POINTS
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hero Story / Reason Quote */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.88rem',
                        color: '#e2e8f0',
                        lineHeight: 1.4,
                        fontStyle: 'italic',
                      }}
                    >
                      "{hero.reason}"
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        paddingTop: '0.4rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <span>Awarded by {hero.servantName}</span>
                      <span>{hero.awardedDate}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              // If no custom heroes spotlighted, show the #1 leader as hero
              top1 && (
                <div
                  onClick={() => onOpenStudentDetail(top1.student)}
                  style={{
                    borderRadius: '16px',
                    background:
                      'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: '1.5px solid rgba(245, 158, 11, 0.5)',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    gridColumn: '1 / -1',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '2.5px solid #f59e0b',
                      boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    {top1.student.photoUrl ? (
                      <img
                        src={top1.student.photoUrl}
                        alt={top1.student.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#1e293b',
                          color: '#fbbf24',
                          fontWeight: 800,
                          fontSize: '1.4rem',
                        }}
                      >
                        {top1.student.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginBottom: '0.25rem',
                      }}
                    >
                      <Crown size={14} /> Overall League Leader (متصدر الترتيب العام)
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                      {top1.student.name}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
                      Reigning champion with {top1.totalScore} total points across class attendance and activities!
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ===================================================================
            SECTION 2: THE CHAMPIONS PODIUM (Top 3)
            =================================================================== */}
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.85rem',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              <Trophy size={14} color="#f59e0b" /> Top 3 Overall Standings
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>
              THE CHAMPIONS PODIUM (منصة التتويج)
            </h2>
          </div>

          <div
            className="podium-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              alignItems: 'end',
            }}
          >
            {/* 2nd Place: Silver Challenger */}
            {top2 && (
              <div
                className="podium-card-top2"
                onClick={() => onOpenStudentDetail(top2.student)}
                style={{
                  order: 1,
                  borderRadius: '20px',
                  background:
                    'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '2px solid rgba(148, 163, 184, 0.5)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(148, 163, 184, 0.15)',
                  padding: '2rem 1.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  backdropFilter: 'blur(12px)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Silver Medal Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
                    color: '#0f172a',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    padding: '0.35rem 1rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(148, 163, 184, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  🥈 2ND PLACE
                </div>

                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0.5rem auto 1rem',
                    border: '3px solid #94a3b8',
                    boxShadow: '0 0 20px rgba(148, 163, 184, 0.4)',
                    background: '#0f172a',
                  }}
                >
                  {top2.student.photoUrl ? (
                    <img
                      src={top2.student.photoUrl}
                      alt={top2.student.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#334155',
                        color: '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                      }}
                    >
                      {top2.student.name.charAt(0)}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
                  {top2.student.name}
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {top2.student.school}
                </p>

                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e2e8f0', lineHeight: 1 }}>
                    {top2.totalScore}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                    TOTAL POINTS
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place: Grand Gold Champion (Center & Elevated) */}
            {top1 && (
              <div
                className="podium-card-top1"
                onClick={() => onOpenStudentDetail(top1.student)}
                style={{
                  order: 2,
                  borderRadius: '24px',
                  background:
                    'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(20, 29, 50, 0.98) 100%)',
                  border: '2.5px solid #f59e0b',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 35px rgba(245, 158, 11, 0.35)',
                  padding: '2.5rem 1.75rem 1.75rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  backdropFilter: 'blur(16px)',
                  transform: 'scale(1.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.06) translateY(-6px)';
                  e.currentTarget.style.boxShadow =
                    '0 18px 50px rgba(0, 0, 0, 0.6), 0 0 45px rgba(245, 158, 11, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1.04)';
                  e.currentTarget.style.boxShadow =
                    '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 35px rgba(245, 158, 11, 0.35)';
                }}
              >
                {/* Gold Crown Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    padding: '0.45rem 1.25rem',
                    borderRadius: '24px',
                    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  <Crown size={18} /> 1ST CHAMPION 👑
                </div>

                <div
                  style={{
                    width: '104px',
                    height: '104px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0.5rem auto 1rem',
                    border: '4px solid #f59e0b',
                    boxShadow: '0 0 28px rgba(245, 158, 11, 0.6)',
                    background: '#0f172a',
                  }}
                >
                  {top1.student.photoUrl ? (
                    <img
                      src={top1.student.photoUrl}
                      alt={top1.student.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '2rem',
                      }}
                    >
                      {top1.student.name.charAt(0)}
                    </div>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    margin: '0 0 0.25rem',
                    background: 'linear-gradient(135deg, #ffffff 30%, #fde68a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {top1.student.name}
                </h3>
                <p style={{ margin: '0 0 1.2rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                  {top1.student.school}
                </p>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    background:
                      'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '2.4rem',
                      fontWeight: 900,
                      color: '#fbbf24',
                      lineHeight: 1,
                      textShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                    }}
                  >
                    {top1.totalScore}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#fde68a',
                      textTransform: 'uppercase',
                      marginTop: '0.35rem',
                      letterSpacing: '1px',
                    }}
                  >
                    CHAMPION POINTS
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place: Bronze Master */}
            {top3 && (
              <div
                className="podium-card-top3"
                onClick={() => onOpenStudentDetail(top3.student)}
                style={{
                  order: 3,
                  borderRadius: '20px',
                  background:
                    'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '2px solid rgba(217, 119, 6, 0.4)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(217, 119, 6, 0.15)',
                  padding: '2rem 1.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  backdropFilter: 'blur(12px)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Bronze Medal Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    padding: '0.35rem 1rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  🥉 3RD PLACE
                </div>

                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0.5rem auto 1rem',
                    border: '3px solid #d97706',
                    boxShadow: '0 0 20px rgba(217, 119, 6, 0.4)',
                    background: '#0f172a',
                  }}
                >
                  {top3.student.photoUrl ? (
                    <img
                      src={top3.student.photoUrl}
                      alt={top3.student.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#78350f',
                        color: '#fef3c7',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                      }}
                    >
                      {top3.student.name.charAt(0)}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
                  {top3.student.name}
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {top3.student.school}
                </p>

                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'rgba(217, 119, 6, 0.1)',
                    border: '1px solid rgba(217, 119, 6, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                    {top3.totalScore}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                    TOTAL POINTS
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            SECTION 3: CLASS SCOREBOARD & STANDINGS (Full Roster)
            =================================================================== */}
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                CLASS STANDINGS (جدول ترتيب الفصل)
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Full ranking of all Grade 4 boys
              </p>
            </div>

            {/* Search Input for Boys to Find Their Name Quickly */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find my rank (ابحث عن اسمك)..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Roster Cards / Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredScoreboard.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                }}
              >
                No students match your search query.
              </div>
            ) : (
              filteredScoreboard.map((item) => {
                const rank = rankedStudents.findIndex((r) => r.student.id === item.student.id) + 1;
                const level = getPlayerLevel(item.totalScore);

                return (
                  <div
                    key={item.student.id}
                    onClick={() => onOpenStudentDetail(item.student)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '14px',
                      background: 'rgba(30, 41, 59, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.95)';
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.65)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Rank Number + Avatar + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1rem',
                          color: rank <= 3 ? '#fbbf24' : '#cbd5e1',
                          flexShrink: 0,
                        }}
                      >
                        #{rank}
                      </div>

                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          background: '#0f172a',
                        }}
                      >
                        {item.student.photoUrl ? (
                          <img
                            src={item.student.photoUrl}
                            alt={item.student.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#1e293b',
                              color: '#94a3b8',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                            }}
                          >
                            {item.student.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.98rem', color: '#f8fafc' }}>
                            {item.student.name}
                          </strong>
                          {item.student.arabicName && (
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                              ({item.student.arabicName})
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: `${level.color}22`,
                              color: level.color,
                              fontWeight: 700,
                            }}
                          >
                            {level.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          {item.student.school} • ID: {item.student.id}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Pills & Total Points */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span
                          title="Friday Class Points"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                          }}
                        >
                          Fri: {item.fridayPoints}p
                        </span>
                        <span
                          title="Odas Points"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#6ee7b7',
                          }}
                        >
                          Odas: {item.odasPoints}p
                        </span>
                        <span
                          title="Dars Ktab Points"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#d8b4fe',
                          }}
                        >
                          Sat: {item.darsKtabPoints + item.ashyaPoints}p
                        </span>
                        {item.confessionPoints > 0 && (
                          <span
                            title="Monthly Confession Points"
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(236, 72, 153, 0.18)',
                              color: '#f472b6',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Church size={11} /> Confession: +{item.confessionPoints}p
                          </span>
                        )}
                        {item.customPointsTotal !== 0 && (
                          <span
                            title="Bonus & Good Deeds Points"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fde68a',
                              fontWeight: 600,
                            }}
                          >
                            Bonus: +{item.customPointsTotal}p
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '70px' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                          {item.totalScore}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                          PTS
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
