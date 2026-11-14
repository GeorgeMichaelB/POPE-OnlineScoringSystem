import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  LogOut,
  Download,
  Crown,
  ShoppingBag,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';
import type {
  Student,
  AttendanceRecord,
  DarsKtabRecord,
  Mal3abRecord,
  SummerClubRecord,
  ConfessionRecord,
  CustomEvent,
  CustomPointEntry,
  PointSettings,
  Announcement,
  ShopItem,
  ShopOrder,
  MazmourDefinition,
  MazmourRequest,
  BoyChallenge,
  BoyQuiz,
  BoyQuestion,
  StudentBadge,
  BoyNotification,
  BoyPortalSettings,
} from '../../types';
import { calculateStudentScore } from '../../utils/helpers';
import { db } from '../../services/db';
import { sound } from '../../services/sound';
import { BoyAnnouncementsView } from './BoyAnnouncementsView';
import { BoyScoreView, calculateBoyLevel } from './BoyScoreView';
import { BoyMzamerView } from './BoyMzamerView';
import { BoyShopView } from './BoyShopView';
import { BoyAskQuestionView } from './BoyAskQuestionView';
import { BoyChallengesView } from './BoyChallengesView';
import { BoyQuizzesView } from './BoyQuizzesView';
import { BoyBadgesView } from './BoyBadgesView';
import { BoyNotificationsModal } from './BoyNotificationsModal';
import { getBoyArena, type ClashChestSlot } from './clashArenas';
import { renderBadgeIconOrImage } from '../BadgePickerModal';
import { TIER_STYLES } from '../../services/badgesEngine';
import './clashRoyale.css';

export type MainClashTab = 'shop' | 'cards' | 'battle' | 'clan' | 'events';

export type BoyPortalTab =
  | 'home'
  | 'score'
  | 'mzamer'
  | 'shop'
  | 'questions'
  | 'challenges'
  | 'quizzes'
  | 'badges'
  | 'battle'
  | 'cards'
  | 'clan'
  | 'events';

interface BoyPortalViewProps {
  student: Student;
  allStudents: Student[];
  fridayAttendance: AttendanceRecord[];
  darsKtabAttendance: DarsKtabRecord[];
  mal3abAttendance: Mal3abRecord[];
  summerClubAttendance: SummerClubRecord[];
  confessions: ConfessionRecord[];
  customEvents: CustomEvent[];
  customPoints: CustomPointEntry[];
  pointSettings: PointSettings;
  onLogout: () => void;
  onRefreshData?: () => Promise<void>;
  onInstallApp?: () => void;
  isAppInstalled?: boolean;
}

export const BoyPortalView: React.FC<BoyPortalViewProps> = ({
  student,
  allStudents = [],
  fridayAttendance = [],
  darsKtabAttendance = [],
  mal3abAttendance = [],
  summerClubAttendance = [],
  confessions = [],
  customEvents = [],
  customPoints = [],
  pointSettings,
  onLogout,
  onRefreshData,
  onInstallApp,
  isAppInstalled,
}) => {
  // Current Main Clash Royale Tab
  const [activeMainTab, setActiveMainTab] = useState<MainClashTab>('battle');

  // Sub-tabs for Clan and Events
  const [clanSubTab, setClanSubTab] = useState<'leaderboard' | 'stats' | 'questions' | 'news'>('leaderboard');
  const [eventsSubTab, setEventsSubTab] = useState<'mzamer' | 'challenges' | 'quizzes'>('mzamer');

  // Async data states
  const [settings, setSettings] = useState<BoyPortalSettings>({
    hideScores: false,
    isShopEnabled: true,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [mazamer, setMazamer] = useState<MazmourDefinition[]>([]);
  const [mazmourRequests, setMazmourRequests] = useState<MazmourRequest[]>([]);
  const [challenges, setChallenges] = useState<BoyChallenge[]>([]);
  const [quizzes, setQuizzes] = useState<BoyQuiz[]>([]);
  const [questions, setQuestions] = useState<BoyQuestion[]>([]);
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [notifications, setNotifications] = useState<BoyNotification[]>([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedChestForModal, setSelectedChestForModal] = useState<ClashChestSlot | null>(null);
  const [isBattleLaunchModalOpen, setIsBattleLaunchModalOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Load Boys Portal Data from db
  const loadPortalData = async () => {
    try {
      const [
        loadedSettings,
        loadedAnnouncements,
        loadedItems,
        loadedOrders,
        loadedMazamer,
        loadedRequests,
        loadedChallenges,
        loadedQuizzes,
        loadedQuestions,
        loadedBadges,
        loadedNotifs,
      ] = await Promise.all([
        db.getBoyPortalSettings(),
        db.getAnnouncements(),
        db.getShopItems(),
        db.getShopOrders(),
        db.getMazamer(),
        db.getMazmourRequests(),
        db.getBoyChallenges(),
        db.getBoyQuizzes(),
        db.getBoyQuestions(),
        db.getStudentBadges(),
        db.getBoyNotifications(student.id),
      ]);

      setSettings(loadedSettings);
      setAnnouncements(loadedAnnouncements);
      setShopItems(loadedItems);
      setShopOrders(loadedOrders);
      setMazamer(loadedMazamer);
      setMazmourRequests(loadedRequests);
      setChallenges(loadedChallenges);
      setQuizzes(loadedQuizzes);
      setQuestions(loadedQuestions);
      setStudentBadges(loadedBadges);
      setNotifications(loadedNotifs);
    } catch (e) {
      console.warn('Error loading portal data:', e);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [student.id]);

  // Calculate Student Score Breakdown
  const scoreBreakdown = useMemo(() => {
    return calculateStudentScore(
      student.id,
      fridayAttendance,
      darsKtabAttendance,
      customEvents,
      customPoints,
      pointSettings,
      mal3abAttendance,
      summerClubAttendance,
      confessions
    );
  }, [
    student.id,
    fridayAttendance,
    darsKtabAttendance,
    customEvents,
    customPoints,
    pointSettings,
    mal3abAttendance,
    summerClubAttendance,
    confessions,
  ]);

  // Calculate Class Rank
  const classRank = useMemo(() => {
    const scores = allStudents.map((s) => {
      const sc = calculateStudentScore(
        s.id,
        fridayAttendance,
        darsKtabAttendance,
        customEvents,
        customPoints,
        pointSettings,
        mal3abAttendance,
        summerClubAttendance,
        confessions
      );
      return { id: s.id, name: s.arabicName || s.name, score: sc.totalScore };
    });

    scores.sort((a, b) => b.score - a.score);
    const index = scores.findIndex((x) => x.id === student.id);
    return {
      rank: index >= 0 ? index + 1 : 1,
      topStudents: scores.slice(0, 10),
    };
  }, [
    allStudents,
    student.id,
    fridayAttendance,
    darsKtabAttendance,
    customEvents,
    customPoints,
    pointSettings,
    mal3abAttendance,
    summerClubAttendance,
    confessions,
  ]);

  // Clash Royale Arena & Level
  const arenaInfo = useMemo(() => {
    return getBoyArena(scoreBreakdown.totalScore);
  }, [scoreBreakdown.totalScore]);

  const levelInfo = useMemo(() => {
    return calculateBoyLevel(scoreBreakdown.totalScore);
  }, [scoreBreakdown.totalScore]);

  // Calculate Crowns (Quizzes completed + Attendance sessions)
  const crownsCount = useMemo(() => {
    const quizCrowns = quizzes.filter((q) => (q.completedStudentIds || []).includes(student.id)).length * 3;
    const fridayCrowns = scoreBreakdown.fridayCount * 2;
    const darsCrowns = scoreBreakdown.darsKtabCount * 2;
    return quizCrowns + fridayCrowns + darsCrowns;
  }, [quizzes, student.id, scoreBreakdown]);

  // 8-Card Battle Deck
  const myBadges = useMemo(() => {
    return studentBadges.filter((b) => b.studentId === student.id);
  }, [studentBadges, student.id]);

  const activeDeck = useMemo(() => {
    const list = [...myBadges].slice(0, 8);
    const slots = [];
    for (let i = 0; i < 8; i++) {
      slots.push(list[i] || null);
    }
    return slots;
  }, [myBadges]);

  // Active Psalm Request
  const myPsalmRequests = useMemo(() => {
    return mazmourRequests.filter((r) => r.studentId === student.id);
  }, [mazmourRequests, student.id]);

  const activePsalmRequest = useMemo(() => {
    return myPsalmRequests.find(
      (r) => r.status === 'requested' || r.status === 'approved' || r.status === 'ready_for_test'
    );
  }, [myPsalmRequests]);

  // The 4 Clash Royale Chest Slots
  const chestSlots: ClashChestSlot[] = useMemo(() => {
    const hasFriday = scoreBreakdown.fridayCount > 0;
    const hasDars = scoreBreakdown.darsKtabCount > 0;
    const hasActivePsalm = Boolean(activePsalmRequest);
    const crownGoal = 10;
    const crownProgress = crownsCount % crownGoal;

    return [
      {
        id: 'chest_friday',
        titleAr: 'صندوق القداس والجمعة',
        type: 'attendance',
        status: hasFriday ? 'claimed' : 'ready',
        rewardLabel: '+10 نقاط 🪙 + كؤوس',
        icon: '🏛️',
        color: '#facc15',
        description: 'صندوق ذهبي ينال عند حضور القداس الإلهي وحصة التربية الكنسية يوم الجمعة.',
      },
      {
        id: 'chest_darsktab',
        titleAr: 'صندوق درس الكتاب السحري',
        type: 'darsktab',
        status: hasDars ? 'claimed' : 'ready',
        rewardLabel: '+10 نقاط 🪙 + إكسير',
        icon: '📖',
        color: '#38bdf8',
        description: 'صندوق سحري ينال عند حضور اجتماع درس الكتاب المقدس يوم السبت بانتظام.',
      },
      {
        id: 'chest_psalm',
        titleAr: 'صندوق المزامير الملكي',
        type: 'psalm',
        status: hasActivePsalm ? 'ready' : 'locked',
        rewardLabel: 'وسام ذهبي 🎖️ + 30 نقطة',
        icon: '📜',
        color: '#a855f7',
        description: hasActivePsalm
          ? `لديك مزمور "${activePsalmRequest?.mazmourTitle}" جاهز للمراجعة والتسميع مع الخدام!`
          : 'اختر مزموراً من مزامير داود النبي واطلب تسميعه لفتح هذا الصندوق الأسطوري!',
      },
      {
        id: 'chest_crown',
        titleAr: 'صندوق الإكليل الفائق',
        type: 'crown',
        status: crownProgress >= 8 ? 'ready' : 'locked',
        rewardLabel: '+50 نقطة 🪙 + 3 بطاقات',
        icon: '👑',
        color: '#ec4899',
        description: `اجمع ١٠ تيجان من الحضور وحل الكويزات لفتح صندوق الإكليل الأكبر! (${crownProgress}/10 👑)`,
      },
    ];
  }, [scoreBreakdown, activePsalmRequest, crownsCount]);

  // Navigation mapper for external/child components calling onNavigateTab
  const handleNavigateAnyTab = (targetTab: string) => {
    sound.playCardFlip();
    if (targetTab === 'home' || targetTab === 'battle') {
      setActiveMainTab('battle');
    } else if (targetTab === 'score') {
      setActiveMainTab('clan');
      setClanSubTab('stats');
    } else if (targetTab === 'questions') {
      setActiveMainTab('clan');
      setClanSubTab('questions');
    } else if (targetTab === 'mzamer') {
      setActiveMainTab('events');
      setEventsSubTab('mzamer');
    } else if (targetTab === 'challenges') {
      setActiveMainTab('events');
      setEventsSubTab('challenges');
    } else if (targetTab === 'quizzes') {
      setActiveMainTab('events');
      setEventsSubTab('quizzes');
    } else if (targetTab === 'badges' || targetTab === 'cards') {
      setActiveMainTab('cards');
    } else if (targetTab === 'shop') {
      setActiveMainTab('shop');
    } else if (targetTab === 'clan') {
      setActiveMainTab('clan');
    } else if (targetTab === 'events') {
      setActiveMainTab('events');
    }
  };

  // Actions Handlers
  const handleRequestPsalm = async (m: MazmourDefinition) => {
    const newRequest: MazmourRequest = {
      id: `req_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      mazmourId: m.id,
      mazmourNumber: m.number,
      mazmourTitle: m.title,
      status: 'requested',
      requestedAt: new Date().toISOString(),
    };
    await db.saveMazmourRequest(newRequest);
    sound.playVictoryFanfare();
    await loadPortalData();
  };

  const handleMarkReadyForTest = async (reqId: string) => {
    const req = mazmourRequests.find((r) => r.id === reqId);
    if (!req) return;
    const updated: MazmourRequest = {
      ...req,
      status: 'ready_for_test',
    };
    await db.saveMazmourRequest(updated);
    sound.playSuccessChime();
    await loadPortalData();
  };

  const handleBuyShopItem = async (item: ShopItem): Promise<ShopOrder> => {
    const codeNumber = Math.floor(1000 + Math.random() * 9000);
    const newOrder: ShopOrder = {
      id: `order_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      itemId: item.id,
      itemTitle: item.title,
      pricePaid: item.price,
      status: 'pending',
      redemptionCode: `PRIZE-${codeNumber}`,
      orderedAt: new Date().toISOString(),
    };

    await db.createShopOrder(newOrder);

    await db.addCustomPointEntry({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      points: -item.price,
      reason: `شراء جائزة من المتجر: ${item.title} (كود: PRIZE-${codeNumber})`,
      servantName: 'الجوائز',
    });

    if (onRefreshData) {
      await onRefreshData();
    }
    sound.playVictoryFanfare();
    await loadPortalData();
    return newOrder;
  };

  const handleSubmitQuestion = async (q: {
    questionText: string;
    category: BoyQuestion['category'];
    isAnonymous: boolean;
  }) => {
    const newQ: BoyQuestion = {
      id: `q_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      questionText: q.questionText,
      category: q.category,
      isAnonymous: q.isAnonymous,
      createdAt: new Date().toISOString(),
    };
    await db.saveBoyQuestion(newQ);
    sound.playSuccessChime();
    await loadPortalData();
  };

  const handleClaimChallenge = async (chalId: string) => {
    const chal = challenges.find((c) => c.id === chalId);
    if (!chal) return;
    const pendingList = chal.pendingStudentIds || [];
    if (!pendingList.includes(student.id)) {
      const updated: BoyChallenge = {
        ...chal,
        pendingStudentIds: [...pendingList, student.id],
      };
      await db.saveBoyChallenge(updated);
      sound.playSuccessChime();
      await loadPortalData();
    }
  };

  const handleCompleteQuiz = async (quizId: string, scoreGained: number) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    const completedList = quiz.completedStudentIds || [];
    if (!completedList.includes(student.id)) {
      const updatedQuiz: BoyQuiz = {
        ...quiz,
        completedStudentIds: [...completedList, student.id],
      };
      await db.saveBoyQuiz(updatedQuiz);

      await db.addCustomPointEntry({
        studentId: student.id,
        date: new Date().toISOString().split('T')[0],
        points: scoreGained,
        reason: `اجتياز مسابقة: ${quiz.title}`,
        servantName: 'المسابقات',
      });

      const newBadge: StudentBadge = {
        id: `sbadge_${Date.now()}`,
        studentId: student.id,
        badgeId: quiz.badgeId,
        badgeName: quiz.badgeName,
        badgeTier: quiz.badgeTier,
        icon: quiz.badgeIcon,
        imageUrl: quiz.badgeImageUrl,
        color: '#f59e0b',
        category: 'quiz',
        awardedAt: new Date().toISOString(),
        reason: `اجتياز مسابقة ${quiz.title} بامتياز`,
        pointsAwarded: scoreGained,
      };
      await db.awardStudentBadge(newBadge);

      if (onRefreshData) {
        await onRefreshData();
      }
      sound.playVictoryFanfare();
      await loadPortalData();
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    await db.markBoyNotificationRead(id);
    await loadPortalData();
  };

  const handleMarkAllNotifsRead = async () => {
    for (const n of notifications) {
      if (!n.read) await db.markBoyNotificationRead(n.id);
    }
    await loadPortalData();
  };

  const handleRequestBrowserNotification = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        sound.playVictoryFanfare();
        new Notification('أسرة البابا ساويرس 🌟', {
          body: `أهلاً بك يا ${student.arabicName || student.name}! تم تفعيل الإشعارات الملكية بنجاح.`,
          icon: '/favicon.svg',
        });
      }
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const activeChallengesCount = challenges.filter(
    (c) => c.isActive && !(c.completedStudentIds || []).includes(student.id)
  ).length;

  return (
    <div className="cr-portal">
      <div className="cr-arena-ambient" />

      {/* CLASH ROYALE TOP RESOURCE HEADER */}
      <header className="cr-top-header">
        <div className="cr-top-header-inner">
          {/* Left: Player Profile Badge & Arena Badge */}
          <div
            onClick={() => {
              sound.playBattleClick();
              setActiveMainTab('clan');
              setClanSubTab('stats');
            }}
            className="cr-header-profile"
            title="عرض ملف البطل وسجل الإحصائيات"
          >
            {/* Level Star Badge */}
            <div className="cr-level-star">
              <span>{levelInfo.level}</span>
              <span className="cr-level-star-icon">⭐</span>
            </div>

            <div className="cr-profile-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="cr-text-shadow cr-player-name">
                  {student.arabicName || student.name}
                </span>
                <span className="cr-player-badge-pill">
                  بطل 👑
                </span>
              </div>
              <div className="cr-arena-subtitle">
                {arenaInfo.currentArena.icon} {arenaInfo.currentArena.nameAr}
              </div>
            </div>
          </div>

          {/* Right: Clash Royale Top Resources Bar */}
          <div className="cr-resource-bar">
            {/* Gold Coins (Points) */}
            <div
              onClick={() => {
                sound.playBattleClick();
                setActiveMainTab('shop');
              }}
              className="cr-resource-pill"
              title="رصيد النقاط الذهبية (اضغط لفتح المتجر)"
              style={{ cursor: 'pointer' }}
            >
              <div
                className="cr-resource-icon"
                style={{
                  background: 'linear-gradient(180deg, #fde047 0%, #eab308 60%, #ca8a04 100%)',
                  border: '1.5px solid #ffffff',
                  color: '#713f12',
                }}
              >
                🪙
              </div>
              <span style={{ color: '#fde047' }}>
                {settings.hideScores ? '🔒' : scoreBreakdown.totalScore}
              </span>
            </div>

            {/* Trophies */}
            <div
              onClick={() => {
                sound.playBattleClick();
                setActiveMainTab('clan');
                setClanSubTab('leaderboard');
              }}
              className="cr-resource-pill"
              title="الكؤوس والترتيب العام (اضغط لعرض الترتيب)"
              style={{ cursor: 'pointer' }}
            >
              <div
                className="cr-resource-icon"
                style={{
                  background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                  border: '1.5px solid #ffffff',
                  color: '#ffffff',
                }}
              >
                🏆
              </div>
              <span style={{ color: '#fbbf24' }}>
                {settings.hideScores ? '🔒' : scoreBreakdown.totalScore}
              </span>
            </div>

            {/* Crowns */}
            <div
              className="cr-resource-pill"
              title="التيجان المحققة من الكويزات والأنشطة"
            >
              <div
                className="cr-resource-icon"
                style={{
                  background: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
                  border: '1.5px solid #ffffff',
                  color: '#ffffff',
                }}
              >
                👑
              </div>
              <span style={{ color: '#f472b6' }}>
                {crownsCount}
              </span>
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => {
                sound.playBattleClick();
                setIsNotifModalOpen(true);
              }}
              className="cr-btn cr-btn-blue cr-header-icon-btn"
              title="الإشعارات الملكية"
            >
              <Bell size={17} />
              {unreadNotifsCount > 0 && (
                <span className="cr-nav-badge" style={{ top: '-4px', right: '-4px' }}>
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* PWA Install */}
            {onInstallApp && !isAppInstalled && (
              <button
                type="button"
                onClick={onInstallApp}
                className="cr-btn cr-btn-green cr-header-action-btn"
                title="تثبيت التطبيق على الموبايل"
              >
                <Download size={14} />
                <span className="hide-on-mobile">تثبيت</span>
              </button>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                sound.playBattleClick();
                onLogout();
              }}
              className="cr-btn cr-btn-red cr-header-action-btn"
              title="تسجيل الخروج"
            >
              <LogOut size={14} />
              <span className="hide-on-mobile">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="cr-main-content">
        {/* =========================================================
            TAB 1: ⚔️ BATTLE / ARENA (The Signature Clash Royale Home)
           ========================================================= */}
        {activeMainTab === 'battle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Arena Stadium Card with Torches */}
            <div className="cr-arena-box">
              {/* Torches on Corners */}
              <div style={{ position: 'absolute', top: 16, left: 16, fontSize: '1.6rem', filter: 'drop-shadow(0 0 12px #f97316)' }}>
                🔥
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '1.6rem', filter: 'drop-shadow(0 0 12px #f97316)' }}>
                🔥
              </div>

              <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                <span
                  style={{
                    background: 'linear-gradient(180deg, #facc15 0%, #ca8a04 100%)',
                    border: '1.5px solid #ffffff',
                    color: '#713f12',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    padding: '3px 12px',
                    borderRadius: '999px',
                    display: 'inline-block',
                    marginBottom: '0.5rem',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                  }}
                >
                  الساحة الحالية (الساحة {arenaInfo.currentArena.id}) 🏆
                </span>

                <h1 className="cr-gold-title cr-text-shadow-heavy" style={{ margin: '0 0 0.4rem', fontSize: '1.85rem' }}>
                  {arenaInfo.currentArena.icon} {arenaInfo.currentArena.nameAr}
                </h1>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                  كؤوسك الحالية: {settings.hideScores ? '🔒 سرية' : `${scoreBreakdown.totalScore} 🏆`}
                </p>

                {/* Trophy Road Progress Bar */}
                <div style={{ maxWidth: '480px', margin: '1.25rem auto 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#fde68a', fontWeight: 800, marginBottom: '0.35rem' }}>
                    <span>{arenaInfo.currentArena.minTrophies} 🏆</span>
                    <span>
                      {arenaInfo.nextArena
                        ? `باقي ${arenaInfo.trophiesRemaining} كؤوس لـ ${arenaInfo.nextArena.nameAr}`
                        : 'وصلت لأعلى ساحة أسطورية! 👑'}
                    </span>
                    <span>{arenaInfo.nextArena ? `${arenaInfo.nextArena.minTrophies} 🏆` : 'Max'}</span>
                  </div>

                  <div className="cr-trophy-bar-bg">
                    <div
                      className="cr-trophy-bar-fill"
                      style={{ width: `${arenaInfo.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* THE GIANT CLASH ROYALE BATTLE BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  sound.playBattleClick();
                  setIsBattleLaunchModalOpen(true);
                }}
                className="cr-btn cr-btn-battle"
                style={{ width: '100%', maxWidth: '440px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>⚔️</span>
                  <span>انطلق للمعركة والمهام!</span>
                  <span style={{ fontSize: '1.8rem' }}>⚔️</span>
                </div>
              </button>
            </div>

            {/* 4 CLASH ROYALE CHEST SLOTS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="cr-gold-title cr-text-shadow" style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  🎁 صناديق الجوائز الملكية (Chest Slots)
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>اضغط على أي صندوق لتفاصيله</span>
              </div>

              <div className="cr-chest-slots-grid">
                {chestSlots.map((chest) => {
                  const isReady = chest.status === 'ready';
                  const isClaimed = chest.status === 'claimed';

                  return (
                    <div
                      key={chest.id}
                      onClick={() => {
                        sound.playChestUnlock();
                        setSelectedChestForModal(chest);
                      }}
                      className={`cr-chest-slot ${isReady ? 'cr-chest-ready' : ''}`}
                    >
                      <div className="chest-icon" style={{ fontSize: '1.8rem', marginBottom: '0.25rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                        {chest.icon}
                      </div>

                      <div
                        className="chest-title"
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          marginBottom: '0.35rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {chest.titleAr}
                      </div>

                      <span
                        className="chest-status-pill"
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background: isReady ? '#22c55e' : isClaimed ? '#0284c7' : '#334155',
                          color: '#ffffff',
                          textShadow: '0 1px 2px #000',
                        }}
                      >
                        {isReady ? 'جاهز! 🎁' : isClaimed ? 'مكتمل ✅' : 'مغلق 🔒'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE 8-CARD BATTLE DECK PREVIEW */}
            <div className="cr-stone-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="cr-gold-title cr-text-shadow" style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  🃏 تشكيلتك النشطة الحالية (8-Card Battle Deck)
                </span>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setActiveMainTab('cards');
                  }}
                  className="cr-btn cr-btn-blue"
                  style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                >
                  <span>تعديل التشكيلة وعرض البطاقات</span>
                  <ChevronRight size={14} />
                </button>
              </div>

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
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                      >
                        فارغ {idx + 1}
                      </div>
                    );
                  }

                  const tierStyle = TIER_STYLES[badge.badgeTier || 'gold'];
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
                      onClick={() => {
                        sound.playCardFlip();
                        setActiveMainTab('cards');
                      }}
                      className={`cr-card ${rarityClass}`}
                    >
                      <div className="cr-card-elixir">5</div>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: tierStyle.bgGradient,
                          border: `1.5px solid ${tierStyle.borderColor}`,
                          alignSelf: 'center',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderBadgeIconOrImage(badge, 22, tierStyle.textColor)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          textAlign: 'center',
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
                        Lv. 10
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgent Announcements Banner / Ticker */}
            {announcements.length > 0 && (
              <div
                className="cr-wood-frame"
                style={{
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                  📢
                </div>
                <div style={{ flex: 1 }}>
                  <div className="cr-gold-title cr-text-shadow" style={{ fontSize: '0.92rem', fontWeight: 900 }}>
                    {announcements[0].title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#fef3c7', lineHeight: 1.4 }}>
                    {announcements[0].content}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setActiveMainTab('clan');
                    setClanSubTab('news');
                  }}
                  className="cr-btn cr-btn-yellow"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  جميع الأخبار
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: 🃏 CARDS & 8-CARD BATTLE DECK
           ========================================================= */}
        {activeMainTab === 'cards' && (
          <BoyBadgesView
            student={student}
            studentBadges={studentBadges}
          />
        )}

        {/* =========================================================
            TAB 3: 🛒 ROYAL SHOP & CHESTS
           ========================================================= */}
        {activeMainTab === 'shop' && (
          <BoyShopView
            student={student}
            items={shopItems}
            orders={shopOrders}
            studentScore={scoreBreakdown.totalScore}
            hideScores={settings.hideScores}
            isShopEnabled={settings.isShopEnabled}
            onBuyItem={handleBuyShopItem}
          />
        )}

        {/* =========================================================
            TAB 4: 🛡️ CLAN & CLASS (Rank, Score, Q&A, News)
           ========================================================= */}
        {activeMainTab === 'clan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Clan Banner Card */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                  }}
                >
                  🛡️
                </div>
                <div>
                  <h2 className="cr-gold-title cr-text-shadow" style={{ margin: 0, fontSize: '1.3rem' }}>
                    قبيلة وفصل البابا ساويرس 4
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#fde68a' }}>
                    {settings.hideLeaderboard ? (
                      'الترتيب العام: 🔒 مخفي مؤقتاً بواسطة الخدام 🛡️'
                    ) : (
                      `ترتيبك في القبيلة: #${classRank.rank} من ${allStudents.length} بطل 🏆`
                    )}
                  </p>
                </div>
              </div>

              {/* Clan Sub-Tabs Buttons */}
              <div className="cr-subtabs-scroll">
                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setClanSubTab('leaderboard');
                  }}
                  className={`cr-btn ${clanSubTab === 'leaderboard' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  🏆 الترتيب {settings.hideLeaderboard ? '🔒' : ''}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setClanSubTab('stats');
                  }}
                  className={`cr-btn ${clanSubTab === 'stats' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  📊 سجل نقاطي
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setClanSubTab('questions');
                  }}
                  className={`cr-btn ${clanSubTab === 'questions' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  💬 اسأل الخادم
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setClanSubTab('news');
                  }}
                  className={`cr-btn ${clanSubTab === 'news' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  📢 الإعلانات
                </button>
              </div>
            </div>

            {/* Sub-View Content */}
            {clanSubTab === 'leaderboard' && (
              settings.hideLeaderboard ? (
                <div className="cr-stone-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🏆🔒</div>
                  <h3 className="cr-gold-title cr-text-shadow" style={{ margin: '0 0 0.75rem', fontSize: '1.3rem' }}>
                    لوحة المتصدرين مغلقة حالياً
                  </h3>
                  <p style={{ margin: '0 auto', maxWidth: '440px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    قام الخدام بإخفاء ترتيب الأبطال مؤقتاً لمزيد من التشويق والتنافس الإيجابي بين الجميع! 🛡️✨
                    <br />
                    واصل جمع الكؤوس والأوسمة والمشاركة في التحديات، وسيتم إعلان الترتيب قريباً!
                  </p>
                </div>
              ) : (
                <div className="cr-stone-panel" style={{ padding: '1.25rem' }}>
                  <h3 className="cr-gold-title cr-text-shadow" style={{ margin: '0 0 1rem', fontSize: '1.2rem' }}>
                    لوحة شرف أبطال القبيلة (Top Champions)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {classRank.topStudents.map((stu, i) => {
                      const isMe = stu.id === student.id;
                      const crownColor = i === 0 ? '#fde047' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : '#94a3b8';

                      return (
                        <div
                          key={stu.id}
                          style={{
                            background: isMe ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.8)',
                            border: isMe ? '2px solid #38bdf8' : '1px solid #334155',
                            borderRadius: '14px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: isMe ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: crownColor, minWidth: '28px' }}>
                              {i === 0 ? '👑 1' : i === 1 ? '🥈 2' : i === 2 ? '🥉 3' : `#${i + 1}`}
                            </span>
                            <span style={{ fontWeight: 800, color: isMe ? '#38bdf8' : '#f8fafc', fontSize: '0.95rem' }}>
                              {stu.name} {isMe ? '(أنت) ⭐' : ''}
                            </span>
                          </div>

                          <div className="cr-resource-pill">
                            <span>🏆</span>
                            <span style={{ color: '#fbbf24' }}>
                              {settings.hideScores ? '🔒' : stu.score}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {clanSubTab === 'stats' && (
              <BoyScoreView
                student={student}
                scoreBreakdown={scoreBreakdown}
                hideScores={settings.hideScores}
                hideLeaderboard={settings.hideLeaderboard}
                classRank={classRank.rank}
                totalStudentsCount={allStudents.length}
              />
            )}

            {clanSubTab === 'questions' && (
              <BoyAskQuestionView
                student={student}
                questions={questions}
                onSubmitQuestion={handleSubmitQuestion}
              />
            )}

            {clanSubTab === 'news' && (
              <BoyAnnouncementsView
                student={student}
                announcements={announcements}
                score={scoreBreakdown.totalScore}
                hideScores={settings.hideScores}
                activePsalmsCount={myPsalmRequests.filter((r) => r.status === 'requested' || r.status === 'approved').length}
                activeChallengesCount={activeChallengesCount}
                badgesCount={myBadges.length}
                onNavigateTab={handleNavigateAnyTab}
              />
            )}
          </div>
        )}

        {/* =========================================================
            TAB 5: 📜 EVENTS, QUESTS & MAZAMER
           ========================================================= */}
        {activeMainTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Events Top Bar */}
            <div
              className="cr-wood-frame"
              style={{
                padding: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>📜</span>
                <div>
                  <h2 className="cr-gold-title cr-text-shadow" style={{ margin: 0, fontSize: '1.3rem' }}>
                    الأحداث والمهام الملكية
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#fde68a' }}>
                    احفظ المزامير، أكمل التحديات الأسبوعية، وحل الكويزات لتفوز بأكبر التيجان والأوسمة! 🏆
                  </p>
                </div>
              </div>

              {/* Events Sub-Tabs */}
              <div className="cr-subtabs-scroll">
                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setEventsSubTab('mzamer');
                  }}
                  className={`cr-btn ${eventsSubTab === 'mzamer' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  📜 مزامير داود
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setEventsSubTab('challenges');
                  }}
                  className={`cr-btn ${eventsSubTab === 'challenges' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  ⚔️ التحديات ({activeChallengesCount})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBattleClick();
                    setEventsSubTab('quizzes');
                  }}
                  className={`cr-btn ${eventsSubTab === 'quizzes' ? 'cr-btn-yellow' : 'cr-btn-blue'}`}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  ⚡ الكويزات ({quizzes.length})
                </button>
              </div>
            </div>

            {/* Events Sub-views */}
            {eventsSubTab === 'mzamer' && (
              <BoyMzamerView
                student={student}
                mazamer={mazamer}
                requests={mazmourRequests}
                onRequestPsalm={handleRequestPsalm}
                onMarkReadyForTest={handleMarkReadyForTest}
              />
            )}

            {eventsSubTab === 'challenges' && (
              <BoyChallengesView
                student={student}
                challenges={challenges}
                onClaimChallenge={handleClaimChallenge}
              />
            )}

            {eventsSubTab === 'quizzes' && (
              <BoyQuizzesView
                student={student}
                quizzes={quizzes}
                onCompleteQuiz={handleCompleteQuiz}
              />
            )}
          </div>
        )}
      </main>

      {/* CLASH ROYALE 5-TAB BOTTOM NAVIGATION BAR */}
      <nav className="cr-navbar" aria-label="Clash Royale Bottom Navigation">
        {/* Tab 1: Shop */}
        <button
          type="button"
          onClick={() => {
            sound.playCardFlip();
            setActiveMainTab('shop');
          }}
          className={`cr-nav-tab ${activeMainTab === 'shop' ? 'active' : ''}`}
        >
          <div className="cr-nav-icon-box">
            <ShoppingBag size={20} />
          </div>
          <span className="cr-nav-label">المتجر</span>
        </button>

        {/* Tab 2: Cards & Deck */}
        <button
          type="button"
          onClick={() => {
            sound.playCardFlip();
            setActiveMainTab('cards');
          }}
          className={`cr-nav-tab ${activeMainTab === 'cards' ? 'active' : ''}`}
        >
          <div className="cr-nav-icon-box">
            <Layers size={20} />
          </div>
          <span className="cr-nav-label">البطاقات</span>
        </button>

        {/* Tab 3: BATTLE / ARENA (Centerpiece) */}
        <button
          type="button"
          onClick={() => {
            sound.playCardFlip();
            setActiveMainTab('battle');
          }}
          className={`cr-nav-tab ${activeMainTab === 'battle' ? 'active' : ''}`}
        >
          <div className="cr-nav-icon-box">
            <Shield size={22} />
          </div>
          <span className="cr-nav-label">الساحة</span>
        </button>

        {/* Tab 4: Clan & Class */}
        <button
          type="button"
          onClick={() => {
            sound.playCardFlip();
            setActiveMainTab('clan');
          }}
          className={`cr-nav-tab ${activeMainTab === 'clan' ? 'active' : ''}`}
        >
          <div className="cr-nav-icon-box">
            <Crown size={20} />
          </div>
          <span className="cr-nav-label">القبيلة</span>
        </button>

        {/* Tab 5: Events & Quests */}
        <button
          type="button"
          onClick={() => {
            sound.playCardFlip();
            setActiveMainTab('events');
          }}
          className={`cr-nav-tab ${activeMainTab === 'events' ? 'active' : ''}`}
        >
          <div className="cr-nav-icon-box">
            <Sparkles size={20} />
          </div>
          <span className="cr-nav-label">المهام</span>
          {activeChallengesCount > 0 && (
            <span className="cr-nav-badge">
              {activeChallengesCount}
            </span>
          )}
        </button>
      </nav>

      {/* CLASH ROYALE CHEST INSPECT / UNLOCK MODAL */}
      {selectedChestForModal && (
        <div className="cr-modal-backdrop" onClick={() => setSelectedChestForModal(null)}>
          <div
            className="cr-modal-card cr-wood-frame"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              width: '92%',
              padding: '2rem 1.5rem',
              textAlign: 'center',
            }}
          >
            {/* 3D Chest Visual */}
            <div
              style={{
                fontSize: '4.5rem',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8)) drop-shadow(0 0 25px rgba(250, 204, 21, 0.5))',
                marginBottom: '1rem',
                animation: 'crBounceBadge 1.2s infinite alternate ease-in-out',
              }}
            >
              {selectedChestForModal.icon}
            </div>

            <h3 className="cr-gold-title cr-text-shadow-heavy" style={{ margin: '0 0 0.5rem', fontSize: '1.45rem' }}>
              {selectedChestForModal.titleAr}
            </h3>

            <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {selectedChestForModal.description}
            </p>

            {/* Chest Reward Box */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1.5px solid #334155',
                borderRadius: '14px',
                padding: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>المكافأة المحتملة:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fde047' }}>
                {selectedChestForModal.rewardLabel}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  sound.playSuccessChime();
                  setSelectedChestForModal(null);
                  if (selectedChestForModal.type === 'psalm') {
                    setActiveMainTab('events');
                    setEventsSubTab('mzamer');
                  } else if (selectedChestForModal.type === 'crown') {
                    setActiveMainTab('events');
                    setEventsSubTab('quizzes');
                  }
                }}
                className="cr-btn cr-btn-green"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
              >
                {selectedChestForModal.status === 'ready' ? 'فتح واستلام 🎁' : 'اذهب للمهمة ⚔️'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedChestForModal(null)}
                className="cr-btn cr-btn-blue"
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK BATTLE LAUNCH MODAL */}
      {isBattleLaunchModalOpen && (
        <div className="cr-modal-backdrop" onClick={() => setIsBattleLaunchModalOpen(false)}>
          <div
            className="cr-modal-card cr-wood-frame"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              width: '92%',
              padding: '1.75rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚔️</div>
            <h3 className="cr-gold-title cr-text-shadow-heavy" style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>
              اختر وجهتك للمعركة اليوم!
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              أين تريد خوض التحدي القادم وكسب الكؤوس والتيجان؟
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  sound.playBattleClick();
                  setIsBattleLaunchModalOpen(false);
                  setActiveMainTab('events');
                  setEventsSubTab('mzamer');
                }}
                className="cr-btn cr-btn-yellow"
                style={{ padding: '0.85rem', fontSize: '1rem', width: '100%' }}
              >
                📜 تسميع مزمور داود النبي (حتى +30 نقطة)
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playBattleClick();
                  setIsBattleLaunchModalOpen(false);
                  setActiveMainTab('events');
                  setEventsSubTab('challenges');
                }}
                className="cr-btn cr-btn-purple"
                style={{ padding: '0.85rem', fontSize: '1rem', width: '100%' }}
              >
                ⚔️ التحديات الأسبوعية المستمرة
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playBattleClick();
                  setIsBattleLaunchModalOpen(false);
                  setActiveMainTab('events');
                  setEventsSubTab('quizzes');
                }}
                className="cr-btn cr-btn-green"
                style={{ padding: '0.85rem', fontSize: '1rem', width: '100%' }}
              >
                ⚡ كويز ومسابقات سريعة (+تيجان)
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playBattleClick();
                  setIsBattleLaunchModalOpen(false);
                  setActiveMainTab('clan');
                  setClanSubTab('leaderboard');
                }}
                className="cr-btn cr-btn-blue"
                style={{ padding: '0.85rem', fontSize: '1rem', width: '100%' }}
              >
                🏆 لوحة شرف أبطال الفصل
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsBattleLaunchModalOpen(false)}
              className="cr-btn"
              style={{
                marginTop: '1rem',
                background: 'transparent',
                borderColor: '#64748b',
                color: '#94a3b8',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
              }}
            >
              إلغاء والعودة للساحة
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      <BoyNotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onNavigateTab={handleNavigateAnyTab}
        onRequestBrowserNotification={handleRequestBrowserNotification}
        browserPermission={browserPermission}
      />
    </div>
  );
};
