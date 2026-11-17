// Clash Royale Arena & Trophy Progression System for Sunday School Boys Portal
export interface ArenaTier {
  id: number;
  nameAr: string;
  nameEn: string;
  minTrophies: number;
  maxTrophies: number;
  icon: string;
  badgeColor: string;
  bannerBg: string;
  chestsReward: string;
}

export const CLASH_ARENAS: ArenaTier[] = [
  {
    id: 1,
    nameAr: 'Home',
    nameEn: 'Home',
    minTrophies: 0,
    maxTrophies: 150,
    icon: '⚔️',
    badgeColor: '#94a3b8',
    bannerBg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    chestsReward: 'صندوق التدريب الخشبي',
  },
  {
    id: 2,
    nameAr: 'ساحة الشمامسة الأبطال',
    nameEn: 'Deacons Arena',
    minTrophies: 150,
    maxTrophies: 350,
    icon: '🛡️',
    badgeColor: '#38bdf8',
    bannerBg: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    chestsReward: 'صندوق الشمامسة الفضي',
  },
  {
    id: 3,
    nameAr: 'حصن داود المرتل',
    nameEn: "David's Fortress",
    minTrophies: 350,
    maxTrophies: 650,
    icon: '🏰',
    badgeColor: '#a855f7',
    bannerBg: 'linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)',
    chestsReward: 'صندوق المزامير الملكي',
  },
  {
    id: 4,
    nameAr: 'برج الرسل الأطهار',
    nameEn: 'Apostles Tower',
    minTrophies: 650,
    maxTrophies: 1000,
    icon: '⚡',
    badgeColor: '#f59e0b',
    bannerBg: 'linear-gradient(135deg, #b45309 0%, #eab308 100%)',
    chestsReward: 'صندوق الرسل العملاق',
  },
  {
    id: 5,
    nameAr: 'الساحة الملوكية للبابا ساويرس',
    nameEn: 'Royal Saweros Arena',
    minTrophies: 1000,
    maxTrophies: 1500,
    icon: '👑',
    badgeColor: '#ec4899',
    bannerBg: 'linear-gradient(135deg, #be185d 0%, #db2777 100%)',
    chestsReward: 'صندوق التاج الملوكي الفائق',
  },
  {
    id: 6,
    nameAr: 'ساحة الأبطال السماوية الأسطورية',
    nameEn: 'Legendary Champions Arena',
    minTrophies: 1500,
    maxTrophies: 9999,
    icon: '✨',
    badgeColor: '#10b981',
    bannerBg: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    chestsReward: 'صندوق الأبطال الأسطوري الفائق',
  },
];

export function getBoyArena(score: number): {
  currentArena: ArenaTier;
  nextArena: ArenaTier | null;
  progressPercent: number;
  trophiesRemaining: number;
} {
  for (let i = 0; i < CLASH_ARENAS.length; i++) {
    const arena = CLASH_ARENAS[i];
    if (score < arena.maxTrophies || i === CLASH_ARENAS.length - 1) {
      const next = i < CLASH_ARENAS.length - 1 ? CLASH_ARENAS[i + 1] : null;
      const range = arena.maxTrophies - arena.minTrophies;
      const progress = Math.min(100, Math.max(0, Math.round(((score - arena.minTrophies) / range) * 100)));
      const remaining = next ? Math.max(0, next.minTrophies - score) : 0;
      return {
        currentArena: arena,
        nextArena: next,
        progressPercent: progress,
        trophiesRemaining: remaining,
      };
    }
  }
  return {
    currentArena: CLASH_ARENAS[CLASH_ARENAS.length - 1],
    nextArena: null,
    progressPercent: 100,
    trophiesRemaining: 0,
  };
}

export interface ClashChestSlot {
  id: string;
  titleAr: string;
  type: 'attendance' | 'darsktab' | 'psalm' | 'crown';
  status: 'ready' | 'locked' | 'claimed';
  rewardLabel: string;
  icon: string;
  color: string;
  description: string;
}
