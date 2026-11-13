import type { BadgeDefinition, BadgeTier, BadgeCategory } from '../types';

export interface TierStyle {
  labelAr: string;
  labelEn: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  accentBg: string;
}

export const TIER_STYLES: Record<BadgeTier, TierStyle> = {
  bronze: {
    labelAr: 'برونزي',
    labelEn: 'Bronze',
    bgGradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #92400e 100%)',
    borderColor: '#d97706',
    textColor: '#fef3c7',
    glowColor: 'rgba(217, 119, 6, 0.45)',
    accentBg: '#451a03',
  },
  silver: {
    labelAr: 'فضي',
    labelEn: 'Silver',
    bgGradient: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #94a3b8 100%)',
    borderColor: '#cbd5e1',
    textColor: '#f8fafc',
    glowColor: 'rgba(203, 213, 225, 0.45)',
    accentBg: '#1e293b',
  },
  gold: {
    labelAr: 'ذهبي',
    labelEn: 'Gold',
    bgGradient: 'linear-gradient(135deg, #854d0e 0%, #eab308 50%, #ca8a04 100%)',
    borderColor: '#fde047',
    textColor: '#ffffff',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    accentBg: '#713f12',
  },
  platinum: {
    labelAr: 'بلاتيني',
    labelEn: 'Platinum',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #38bdf8 50%, #0284c7 100%)',
    borderColor: '#7dd3fc',
    textColor: '#f0f9ff',
    glowColor: 'rgba(56, 189, 248, 0.55)',
    accentBg: '#082f49',
  },
  diamond: {
    labelAr: 'ماسي',
    labelEn: 'Diamond',
    bgGradient: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #67e8f9 100%)',
    borderColor: '#a5f3fc',
    textColor: '#ecfeff',
    glowColor: 'rgba(6, 182, 212, 0.65)',
    accentBg: '#164e63',
  },
  legendary: {
    labelAr: 'أسطوري',
    labelEn: 'Legendary',
    bgGradient: 'linear-gradient(135deg, #581c87 0%, #a855f7 50%, #ec4899 100%)',
    borderColor: '#f472b6',
    textColor: '#fdf2f8',
    glowColor: 'rgba(236, 72, 153, 0.65)',
    accentBg: '#3b0764',
  },
};

export const CATEGORY_LABELS: Record<BadgeCategory, { ar: string; en: string }> = {
  mazamer: { ar: 'مزامير داود', en: 'David Psalms' },
  challenge: { ar: 'تحديات أسبوعية', en: 'Challenges' },
  quiz: { ar: 'مسابقات وكويزات', en: 'Quizzes' },
  spiritual: { ar: 'حياة روحية', en: 'Spiritual' },
  attendance: { ar: 'حضور والتزام', en: 'Attendance' },
  hymns: { ar: 'ألحان وطقس', en: 'Hymns & Liturgy' },
  bible: { ar: 'كتاب مقدس', en: 'Bible' },
  sports: { ar: 'ملعب ورياضة', en: 'Sports & Pitch' },
  special: { ar: 'أوسمة شرف', en: 'Special Honors' },
};

// Available icons used in badges
export const BADGE_ICONS = [
  'Trophy',
  'Crown',
  'Flame',
  'Shield',
  'Star',
  'Cross',
  'Sparkles',
  'BookOpen',
  'Heart',
  'Zap',
  'Award',
  'Gem',
  'Compass',
  'Sun',
  'Moon',
  'Target',
  'Anchor',
  'Feather',
  'Bell',
  'Key',
  'Sword',
  'Music',
  'Eye',
  'Flag',
  'CheckCircle2',
] as const;

// Base themes and nouns for procedural generation of 1,000+ badges
const ARABIC_PREFIXES = [
  'فارس',
  'بطل',
  'حارس',
  'نسر',
  'أسد',
  'تاج',
  'سيف',
  'درع',
  'شعلة',
  'نجم',
  'سراج',
  'جوهرة',
  'صخرة',
  'ينبوع',
  'حكيم',
  'قائد',
  'صقر',
  'راعي',
  'خادم',
  'منارة',
  'كوكب',
  'شعاع',
  'نور',
  'صوت',
  'سفير',
];

const ARABIC_SUFFIXES = [
  'الإيمان',
  'المذبح',
  'التسبيح',
  'الإنجيل',
  'الصلاة',
  'الخدمة',
  'المحبة',
  'الحق',
  'الوداعة',
  'الرجاء',
  'السلام',
  'القداس',
  'الألحان',
  'الملعب',
  'الانتصار',
  'النقاء',
  'الأمانة',
  'العهد',
  'الشجاعة',
  'النعمة',
  'الحكمة',
  'الصوم',
  'التوبة',
  'التفوق',
  'الشهادة',
];

const ENGLISH_PREFIXES = [
  'Knight of',
  'Champion of',
  'Guardian of',
  'Eagle of',
  'Lion of',
  'Crown of',
  'Sword of',
  'Shield of',
  'Flame of',
  'Star of',
  'Beacon of',
  'Gem of',
  'Rock of',
  'Fountain of',
  'Sage of',
  'Leader of',
  'Falcon of',
  'Shepherd of',
  'Servant of',
  'Lighthouse of',
  'Celestial',
  'Radiant',
  'Beacon of',
  'Voice of',
  'Ambassador of',
];

const ENGLISH_SUFFIXES = [
  'Faith',
  'the Altar',
  'Praise',
  'the Gospel',
  'Prayer',
  'Service',
  'Love',
  'Truth',
  'Meekness',
  'Hope',
  'Peace',
  'Liturgy',
  'Hymns',
  'the Pitch',
  'Victory',
  'Purity',
  'Faithfulness',
  'the Covenant',
  'Courage',
  'Grace',
  'Wisdom',
  'Fasting',
  'Repentance',
  'Excellence',
  'Witness',
];

const TIERS: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legendary'];
const CATEGORIES: BadgeCategory[] = [
  'mazamer',
  'challenge',
  'quiz',
  'spiritual',
  'attendance',
  'hymns',
  'bible',
  'sports',
  'special',
];

// Generate 1,000 unique badges once and memoize
let cachedBadges: BadgeDefinition[] | null = null;

export function generate1000Badges(): BadgeDefinition[] {
  if (cachedBadges) return cachedBadges;

  const badges: BadgeDefinition[] = [];

  // 1. Core hand-crafted Psalm Badges (Psalms 1, 23, 27, 34, 51, 63, 91, 103, 121, 134, 150)
  const corePsalms = [1, 23, 27, 34, 51, 63, 91, 103, 121, 134, 150];
  corePsalms.forEach((num) => {
    // Gold badge
    badges.push({
      id: `mazmour_${num}_gold`,
      name: `وسام مزمور ${num} الذهبي`,
      nameEn: `Gold Psalm ${num} Badge`,
      description: `أتم حفظ مزمور ${num} في الأسبوع الأول بامتياز ذهبي`,
      category: 'mazamer',
      tier: 'gold',
      icon: 'Crown',
      bgGradient: TIER_STYLES.gold.bgGradient,
      borderColor: TIER_STYLES.gold.borderColor,
      textColor: TIER_STYLES.gold.textColor,
      rarityScore: 90,
      tags: ['مزمور', 'داود', 'أسبوع أول', 'ذهبي'],
    });

    // Silver badge
    badges.push({
      id: `mazmour_${num}_silver`,
      name: `وسام مزمور ${num} الفضي`,
      nameEn: `Silver Psalm ${num} Badge`,
      description: `أتم حفظ مزمور ${num} في غضون أسبوعين بنجاح فضي`,
      category: 'mazamer',
      tier: 'silver',
      icon: 'Shield',
      bgGradient: TIER_STYLES.silver.bgGradient,
      borderColor: TIER_STYLES.silver.borderColor,
      textColor: TIER_STYLES.silver.textColor,
      rarityScore: 75,
      tags: ['مزمور', 'داود', 'أسبوعين', 'فضي'],
    });

    // Bronze badge
    badges.push({
      id: `mazmour_${num}_bronze`,
      name: `وسام مزمور ${num} البرونزي`,
      nameEn: `Bronze Psalm ${num} Badge`,
      description: `أتم حفظ مزمور ${num} قبل انتهاء المهلة المحددة`,
      category: 'mazamer',
      tier: 'bronze',
      icon: 'BookOpen',
      bgGradient: TIER_STYLES.bronze.bgGradient,
      borderColor: TIER_STYLES.bronze.borderColor,
      textColor: TIER_STYLES.bronze.textColor,
      rarityScore: 60,
      tags: ['مزمور', 'داود', 'برونزي'],
    });
  });

  // 2. Procedurally generate up to 1,000 distinct badges
  const targetCount = 1000;
  let counter = 1;

  for (let p = 0; p < ARABIC_PREFIXES.length && badges.length < targetCount; p++) {
    for (let s = 0; s < ARABIC_SUFFIXES.length && badges.length < targetCount; s++) {
      // Pick tier cycling
      const tierIndex = (p + s) % TIERS.length;
      const tier = TIERS[tierIndex];

      // Pick category cycling
      const catIndex = (p * 3 + s) % CATEGORIES.length;
      const category = CATEGORIES[catIndex];

      // Pick icon cycling
      const iconIndex = (p * 5 + s * 7) % BADGE_ICONS.length;
      const icon = BADGE_ICONS[iconIndex];

      const prefixAr = ARABIC_PREFIXES[p];
      const suffixAr = ARABIC_SUFFIXES[s];
      const prefixEn = ENGLISH_PREFIXES[p];
      const suffixEn = ENGLISH_SUFFIXES[s];

      const tierStyle = TIER_STYLES[tier];
      const id = `badge_${counter.toString().padStart(4, '0')}`;

      badges.push({
        id,
        name: `${prefixAr} ${suffixAr}`,
        nameEn: `${prefixEn} ${suffixEn}`,
        description: `وسام ${tierStyle.labelAr} يُمنح للتميز في ${CATEGORY_LABELS[category].ar}`,
        category,
        tier,
        icon,
        bgGradient: tierStyle.bgGradient,
        borderColor: tierStyle.borderColor,
        textColor: tierStyle.textColor,
        rarityScore: tier === 'legendary' ? 99 : tier === 'diamond' ? 95 : tier === 'platinum' ? 88 : tier === 'gold' ? 80 : tier === 'silver' ? 65 : 50,
        tags: [prefixAr, suffixAr, tierStyle.labelAr, CATEGORY_LABELS[category].ar],
      });

      counter++;
    }
  }

  // If still under 1000, add specialized variation badges to reach exactly 1000+
  while (badges.length < targetCount) {
    const num = badges.length + 1;
    const tier = TIERS[num % TIERS.length];
    const category = CATEGORIES[num % CATEGORIES.length];
    const icon = BADGE_ICONS[num % BADGE_ICONS.length];
    const tierStyle = TIER_STYLES[tier];

    badges.push({
      id: `badge_${num.toString().padStart(4, '0')}`,
      name: `وسام التميز الفائق #${num}`,
      nameEn: `Supreme Excellence Badge #${num}`,
      description: `وسام تكريمي خاص للفصل ولأنشطة المخدومين`,
      category,
      tier,
      icon,
      bgGradient: tierStyle.bgGradient,
      borderColor: tierStyle.borderColor,
      textColor: tierStyle.textColor,
      rarityScore: 70 + (num % 25),
      tags: ['تكريم', 'كنيسة', tierStyle.labelAr],
    });
  }

  cachedBadges = badges;
  return badges;
}

export const ALL_1000_BADGES = generate1000Badges();

export function getBadgeById(id: string): BadgeDefinition {
  const found = ALL_1000_BADGES.find((b) => b.id === id);
  if (found) return found;

  // Fallback badge if not found
  return {
    id,
    name: 'وسام الشرف الكنسي',
    nameEn: 'Church Honor Badge',
    description: 'وسام تقديري للمخدوم البطل',
    category: 'special',
    tier: 'gold',
    icon: 'Trophy',
    bgGradient: TIER_STYLES.gold.bgGradient,
    borderColor: TIER_STYLES.gold.borderColor,
    textColor: TIER_STYLES.gold.textColor,
    rarityScore: 80,
  };
}

export function searchBadges(
  query: string,
  category?: string,
  tier?: string
): BadgeDefinition[] {
  const q = query.trim().toLowerCase();

  return ALL_1000_BADGES.filter((b) => {
    if (category && category !== 'all' && b.category !== category) return false;
    if (tier && tier !== 'all' && b.tier !== tier) return false;
    if (!q) return true;

    return (
      b.name.toLowerCase().includes(q) ||
      b.nameEn.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });
}
