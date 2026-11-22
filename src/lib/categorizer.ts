import { ThematicCategory, StudyItem } from '../types';

export interface CategoryMetadata {
  id: ThematicCategory;
  nameEn: string;
  nameJp: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const THEMATIC_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'Work & Jobs',
    nameEn: 'Work & Jobs',
    nameJp: '仕事・ビジネス',
    iconName: 'Briefcase',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
  },
  {
    id: 'Family & Relationships',
    nameEn: 'Family & Relationships',
    nameJp: '家族・人間関係',
    iconName: 'Users',
    color: 'rose',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-900',
  },
  {
    id: 'Emotions & Personality',
    nameEn: 'Emotions & Personality',
    nameJp: '感情・性格',
    iconName: 'Heart',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
  },
  {
    id: 'Daily Life & Home',
    nameEn: 'Daily Life & Home',
    nameJp: '日常生活',
    iconName: 'Home',
    color: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
  },
  {
    id: 'Travel, Places & Transport',
    nameEn: 'Travel, Places & Transport',
    nameJp: '交通・旅行',
    iconName: 'Compass',
    color: 'teal',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-900',
  },
  {
    id: 'Health & Body',
    nameEn: 'Health & Body',
    nameJp: '健康・体',
    iconName: 'Activity',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900',
  },
  {
    id: 'Time, Nature & Weather',
    nameEn: 'Time, Nature & Weather',
    nameJp: '時間・自然',
    iconName: 'Sun',
    color: 'sky',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-900',
  },
  {
    id: 'Society, News & Education',
    nameEn: 'Society, News & Education',
    nameJp: '社会・教育',
    iconName: 'Building',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900',
  },
  {
    id: 'Core Verbs & Abstract',
    nameEn: 'Core Verbs & Abstract',
    nameJp: '動詞・抽象',
    iconName: 'Zap',
    color: 'violet',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-900',
  },
  {
    id: 'Uncategorized / Custom',
    nameEn: 'Uncategorized / Custom',
    nameJp: 'その他・カスタム',
    iconName: 'Layers',
    color: 'slate',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-900',
  },
];

// Keyword matching dictionaries for auto-categorization
const CATEGORY_KEYWORDS: Record<Exclude<ThematicCategory, 'Uncategorized / Custom'>, {
  kanji: string[];
  enWords: string[];
}> = {
  'Work & Jobs': {
    kanji: ['職', '業', '企', '雇', '役', '課', '営', '勤', '給', '資', '工', '貿', '商', '労', '任', '社', '務', '面', '接', '契', '約'],
    enWords: [
      'job', 'work', 'company', 'office', 'employee', 'boss', 'salary', 'business',
      'meeting', 'interview', 'economy', 'trade', 'industry', 'contract', 'labor',
      'profession', 'president', 'manager', 'colleague', 'career', 'factory', 'project',
      'enterprise', 'hire', 'employ', 'retire', 'department', 'wage', 'pay'
    ],
  },
  'Family & Relationships': {
    kanji: ['族', '親', '妻', '夫', '兄', '弟', '姉', '妹', '婚', '友', '彼', '娘', '息', '孫', '祖', '婦', '偶', '育', '恋'],
    enWords: [
      'family', 'parent', 'mother', 'father', 'brother', 'sister', 'child', 'children',
      'husband', 'wife', 'friend', 'marriage', 'relative', 'ancestor', 'couple', 'neighbor',
      'son', 'daughter', 'grandchild', 'grandmother', 'grandfather', 'lover', 'marry',
      'relationship', 'acquaintance', 'partner', 'baby', 'infant', 'raise'
    ],
  },
  'Emotions & Personality': {
    kanji: ['感', '情', '怒', '悲', '喜', '恐', '恥', '悩', '望', '怖', '悔', '笑', '泣', '誇', '愛', '寂', '嫉', '妬', '憎', '慎', '誠'],
    enWords: [
      'feel', 'feeling', 'emotion', 'angry', 'anger', 'sad', 'sadness', 'happy', 'happiness',
      'joy', 'fear', 'scared', 'worry', 'anxious', 'anxiety', 'surprise', 'lonely', 'calm',
      'shy', 'ashamed', 'pride', 'proud', 'confident', 'regret', 'doubt', 'mind', 'heart',
      'mood', 'laugh', 'cry', 'smile', 'personality', 'character', 'pity', 'sympathy', 'hope'
    ],
  },
  'Daily Life & Home': {
    kanji: ['住', '室', '具', '宅', '洗', '掃', '炊', '衣', '服', '食', '飲', '寝', '買', '店', '包', '窓', '門', '壁', '床', '鍵'],
    enWords: [
      'house', 'home', 'room', 'kitchen', 'door', 'window', 'floor', 'wall', 'clean', 'cleaning',
      'wash', 'cook', 'cooking', 'eat', 'food', 'drink', 'wear', 'clothes', 'clothing', 'bed',
      'furniture', 'shop', 'store', 'buy', 'purchase', 'sleep', 'garbage', 'trash', 'rent',
      'apartment', 'bath', 'shower', 'key', 'soap', 'towel', 'dish', 'plate', 'living'
    ],
  },
  'Travel, Places & Transport': {
    kanji: ['旅', '宿', '途', '駅', '停', '線', '路', '航', '車', '飛', '船', '港', '乗', '降', '往', '復', '角', '橋', '街', '島'],
    enWords: [
      'travel', 'trip', 'journey', 'station', 'train', 'bus', 'car', 'vehicle', 'airport',
      'flight', 'airplane', 'fly', 'ship', 'boat', 'port', 'harbor', 'road', 'street',
      'highway', 'corner', 'bridge', 'hotel', 'inn', 'ticket', 'passenger', 'arrive',
      'departure', 'route', 'map', 'transport', 'speed', 'subway', 'tour', 'sightseeing'
    ],
  },
  'Health & Body': {
    kanji: ['医', '薬', '病', '痛', '熱', '歯', '眼', '骨', '筋', '血', '鼻', '耳', '頭', '胸', '腹', '背', '肩', '息', '診', '傷'],
    enWords: [
      'doctor', 'hospital', 'medicine', 'drug', 'sick', 'illness', 'disease', 'pain',
      'ache', 'headache', 'fever', 'tooth', 'teeth', 'eye', 'hand', 'foot', 'leg', 'body',
      'ear', 'nose', 'blood', 'bone', 'muscle', 'breath', 'breathe', 'injury', 'wound',
      'surgery', 'clinic', 'health', 'healthy', 'cure', 'symptom', 'cough', 'dizzy'
    ],
  },
  'Time, Nature & Weather': {
    kanji: ['季', '候', '雨', '雪', '雲', '晴', '風', '寒', '暖', '涼', '星', '月', '日', '春', '夏', '秋', '冬', '空', '海', '山', '川', '林', '森'],
    enWords: [
      'season', 'weather', 'climate', 'rain', 'rainy', 'snow', 'cloud', 'cloudy', 'sunny',
      'wind', 'windy', 'storm', 'sun', 'moon', 'star', 'sky', 'spring', 'summer', 'autumn',
      'fall', 'winter', 'morning', 'evening', 'night', 'dawn', 'dusk', 'tree', 'flower',
      'mountain', 'river', 'sea', 'ocean', 'nature', 'earth', 'cool', 'warm', 'cold', 'hot'
    ],
  },
  'Society, News & Education': {
    kanji: ['研', '究', '授', '試', '政', '治', '法', '律', '犯', '警', '民', '選', '挙', '税', '権', '校', '課', '題', '文', '化', '歴', '史'],
    enWords: [
      'school', 'student', 'study', 'exam', 'examination', 'test', 'research', 'lecture',
      'class', 'law', 'legal', 'government', 'politics', 'political', 'citizen', 'society',
      'social', 'crime', 'police', 'court', 'vote', 'election', 'tax', 'culture', 'history',
      'rule', 'rights', 'peace', 'war', 'news', 'newspaper', 'education', 'university'
    ],
  },
  'Core Verbs & Abstract': {
    kanji: ['決', '変', '始', '終', '続', '考', '現', '違', '理', '由', '意', '味', '原', '因', '結', '果', '状', '態', '規', '則', '点'],
    enWords: [
      'decide', 'decision', 'change', 'begin', 'start', 'finish', 'end', 'continue',
      'continuation', 'think', 'thought', 'appear', 'appearance', 'differ', 'difference',
      'reason', 'cause', 'result', 'effect', 'meaning', 'state', 'condition', 'rule',
      'standard', 'point', 'purpose', 'method', 'way', 'action', 'fact', 'situation'
    ],
  },
};

/**
 * Automatically assigns an appropriate thematic category based on kanji characters,
 * English definition words, and subskill type.
 */
export function autoCategorize(
  expr: string,
  meaningEn: string,
  subskill: string
): ThematicCategory {
  const textEn = (meaningEn || '').toLowerCase();
  const chars = Array.from(expr || '');

  // 1. Check kanji character exact matches
  for (const [catName, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const k of kw.kanji) {
      if (chars.includes(k)) {
        return catName as ThematicCategory;
      }
    }
  }

  // 2. Check English meaning keywords
  for (const [catName, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of kw.enWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(textEn)) {
        return catName as ThematicCategory;
      }
    }
  }

  // 3. Fallbacks based on subskill
  if (subskill === 'Grammar') {
    return 'Core Verbs & Abstract';
  }

  return 'Uncategorized / Custom';
}

/**
 * Calculate mastery and progress statistics for items in a category
 */
export function calculateCategoryStats(items: StudyItem[], category: ThematicCategory) {
  const catItems = items.filter((i) => i.category === category);
  const total = catItems.length;

  const weak = catItems.filter((i) => (i.masteryLevel || 2) === 1).length;
  const shaky = catItems.filter((i) => (i.masteryLevel || 2) === 2).length;
  const familiar = catItems.filter((i) => (i.masteryLevel || 2) === 3).length;
  const mastered = catItems.filter((i) => (i.masteryLevel || 2) === 4).length;

  const unmastered = total - mastered;
  const progressPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return {
    total,
    weak,
    shaky,
    familiar,
    mastered,
    unmastered,
    progressPercent,
    items: catItems,
  };
}
