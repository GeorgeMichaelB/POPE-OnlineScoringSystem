import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Trophy,
  BookOpen,
  ShoppingBag,
  HelpCircle,
  Flame,
  Sparkles,
  Award,
  Bell,
  LogOut,
  Download,
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
import { BoyScoreView } from './BoyScoreView';
import { BoyMzamerView } from './BoyMzamerView';
import { BoyShopView } from './BoyShopView';
import { BoyAskQuestionView } from './BoyAskQuestionView';
import { BoyChallengesView } from './BoyChallengesView';
import { BoyQuizzesView } from './BoyQuizzesView';
import { BoyBadgesView } from './BoyBadgesView';
import { BoyNotificationsModal } from './BoyNotificationsModal';

export type BoyPortalTab =
  | 'home'
  | 'score'
  | 'mzamer'
  | 'shop'
  | 'questions'
  | 'challenges'
  | 'quizzes'
  | 'badges';

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
  const [activeTab, setActiveTab] = useState<BoyPortalTab>('home');

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

  // Calculate Student Score
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
      return { id: s.id, score: sc.totalScore };
    });

    scores.sort((a, b) => b.score - a.score);
    const index = scores.findIndex((x) => x.id === student.id);
    return index >= 0 ? index + 1 : 1;
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

  // Request Psalm Action
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
    await loadPortalData();
  };

  // Mark Psalm Ready for Test
  const handleMarkReadyForTest = async (reqId: string) => {
    const req = mazmourRequests.find((r) => r.id === reqId);
    if (!req) return;
    const updated: MazmourRequest = {
      ...req,
      status: 'ready_for_test',
    };
    await db.saveMazmourRequest(updated);
    await loadPortalData();
  };

  // Buy Shop Item
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

    // Deduct points via custom point entry
    await db.addCustomPointEntry({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      points: -item.price,
      reason: `شراء جائزة من المتجر: ${item.title} (كود: PRIZE-${codeNumber})`,
      servantName: 'الجوائز ',
    });

    if (onRefreshData) {
      await onRefreshData();
    }
    await loadPortalData();
    return newOrder;
  };

  // Submit Question
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
    await loadPortalData();
  };

  // Claim Challenge
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
      await loadPortalData();
    }
  };

  // Complete Quiz
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

      // Award points
      await db.addCustomPointEntry({
        studentId: student.id,
        date: new Date().toISOString().split('T')[0],
        points: scoreGained,
        reason: `اجتياز مسابقة: ${quiz.title}`,
        servantName: 'المسابقات',
      });

      // Award Badge
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
      await loadPortalData();
    }
  };

  // Notifications Handlers
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
        sound.playSuccessChime();
        new Notification('أسرة البابا ساويرس 🌟', {
          body: `أهلاً بك يا ${student.arabicName || student.name}! تم تفعيل الإشعارات بنجاح.`,
          icon: '/favicon.svg',
        });
      }
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="boy-portal-theme"
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Cyber Gamer Header */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '0.75rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand & Student Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#0f172a',
              fontSize: '1.1rem',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
            }}
          >
            {(student.arabicName || student.name).charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f8fafc' }}>
                {student.arabicName || student.name}
              </span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                }}
              >
                بطل
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Pope Saweros Class • {student.id}
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Quick Score Chip */}
          <div
            onClick={() => setActiveTab('score')}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '10px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <Trophy size={15} color="#fbbf24" />
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fbbf24' }}>
              {settings.hideScores ? '🔒' : scoreBreakdown.totalScore}
            </span>
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotifModalOpen(true)}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '6px 8px',
              color: '#f8fafc',
              position: 'relative',
              cursor: 'pointer',
            }}
            title="الإشعارات والتنبيهات"
          >
            <Bell size={18} />
            {unreadNotifsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* PWA Install Button */}
          {onInstallApp && !isAppInstalled && (
            <button
              type="button"
              onClick={onInstallApp}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '5px 10px',
                color: '#0f172a',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
              title="تثبيت التطبيق على الموبايل كبرنامج PWA"
            >
              <Download size={14} />
              <span className="hide-on-very-small">تثبيت التطبيق</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '6px 10px',
              color: '#f87171',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
            }}
            title="تسجيل الخروج"
          >
            <LogOut size={15} />
            <span className="hide-on-very-small">خروج</span>
          </button>
        </div>
      </header>

      {/* Desktop / Tablet Sub-Navbar Bar */}
      <nav
        style={{
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '0.5rem 1.25rem',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          style={{
            background: activeTab === 'home' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'home' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'home' ? '#38bdf8' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Megaphone size={16} />
          الرئيسية والإعلانات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('score')}
          style={{
            background: activeTab === 'score' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: activeTab === 'score' ? '1px solid #f59e0b' : '1px solid transparent',
            color: activeTab === 'score' ? '#fbbf24' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Trophy size={16} />
          نقاطي وترتيبي
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mzamer')}
          style={{
            background: activeTab === 'mzamer' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'mzamer' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'mzamer' ? '#38bdf8' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <BookOpen size={16} />
          المزامير (داود)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shop')}
          style={{
            background: activeTab === 'shop' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: activeTab === 'shop' ? '1px solid #10b981' : '1px solid transparent',
            color: activeTab === 'shop' ? '#34d399' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <ShoppingBag size={16} />
          متجر الجوائز
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          style={{
            background: activeTab === 'challenges' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
            border: activeTab === 'challenges' ? '1px solid #f97316' : '1px solid transparent',
            color: activeTab === 'challenges' ? '#fb923c' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Flame size={16} />
          التحديات والمهام
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          style={{
            background: activeTab === 'quizzes' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            border: activeTab === 'quizzes' ? '1px solid #a855f7' : '1px solid transparent',
            color: activeTab === 'quizzes' ? '#c084fc' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={16} />
          المسابقات والكويزات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          style={{
            background: activeTab === 'badges' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
            border: activeTab === 'badges' ? '1px solid #ec4899' : '1px solid transparent',
            color: activeTab === 'badges' ? '#f472b6' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Award size={16} />
          أوسمتي الشرفية
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          style={{
            background: activeTab === 'questions' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'questions' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'questions' ? '#38bdf8' : '#94a3b8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <HelpCircle size={16} />
          اسأل الخادم
        </button>
      </nav>

      {/* Main Tab Content Area */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1080px', width: '100%', margin: '0 auto', boxSizing: 'border-box', paddingBottom: '5rem' }}>
        {activeTab === 'home' && (
          <BoyAnnouncementsView
            student={student}
            announcements={announcements}
            score={scoreBreakdown.totalScore}
            hideScores={settings.hideScores}
            activePsalmsCount={mazmourRequests.filter((r) => r.studentId === student.id && (r.status === 'requested' || r.status === 'approved')).length}
            activeChallengesCount={challenges.filter((c) => c.isActive && !(c.completedStudentIds || []).includes(student.id)).length}
            badgesCount={studentBadges.filter((b) => b.studentId === student.id).length}
            onNavigateTab={(tab) => setActiveTab(tab as BoyPortalTab)}
          />
        )}

        {activeTab === 'score' && (
          <BoyScoreView
            student={student}
            scoreBreakdown={scoreBreakdown}
            hideScores={settings.hideScores}
            classRank={classRank}
            totalStudentsCount={allStudents.length}
          />
        )}

        {activeTab === 'mzamer' && (
          <BoyMzamerView
            student={student}
            mazamer={mazamer}
            requests={mazmourRequests}
            onRequestPsalm={handleRequestPsalm}
            onMarkReadyForTest={handleMarkReadyForTest}
          />
        )}

        {activeTab === 'shop' && (
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

        {activeTab === 'challenges' && (
          <BoyChallengesView
            student={student}
            challenges={challenges}
            onClaimChallenge={handleClaimChallenge}
          />
        )}

        {activeTab === 'quizzes' && (
          <BoyQuizzesView
            student={student}
            quizzes={quizzes}
            onCompleteQuiz={handleCompleteQuiz}
          />
        )}

        {activeTab === 'badges' && (
          <BoyBadgesView
            student={student}
            studentBadges={studentBadges}
          />
        )}

        {activeTab === 'questions' && (
          <BoyAskQuestionView
            student={student}
            questions={questions}
            onSubmitQuestion={handleSubmitQuestion}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.45rem 0.25rem',
          zIndex: 100,
        }}
        aria-label="Mobile Navigation"
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'home' ? '#38bdf8' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '0.68rem',
            fontWeight: activeTab === 'home' ? 800 : 600,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          <Megaphone size={19} />
          <span>الرئيسية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('score')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'score' ? '#fbbf24' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '0.68rem',
            fontWeight: activeTab === 'score' ? 800 : 600,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          <Trophy size={19} />
          <span>نقاطي</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mzamer')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'mzamer' ? '#38bdf8' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '0.68rem',
            fontWeight: activeTab === 'mzamer' ? 800 : 600,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          <BookOpen size={19} />
          <span>المزامير</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shop')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'shop' ? '#34d399' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '0.68rem',
            fontWeight: activeTab === 'shop' ? 800 : 600,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          <ShoppingBag size={19} />
          <span>المتجر</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'badges' ? '#f472b6' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '0.68rem',
            fontWeight: activeTab === 'badges' ? 800 : 600,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          <Award size={19} />
          <span>أوسمتي</span>
        </button>
      </nav>

      {/* Notifications Modal */}
      <BoyNotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onNavigateTab={(tab) => setActiveTab(tab as BoyPortalTab)}
        onRequestBrowserNotification={handleRequestBrowserNotification}
        browserPermission={browserPermission}
      />
    </div>
  );
};
