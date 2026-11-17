import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  ShoppingBag,
  BookOpen,
  Flame,
  Sparkles,
  HelpCircle,
  Award,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Eye,
  Search,
  Crown,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  X,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import type {
  Student,
  BoyPortalSettings,
  Announcement,
  ShopItem,
  ShopOrder,
  MazmourDefinition,
  MazmourRequest,
  BoyChallenge,
  BoyQuiz,
  BoyQuestion,
  StudentBadge,
  BadgeDefinition,
  QuizQuestion,
  QuestionType,
} from '../types';
import { db } from '../services/db';
import { sound } from '../services/sound';
import {
  ALL_1000_BADGES,
  TIER_STYLES,
} from '../services/badgesEngine';
import { BadgePickerModal, renderBadgeIconOrImage } from './BadgePickerModal';
import { ImageUploadInput } from './ImageUploadInput';

export type ServantPortalTab =
  | 'overview'
  | 'announcements'
  | 'shop'
  | 'mazamer'
  | 'challenges'
  | 'quizzes'
  | 'questions'
  | 'badge_picker'
  | 'badge_report';

interface ServantsBoysPortalProps {
  students: Student[];
  currentServantName: string;
  onRefreshParentData?: () => Promise<void>;
}

export const ServantsBoysPortal: React.FC<ServantsBoysPortalProps> = ({
  students,
  currentServantName,
  onRefreshParentData,
}) => {
  const [activeTab, setActiveTab] = useState<ServantPortalTab>('overview');

  // Async data states
  const [settings, setSettings] = useState<BoyPortalSettings>({
    hideScores: false,
    hideLeaderboard: false,
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

  // Modals & Forms
  const [isBadgePickerOpen, setIsBadgePickerOpen] = useState(false);
  const [badgePickerCallback, setBadgePickerCallback] = useState<((badge: BadgeDefinition) => void) | null>(null);

  // Announcement Modal
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annTarget, setAnnTarget] = useState<'boys' | 'parents' | 'all'>('boys');
  const [annPinned, setAnnPinned] = useState(false);
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent' | 'celebration'>('normal');

  // Shop Item Modal
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [editingShopItem, setEditingShopItem] = useState<ShopItem | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState(50);
  const [itemStock, setItemStock] = useState(10);
  const [itemIcon, setItemIcon] = useState('Package');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemEnabled, setItemEnabled] = useState(true);
  const [itemCategory, setItemCategory] = useState('هدايا عامة');

  // Mazmour Modal
  const [isMazmourModalOpen, setIsMazmourModalOpen] = useState(false);
  const [editingMazmour, setEditingMazmour] = useState<MazmourDefinition | null>(null);
  const [mazNum, setMazNum] = useState(1);
  const [mazTitle, setMazTitle] = useState('');
  const [mazRef, setMazRef] = useState('');
  const [mazText, setMazText] = useState('');
  const [mazWeek1Score, setMazWeek1Score] = useState(30);
  const [mazWeek2Score, setMazWeek2Score] = useState(20);
  const [mazAfterScore, setMazAfterScore] = useState(10);
  const [mazMaxDrop, setMazMaxDrop] = useState(21);

  // Recitation Confirmation Modal
  const [recitationModalRequest, setRecitationModalRequest] = useState<MazmourRequest | null>(null);

  // Decline Mazmour Request Modal
  const [declineModalRequest, setDeclineModalRequest] = useState<MazmourRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Student Badges Management Modal (for removing badges)
  const [studentBadgeManageModal, setStudentBadgeManageModal] = useState<Student | null>(null);
  const [deductPointsOnBadgeDelete, setDeductPointsOnBadgeDelete] = useState(true);

  // Challenge Modal
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<BoyChallenge | null>(null);
  const [chalTitle, setChalTitle] = useState('');
  const [chalDesc, setChalDesc] = useState('');
  const [chalImageUrl, setChalImageUrl] = useState('');
  const [chalScore, setChalScore] = useState(30);
  const [chalCategory, setChalCategory] = useState<BoyChallenge['category']>('spiritual');
  const [chalSelectedBadge, setChalSelectedBadge] = useState<BadgeDefinition>(ALL_1000_BADGES[0]);

  // Quiz Modal
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<BoyQuiz | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizImageUrl, setQuizImageUrl] = useState('');
  const [quizScore, setQuizScore] = useState(40);
  const [quizBadge, setQuizBadge] = useState<BadgeDefinition>(ALL_1000_BADGES[2]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      type: 'mcq',
      question: 'السؤال الأول',
      options: ['اختيار أ', 'اختيار ب', 'اختيار ج', 'اختيار د'],
      correctOptionIndex: 0,
      explanation: '',
    },
  ]);

  // Question Reply Modal
  const [replyingQuestion, setReplyingQuestion] = useState<BoyQuestion | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyPublic, setReplyPublic] = useState(false);

  // Manual Badge Award Tool
  const [awardStudentId, setAwardStudentId] = useState('');
  const [awardBadge, setAwardBadge] = useState<BadgeDefinition>(ALL_1000_BADGES[0]);
  const [awardReason, setAwardReason] = useState('تكريم وتشجيع من الخدام');
  const [awardPoints, setAwardPoints] = useState(20);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState('');

  // Search & Filter in Badges Report
  const [reportSearch, setReportSearch] = useState('');

  // Load All Portal Data
  const loadAll = async () => {
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
    } catch (e) {
      console.warn('Error loading servants boys portal data:', e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // 1. Settings Handlers
  const handleToggleHideScores = async () => {
    const updated: BoyPortalSettings = {
      ...settings,
      hideScores: !settings.hideScores,
    };
    setSettings(updated);
    await db.saveBoyPortalSettings(updated);
    sound.playSuccessChime();
  };

  const handleToggleShopEnabled = async () => {
    const updated: BoyPortalSettings = {
      ...settings,
      isShopEnabled: !settings.isShopEnabled,
    };
    setSettings(updated);
    await db.saveBoyPortalSettings(updated);
    sound.playSuccessChime();
  };

  const handleToggleHideLeaderboard = async () => {
    const updated: BoyPortalSettings = {
      ...settings,
      hideLeaderboard: !settings.hideLeaderboard,
    };
    setSettings(updated);
    await db.saveBoyPortalSettings(updated);
    sound.playSuccessChime();
  };

  // 2. Announcements Handlers
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    const newAnn: Announcement = {
      id: editingAnnouncement ? editingAnnouncement.id : `ann_${Date.now()}`,
      title: annTitle.trim(),
      content: annContent.trim(),
      imageUrl: annImageUrl.trim() || undefined,
      targetAudience: annTarget,
      isPinned: annPinned,
      priority: annPriority,
      authorServant: currentServantName,
      createdAt: editingAnnouncement ? editingAnnouncement.createdAt : new Date().toISOString(),
    };

    await db.saveAnnouncement(newAnn);

    // Broadcast in-app notification to all boys
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      title: `إعلان جديد: ${newAnn.title}`,
      message: newAnn.content.slice(0, 100),
      type: 'announcement',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'home',
    });

    setIsAnnouncementModalOpen(false);
    setEditingAnnouncement(null);
    setAnnTitle('');
    setAnnContent('');
    setAnnImageUrl('');
    sound.playSuccessChime();
    await loadAll();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      await db.deleteAnnouncement(id);
      sound.playAlertChime();
      await loadAll();
    }
  };

  // 3. Shop Items & Orders Handlers
  const handleSaveShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const newItem: ShopItem = {
      id: editingShopItem ? editingShopItem.id : `shop_${Date.now()}`,
      title: itemTitle.trim(),
      description: itemDesc.trim(),
      price: Number(itemPrice) || 10,
      stock: Number(itemStock) || 0,
      icon: itemIcon,
      imageUrl: itemImageUrl.trim() || undefined,
      isEnabled: itemEnabled,
      category: itemCategory,
      createdAt: editingShopItem ? editingShopItem.createdAt : new Date().toISOString(),
    };

    await db.saveShopItem(newItem);
    setIsShopModalOpen(false);
    setEditingShopItem(null);
    setItemImageUrl('');
    sound.playSuccessChime();
    await loadAll();
  };

  const handleDeleteShopItem = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الجائزة من المتجر؟')) {
      await db.deleteShopItem(id);
      sound.playAlertChime();
      await loadAll();
    }
  };

  const handleUpdateOrderStatus = async (
    order: ShopOrder,
    status: 'pending' | 'delivered' | 'cancelled'
  ) => {
    await db.updateShopOrderStatus(order.id, status);

    if (status === 'delivered') {
      sound.playSuccessChime();
      // Notify boy
      await db.addBoyNotification({
        id: `notif_${Date.now()}`,
        studentId: order.studentId,
        title: 'تم تسليم جائزتك بنجاح! 🎁',
        message: `سلمك الخادم جائزة "${order.itemTitle}". مبروك يا بطل!`,
        type: 'shop',
        timestamp: new Date().toISOString(),
        read: false,
        linkView: 'shop',
      });
    } else if (status === 'cancelled') {
      // Refund points
      await db.addCustomPointEntry({
        studentId: order.studentId,
        date: new Date().toISOString().split('T')[0],
        points: order.pricePaid,
        reason: `استرجاع نقاط إلغاء طلب الجائزة: ${order.itemTitle}`,
        servantName: currentServantName,
      });
      if (onRefreshParentData) await onRefreshParentData();
    }

    await loadAll();
  };

  // 4. Mazamer Database & Requests Handlers
  const handleSaveMazmour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mazTitle.trim()) return;

    const newMaz: MazmourDefinition = {
      id: editingMazmour ? editingMazmour.id : `maz_${Date.now()}`,
      number: Number(mazNum) || 1,
      title: mazTitle.trim(),
      reference: mazRef.trim() || `مزمور ${mazNum}`,
      textArabic: mazText.trim(),
      week1Score: Number(mazWeek1Score) || 30,
      week2Score: Number(mazWeek2Score) || 20,
      afterTimeScore: Number(mazAfterScore) || 10,
      maxDropDays: Number(mazMaxDrop) || 21,
      goldBadgeId: `mazmour_${mazNum}_gold`,
      silverBadgeId: `mazmour_${mazNum}_silver`,
      bronzeBadgeId: `mazmour_${mazNum}_bronze`,
      isActive: true,
    };

    await db.saveMazmour(newMaz);
    setIsMazmourModalOpen(false);
    setEditingMazmour(null);
    sound.playSuccessChime();
    await loadAll();
  };

  const handleDeleteMazmour = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المزمور من قاعدة البيانات؟')) {
      await db.deleteMazmour(id);
      sound.playAlertChime();
      await loadAll();
    }
  };

  const handleApproveMazmourRequest = async (req: MazmourRequest) => {
    const updated: MazmourRequest = {
      ...req,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    };
    await db.saveMazmourRequest(updated);

    // Notify boy
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId: req.studentId,
      title: `تم اعتماد طلب استلام ${req.mazmourTitle}! 📖`,
      message: 'بدأ عداد الحفظ الآن! احفظه في أول أسبوع لتربح الوسام الذهبي والنقاط الكاملة.',
      type: 'mazmour',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'mzamer',
    });

    sound.playSuccessChime();
    await loadAll();
  };

  const handleDeclineMazmourRequest = async (req: MazmourRequest, reason: string) => {
    const updated: MazmourRequest = {
      ...req,
      status: 'declined',
      droppedAt: new Date().toISOString(),
      servantNotes: reason.trim()
        ? `تم رفض الطلب: ${reason.trim()} (بواسطة ${currentServantName})`
        : `تم رفض الطلب بواسطة ${currentServantName}`,
    };
    await db.saveMazmourRequest(updated);

    // Notify boy so they know and can choose another psalm
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId: req.studentId,
      title: `تحديث بشأن طلب استلام ${req.mazmourTitle} ℹ️`,
      message: reason.trim()
        ? `تم الاعتذار عن اعتماد طلب المزمور: "${reason.trim()}". يمكنك اختيار مزمور آخر الآن.`
        : `تم الاعتذار عن اعتماد طلب المزمور بواسطة الخادم. يمكنك اختيار مزمور آخر الآن.`,
      type: 'mazmour',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'mzamer',
    });

    sound.playAlertChime();
    setDeclineModalRequest(null);
    setDeclineReason('');
    await loadAll();
  };

  const handleDeleteMazmourRequest = async (reqId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من السجل؟')) {
      await db.deleteMazmourRequest(reqId);
      sound.playSuccessChime();
      setDeclineModalRequest(null);
      setDeclineReason('');
      await loadAll();
    }
  };

  const handleRemoveStudentBadge = async (badge: StudentBadge, deductPoints: boolean = true) => {
    const pts = badge.pointsAwarded || 0;
    const confirmMsg = deductPoints && pts > 0
      ? `هل أنت متأكد من حذف وسام "${badge.badgeName}" وخصم ${pts} نقطة من رصيد المخدوم؟`
      : `هل أنت متأكد من حذف وسام "${badge.badgeName}" من المخدوم؟`;

    if (!confirm(confirmMsg)) return;

    await db.deleteStudentBadge(badge.id);

    // Deduct points if requested and points were awarded
    if (deductPoints && pts > 0) {
      await db.addCustomPointEntry({
        studentId: badge.studentId,
        date: new Date().toISOString().split('T')[0],
        points: -pts,
        reason: `سحب وسام: ${badge.badgeName}`,
        servantName: currentServantName,
      });
      if (onRefreshParentData) {
        await onRefreshParentData();
      }
    }

    // Add audit log
    await db.addLogEntry({
      username: currentServantName,
      servantName: currentServantName,
      action: 'BADGE_DELETED',
      details: `حذف وسام "${badge.badgeName}" من المخدوم ${badge.studentId}${deductPoints && pts > 0 ? ` مع خصم ${pts} نقطة` : ''}`,
      category: 'scoring',
    });

    // Notify boy
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId: badge.studentId,
      title: `تحديث الأوسمة الشرفية 🎖️`,
      message: `تم سحب وسام "${badge.badgeName}" من خزانة أوسمتك بواسطة الخادم.`,
      type: 'badge',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'badges',
    });

    sound.playAlertChime();
    await loadAll();
  };

  // Done / Recitation confirmation handler with automatic interval calculation!
  const handleConfirmRecitationDone = async (
    req: MazmourRequest,
    customOverrideTier?: 'gold' | 'silver' | 'bronze'
  ) => {
    const maz = mazamer.find((m) => m.id === req.mazmourId);
    const approvedTime = req.approvedAt ? new Date(req.approvedAt).getTime() : Date.now();
    const daysElapsed = Math.max(0, Math.floor((Date.now() - approvedTime) / (1000 * 60 * 60 * 24)));

    let tier: 'gold' | 'silver' | 'bronze' = 'gold';
    let points = maz?.week1Score || 30;

    if (customOverrideTier) {
      tier = customOverrideTier;
      points =
        tier === 'gold'
          ? maz?.week1Score || 30
          : tier === 'silver'
            ? maz?.week2Score || 20
            : maz?.afterTimeScore || 10;
    } else {
      if (daysElapsed <= 7) {
        tier = 'gold';
        points = maz?.week1Score || 30;
      } else if (daysElapsed <= 14) {
        tier = 'silver';
        points = maz?.week2Score || 20;
      } else {
        tier = 'bronze';
        points = maz?.afterTimeScore || 10;
      }
    }

    const badgeId =
      tier === 'gold'
        ? maz?.goldBadgeId || 'mazmour_1_gold'
        : tier === 'silver'
          ? maz?.silverBadgeId || 'mazmour_1_silver'
          : maz?.bronzeBadgeId || 'mazmour_1_bronze';

    // 1. Update Request
    const updatedRequest: MazmourRequest = {
      ...req,
      status: 'completed',
      completedAt: new Date().toISOString(),
      awardedTier: tier,
      awardedScore: points,
      awardedBadgeId: badgeId,
      servantNotes: `سمّع بنجاح بعد ${daysElapsed} يوم بواسطة ${currentServantName}`,
    };
    await db.saveMazmourRequest(updatedRequest);

    // 2. Award Points to Student Score
    await db.addCustomPointEntry({
      studentId: req.studentId,
      date: new Date().toISOString().split('T')[0],
      points,
      reason: `حفظ ${req.mazmourTitle} (وسام ${tier === 'gold' ? 'ذهبي 🥇' : tier === 'silver' ? 'فضي 🥈' : 'برونزي 🥉'})`,
      servantName: currentServantName,
    });

    // 3. Award Badge to Student Badges Collection
    const newBadge: StudentBadge = {
      id: `sbadge_${Date.now()}`,
      studentId: req.studentId,
      badgeId,
      badgeName: `وسام مزمور ${req.mazmourNumber || 1} ${tier === 'gold' ? 'الذهبي' : tier === 'silver' ? 'الفضي' : 'البرونزي'}`,
      badgeTier: tier,
      icon: tier === 'gold' ? 'Crown' : tier === 'silver' ? 'Shield' : 'BookOpen',
      color: tier === 'gold' ? '#eab308' : tier === 'silver' ? '#94a3b8' : '#b45309',
      category: 'mazamer',
      awardedAt: new Date().toISOString(),
      reason: `حفظ ${req.mazmourTitle} خلال ${daysElapsed} يوم بنجاح وتسميعه للخادم`,
      pointsAwarded: points,
    };
    await db.awardStudentBadge(newBadge);

    // 4. Notify Boy
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId: req.studentId,
      title: `مبروك! تم اعتماد حفظ ${req.mazmourTitle} 🏆`,
      message: `حصلت على ${points} نقطة ووسام ${tier === 'gold' ? 'ذهبي 🥇' : tier === 'silver' ? 'فضي 🥈' : 'برونزي 🥉'}! تفقد خزانة أوسمتك الآن.`,
      type: 'badge',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'badges',
    });

    sound.playSuccessChime();
    setRecitationModalRequest(null);

    if (onRefreshParentData) {
      await onRefreshParentData();
    }
    await loadAll();
  };

  // 5. Challenges Handlers
  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chalTitle.trim()) return;

    const newChal: BoyChallenge = {
      id: editingChallenge ? editingChallenge.id : `chal_${Date.now()}`,
      title: chalTitle.trim(),
      description: chalDesc.trim(),
      imageUrl: chalImageUrl.trim() || undefined,
      scoreReward: Number(chalScore) || 30,
      badgeId: chalSelectedBadge.id,
      badgeName: chalSelectedBadge.name,
      badgeIcon: chalSelectedBadge.icon,
      badgeTier: chalSelectedBadge.tier,
      badgeImageUrl: chalSelectedBadge.imageUrl,
      category: chalCategory,
      isActive: true,
      completedStudentIds: editingChallenge ? editingChallenge.completedStudentIds : [],
      pendingStudentIds: editingChallenge ? editingChallenge.pendingStudentIds : [],
      createdAt: editingChallenge ? editingChallenge.createdAt : new Date().toISOString(),
    };

    await db.saveBoyChallenge(newChal);

    // Broadcast notification to boys
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      title: `تحدي جديد: ${newChal.title} 🔥`,
      message: `أكمل التحدي لتربح +${newChal.scoreReward} نقطة ووسام "${newChal.badgeName}"!`,
      type: 'challenge',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'challenges',
    });

    setIsChallengeModalOpen(false);
    setEditingChallenge(null);
    setChalImageUrl('');
    sound.playSuccessChime();
    await loadAll();
  };

  const handleApproveChallengeClaim = async (chal: BoyChallenge, studentId: string) => {
    const completed = chal.completedStudentIds || [];
    const pending = (chal.pendingStudentIds || []).filter((id) => id !== studentId);

    const updated: BoyChallenge = {
      ...chal,
      completedStudentIds: [...completed, studentId],
      pendingStudentIds: pending,
    };
    await db.saveBoyChallenge(updated);

    // Award Points
    await db.addCustomPointEntry({
      studentId,
      date: new Date().toISOString().split('T')[0],
      points: chal.scoreReward,
      reason: `إنجاز تحدي: ${chal.title}`,
      servantName: currentServantName,
    });

    // Award Badge
    const newBadge: StudentBadge = {
      id: `sbadge_${Date.now()}`,
      studentId,
      badgeId: chal.badgeId,
      badgeName: chal.badgeName,
      badgeTier: chal.badgeTier,
      icon: chal.badgeIcon,
      imageUrl: chal.badgeImageUrl,
      color: '#f97316',
      category: 'challenge',
      awardedAt: new Date().toISOString(),
      reason: `إنجاز تحدي "${chal.title}" بنجاح`,
      pointsAwarded: chal.scoreReward,
    };
    await db.awardStudentBadge(newBadge);

    // Notify Boy
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId,
      title: `تم اعتماد إنجاز تحدي: ${chal.title}! 🌟`,
      message: `أحسنت يا بطل! تم إضافة +${chal.scoreReward} نقطة ومنحك وسام "${chal.badgeName}".`,
      type: 'badge',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'badges',
    });

    sound.playSuccessChime();
    if (onRefreshParentData) await onRefreshParentData();
    await loadAll();
  };

  // 6. Quizzes Handlers
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    const newQuiz: BoyQuiz = {
      id: editingQuiz ? editingQuiz.id : `quiz_${Date.now()}`,
      title: quizTitle.trim(),
      description: quizDesc.trim(),
      imageUrl: quizImageUrl.trim() || undefined,
      scoreReward: Number(quizScore) || 40,
      badgeId: quizBadge.id,
      badgeName: quizBadge.name,
      badgeIcon: quizBadge.icon,
      badgeTier: quizBadge.tier,
      badgeImageUrl: quizBadge.imageUrl,
      questions: quizQuestions,
      isActive: true,
      completedStudentIds: editingQuiz ? editingQuiz.completedStudentIds : [],
      createdAt: editingQuiz ? editingQuiz.createdAt : new Date().toISOString(),
    };

    await db.saveBoyQuiz(newQuiz);

    if (!editingQuiz) {
      // Broadcast notification for new quiz
      await db.addBoyNotification({
        id: `notif_${Date.now()}`,
        title: `مسابقة جديدة: ${newQuiz.title} 📝`,
        message: `كويز تفاعلي جديد ينتظرك! ادخل الآن واكسب +${newQuiz.scoreReward} نقطة والوسام!`,
        type: 'quiz',
        timestamp: new Date().toISOString(),
        read: false,
        linkView: 'quizzes',
      });
    }

    setIsQuizModalOpen(false);
    setEditingQuiz(null);
    setQuizTitle('');
    setQuizDesc('');
    setQuizImageUrl('');
    sound.playSuccessChime();
    await loadAll();
  };

  // 7. Questions Reply Handler
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingQuestion || !replyText.trim()) return;

    const updated: BoyQuestion = {
      ...replyingQuestion,
      answerText: replyText.trim(),
      answeredBy: currentServantName,
      answeredAt: new Date().toISOString(),
      isPublic: replyPublic,
    };

    await db.saveBoyQuestion(updated);

    // Notify Boy
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId: replyingQuestion.studentId,
      title: 'أجاب الخادم على سؤالك! 💬',
      message: `كتب ${currentServantName} إجابة على سؤالك. ادخل لتقرأ الرد.`,
      type: 'announcement',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'questions',
    });

    setReplyingQuestion(null);
    setReplyText('');
    sound.playSuccessChime();
    await loadAll();
  };

  // 8. Manual Badge Award Handler
  const handleManualAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardStudentId) {
      alert('يرجى اختيار المخدوم');
      return;
    }

    const student = students.find((s) => s.id === awardStudentId);
    if (!student) return;

    const newBadge: StudentBadge = {
      id: `sbadge_${Date.now()}`,
      studentId: student.id,
      badgeId: awardBadge.id,
      badgeName: awardBadge.name,
      badgeTier: awardBadge.tier,
      icon: awardBadge.icon,
      imageUrl: awardBadge.imageUrl,
      color: awardBadge.borderColor,
      category: awardBadge.category,
      awardedAt: new Date().toISOString(),
      reason: awardReason.trim() || 'تكريم خاص من الخدام',
      pointsAwarded: Number(awardPoints) || 0,
    };

    await db.awardStudentBadge(newBadge);

    // Award bonus points if specified
    if (awardPoints > 0) {
      await db.addCustomPointEntry({
        studentId: student.id,
        date: new Date().toISOString().split('T')[0],
        points: Number(awardPoints),
        reason: `وسام شرف: ${awardBadge.name} (${awardReason})`,
        servantName: currentServantName,
      });
      if (onRefreshParentData) await onRefreshParentData();
    }

    // Notify Boy
    await db.addBoyNotification({
      id: `notif_${Date.now()}`,
      studentId: student.id,
      title: `حصلت علي وسام "${awardBadge.name}"! 🎖️`,
      message: `${awardReason}. مبروك يا بطل!`,
      type: 'badge',
      timestamp: new Date().toISOString(),
      read: false,
      linkView: 'badges',
    });

    sound.playSuccessChime();
    setAwardSuccessMsg(`تم منح وسام "${awardBadge.name}" للبطل ${student.arabicName || student.name} بنجاح!`);
    setTimeout(() => setAwardSuccessMsg(''), 4000);
    await loadAll();
  };

  // Badges Leaderboard & Stats for the Report
  const badgeReportStats = useMemo(() => {
    const map: Record<string, { student: Student; badges: StudentBadge[]; gold: number; silver: number; bronze: number; elite: number }> = {};

    students.forEach((s) => {
      map[s.id] = {
        student: s,
        badges: [],
        gold: 0,
        silver: 0,
        bronze: 0,
        elite: 0,
      };
    });

    studentBadges.forEach((b) => {
      if (map[b.studentId]) {
        map[b.studentId].badges.push(b);
        if (b.badgeTier === 'gold') map[b.studentId].gold++;
        else if (b.badgeTier === 'silver') map[b.studentId].silver++;
        else if (b.badgeTier === 'bronze') map[b.studentId].bronze++;
        else map[b.studentId].elite++;
      }
    });

    const list = Object.values(map);
    list.sort((a, b) => b.badges.length - a.badges.length);
    return list;
  }, [students, studentBadges]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Servants Portal Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #1e293b 100%)',
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
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            }}
          >
            <Crown size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                بوابة الخدام المركزية
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                المسؤول: {currentServantName}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc' }}>
              إدارة بوابة المخدومين والأنشطة والأوسمة (Boys Portal)
            </h2>
          </div>
        </div>

        {/* Master Switches Box in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Hide Score Switch */}
          <div
            onClick={handleToggleHideScores}
            style={{
              background: settings.hideScores ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: settings.hideScores ? '1px solid #ef4444' : '1px solid #10b981',
              borderRadius: '12px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title="إخفاء أو إظهار النقاط للمخدومين"
          >
            {settings.hideScores ? <Lock size={16} color="#f87171" /> : <Eye size={16} color="#34d399" />}
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: settings.hideScores ? '#f87171' : '#34d399' }}>
              {settings.hideScores ? 'النقاط مخفية عن الأولاد' : 'النقاط معلنة للأولاد'}
            </span>
          </div>

          {/* Shop Switch */}
          <div
            onClick={handleToggleShopEnabled}
            style={{
              background: settings.isShopEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: settings.isShopEnabled ? '1px solid #10b981' : '1px solid #ef4444',
              borderRadius: '12px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title="تفعيل أو إغلاق متجر الجوائز"
          >
            <ShoppingBag size={16} color={settings.isShopEnabled ? '#34d399' : '#f87171'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: settings.isShopEnabled ? '#34d399' : '#f87171' }}>
              {settings.isShopEnabled ? 'المتجر مفعّل 🛍️' : 'المتجر مغلق 🔒'}
            </span>
          </div>

          {/* Hide Leaderboard Switch */}
          <div
            onClick={handleToggleHideLeaderboard}
            style={{
              background: settings.hideLeaderboard ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: settings.hideLeaderboard ? '1px solid #ef4444' : '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
            title="إخفاء أو إظهار لوحة ترتيب المتصدرين في بوابة الأولاد"
          >
            {settings.hideLeaderboard ? <Lock size={16} color="#f87171" /> : <Trophy size={16} color="#fbbf24" />}
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: settings.hideLeaderboard ? '#f87171' : '#fbbf24' }}>
              {settings.hideLeaderboard ? 'الترتيب مخفي عن الأولاد 🔒' : 'الترتيب معلن للأولاد 🏆'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          borderBottom: '1px solid #334155',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            background: activeTab === 'overview' ? '#1e293b' : 'transparent',
            border: activeTab === 'overview' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'overview' ? '#38bdf8' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <TrendingUp size={16} />
          لوحة التحكم
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          style={{
            background: activeTab === 'announcements' ? '#1e293b' : 'transparent',
            border: activeTab === 'announcements' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'announcements' ? '#38bdf8' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Megaphone size={16} />
          الإعلانات ({announcements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shop')}
          style={{
            background: activeTab === 'shop' ? '#1e293b' : 'transparent',
            border: activeTab === 'shop' ? '1px solid #10b981' : '1px solid transparent',
            color: activeTab === 'shop' ? '#34d399' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <ShoppingBag size={16} />
          المتجر والطلبات ({shopOrders.filter((o) => o.status === 'pending').length} انتظار)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mazamer')}
          style={{
            background: activeTab === 'mazamer' ? '#1e293b' : 'transparent',
            border: activeTab === 'mazamer' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'mazamer' ? '#38bdf8' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <BookOpen size={16} />
          المزامير والتسميع ({mazmourRequests.filter((r) => r.status === 'requested' || r.status === 'ready_for_test').length} طلبات)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          style={{
            background: activeTab === 'challenges' ? '#1e293b' : 'transparent',
            border: activeTab === 'challenges' ? '1px solid #f97316' : '1px solid transparent',
            color: activeTab === 'challenges' ? '#fb923c' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Flame size={16} />
          التحديات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          style={{
            background: activeTab === 'quizzes' ? '#1e293b' : 'transparent',
            border: activeTab === 'quizzes' ? '1px solid #a855f7' : '1px solid transparent',
            color: activeTab === 'quizzes' ? '#c084fc' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
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
          onClick={() => setActiveTab('questions')}
          style={{
            background: activeTab === 'questions' ? '#1e293b' : 'transparent',
            border: activeTab === 'questions' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'questions' ? '#38bdf8' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <HelpCircle size={16} />
          صندوق الأسئلة ({questions.filter((q) => !q.answerText).length} انتظار)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badge_picker')}
          style={{
            background: activeTab === 'badge_picker' ? '#1e293b' : 'transparent',
            border: activeTab === 'badge_picker' ? '1px solid #ec4899' : '1px solid transparent',
            color: activeTab === 'badge_picker' ? '#f472b6' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Award size={16} />
          مكتبة الـ ١٠٠٠ وسام والمنح
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badge_report')}
          style={{
            background: activeTab === 'badge_report' ? '#1e293b' : 'transparent',
            border: activeTab === 'badge_report' ? '1px solid #fbbf24' : '1px solid transparent',
            color: activeTab === 'badge_report' ? '#fbbf24' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <BarChart3 size={16} />
          تقرير وسجل الأوسمة 📊
        </button>
      </div>

      {/* TAB 0: OVERVIEW & DASHBOARD */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>إجمالي المخدومين المسجلين</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', marginTop: '0.25rem' }}>
                {students.length} بطل
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>طلبات المزامير في الانتظار</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.25rem' }}>
                {mazmourRequests.filter((r) => r.status === 'requested' || r.status === 'ready_for_test').length}
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>طلبات جوائز المتجر للتسليم</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>
                {shopOrders.filter((o) => o.status === 'pending').length}
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>إجمالي الأوسمة الممنوحة</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ec4899', marginTop: '0.25rem' }}>
                {studentBadges.length} وسام
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '18px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              إجراءات سريعة للخدام
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingAnnouncement(null);
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnImageUrl('');
                  setIsAnnouncementModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ background: '#0284c7', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                نشر إعلان جديد للأولاد/الأهالي
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingShopItem(null);
                  setItemTitle('');
                  setItemDesc('');
                  setItemImageUrl('');
                  setIsShopModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ background: '#1e293b', border: '1px solid #10b981', color: '#34d399', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                إضافة جائزة جديدة للمتجر
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingMazmour(null);
                  setMazTitle('');
                  setMazText('');
                  setIsMazmourModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                إضافة مزمور جديد لقاعدة البيانات
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingChallenge(null);
                  setChalTitle('');
                  setChalDesc('');
                  setChalImageUrl('');
                  setIsChallengeModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ background: '#1e293b', border: '1px solid #f97316', color: '#fb923c', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                إضافة تحدي أسبوعي جديد
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('هل تريد مزامنة وتحديث بنك البيانات الافتراضي (المسابقات، المزامير، التحديات، والمتجر) بآخر نسخة من الكود دون التأثير على تقدم المخدومين أو الأوسمة الممنوحة؟')) {
                    await db.resetBoysPortalToSystemSeeds();
                    await loadAll();
                    sound.playSuccessChime();
                    alert('✅ تم تحديث ومزامنة البيانات المسبقة بنجاح مع الكود الأصلي!');
                  }
                }}
                className="btn btn-secondary"
                style={{ background: '#312e81', border: '1px solid #818cf8', color: '#c7d2fe', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Force reload pre-setted code seeders into this deployment"
              >
                <RefreshCw size={16} />
                مزامنة البيانات المسبقة من الكود (Sync Seeders) 🔄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ANNOUNCEMENTS MANAGER */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              إعلانات الفصل والتنبيهات العامة
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingAnnouncement(null);
                setAnnTitle('');
                setAnnContent('');
                setAnnImageUrl('');
                setIsAnnouncementModalOpen(true);
              }}
              style={{
                background: '#0284c7',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={16} />
              إضافة إعلان جديد
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  border: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {ann.isPinned && (
                      <span style={{ background: '#38bdf8', color: '#0f172a', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                        مثبت
                      </span>
                    )}
                    <span style={{ background: '#334155', color: '#cbd5e1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                      {ann.targetAudience === 'boys' ? 'للأولاد' : ann.targetAudience === 'parents' ? 'للأهالي' : 'عام'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {new Date(ann.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                    {ann.title}
                  </h4>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-line' }}>
                    {ann.content}
                  </p>

                  {ann.imageUrl && (
                    <div style={{ maxWidth: '280px', maxHeight: '140px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', marginTop: '0.5rem' }}>
                      <img src={ann.imageUrl} alt={ann.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnnouncement(ann);
                      setAnnTitle(ann.title);
                      setAnnContent(ann.content);
                      setAnnTarget(ann.targetAudience);
                      setAnnPinned(ann.isPinned);
                      setAnnPriority(ann.priority);
                      setAnnImageUrl(ann.imageUrl || '');
                      setIsAnnouncementModalOpen(true);
                    }}
                    style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '6px 8px', borderRadius: '6px' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', padding: '6px 8px', borderRadius: '6px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SHOP INVENTORY & ORDERS */}
      {activeTab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pending Orders Queue */}
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              طلبات استلام الجوائز من الأولاد ({shopOrders.filter((o) => o.status === 'pending').length} طلب بانتظار التسليم)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {shopOrders.map((ord) => {
                const isPending = ord.status === 'pending';
                const isDelivered = ord.status === 'delivered';

                return (
                  <div
                    key={ord.id}
                    style={{
                      background: '#0f172a',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: isPending ? '1px solid #f59e0b' : '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem' }}>
                          {ord.studentName}
                        </span>
                        <span style={{ background: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', color: '#fbbf24', fontFamily: 'monospace' }}>
                          كود: {ord.redemptionCode}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#f8fafc' }}>
                        الجائزة: <b>{ord.itemTitle}</b> ({ord.pricePaid} نقطة)
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord, 'delivered')}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            تم التسليم بنجاح ✅
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord, 'cancelled')}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              border: '1px solid #ef4444',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            إلغاء واسترجاع النقاط
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
                          {isDelivered ? 'تم التسليم بنجاح' : 'ملغي ومسترجع'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {shopOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                  لا توجد طلبات شراء مسجلة بعد.
                </div>
              )}
            </div>
          </div>

          {/* Items Inventory Manager */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                قائمة جوائز المتجر ({shopItems.length} جائزة)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingShopItem(null);
                  setItemTitle('');
                  setItemDesc('');
                  setItemImageUrl('');
                  setIsShopModalOpen(true);
                }}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} />
                إضافة جائزة جديدة
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {shopItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {item.imageUrl && (
                      <div style={{ width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem', background: '#090d16', border: '1px solid #334155' }}>
                        <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: item.stock > 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
                        {item.stock > 0 ? `متبقي ${item.stock} قطع` : 'نفدت الكمية'}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#f8fafc' }}>
                      {item.title}
                    </h4>

                    <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                      {item.description}
                    </p>

                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24', marginBottom: '0.85rem' }}>
                      {item.price} نقطة
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #334155', paddingTop: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShopItem(item);
                        setItemTitle(item.title);
                        setItemDesc(item.description);
                        setItemPrice(item.price);
                        setItemStock(item.stock);
                        setItemIcon(item.icon);
                        setItemImageUrl(item.imageUrl || '');
                        setItemCategory(item.category || '');
                        setItemEnabled(item.isEnabled);
                        setIsShopModalOpen(true);
                      }}
                      style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteShopItem(item.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MAZAMER DATABASE & RECITATIONS */}
      {activeTab === 'mazamer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Requests & Recitations Waiting Inbox */}
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              طلبات استلام وتسميع المزامير من الأولاد
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mazmourRequests
                .filter((r) => r.status === 'requested' || r.status === 'approved' || r.status === 'ready_for_test')
                .map((req) => {
                  const approvedTime = req.approvedAt ? new Date(req.approvedAt).getTime() : Date.now();
                  const daysElapsed = req.approvedAt ? Math.max(0, Math.floor((Date.now() - approvedTime) / (1000 * 60 * 60 * 24))) : 0;

                  return (
                    <div
                      key={req.id}
                      style={{
                        background: '#0f172a',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: req.status === 'ready_for_test' ? '1px solid #10b981' : '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1rem' }}>
                            {req.studentName}
                          </span>
                          <span
                            style={{
                              background: req.status === 'ready_for_test' ? '#10b981' : req.status === 'approved' ? '#0284c7' : '#d97706',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            {req.status === 'ready_for_test' ? 'جاهز للتسميع ✋' : req.status === 'approved' ? 'جاري الحفظ 📖' : 'طلب استلام جديد ⏳'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                          المزمور: <b>{req.mazmourTitle}</b>
                        </div>

                        {req.approvedAt && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            مر {daysElapsed} يوم منذ الاعتماد • المستحق الآن: {daysElapsed <= 7 ? 'وسام ذهبي 🥇' : daysElapsed <= 14 ? 'وسام فضي 🥈' : 'وسام برونزي 🥉'}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {req.status === 'requested' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveMazmourRequest(req)}
                              style={{
                                background: '#0284c7',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              اعتماد وبدء عداد الحفظ 🚀
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeclineModalRequest(req);
                                setDeclineReason('');
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid #ef4444',
                                color: '#f87171',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="الاعتذار عن قبول هذا الطلب"
                            >
                              رفض الطلب ✕
                            </button>
                          </>
                        )}

                        {(req.status === 'approved' || req.status === 'ready_for_test') && (
                          <>
                            <button
                              type="button"
                              onClick={() => setRecitationModalRequest(req)}
                              style={{
                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              سمّع الآن (Done) ✅
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeclineModalRequest(req);
                                setDeclineReason('');
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#f87171',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="إلغاء أو رفض التسميع"
                            >
                              إلغاء / رفض ✕
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

              {mazmourRequests.filter((r) => r.status === 'requested' || r.status === 'approved' || r.status === 'ready_for_test').length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                  لا توجد طلبات مزامير معلقة حالياً.
                </div>
              )}
            </div>
          </div>

          {/* Mazamer Catalog Manager */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                قاعدة بيانات المزامير المتاحة ({mazamer.length} مزمور)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingMazmour(null);
                  setMazTitle('');
                  setMazText('');
                  setIsMazmourModalOpen(true);
                }}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} />
                إضافة مزمور جديد
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {mazamer.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                      {m.reference}
                    </span>
                    <h4 style={{ margin: '0.2rem 0 0.5rem', fontSize: '1.1rem', color: '#f8fafc' }}>
                      {m.title}
                    </h4>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                      🥇 أسبوع أول: <b>+{m.week1Score}</b> | 🥈 أسبوعين: <b>+{m.week2Score}</b> | 🥉 بعد الوقت: <b>+{m.afterTimeScore}</b> | مهلة الإسقاط: {m.maxDropDays} يوم
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #334155', paddingTop: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMazmour(m);
                        setMazNum(m.number);
                        setMazTitle(m.title);
                        setMazRef(m.reference);
                        setMazText(m.textArabic);
                        setMazWeek1Score(m.week1Score);
                        setMazWeek2Score(m.week2Score);
                        setMazAfterScore(m.afterTimeScore);
                        setMazMaxDrop(m.maxDropDays);
                        setIsMazmourModalOpen(true);
                      }}
                      style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMazmour(m.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHALLENGES MANAGER */}
      {activeTab === 'challenges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              التحديات الأسبوعية والمهام الكنسية ({challenges.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingChallenge(null);
                setChalTitle('');
                setChalDesc('');
                setChalImageUrl('');
                setIsChallengeModalOpen(true);
              }}
              style={{
                background: '#ea580c',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={16} />
              إضافة تحدي جديد
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {challenges.map((chal) => {
              const pendingStudentIds = chal.pendingStudentIds || [];

              return (
                <div
                  key={chal.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {chal.imageUrl && (
                      <div style={{ width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem', background: '#090d16', border: '1px solid #334155' }}>
                        <img src={chal.imageUrl} alt={chal.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#f8fafc' }}>
                      {chal.title}
                    </h4>
                    <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {chal.description}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 800, marginBottom: '0.75rem' }}>
                      الوسام: {chal.badgeName} (+{chal.scoreReward} نقطة)
                    </div>

                    {/* Pending Submissions Queue */}
                    {pendingStudentIds.length > 0 && (
                      <div style={{ background: '#0f172a', padding: '0.65rem', borderRadius: '10px', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.35rem' }}>
                          أولاد أتموا التحدي وبانتظار اعتمادك:
                        </div>
                        {pendingStudentIds.map((sId) => {
                          const s = students.find((x) => x.id === sId);
                          return (
                            <div key={sId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#f8fafc' }}>{s?.arabicName || s?.name || sId}</span>
                              <button
                                type="button"
                                onClick={() => handleApproveChallengeClaim(chal, sId)}
                                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}
                              >
                                اعتماد ومنح الوسام ✅
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '0.65rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      أتمّه {chal.completedStudentIds?.length || 0} ولد
                    </span>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChallenge(chal);
                          setChalTitle(chal.title);
                          setChalDesc(chal.description);
                          setChalScore(chal.scoreReward);
                          setChalCategory(chal.category);
                          setChalImageUrl(chal.imageUrl || '');
                          const badgeDef = ALL_1000_BADGES.find((b) => b.id === chal.badgeId) || {
                            id: chal.badgeId,
                            name: chal.badgeName,
                            icon: chal.badgeIcon,
                            tier: chal.badgeTier,
                            imageUrl: chal.badgeImageUrl,
                            category: 'challenge',
                            description: '',
                            gradient: '',
                            borderColor: '',
                            glowColor: '',
                            symbol: '',
                          };
                          setChalSelectedBadge(badgeDef as any);
                          setIsChallengeModalOpen(true);
                        }}
                        style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('حذف هذا التحدي؟')) {
                            await db.deleteBoyChallenge(chal.id);
                            await loadAll();
                          }
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: QUIZZES MANAGER */}
      {activeTab === 'quizzes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              المسابقات والكويزات التفاعلية ({quizzes.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingQuiz(null);
                setQuizTitle('');
                setQuizDesc('');
                setQuizImageUrl('');
                setQuizScore(40);
                setQuizQuestions([
                  {
                    id: `q_${Date.now()}`,
                    type: 'mcq',
                    question: 'السؤال الأول',
                    options: ['اختيار أ', 'اختيار ب', 'اختيار ج', 'اختيار د'],
                    correctOptionIndex: 0,
                  },
                ]);
                setIsQuizModalOpen(true);
              }}
              style={{
                background: '#a855f7',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={16} />
              إنشاء كويز جديد
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {quiz.imageUrl && (
                    <div style={{ width: '100%', height: '110px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem', border: '1px solid #334155' }}>
                      <img src={quiz.imageUrl} alt={quiz.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#f8fafc' }}>
                    {quiz.title}
                  </h4>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {quiz.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 800 }}>
                    {quiz.questions.length} أسئلة • مكافأة: +{quiz.scoreReward} نقطة • وسام: {quiz.badgeName}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '0.65rem', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                    حله {quiz.completedStudentIds?.length || 0} مخدوم
                  </span>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuiz(quiz);
                        setQuizTitle(quiz.title);
                        setQuizDesc(quiz.description);
                        setQuizScore(quiz.scoreReward);
                        setQuizImageUrl(quiz.imageUrl || '');
                        const matchingBadge = ALL_1000_BADGES.find((b) => b.id === quiz.badgeId) || {
                          id: quiz.badgeId,
                          name: quiz.badgeName,
                          icon: quiz.badgeIcon,
                          tier: quiz.badgeTier,
                          imageUrl: quiz.badgeImageUrl,
                          category: 'quiz',
                          description: '',
                          gradient: '',
                          borderColor: '',
                          glowColor: '',
                          symbol: '',
                        };
                        setQuizBadge(matchingBadge as any);
                        setQuizQuestions(quiz.questions || []);
                        setIsQuizModalOpen(true);
                      }}
                      style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('حذف هذا الكويز؟')) {
                          await db.deleteBoyQuiz(quiz.id);
                          await loadAll();
                        }
                      }}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: QUESTIONS INBOX */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            صندوق استفسارات وأسئلة الأولاد السرية ({questions.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {questions.map((q) => {
              const isAnswered = Boolean(q.answerText);

              return (
                <div
                  key={q.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: isAnswered ? '1px solid #10b981' : '1px solid #f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                        {q.isAnonymous ? 'مخدوم (مجهول الاسم)' : q.studentName}
                      </span>
                      <span style={{ background: '#334155', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#cbd5e1' }}>
                        {q.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {new Date(q.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
                    "{q.questionText}"
                  </p>

                  {isAnswered ? (
                    <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '10px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800, marginBottom: '0.2rem' }}>
                        إجابتك ({q.answeredBy}):
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-line' }}>
                        {q.answerText}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingQuestion(q);
                          setReplyText('');
                          setReplyPublic(false);
                        }}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        كتابة الرد على الولد 💬
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {questions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                لا توجد أسئلة مرسلة حالياً.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: 1000+ BADGES LIBRARY & DIRECT AWARD */}
      {activeTab === 'badge_picker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Direct Manual Badge Award Tool */}
          <div
            style={{
              background: '#1e293b',
              borderRadius: '18px',
              padding: '1.5rem',
              border: '2px solid #ec4899',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: '#f472b6' }}>
              أداة منح وسام شرفي مباشر لأي مخدوم
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              اختر أي وسام من مكتبة الـ ١٠٠٠ وسام وامنحه فوراً لأي بطل تكريماً لأمانته أو حفظه أو تميزه!
            </p>

            <form onSubmit={handleManualAwardBadge} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Student Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.35rem' }}>
                    اختر المخدوم:
                  </label>
                  <select
                    value={awardStudentId}
                    onChange={(e) => setAwardStudentId(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '0.6rem', borderRadius: '10px', fontSize: '0.85rem' }}
                  >
                    <option value="">-- اضغط لاختيار المخدوم --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.arabicName || s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge Picker Trigger */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.35rem' }}>
                    الوسام المختار:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBadgePickerCallback(() => (badge: BadgeDefinition) => {
                        setAwardBadge(badge);
                        setIsBadgePickerOpen(false);
                      });
                      setIsBadgePickerOpen(true);
                    }}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: `1px solid ${TIER_STYLES[awardBadge.tier].borderColor}`,
                      padding: '0.5rem 0.85rem',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: TIER_STYLES[awardBadge.tier].bgGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderBadgeIconOrImage(awardBadge, 16, '#fff')}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{awardBadge.name}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>تغيير</span>
                  </button>
                </div>

                {/* Bonus Points */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.35rem' }}>
                    نقاط إضافية تمنح مع الوسام:
                  </label>
                  <input
                    type="number"
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', color: '#fbbf24', fontWeight: 800, border: '1px solid #334155', padding: '0.6rem', borderRadius: '10px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Award Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.35rem' }}>
                  سبب منح الوسام:
                </label>
                <input
                  type="text"
                  placeholder="مثال: لحفظ مزمور التوبة، أو التبكير وحضور 4 قداسات متتالية"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '0.6rem', borderRadius: '10px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    padding: '0.65rem 1.75rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
                  }}
                >
                  منح الوسام للبطل الآن 🎖️
                </button>
              </div>

              {awardSuccessMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {awardSuccessMsg}
                </div>
              )}

              {/* Show current badges for the selected student with quick remove */}
              {awardStudentId && (() => {
                const currentBadges = studentBadges.filter((b) => b.studentId === awardStudentId);
                const selectedStudent = students.find((s) => s.id === awardStudentId);
                return (
                  <div style={{ marginTop: '0.75rem', background: '#0f172a', borderRadius: '12px', padding: '1rem', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                        الأوسمة الممنوحة حالياً لـ ({selectedStudent?.arabicName || selectedStudent?.name}):
                        <span style={{ color: '#38bdf8', marginRight: '6px' }}>({currentBadges.length} وسام)</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        يمكنك حذف أي وسام بالضغط على زر الحذف وسحب نقاطه 🗑️
                      </span>
                    </div>

                    {currentBadges.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>لا توجد أوسمة ممنوحة لهذا المخدوم بعد.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {currentBadges.map((b) => {
                          const tierStyle = TIER_STYLES[b.badgeTier as keyof typeof TIER_STYLES] || TIER_STYLES.bronze;
                          return (
                            <div
                              key={b.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#1e293b',
                                border: `1px solid ${tierStyle.borderColor}60`,
                                borderRadius: '10px',
                                padding: '6px 10px',
                              }}
                            >
                              <div
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  background: tierStyle.bgGradient,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {renderBadgeIconOrImage(
                                  { icon: b.icon, imageUrl: b.imageUrl, tier: b.badgeTier } as any,
                                  14,
                                  tierStyle.textColor
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                                  {b.badgeName}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                  {b.pointsAwarded ? `+${b.pointsAwarded} نقطة • ` : ''}{b.awardedAt?.split('T')[0]}
                                </span>
                              </div>
                              <button
                                type="button"
                                title="حذف الوسام وخصم نقاطه"
                                onClick={() => handleRemoveStudentBadge(b, true)}
                                style={{
                                  background: '#ef444420',
                                  border: '1px solid #ef4444',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  padding: '4px',
                                  marginRight: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </form>
          </div>

          {/* Catalog Preview of Badges */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                استعراض مكتبة الـ ١٠٠٠ وسام الكبرى
              </h3>
              <button
                type="button"
                onClick={() => {
                  setBadgePickerCallback(null);
                  setIsBadgePickerOpen(true);
                }}
                style={{ background: '#334155', color: '#38bdf8', border: '1px solid #38bdf8', padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                فتح المستكشف التفاعلي الكامل
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.85rem' }}>
              {ALL_1000_BADGES.slice(0, 36).map((badge) => {
                const tierStyle = TIER_STYLES[badge.tier];
                return (
                  <div
                    key={badge.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: '12px',
                      padding: '0.75rem 0.5rem',
                      textAlign: 'center',
                      border: `1px solid ${tierStyle.borderColor}40`,
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: tierStyle.bgGradient,
                        margin: '0 auto 0.45rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {renderBadgeIconOrImage(badge, 20, tierStyle.textColor)}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {badge.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: tierStyle.borderColor }}>
                      {tierStyle.labelAr}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: BADGES REPORT FOR SERVANTS */}
      {activeTab === 'badge_report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                تقرير وإحصائيات أوسمة المخدومين بالفصل
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                متابعة دقيقة لكل مخدوم والأوسمة التي حققها (ذهبي، فضي، برونزي)
              </p>
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="ابحث باسم المخدوم..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  padding: '6px 2rem 6px 10px',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          </div>

          {/* Roster Badges Table */}
          <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>الترتيب</th>
                  <th style={{ padding: '0.85rem 1rem' }}>اسم المخدوم</th>
                  <th style={{ padding: '0.85rem 1rem' }}>كود الباسبور</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#fbbf24' }}>🥇 ذهبي</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>🥈 فضي</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#d97706' }}>🥉 برونزي</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#f472b6' }}>💎 أسطوري/ماسي</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#38bdf8' }}>إجمالي الأوسمة</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>إدارة الأوسمة</th>
                </tr>
              </thead>
              <tbody>
                {badgeReportStats
                  .filter((row) => {
                    if (!reportSearch.trim()) return true;
                    const q = reportSearch.toLowerCase();
                    return (
                      row.student.name.toLowerCase().includes(q) ||
                      (row.student.arabicName && row.student.arabicName.includes(q)) ||
                      row.student.id.toLowerCase().includes(q)
                    );
                  })
                  .map((row, idx) => (
                    <tr
                      key={row.student.id}
                      style={{
                        borderBottom: '1px solid #334155',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.4)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: idx < 3 ? '#fbbf24' : '#94a3b8' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {row.student.arabicName || row.student.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {row.student.id}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#fbbf24', fontWeight: 700 }}>
                        {row.gold}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontWeight: 700 }}>
                        {row.silver}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#d97706', fontWeight: 700 }}>
                        {row.bronze}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#f472b6', fontWeight: 700 }}>
                        {row.elite}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#38bdf8', fontSize: '1rem' }}>
                        {row.badges.length} وسام
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setStudentBadgeManageModal(row.student)}
                          disabled={row.badges.length === 0}
                          style={{
                            background: row.badges.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(51, 65, 85, 0.25)',
                            border: `1px solid ${row.badges.length > 0 ? '#ef4444' : '#475569'}`,
                            color: row.badges.length > 0 ? '#fca5a5' : '#64748b',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: row.badges.length > 0 ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={13} />
                          عرض وحذف ({row.badges.length})
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECITATION CONFIRMATION MODAL */}
      {recitationModalRequest && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: '500px',
              width: '95%',
              background: '#0f172a',
              border: '2px solid #10b981',
              borderRadius: '20px',
              padding: '1.75rem',
              color: '#f8fafc',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 900, color: '#34d399' }}>
              اعتماد تسميع المزمور وإيداع النقاط والوسام
            </h3>

            {(() => {
              const req = recitationModalRequest;
              const maz = mazamer.find((m) => m.id === req.mazmourId);
              const approvedTime = req.approvedAt ? new Date(req.approvedAt).getTime() : Date.now();
              const days = Math.max(0, Math.floor((Date.now() - approvedTime) / (1000 * 60 * 60 * 24)));

              let autoTier: 'gold' | 'silver' | 'bronze' = 'gold';
              let autoPoints = maz?.week1Score || 30;

              if (days <= 7) {
                autoTier = 'gold';
                autoPoints = maz?.week1Score || 30;
              } else if (days <= 14) {
                autoTier = 'silver';
                autoPoints = maz?.week2Score || 20;
              } else {
                autoTier = 'bronze';
                autoPoints = maz?.afterTimeScore || 10;
              }

              return (
                <div>
                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.25rem' }}>
                      المخدوم: {req.studentName}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                      المزمور: {req.mazmourTitle}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                      مرت {days} يوم منذ تسليم المزمور.
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>الاستحقاق التلقائي حسب المدة:</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: autoTier === 'gold' ? '#fbbf24' : autoTier === 'silver' ? '#cbd5e1' : '#d97706', margin: '0.35rem 0' }}>
                      وسام {autoTier === 'gold' ? 'ذهبي 🥇' : autoTier === 'silver' ? 'فضي 🥈' : 'برونزي 🥉'} + {autoPoints} نقطة
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleConfirmRecitationDone(req)}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        padding: '0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      تأكيد التسميع بالاستحقاق التلقائي ({autoTier}) 🚀
                    </button>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleConfirmRecitationDone(req, 'gold')}
                        style={{ flex: 1, background: '#854d0e', color: '#fff', border: 'none', padding: '6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        منح ذهبي استثنائي 🥇
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmRecitationDone(req, 'silver')}
                        style={{ flex: 1, background: '#475569', color: '#fff', border: 'none', padding: '6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        منح فضي 🥈
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmRecitationDone(req, 'bronze')}
                        style={{ flex: 1, background: '#78350f', color: '#fff', border: 'none', padding: '6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        منح برونزي 🥉
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRecitationModalRequest(null)}
                      style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT CREATE/EDIT MODAL */}
      {isAnnouncementModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '500px', width: '95%', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingAnnouncement ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
            </h3>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>عنوان الإعلان:</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>نص الإعلان:</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                />
              </div>

              <ImageUploadInput
                label="صورة أو بوستر الإعلان (اختياري)"
                value={annImageUrl}
                onChange={setAnnImageUrl}
                aspectRatio="banner"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الجمهور المستهدف:</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value as any)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="boys">المخدومين فقط</option>
                    <option value="parents">أولياء الأمور فقط</option>
                    <option value="all">عام للجميع</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الأهمية:</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل ⚠️</option>
                    <option value="celebration">احتفال وتشجيع 🌟</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>تثبيت الإعلان في أعلى اللوحة</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.25rem', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '8px', fontWeight: 800 }}
                >
                  حفظ ونشر الإعلان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHOP ITEM CREATE/EDIT MODAL */}
      {isShopModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '480px', width: '95%', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingShopItem ? 'تعديل الجائزة' : 'إضافة جائزة جديدة للمتجر'}
            </h3>

            <form onSubmit={handleSaveShopItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>اسم الجائزة:</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الوصف:</label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <ImageUploadInput
                label="صورة الجائزة أو المنتج (اختياري)"
                value={itemImageUrl}
                onChange={setItemImageUrl}
                aspectRatio="square"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>السعر بالنقاط:</label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fbbf24', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الكمية المتاحة:</label>
                  <input
                    type="number"
                    required
                    value={itemStock}
                    onChange={(e) => setItemStock(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>أيقونة الجائزة:</label>
                  <select
                    value={itemIcon}
                    onChange={(e) => setItemIcon(e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="Package">هدية عامة (Package)</option>
                    <option value="BookOpen">كتاب مقدس (Bible)</option>
                    <option value="Cross">صليب (Cross)</option>
                    <option value="Trophy">رياضة وكأس (Trophy)</option>
                    <option value="Heart">محبة ومج (Heart)</option>
                    <option value="Zap">لعبة ومسابقات (Game)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>التصنيف:</label>
                  <input
                    type="text"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={itemEnabled}
                  onChange={(e) => setItemEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>تفعيل الجائزة (يمكن للأولاد شراؤها)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsShopModalOpen(false)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.25rem', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '8px', fontWeight: 800 }}
                >
                  حفظ الجائزة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAZMOUR CREATE/EDIT MODAL */}
      {isMazmourModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '550px', width: '95%', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingMazmour ? 'تعديل المزمور' : 'إضافة مزمور جديد لقاعدة البيانات'}
            </h3>

            <form onSubmit={handleSaveMazmour} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>رقم المزمور:</label>
                  <input
                    type="number"
                    required
                    value={mazNum}
                    onChange={(e) => setMazNum(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>عنوان المزمور:</label>
                  <input
                    type="text"
                    required
                    placeholder="مزمور ٢٣: الرب راعيّ"
                    value={mazTitle}
                    onChange={(e) => setMazTitle(e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الشاهد والصلوات:</label>
                <input
                  type="text"
                  placeholder="صلاة الساعة الثالثة بالأجبية"
                  value={mazRef}
                  onChange={(e) => setMazRef(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>نص المزمور باللغة العربية:</label>
                <textarea
                  rows={5}
                  required
                  placeholder="اكتب أو الصق نص المزمور هنا..."
                  value={mazText}
                  onChange={(e) => setMazText(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff', lineHeight: 1.6, direction: 'rtl' }}
                />
              </div>

              {/* Interval Points Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#fbbf24', marginBottom: '0.2rem' }}>🥇 أسبوع ١:</label>
                  <input
                    type="number"
                    value={mazWeek1Score}
                    onChange={(e) => setMazWeek1Score(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.4rem', borderRadius: '6px', color: '#fbbf24', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>🥈 أسبوعين:</label>
                  <input
                    type="number"
                    value={mazWeek2Score}
                    onChange={(e) => setMazWeek2Score(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.4rem', borderRadius: '6px', color: '#cbd5e1', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#d97706', marginBottom: '0.2rem' }}>🥉 بعد الوقت:</label>
                  <input
                    type="number"
                    value={mazAfterScore}
                    onChange={(e) => setMazAfterScore(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.4rem', borderRadius: '6px', color: '#d97706', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#f87171', marginBottom: '0.2rem' }}>مهلة الإسقاط:</label>
                  <input
                    type="number"
                    value={mazMaxDrop}
                    onChange={(e) => setMazMaxDrop(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.4rem', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsMazmourModalOpen(false)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.25rem', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '8px', fontWeight: 800 }}
                >
                  حفظ المزمور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHALLENGE CREATE MODAL */}
      {isChallengeModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '500px', width: '95%', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingChallenge ? 'تعديل التحدي' : 'إضافة تحدي أسبوعي جديد'}
            </h3>

            <form onSubmit={handleSaveChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>عنوان التحدي:</label>
                <input
                  type="text"
                  required
                  value={chalTitle}
                  onChange={(e) => setChalTitle(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>وصف التحدي وشروطه:</label>
                <textarea
                  rows={3}
                  required
                  value={chalDesc}
                  onChange={(e) => setChalDesc(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <ImageUploadInput
                label="صورة أو بوستر التحدي (اختياري)"
                value={chalImageUrl}
                onChange={setChalImageUrl}
                aspectRatio="banner"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>النقاط الممنوحة:</label>
                  <input
                    type="number"
                    required
                    value={chalScore}
                    onChange={(e) => setChalScore(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fbbf24', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>التصنيف:</label>
                  <select
                    value={chalCategory}
                    onChange={(e) => setChalCategory(e.target.value as any)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="spiritual">حياة روحية وصلاة</option>
                    <option value="attendance">حضور والتزام</option>
                    <option value="service">خدمة ومحبة</option>
                    <option value="study">دراسة وإنجيل</option>
                    <option value="sports">نشاط رياضي</option>
                  </select>
                </div>
              </div>

              {/* Badge Selection Trigger */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>وسام التحدي (من مكتبة الـ ١٠٠٠ وسام):</label>
                <button
                  type="button"
                  onClick={() => {
                    setBadgePickerCallback(() => (badge: BadgeDefinition) => {
                      setChalSelectedBadge(badge);
                      setIsBadgePickerOpen(false);
                    });
                    setIsBadgePickerOpen(true);
                  }}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #38bdf8',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: TIER_STYLES[chalSelectedBadge.tier].bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderBadgeIconOrImage(chalSelectedBadge, 16, '#fff')}
                    </div>
                    <span>{chalSelectedBadge.name} ({TIER_STYLES[chalSelectedBadge.tier].labelAr})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>تغيير الوسام</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsChallengeModalOpen(false)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.25rem', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '8px', fontWeight: 800 }}
                >
                  حفظ التحدي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUIZ CREATE MODAL */}
      {isQuizModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '650px', width: '95%', maxHeight: '85vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingQuiz ? 'تعديل المسابقة' : 'إنشاء مسابقة تفاعلية جديدة'}
            </h3>

            <form onSubmit={handleSaveQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>عنوان المسابقة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مسابقة سفر الخروج - الأسبوع الثاني"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الوصف أو الشاهد الكنسي:</label>
                <input
                  type="text"
                  placeholder="معلومات إرشادية للأولاد قبل بدء الحل..."
                  value={quizDesc}
                  onChange={(e) => setQuizDesc(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <ImageUploadInput
                label="غلاف / بوستر المسابقة (اختياري)"
                value={quizImageUrl}
                onChange={setQuizImageUrl}
                aspectRatio="banner"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>النقاط الممنوحة عند الاجتياز:</label>
                  <input
                    type="number"
                    value={quizScore}
                    onChange={(e) => setQuizScore(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.6rem', borderRadius: '8px', color: '#fbbf24', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>الوسام الممنوح:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setBadgePickerCallback(() => (b: BadgeDefinition) => {
                        setQuizBadge(b);
                        setIsBadgePickerOpen(false);
                      });
                      setIsBadgePickerOpen(true);
                    }}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #a855f7',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: TIER_STYLES[quizBadge.tier].bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {renderBadgeIconOrImage(quizBadge, 14, '#fff')}
                      </div>
                      <span>{quizBadge.name} ({TIER_STYLES[quizBadge.tier].labelAr})</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#c084fc' }}>تغيير</span>
                  </button>
                </div>
              </div>

              {/* Questions List Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c084fc' }}>
                    أسئلة المسابقة ({quizQuestions.length})
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions((prev) => [
                          ...prev,
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            type: 'mcq',
                            question: `سؤال اختيار من متعدد #${prev.length + 1}`,
                            options: ['اختيار أ', 'اختيار ب', 'اختيار ج', 'اختيار د'],
                            correctOptionIndex: 0,
                            explanation: '',
                          },
                        ]);
                      }}
                      style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      + اختيار متعدد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions((prev) => [
                          ...prev,
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            type: 'true_false',
                            question: `سؤال صح أو خطأ #${prev.length + 1}`,
                            correctBoolean: true,
                            explanation: '',
                          },
                        ]);
                      }}
                      style={{ background: '#334155', color: '#34d399', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      + صح/خطأ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions((prev) => [
                          ...prev,
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            type: 'fill_blank',
                            question: `أكمل الآية: "......"`,
                            blankAnswer: '',
                            explanation: '',
                          },
                        ]);
                      }}
                      style={{ background: '#334155', color: '#fbbf24', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      + أكمل الفراغ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions((prev) => [
                          ...prev,
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            type: 'order',
                            question: `رتب الأحداث التالية حسب تسلسلها الزمني:`,
                            orderItems: ['الحدث الأول', 'الحدث الثاني', 'الحدث الثالث'],
                            explanation: '',
                          },
                        ]);
                      }}
                      style={{ background: '#334155', color: '#a78bfa', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      + ترتيب
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions((prev) => [
                          ...prev,
                          {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            type: 'matching',
                            question: `قم بتوصيل كل عنصر بما يناسبه:`,
                            matchingPairs: [
                              { id: '1', left: 'الشخصية الأولى', right: 'العمل الأول' },
                              { id: '2', left: 'الشخصية الثانية', right: 'العمل الثاني' },
                              { id: '3', left: 'الشخصية الثالثة', right: 'العمل الثالث' },
                            ],
                            explanation: '',
                          },
                        ]);
                      }}
                      style={{ background: '#334155', color: '#f472b6', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      + توصيل
                    </button>
                  </div>
                </div>

                {quizQuestions.map((q, qIdx) => {
                  const qType = q.type || 'mcq';

                  return (
                    <div
                      key={q.id || qIdx}
                      style={{
                        background: '#1e293b',
                        padding: '1.25rem',
                        borderRadius: '14px',
                        marginBottom: '1rem',
                        border: '1px solid #334155',
                      }}
                    >
                      {/* Question Top Header Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
                            السؤال #{qIdx + 1}
                          </span>

                          {/* Question Type Selector */}
                          <select
                            value={qType}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionType;
                              setQuizQuestions((prev) => {
                                const updated = [...prev];
                                const cur = updated[qIdx];
                                updated[qIdx] = {
                                  ...cur,
                                  type: newType,
                                  options: newType === 'mcq' ? (cur.options && cur.options.length > 0 ? cur.options : ['اختيار أ', 'اختيار ب', 'اختيار ج', 'اختيار د']) : undefined,
                                  correctOptionIndex: newType === 'mcq' ? (cur.correctOptionIndex ?? 0) : undefined,
                                  correctBoolean: newType === 'true_false' ? (cur.correctBoolean ?? true) : undefined,
                                  blankAnswer: newType === 'fill_blank' ? (cur.blankAnswer || '') : undefined,
                                  orderItems: newType === 'order' ? (cur.orderItems && cur.orderItems.length > 0 ? cur.orderItems : ['الحدث الأول', 'الحدث الثاني', 'الحدث الثالث']) : undefined,
                                  matchingPairs: newType === 'matching' ? (cur.matchingPairs && cur.matchingPairs.length > 0 ? cur.matchingPairs : [
                                    { id: '1', left: 'العنصر الأول', right: 'المطابق له' },
                                    { id: '2', left: 'العنصر الثاني', right: 'المطابق له' },
                                  ]) : undefined,
                                };
                                return updated;
                              });
                            }}
                            style={{
                              background: '#0f172a',
                              border: '1px solid #38bdf8',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <option value="mcq">اختيار من متعدد (MCQ) 🔘</option>
                            <option value="true_false">صح أو خطأ ⚖️</option>
                            <option value="fill_blank">أكمل الفراغ / آية ✍️</option>
                            <option value="order">ترتيب أحداث أو آيات 🔢</option>
                            <option value="matching">توصيل ومطابقة 🔗</option>
                          </select>
                        </div>

                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuizQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                            style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Trash2 size={13} />
                            حذف السؤال
                          </button>
                        )}
                      </div>

                      {/* Question Text */}
                      <input
                        type="text"
                        placeholder="نص السؤال أو الآية..."
                        value={q.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuizQuestions((prev) => {
                            const updated = [...prev];
                            updated[qIdx].question = val;
                            return updated;
                          });
                        }}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid #334155',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          color: '#fff',
                          marginBottom: '0.75rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                        }}
                      />

                      {/* Question Image Uploader */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <ImageUploadInput
                          label="صورة توضيحية للسؤال (اختياري)"
                          value={q.imageUrl || ''}
                          onChange={(url) => {
                            setQuizQuestions((prev) => {
                              const updated = [...prev];
                              updated[qIdx].imageUrl = url;
                              return updated;
                            });
                          }}
                          aspectRatio="banner"
                        />
                      </div>

                      {/* --- TYPE 1: MCQ --- */}
                      {qType === 'mcq' && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                            الاختيارات (حدد الدائرة أمام الإجابة الصحيحة):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {(q.options || ['اختيار أ', 'اختيار ب', 'اختيار ج', 'اختيار د']).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  background: q.correctOptionIndex === oIdx ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  border: q.correctOptionIndex === oIdx ? '1px solid #10b981' : '1px solid #334155',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correctOptionIndex === oIdx}
                                  onChange={() => {
                                    setQuizQuestions((prev) => {
                                      const updated = [...prev];
                                      updated[qIdx].correctOptionIndex = oIdx;
                                      return updated;
                                    });
                                  }}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuizQuestions((prev) => {
                                      const updated = [...prev];
                                      const opts = [...(updated[qIdx].options || ['اختيار أ', 'اختيار ب', 'اختيار ج', 'اختيار د'])];
                                      opts[oIdx] = val;
                                      updated[qIdx].options = opts;
                                      return updated;
                                    });
                                  }}
                                  style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.82rem',
                                    outline: 'none',
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* --- TYPE 2: TRUE / FALSE --- */}
                      {qType === 'true_false' && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                            حدد الإجابة الصحيحة للعبارة:
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setQuizQuestions((prev) => {
                                  const updated = [...prev];
                                  updated[qIdx].correctBoolean = true;
                                  return updated;
                                });
                              }}
                              style={{
                                flex: 1,
                                background: q.correctBoolean !== false ? 'rgba(16, 185, 129, 0.2)' : '#0f172a',
                                border: q.correctBoolean !== false ? '2px solid #10b981' : '1px solid #334155',
                                color: q.correctBoolean !== false ? '#34d399' : '#94a3b8',
                                padding: '8px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                            >
                              ✅ صح (العبارة صحيحة)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuizQuestions((prev) => {
                                  const updated = [...prev];
                                  updated[qIdx].correctBoolean = false;
                                  return updated;
                                });
                              }}
                              style={{
                                flex: 1,
                                background: q.correctBoolean === false ? 'rgba(239, 68, 68, 0.2)' : '#0f172a',
                                border: q.correctBoolean === false ? '2px solid #ef4444' : '1px solid #334155',
                                color: q.correctBoolean === false ? '#f87171' : '#94a3b8',
                                padding: '8px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                            >
                              ❌ خطأ (العبارة خاطئة)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* --- TYPE 3: FILL IN THE BLANK --- */}
                      {qType === 'fill_blank' && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.3rem', fontWeight: 700 }}>
                            الكلمة أو العبارة المطلوبة (الإجابة الصحيحة):
                          </div>
                          <input
                            type="text"
                            placeholder="مثال: داود / المحبة / ٣٠"
                            value={q.blankAnswer || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuizQuestions((prev) => {
                                const updated = [...prev];
                                updated[qIdx].blankAnswer = val;
                                return updated;
                              });
                            }}
                            style={{
                              width: '100%',
                              background: '#0f172a',
                              border: '1px solid #fbbf24',
                              padding: '0.55rem',
                              borderRadius: '8px',
                              color: '#fbbf24',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              marginBottom: '0.4rem',
                            }}
                          />
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            💡 ملاحظة: النظام يتغاضى تلقائياً عن التشكيل والهمزات (أ، إ، آ ➔ ا) والياء والألف اللينة (ى ➔ ي) والتاء المربوطة.
                          </div>
                        </div>
                      )}

                      {/* --- TYPE 4: ORDERING --- */}
                      {qType === 'order' && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700 }}>
                              العناصر بالترتيب الصحيح (سيتم خلطها أمام الولد):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuizQuestions((prev) => {
                                  const updated = [...prev];
                                  const items = [...(updated[qIdx].orderItems || ['عنصر ١', 'عنصر ٢'])];
                                  items.push(`عنصر جديد ${items.length + 1}`);
                                  updated[qIdx].orderItems = items;
                                  return updated;
                                });
                              }}
                              style={{ background: '#334155', color: '#a78bfa', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}
                            >
                              + عنصر جديد
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {(q.orderItems || ['الحدث الأول', 'الحدث الثاني', 'الحدث الثالث']).map((item, itmIdx, arr) => (
                              <div
                                key={itmIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  background: '#0f172a',
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid #334155',
                                }}
                              >
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa' }}>
                                  {itmIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuizQuestions((prev) => {
                                      const updated = [...prev];
                                      const items = [...(updated[qIdx].orderItems || [])];
                                      items[itmIdx] = val;
                                      updated[qIdx].orderItems = items;
                                      return updated;
                                    });
                                  }}
                                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                                />
                                {itmIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuizQuestions((prev) => {
                                        const updated = [...prev];
                                        const items = [...(updated[qIdx].orderItems || [])];
                                        const tmp = items[itmIdx];
                                        items[itmIdx] = items[itmIdx - 1];
                                        items[itmIdx - 1] = tmp;
                                        updated[qIdx].orderItems = items;
                                        return updated;
                                      });
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                )}
                                {itmIdx < arr.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuizQuestions((prev) => {
                                        const updated = [...prev];
                                        const items = [...(updated[qIdx].orderItems || [])];
                                        const tmp = items[itmIdx];
                                        items[itmIdx] = items[itmIdx + 1];
                                        items[itmIdx + 1] = tmp;
                                        updated[qIdx].orderItems = items;
                                        return updated;
                                      });
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                )}
                                {arr.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuizQuestions((prev) => {
                                        const updated = [...prev];
                                        updated[qIdx].orderItems = (updated[qIdx].orderItems || []).filter((_, i) => i !== itmIdx);
                                        return updated;
                                      });
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                    title="حذف هذا العنصر"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* --- TYPE 5: MATCHING --- */}
                      {qType === 'matching' && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 700 }}>
                              أزواج التوصيل المتطابقة (سيتم خلط الطرف المقابل):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuizQuestions((prev) => {
                                  const updated = [...prev];
                                  const pairs = [...(updated[qIdx].matchingPairs || [])];
                                  pairs.push({
                                    id: `pair_${Date.now()}`,
                                    left: `شخصية / سؤال ${pairs.length + 1}`,
                                    right: `عمل / إجابة ${pairs.length + 1}`,
                                  });
                                  updated[qIdx].matchingPairs = pairs;
                                  return updated;
                                });
                              }}
                              style={{ background: '#334155', color: '#f472b6', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}
                            >
                              + زوج جديد
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {(q.matchingPairs || [
                              { id: '1', left: 'العنصر الأول', right: 'المطابق له' },
                              { id: '2', left: 'العنصر الثاني', right: 'المطابق له' },
                            ]).map((pair, pIdx, arr) => (
                              <div
                                key={pair.id || pIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  background: '#0f172a',
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid #334155',
                                }}
                              >
                                <input
                                  type="text"
                                  placeholder="الطرف الأيمن (السؤال)"
                                  value={pair.left}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuizQuestions((prev) => {
                                      const updated = [...prev];
                                      const pairs = [...(updated[qIdx].matchingPairs || [])];
                                      pairs[pIdx] = { ...pairs[pIdx], left: val };
                                      updated[qIdx].matchingPairs = pairs;
                                      return updated;
                                    });
                                  }}
                                  style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '4px 6px', color: '#fff', fontSize: '0.8rem' }}
                                />
                                <span style={{ color: '#f472b6', fontWeight: 800 }}>⇄</span>
                                <input
                                  type="text"
                                  placeholder="الطرف المقابل (الإجابة)"
                                  value={pair.right}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuizQuestions((prev) => {
                                      const updated = [...prev];
                                      const pairs = [...(updated[qIdx].matchingPairs || [])];
                                      pairs[pIdx] = { ...pairs[pIdx], right: val };
                                      updated[qIdx].matchingPairs = pairs;
                                      return updated;
                                    });
                                  }}
                                  style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '4px 6px', color: '#fff', fontSize: '0.8rem' }}
                                />
                                {arr.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuizQuestions((prev) => {
                                        const updated = [...prev];
                                        updated[qIdx].matchingPairs = (updated[qIdx].matchingPairs || []).filter((_, i) => i !== pIdx);
                                        return updated;
                                      });
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                    title="حذف هذا الزوج"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation Field */}
                      <input
                        type="text"
                        placeholder="تفسير أو معلومة إضافية تظهر بعد الحل (اختياري)"
                        value={q.explanation || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuizQuestions((prev) => {
                            const updated = [...prev];
                            updated[qIdx].explanation = val;
                            return updated;
                          });
                        }}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid #334155',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          color: '#94a3b8',
                          fontSize: '0.78rem',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.25rem', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '8px', fontWeight: 800 }}
                >
                  {editingQuiz ? 'حفظ التعديلات' : 'حفظ ونشر المسابقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION REPLY MODAL */}
      {replyingQuestion && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: '500px', width: '95%', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: '20px', padding: '1.5rem', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
              الرد على سؤال المخدوم
            </h3>

            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: '0.2rem' }}>
                {replyingQuestion.isAnonymous ? 'مخدوم (سري)' : replyingQuestion.studentName}:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                "{replyingQuestion.questionText}"
              </div>
            </div>

            <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>نص إجابتك الإرشادية:</label>
                <textarea
                  rows={5}
                  required
                  placeholder="اكتب الإجابة الروحية أو النصيحة للولد هنا..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', padding: '0.65rem', borderRadius: '8px', color: '#fff', lineHeight: 1.6 }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={replyPublic}
                  onChange={(e) => setReplyPublic(e.target.checked)}
                />
                <span>مشاركة السؤال والإجابة كفائدة عامة لكل الأولاد (بدون ذكر اسم السائل)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReplyingQuestion(null)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.25rem', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '8px', fontWeight: 800 }}
                >
                  إرسال الرد للولد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECLINE MAZMOUR REQUEST MODAL */}
      {declineModalRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setDeclineModalRequest(null)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '2px solid #ef4444',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={20} color="#f87171" />
                رفض أو حذف طلب استلام المزمور
              </h3>
              <button
                type="button"
                onClick={() => setDeclineModalRequest(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '10px', padding: '0.85rem', marginBottom: '1rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                المخدوم: {declineModalRequest.studentName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                المزمور المطلوب: {declineModalRequest.mazmourTitle} (مزمور {declineModalRequest.mazmourNumber || 1})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                تاريخ الطلب: {declineModalRequest.requestedAt ? new Date(declineModalRequest.requestedAt).toLocaleDateString('ar-EG') : 'غير محدد'}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                سبب الرفض (سيظهر للمخدوم في الإشعار وصفحة المزامير):
              </label>

              {/* Quick Reasons Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.6rem' }}>
                {[
                  'طلب بالخطأ من المخدوم',
                  'لم ينتهِ من حفظ المزمور السابق بعد',
                  'يرجى مراجعة الخادم المسئول أولاً',
                  'يرجى اختيار مزمور آخر مناسب لمستواك',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDeclineReason(reason)}
                    style={{
                      background: declineReason === reason ? '#ef4444' : '#1e293b',
                      color: declineReason === reason ? '#fff' : '#cbd5e1',
                      border: '1px solid #334155',
                      borderRadius: '14px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="اكتب سبب الرفض أو الملاحظة للمخدوم..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                💡 عند الرفض، سيتمكن المخدوم فوراً من اختيار مزمور جديد وحفظه.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setDeclineModalRequest(null)}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclineMazmourRequest(declineModalRequest, declineReason)}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1.3rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  تأكيد رفض الطلب ❌
                </button>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>أو يمكنك حذف الطلب كلياً بدون حفظ حالة الرفض:</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMazmourRequest(declineModalRequest.id)}
                  style={{
                    background: 'transparent',
                    color: '#f87171',
                    border: '1px dashed #ef4444',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  حذف السجل نهائياً 🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT BADGES MANAGEMENT MODAL */}
      {studentBadgeManageModal && (() => {
        const student = studentBadgeManageModal;
        const badgesOfStudent = studentBadges.filter((b) => b.studentId === student.id);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
            onClick={() => setStudentBadgeManageModal(null)}
          >
            <div
              style={{
                background: '#0f172a',
                border: '2px solid #38bdf8',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                color: '#f8fafc',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#1e293b',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8' }}>
                    إدارة أوسمة المخدوم: {student.arabicName || student.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    كود الباسبور: {student.id} • إجمالي الأوسمة: {badgesOfStudent.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentBadgeManageModal(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Options Bar */}
              <div style={{ padding: '0.75rem 1.25rem', background: '#0b1329', borderBottom: '1px solid #1e293b' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={deductPointsOnBadgeDelete}
                    onChange={(e) => setDeductPointsOnBadgeDelete(e.target.checked)}
                  />
                  <span>خصم وسحب النقاط الممنوحة مع الوسام تلقائياً من رصيد المخدوم عند حذفه</span>
                </label>
              </div>

              {/* Badges List */}
              <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {badgesOfStudent.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    لا توجد أوسمة ممنوحة لهذا المخدوم حالياً
                  </div>
                ) : (
                  badgesOfStudent.map((badge) => {
                    const tierStyle = TIER_STYLES[badge.badgeTier as keyof typeof TIER_STYLES] || TIER_STYLES.bronze;
                    return (
                      <div
                        key={badge.id}
                        style={{
                          background: '#1e293b',
                          border: `1px solid ${tierStyle.borderColor}60`,
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: tierStyle.bgGradient,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {renderBadgeIconOrImage(
                              { icon: badge.icon, imageUrl: badge.imageUrl, tier: badge.badgeTier } as any,
                              22,
                              tierStyle.textColor
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
                              {badge.badgeName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                              <span style={{ color: tierStyle.borderColor, fontWeight: 700 }}>
                                {tierStyle.labelAr}
                              </span>
                              {badge.pointsAwarded ? (
                                <span style={{ color: '#fbbf24' }}>• +{badge.pointsAwarded} نقطة</span>
                              ) : null}
                              {badge.awardedAt ? (
                                <span>• {new Date(badge.awardedAt).toLocaleDateString('ar-EG')}</span>
                              ) : null}
                              {badge.reason ? (
                                <span style={{ color: '#cbd5e1' }}>• {badge.reason}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStudentBadge(badge, deductPointsOnBadgeDelete)}
                          style={{
                            background: '#ef444420',
                            border: '1px solid #ef4444',
                            color: '#f87171',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={14} />
                          حذف الوسام
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', background: '#1e293b' }}>
                <button
                  type="button"
                  onClick={() => setStudentBadgeManageModal(null)}
                  style={{
                    background: '#334155',
                    color: '#f8fafc',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BADGE PICKER MODAL (From 1000 Badges Library) */}
      <BadgePickerModal
        isOpen={isBadgePickerOpen}
        onClose={() => setIsBadgePickerOpen(false)}
        onSelectBadge={(badge) => {
          if (badgePickerCallback) {
            badgePickerCallback(badge);
          } else {
            setAwardBadge(badge);
            setIsBadgePickerOpen(false);
          }
        }}
      />
    </div>
  );
};
