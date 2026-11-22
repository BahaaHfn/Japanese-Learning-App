import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  StudyItem,
  GrammarFormQuestion,
  GrammarStarQuestion,
  GrammarClozeQuestion,
  ConfusablePair,
  ReadingPassage,
  MockAttempt,
  DailyPlan,
  AppSettings,
  SubskillType,
  PillarType,
  StudySubTab,
  LibrarySubTab,
  MasteryDegree,
} from '../types';
import {
  INITIAL_SETTINGS,
  SEED_CONFUSABLE_PAIRS,
  SEED_READING_PASSAGES,
  SEED_MOCK_QUESTIONS,
  INITIAL_SPRINT_PLAN,
} from '../data/seedData';
import {
  ALL_OFFICIAL_VOCABULARY,
  ALL_OFFICIAL_KANJI,
  ALL_OFFICIAL_GRAMMAR,
} from '../data/allOfficialResources';
import {
  EXPANDED_GRAMMAR_FORM_QUESTIONS,
  EXPANDED_GRAMMAR_STAR_QUESTIONS,
  EXPANDED_GRAMMAR_CLOZE_QUESTIONS,
} from '../data/expandedGrammarBank';
import { reviewStudyItem, applyMasteryOverride } from '../lib/fsrs';
import { autoCategorize } from '../lib/categorizer';

export type TabType =
  | 'Dashboard'
  | 'VocabSRS'
  | 'GrammarDrills'
  | 'ReadingLab'
  | 'MockExam'
  | 'ImportResources'
  | 'SprintPlanAndSettings';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface AppContextType {
  // State
  settings: AppSettings;
  vocabItems: StudyItem[];
  grammarFormQuestions: GrammarFormQuestion[];
  grammarStarQuestions: GrammarStarQuestion[];
  grammarClozeQuestions: GrammarClozeQuestion[];
  confusablePairs: ConfusablePair[];
  readingPassages: ReadingPassage[];
  mockAttempts: MockAttempt[];
  dailyPlans: DailyPlan[];
  activeTab: TabType;
  activePillar: PillarType;
  studySubTab: StudySubTab;
  librarySubTab: LibrarySubTab;
  focusMode: boolean;
  toasts: ToastItem[];
  shortcutsModalOpen: boolean;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setActivePillar: (pillar: PillarType) => void;
  setStudySubTab: (sub: StudySubTab) => void;
  setLibrarySubTab: (sub: LibrarySubTab) => void;
  setFocusMode: (focus: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  toggleFurigana: () => void;
  toggleArabic: () => void;
  toggleExamCap: () => void;
  addStudyMinutes: (minutes: number) => void;

  // FSRS & Vocab & Mastery
  rateVocab: (id: string, grade: 1 | 2 | 3 | 4) => void;
  updateItemMastery: (id: string, level: MasteryDegree) => void;
  toggleSuspendVocab: (id: string) => void;
  addVocabItem: (item: Partial<StudyItem>) => void;
  importVocabItems: (items: StudyItem[]) => number;
  replaceVocabDeck: (items: StudyItem[]) => void;
  enqueueWeakItem: (item: {
    expr: string;
    reading: string;
    meaningEn: string;
    meaningAr?: string;
    example?: string;
    exampleEn?: string;
    exampleAr?: string;
    source?: string;
    subskill?: SubskillType;
  }) => void;

  // Grammar & Reading
  updateGrammarMastery: (section: 'form' | 'star' | 'cloze', id: string, level: MasteryDegree) => void;
  toggleConfusableWeak: (id: string) => void;

  // Mock Exam
  saveMockAttempt: (attempt: MockAttempt) => void;
  pushMissedMockItemsToFSRS: (attemptId: string) => number;

  // Sprint Plan
  toggleSprintTask: (day: number, taskId: string) => void;

  // Feedback & Persistence
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;
  resetAllData: () => void;
}

const STORAGE_KEY_PREFIX = 'jlpt_n3_sprint_';
const SETTINGS_KEY = `${STORAGE_KEY_PREFIX}settings`;
const VOCAB_KEY = `${STORAGE_KEY_PREFIX}vocab`;
const CONFUSABLE_KEY = `${STORAGE_KEY_PREFIX}confusables`;
const ATTEMPTS_KEY = `${STORAGE_KEY_PREFIX}mock_attempts`;
const SPRINT_KEY = `${STORAGE_KEY_PREFIX}sprint_plan`;
const GRAMMAR_FORM_KEY = `${STORAGE_KEY_PREFIX}grammar_form`;
const GRAMMAR_STAR_KEY = `${STORAGE_KEY_PREFIX}grammar_star`;
const GRAMMAR_CLOZE_KEY = `${STORAGE_KEY_PREFIX}grammar_cloze`;

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage(SETTINGS_KEY, INITIAL_SETTINGS)
  );

  // Deck initialization with auto-categorization and mastery migration
  const [vocabItems, setVocabItems] = useState<StudyItem[]>(() => {
    const stored = loadFromStorage<StudyItem[] | null>(VOCAB_KEY, null);
    let rawList: StudyItem[];

    // If deck has only the demo/seed sample (<= 20 cards) or is empty,
    // automatically load all 2,230 official cards from the resource files!
    if (!stored || stored.length <= 20) {
      rawList = [
        ...ALL_OFFICIAL_VOCABULARY,
        ...ALL_OFFICIAL_KANJI,
        ...ALL_OFFICIAL_GRAMMAR,
      ];
    } else {
      rawList = stored;
    }

    // Ensure all items have masteryLevel and category safely populated
    return rawList.map((item) => {
      const masteryLevel: MasteryDegree =
        item.masteryLevel ||
        (item.status === 'Mastered'
          ? 4
          : item.status === 'Leech' || (item.lapses || 0) >= 2
          ? 1
          : item.status === 'Review'
          ? 3
          : 2);

      const category = item.category || autoCategorize(item.expr, item.meaningEn, item.subskill);

      return {
        ...item,
        masteryLevel,
        category,
      };
    });
  });

  const [confusablePairs, setConfusablePairs] = useState<ConfusablePair[]>(() =>
    loadFromStorage(CONFUSABLE_KEY, SEED_CONFUSABLE_PAIRS)
  );
  const [mockAttempts, setMockAttempts] = useState<MockAttempt[]>(() =>
    loadFromStorage(ATTEMPTS_KEY, [])
  );
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>(() =>
    loadFromStorage(SPRINT_KEY, INITIAL_SPRINT_PLAN)
  );

  // Expanded 30+ Grammar Banks
  const [grammarFormQuestions, setGrammarFormQuestions] = useState<GrammarFormQuestion[]>(() =>
    loadFromStorage(GRAMMAR_FORM_KEY, EXPANDED_GRAMMAR_FORM_QUESTIONS)
  );
  const [grammarStarQuestions, setGrammarStarQuestions] = useState<GrammarStarQuestion[]>(() =>
    loadFromStorage(GRAMMAR_STAR_KEY, EXPANDED_GRAMMAR_STAR_QUESTIONS)
  );
  const [grammarClozeQuestions, setGrammarClozeQuestions] = useState<GrammarClozeQuestion[]>(() =>
    loadFromStorage(GRAMMAR_CLOZE_KEY, EXPANDED_GRAMMAR_CLOZE_QUESTIONS)
  );

  const [readingPassages] = useState<ReadingPassage[]>(SEED_READING_PASSAGES);

  const [activeTab, setActiveTabState] = useState<TabType>('Dashboard');
  const [activePillar, setActivePillarState] = useState<PillarType>('today');
  const [studySubTab, setStudySubTabState] = useState<StudySubTab>('vocab');
  const [librarySubTab, setLibrarySubTabState] = useState<LibrarySubTab>('resources');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const setActivePillar = useCallback((pillar: PillarType) => {
    setActivePillarState(pillar);
    if (pillar === 'today') {
      setActiveTabState('Dashboard');
    } else if (pillar === 'study') {
      if (studySubTab === 'vocab') setActiveTabState('VocabSRS');
      else if (studySubTab === 'grammar') setActiveTabState('GrammarDrills');
      else setActiveTabState('ReadingLab');
    } else if (pillar === 'mock') {
      setActiveTabState('MockExam');
    } else if (pillar === 'library') {
      if (librarySubTab === 'resources') setActiveTabState('ImportResources');
      else setActiveTabState('SprintPlanAndSettings');
    }
  }, [studySubTab, librarySubTab]);

  const setStudySubTab = useCallback((sub: StudySubTab) => {
    setStudySubTabState(sub);
    setActivePillarState('study');
    if (sub === 'vocab') setActiveTabState('VocabSRS');
    else if (sub === 'grammar') setActiveTabState('GrammarDrills');
    else if (sub === 'reading') setActiveTabState('ReadingLab');
  }, []);

  const setLibrarySubTab = useCallback((sub: LibrarySubTab) => {
    setLibrarySubTabState(sub);
    setActivePillarState('library');
    if (sub === 'resources') setActiveTabState('ImportResources');
    else if (sub === 'plan' || sub === 'settings') setActiveTabState('SprintPlanAndSettings');
  }, []);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    if (tab === 'Dashboard') {
      setActivePillarState('today');
    } else if (tab === 'VocabSRS') {
      setActivePillarState('study');
      setStudySubTabState('vocab');
    } else if (tab === 'GrammarDrills') {
      setActivePillarState('study');
      setStudySubTabState('grammar');
    } else if (tab === 'ReadingLab') {
      setActivePillarState('study');
      setStudySubTabState('reading');
    } else if (tab === 'MockExam') {
      setActivePillarState('mock');
    } else if (tab === 'ImportResources') {
      setActivePillarState('library');
      setLibrarySubTabState('resources');
    } else if (tab === 'SprintPlanAndSettings') {
      setActivePillarState('library');
      setLibrarySubTabState('plan');
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    saveToStorage(SETTINGS_KEY, settings);
  }, [settings]);

  useEffect(() => {
    saveToStorage(VOCAB_KEY, vocabItems);
  }, [vocabItems]);

  useEffect(() => {
    saveToStorage(CONFUSABLE_KEY, confusablePairs);
  }, [confusablePairs]);

  useEffect(() => {
    saveToStorage(ATTEMPTS_KEY, mockAttempts);
  }, [mockAttempts]);

  useEffect(() => {
    saveToStorage(SPRINT_KEY, dailyPlans);
  }, [dailyPlans]);

  useEffect(() => {
    saveToStorage(GRAMMAR_FORM_KEY, grammarFormQuestions);
  }, [grammarFormQuestions]);

  useEffect(() => {
    saveToStorage(GRAMMAR_STAR_KEY, grammarStarQuestions);
  }, [grammarStarQuestions]);

  useEffect(() => {
    saveToStorage(GRAMMAR_CLOZE_KEY, grammarClozeQuestions);
  }, [grammarClozeQuestions]);

  // Toast handlers
  const addToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Settings
  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        addToast('Settings updated', 'success');
        return next;
      });
    },
    [addToast]
  );

  const toggleFurigana = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.furigana;
      addToast(next ? 'Furigana enabled (振仮名 ON)' : 'Furigana hidden (振仮名 OFF)', 'info');
      return { ...prev, furigana: next };
    });
  }, [addToast]);

  const toggleArabic = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.showArabic;
      addToast(next ? 'Arabic translation enabled (العربية مفعلة)' : 'Arabic translation hidden', 'info');
      return { ...prev, showArabic: next };
    });
  }, [addToast]);

  const toggleExamCap = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.examCap5Days;
      addToast(next ? '14-Day Sprint FSRS Cap enabled (Max 5 days)' : 'FSRS Exam Cap disabled', 'info');
      return { ...prev, examCap5Days: next };
    });
  }, [addToast]);

  const addStudyMinutes = useCallback((minutes: number) => {
    setSettings((prev) => ({
      ...prev,
      studyMinutesLogged: prev.studyMinutesLogged + minutes,
    }));
    addToast(`+${minutes} minutes logged toward your daily target!`, 'success');
  }, [addToast]);

  // Rate vocab with FSRS & Adaptive Mastery
  const rateVocab = useCallback((id: string, grade: 1 | 2 | 3 | 4) => {
    setVocabItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return reviewStudyItem(item, grade, settings.examCap5Days);
      })
    );
  }, [settings.examCap5Days]);

  // 1-Click Manual Mastery Override
  const updateItemMastery = useCallback((id: string, level: MasteryDegree) => {
    setVocabItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return applyMasteryOverride(item, level);
      })
    );
    const labels: Record<MasteryDegree, string> = {
      1: 'Weak (Show daily)',
      2: 'Shaky (Every 1–2d)',
      3: 'Familiar (Every 3–4d)',
      4: 'Mastered (Parked 5–7d)',
    };
    addToast(`Mastery set to: ${labels[level]}`, 'info');
  }, [addToast]);

  // Update Grammar Mastery Level
  const updateGrammarMastery = useCallback(
    (section: 'form' | 'star' | 'cloze', id: string, level: MasteryDegree) => {
      if (section === 'form') {
        setGrammarFormQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, masteryLevel: level } : q))
        );
      } else if (section === 'star') {
        setGrammarStarQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, masteryLevel: level } : q))
        );
      } else {
        setGrammarClozeQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, masteryLevel: level } : q))
        );
      }
    },
    []
  );

  const toggleSuspendVocab = useCallback((id: string) => {
    setVocabItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = !item.suspended;
        addToast(next ? `Suspended "${item.expr}"` : `Unsuspended "${item.expr}"`, 'info');
        return { ...item, suspended: next };
      })
    );
  }, [addToast]);

  const addVocabItem = useCallback((partial: Partial<StudyItem>) => {
    const expr = partial.expr || '新語';
    const meaningEn = partial.meaningEn || '';
    const subskill = partial.subskill || 'Vocab';
    const newItem: StudyItem = {
      id: `custom-${Date.now()}`,
      expr,
      reading: partial.reading || expr,
      meaningEn,
      meaningAr: partial.meaningAr || '',
      example: partial.example || '',
      exampleEn: partial.exampleEn || '',
      exampleAr: partial.exampleAr || '',
      source: partial.source || 'Manual Entry',
      subskill,
      lapses: partial.lapses || 0,
      intervalDays: partial.intervalDays || 0,
      due: partial.due || new Date().toISOString(),
      suspended: partial.suspended || false,
      status: partial.status || 'New',
      masteryLevel: partial.masteryLevel || 2,
      category: partial.category || autoCategorize(expr, meaningEn, subskill),
    };
    setVocabItems((prev) => [newItem, ...prev]);
    addToast(`Added "${newItem.expr}" to study deck!`, 'success');
  }, [addToast]);

  const importVocabItems = useCallback(
    (items: StudyItem[]) => {
      const existingKeys = new Set(vocabItems.map((i) => `${i.expr}::${i.subskill}`));
      const newItems = items
        .filter((i) => !existingKeys.has(`${i.expr}::${i.subskill}`))
        .map((i) => ({
          ...i,
          masteryLevel: i.masteryLevel || 2,
          category: i.category || autoCategorize(i.expr, i.meaningEn, i.subskill),
        }));
      const count = newItems.length;

      if (count === 0) {
        addToast(
          `All ${items.length.toLocaleString()} items from this pack are already in your active deck!`,
          'info'
        );
        return 0;
      }

      setVocabItems((prev) => [...newItems, ...prev]);
      addToast(
        `Successfully imported ${count.toLocaleString()} new items! (Total deck size: ${(
          vocabItems.length + count
        ).toLocaleString()})`,
        'success'
      );
      return count;
    },
    [vocabItems, addToast]
  );

  const replaceVocabDeck = useCallback(
    (items: StudyItem[]) => {
      const categorized = items.map((i) => ({
        ...i,
        masteryLevel: i.masteryLevel || 2,
        category: i.category || autoCategorize(i.expr, i.meaningEn, i.subskill),
      }));
      setVocabItems(categorized);
      addToast(
        `Active deck reset and loaded with all ${categorized.length.toLocaleString()} cards!`,
        'success'
      );
    },
    [addToast]
  );

  const enqueueWeakItem = useCallback(
    ({
      expr,
      reading,
      meaningEn,
      meaningAr = '',
      example = '',
      exampleEn = '',
      exampleAr = '',
      source = 'Weak Queue Loop',
      subskill = 'Vocab',
    }: {
      expr: string;
      reading: string;
      meaningEn: string;
      meaningAr?: string;
      example?: string;
      exampleEn?: string;
      exampleAr?: string;
      source?: string;
      subskill?: SubskillType;
    }) => {
      setVocabItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.expr === expr && i.subskill === subskill);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const curr = updated[existingIdx];
          const lapses = (curr.lapses || 0) + 1;
          const dueIso = new Date().toISOString();
          updated[existingIdx] = {
            ...curr,
            example: curr.example || example,
            exampleEn: curr.exampleEn || exampleEn,
            exampleAr: curr.exampleAr || exampleAr,
            lapses,
            due: dueIso,
            status: lapses >= 2 ? 'Leech' : 'Learning',
            masteryLevel: 1, // Set to Weak
            suspended: false,
            fsrsCard: curr.fsrsCard
              ? {
                  ...curr.fsrsCard,
                  lapses,
                  due: dueIso,
                  state: 1, // Learning
                }
              : undefined,
          };
          addToast(`Enqueued "${expr}" into Weak Queue (1 - Weak)!`, 'warning');
          return updated;
        } else {
          const newItem: StudyItem = {
            id: `weak-${Date.now()}-${Math.random().toString().slice(2, 5)}`,
            expr,
            reading,
            meaningEn,
            meaningAr,
            example,
            exampleEn,
            exampleAr,
            source,
            subskill,
            lapses: 1,
            intervalDays: 0,
            due: new Date().toISOString(),
            suspended: false,
            status: 'Learning',
            masteryLevel: 1, // Set to Weak
            category: autoCategorize(expr, meaningEn, subskill),
          };
          addToast(`Enqueued "${expr}" into Weak Queue (1 - Weak)!`, 'warning');
          return [newItem, ...prev];
        }
      });
    },
    [addToast]
  );

  const toggleConfusableWeak = useCallback(
    (id: string) => {
      setConfusablePairs((prev) =>
        prev.map((pair) => {
          if (pair.id !== id) return pair;
          const nextWeak = !pair.weak;
          addToast(nextWeak ? `Flagged pair as Weak!` : `Marked pair as Mastered.`, 'info');
          return { ...pair, weak: nextWeak, masteryLevel: nextWeak ? 1 : 4 };
        })
      );
    },
    [addToast]
  );

  const saveMockAttempt = useCallback(
    (attempt: MockAttempt) => {
      setMockAttempts((prev) => [attempt, ...prev]);
      addToast(
        `Mock exam completed: ${attempt.scaledLanguageKnowledge}/60 Knowledge, ${attempt.scaledReading}/60 Reading (${attempt.overallPassed ? 'Passed' : 'Failed'})`,
        attempt.overallPassed ? 'success' : 'warning'
      );
    },
    [addToast]
  );

  const pushMissedMockItemsToFSRS = useCallback(
    (attemptId: string) => {
      const attempt = mockAttempts.find((a) => a.id === attemptId);
      if (!attempt || attempt.missedQuestionIds.length === 0) return 0;

      attempt.missedQuestionIds.forEach((qId) => {
        const q = SEED_MOCK_QUESTIONS.find((m) => m.id === qId);
        if (q) {
          enqueueWeakItem({
            expr: q.prompt.slice(0, 24),
            reading: q.prompt.slice(0, 24),
            meaningEn: q.explanationEn,
            meaningAr: q.explanationAr,
            source: `Mock Missed (${q.section})`,
            subskill: q.section === 'ReadingPassage' ? 'Vocab' : q.section.includes('Grammar') ? 'Grammar' : 'Kanji',
          });
        }
      });
      return attempt.missedQuestionIds.length;
    },
    [mockAttempts, enqueueWeakItem]
  );

  const toggleSprintTask = useCallback((day: number, taskId: string) => {
    setDailyPlans((prev) =>
      prev.map((plan) => {
        if (plan.day !== day) return plan;
        return {
          ...plan,
          tasks: plan.tasks.map((task) =>
            task.id === taskId ? { ...task, done: !task.done } : task
          ),
        };
      })
    );
  }, []);

  // Export / Import
  const exportBackupJson = useCallback(() => {
    const backup = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      settings,
      vocabItems,
      confusablePairs,
      mockAttempts,
      dailyPlans,
      grammarFormQuestions,
      grammarStarQuestions,
      grammarClozeQuestions,
    };
    return JSON.stringify(backup, null, 2);
  }, [settings, vocabItems, confusablePairs, mockAttempts, dailyPlans, grammarFormQuestions, grammarStarQuestions, grammarClozeQuestions]);

  const importBackupJson = useCallback(
    (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.settings) setSettings(parsed.settings);
        if (Array.isArray(parsed.vocabItems)) setVocabItems(parsed.vocabItems);
        if (Array.isArray(parsed.confusablePairs)) setConfusablePairs(parsed.confusablePairs);
        if (Array.isArray(parsed.mockAttempts)) setMockAttempts(parsed.mockAttempts);
        if (Array.isArray(parsed.dailyPlans)) setDailyPlans(parsed.dailyPlans);
        if (Array.isArray(parsed.grammarFormQuestions)) setGrammarFormQuestions(parsed.grammarFormQuestions);
        if (Array.isArray(parsed.grammarStarQuestions)) setGrammarStarQuestions(parsed.grammarStarQuestions);
        if (Array.isArray(parsed.grammarClozeQuestions)) setGrammarClozeQuestions(parsed.grammarClozeQuestions);
        addToast('State backup restored successfully!', 'success');
        return true;
      } catch (e) {
        addToast('Invalid backup file JSON format.', 'error');
        return false;
      }
    },
    [addToast]
  );

  const resetAllData = useCallback(() => {
    const fullMasterPack = [
      ...ALL_OFFICIAL_VOCABULARY,
      ...ALL_OFFICIAL_KANJI,
      ...ALL_OFFICIAL_GRAMMAR,
    ].map((i) => ({
      ...i,
      masteryLevel: 2 as MasteryDegree,
      category: autoCategorize(i.expr, i.meaningEn, i.subskill),
    }));

    setSettings(INITIAL_SETTINGS);
    setVocabItems(fullMasterPack);
    setConfusablePairs(SEED_CONFUSABLE_PAIRS);
    setMockAttempts([]);
    setDailyPlans(INITIAL_SPRINT_PLAN);
    setGrammarFormQuestions(EXPANDED_GRAMMAR_FORM_QUESTIONS);
    setGrammarStarQuestions(EXPANDED_GRAMMAR_STAR_QUESTIONS);
    setGrammarClozeQuestions(EXPANDED_GRAMMAR_CLOZE_QUESTIONS);

    saveToStorage(SETTINGS_KEY, INITIAL_SETTINGS);
    saveToStorage(VOCAB_KEY, fullMasterPack);
    saveToStorage(CONFUSABLE_KEY, SEED_CONFUSABLE_PAIRS);
    saveToStorage(ATTEMPTS_KEY, []);
    saveToStorage(SPRINT_KEY, INITIAL_SPRINT_PLAN);
    saveToStorage(GRAMMAR_FORM_KEY, EXPANDED_GRAMMAR_FORM_QUESTIONS);
    saveToStorage(GRAMMAR_STAR_KEY, EXPANDED_GRAMMAR_STAR_QUESTIONS);
    saveToStorage(GRAMMAR_CLOZE_KEY, EXPANDED_GRAMMAR_CLOZE_QUESTIONS);

    addToast('All data reset to complete official 2,230 master deck defaults!', 'info');
  }, [addToast]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target?.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFurigana();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        toggleArabic();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFurigana, toggleArabic]);

  return (
    <AppContext.Provider
      value={{
        settings,
        vocabItems,
        grammarFormQuestions,
        grammarStarQuestions,
        grammarClozeQuestions,
        confusablePairs,
        readingPassages,
        mockAttempts,
        dailyPlans,
        activeTab,
        activePillar,
        studySubTab,
        librarySubTab,
        focusMode,
        toasts,
        shortcutsModalOpen,
        setActiveTab,
        setActivePillar,
        setStudySubTab,
        setLibrarySubTab,
        setFocusMode,
        setShortcutsModalOpen,
        updateSettings,
        toggleFurigana,
        toggleArabic,
        toggleExamCap,
        addStudyMinutes,
        rateVocab,
        updateItemMastery,
        updateGrammarMastery,
        toggleSuspendVocab,
        addVocabItem,
        importVocabItems,
        replaceVocabDeck,
        enqueueWeakItem,
        toggleConfusableWeak,
        saveMockAttempt,
        pushMissedMockItemsToFSRS,
        toggleSprintTask,
        addToast,
        removeToast,
        exportBackupJson,
        importBackupJson,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
