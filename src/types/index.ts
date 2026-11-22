export type StudyItemStatus = 'New' | 'Learning' | 'Review' | 'Mastered' | 'Leech';
export type SubskillType = 'Kanji' | 'Vocab' | 'Grammar';

export type PillarType = 'today' | 'study' | 'mock' | 'library';
export type StudySubTab = 'vocab' | 'grammar' | 'reading';
export type LibrarySubTab = 'resources' | 'plan' | 'settings';

export type MasteryDegree = 1 | 2 | 3 | 4;
// 1 = Weak (Red), 2 = Shaky (Amber), 3 = Familiar (Indigo), 4 = Mastered (Jade)

export type ThematicCategory =
  | 'Work & Jobs'
  | 'Family & Relationships'
  | 'Emotions & Personality'
  | 'Daily Life & Home'
  | 'Travel, Places & Transport'
  | 'Health & Body'
  | 'Time, Nature & Weather'
  | 'Society, News & Education'
  | 'Core Verbs & Abstract'
  | 'Uncategorized / Custom';

export interface StudyItem {
  id: string;
  expr: string;             // Kanji / Expression
  reading: string;          // Hiragana / Furigana
  meaningEn: string;        // English meaning
  meaningAr: string;        // Arabic meaning (RTL)
  example?: string;         // Japanese example sentence
  exampleEn?: string;       // English translation of example
  exampleAr?: string;       // Arabic translation of example
  source: string;           // e.g., 'Kanzen Master N3', 'JLPT N3 List', 'Reading Lab'
  subskill: SubskillType;
  lapses: number;           // Times failed
  intervalDays: number;     // FSRS scheduled interval
  due: string;              // ISO date string
  suspended: boolean;       // If user wants to skip
  status: StudyItemStatus;
  masteryLevel?: MasteryDegree; // 1-4
  category?: ThematicCategory;
  // Internal FSRS card state (serialized)
  fsrsCard?: {
    due: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: number;
    last_review?: string;
  };
}

export interface GrammarFormQuestion {
  id: string;
  pattern: string;
  sentence: string; // contains blank `【　　】` or `____`
  options: [string, string, string, string];
  correct: number; // 0-3 index
  connection: string; // e.g. V-dictionary + べき
  explanationEn: string;
  explanationAr: string;
  grammarPattern?: string;
  masteryLevel?: MasteryDegree;
}

export interface GrammarStarQuestion {
  id: string;
  prefix: string;
  suffix: string;
  chunks: [string, string, string, string]; // 4 shuffled chunks
  correctOrder: [number, number, number, number]; // 0-indexed original chunk indices
  starSlot: number; // 0-3 which slot is the star (usually 2 or 3)
  explanationEn: string;
  explanationAr: string;
  grammarPattern?: string;
  masteryLevel?: MasteryDegree;
}

export interface GrammarClozeQuestion {
  id: string;
  pattern: string;
  sentence: string; // cloze sentence with blank
  options: [string, string, string, string];
  correct: number;
  connection: string;
  explanationEn: string;
  explanationAr: string;
  grammarPattern?: string;
  masteryLevel?: MasteryDegree;
}

export interface ConfusablePair {
  id: string;
  left: string;
  right: string;
  diffEn: string;
  diffAr: string;
  exampleL: string;
  exampleR: string;
  weak: boolean;
  masteryLevel?: MasteryDegree;
}

export type ReadingType = 'Short' | 'Medium' | 'Long' | 'Notice';

export interface ClickableWord {
  expr: string;
  reading: string;
  meaningEn: string;
  meaningAr: string;
  category?: ThematicCategory;
}

export interface ReadingQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correct: number;
  explanationEn: string;
  explanationAr: string;
}

export interface ReadingPassage {
  id: string;
  type: ReadingType;
  targetSec: number;
  title: string;
  paragraphs: string[];
  clickableWords: ClickableWord[];
  conjunctions: string[]; // Discourse markers like しかし, そのため
  questions: ReadingQuestion[];
}

export interface MockQuestion {
  id: string;
  block: 1 | 2; // 1: Vocab (30m), 2: Grammar & Reading (70m)
  section:
    | 'KanjiReading'
    | 'Orthography'
    | 'Contextual'
    | 'ContextualVocab'
    | 'Paraphrase'
    | 'GrammarForm'
    | 'StarReordering'
    | 'GrammarStar'
    | 'ReadingPassage';
  prompt: string;
  passageText?: string;
  options: [string, string, string, string];
  correct: number; // 0-3
  explanationEn: string;
  explanationAr: string;
  relatedItem?: {
    expr: string;
    reading: string;
    meaningEn: string;
    meaningAr?: string;
    subskill?: SubskillType;
  };
}

export interface MockAttempt {
  id: string;
  date: string;
  type: 'full' | 'block1' | 'block2';
  block1Score: number; // out of total possible
  block2Score: number;
  scaledLanguageKnowledge: number; // /60
  scaledReading: number; // /60
  totalScaled: number; // /120
  languagePassed: boolean; // >= 19
  readingPassed: boolean; // >= 19
  overallPassed: boolean; // >= 95 scaled or equivalent
  timeSpentSec: number;
  missedQuestionIds: string[];
}

export interface SprintTask {
  id: string;
  label: string;
  done: boolean;
  module: 'Dashboard' | 'VocabSRS' | 'GrammarDrills' | 'ReadingLab' | 'MockExam' | 'ImportResources' | 'SprintPlanAndSettings';
}

export interface DailyPlan {
  day: number;
  dateStr: string;
  phase: 1 | 2 | 3;
  title: string;
  subtitle: string;
  tasks: SprintTask[];
}

export interface AppSettings {
  furigana: boolean;
  showArabic: boolean;
  examCap5Days: boolean;
  dailyTargetMinutes: number;
  studyMinutesLogged: number;
  streakDays: number;
  lastStudyDate?: string;
}
