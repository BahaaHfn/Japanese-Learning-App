import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { FuriganaText } from '../components/common/FuriganaText';
import { SectionContextHeader } from '../components/common/SectionContextHeader';
import { BilingualBlock } from '../components/common/BilingualBlock';
import { MasteryPillSelector } from '../components/common/MasteryPillSelector';
import { InteractiveSentence, ClickableWord } from '../components/common/InteractiveSentence';
import { MigiiFeedbackCard } from '../components/common/MigiiFeedbackCard';
import { VocabCategoryHub } from '../components/vocab/VocabCategoryHub';
import { KanjiMasteryGrid } from '../components/kanji/KanjiMasteryGrid';
import { getNextIntervals } from '../lib/fsrs';
import {
  shuffleArray,
  sampleMasteryBatch,
  generateSmartDistractors,
  shuffleQuestionOptions,
  getMistakesQueue,
  recordMistake,
  recordCorrectMistake,
} from '../lib/questionEngine';
import { StudyItem, ThematicCategory, OptionGloss, MockQuestion, TrackedMistake } from '../types';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Layers,
  LayoutGrid,
  Filter,
  Shuffle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

type SubView = 'drill' | 'categories' | 'kanji-grid';
type Mode = 'flashcard' | 'quiz';
type MondaiQuizSubtype =
  | 'Mondai1_Reading'
  | 'Mondai2_Orthography'
  | 'Mondai3_Contextual'
  | 'Mondai4_Paraphrase'
  | 'Mondai5_Usage';

interface RichQuizQuestion {
  promptText: string;
  sentenceContext?: string;
  sentenceTranslationEn?: string;
  sentenceTranslationAr?: string;
  options: string[];
  correctIndex: number;
  explanationEn: string;
  explanationAr: string;
  optionGlosses: OptionGloss[];
  clickableWords: ClickableWord[];
  sourceQuestionId?: string;
  relatedItem?: {
    expr: string;
    reading: string;
    meaningEn: string;
    meaningAr?: string;
    subskill?: any;
  };
}

export const VocabSRS: React.FC = () => {
  const {
    vocabItems,
    rateVocab,
    updateItemMastery,
    settings,
    setActivePillar,
    enqueueWeakItem,
    addToast,
  } = useApp();

  const [subView, setSubView] = useState<SubView>('drill');
  const [mode, setMode] = useState<Mode>('flashcard');
  const [leechOnly, setLeechOnly] = useState<boolean>(false);
  const [unmasteredOnly, setUnmasteredOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ThematicCategory | 'all'>('all');
  const [subskillFilter, setSubskillFilter] = useState<'all' | 'Vocab' | 'Kanji' | 'Grammar'>('all');
  const [mondaiSubtype, setMondaiSubtype] = useState<MondaiQuizSubtype>('Mondai1_Reading');

  // Mistakes queue mode
  const [isMistakeMode, setIsMistakeMode] = useState<boolean>(false);
  const [mistakesQueue, setMistakesQueue] = useState<TrackedMistake[]>([]);

  // Randomized Active Batch (Fisher-Yates Mastery Weighted)
  const [studyBatch, setStudyBatch] = useState<StudyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Pacing stats
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [paceTimes, setPaceTimes] = useState<number[]>([]);

  // Quiz state
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerRevealed, setQuizAnswerRevealed] = useState<boolean>(false);
  const [richQuizData, setRichQuizData] = useState<RichQuizQuestion | null>(null);

  // Refresh mistakes queue from storage
  const refreshMistakes = useCallback(() => {
    setMistakesQueue(getMistakesQueue());
  }, []);

  useEffect(() => {
    refreshMistakes();
  }, [refreshMistakes]);

  // Separate kanji items for visual grid
  const kanjiItems = useMemo(() => {
    return vocabItems.filter((i) => i.subskill === 'Kanji');
  }, [vocabItems]);

  // Filtered master pool based on current settings
  const filteredMasterPool = useMemo(() => {
    let list = vocabItems.filter((i) => !i.suspended);

    if (leechOnly) {
      list = list.filter((i) => i.status === 'Leech' || (i.lapses || 0) >= 2 || (i.masteryLevel || 2) === 1);
    }
    if (unmasteredOnly) {
      list = list.filter((i) => (i.masteryLevel || 2) < 4);
    }
    if (selectedCategory !== 'all') {
      list = list.filter((i) => i.category === selectedCategory);
    }
    if (subskillFilter !== 'all') {
      list = list.filter((i) => i.subskill === subskillFilter);
    }

    return list;
  }, [vocabItems, leechOnly, unmasteredOnly, selectedCategory, subskillFilter]);

  // Sample a fresh randomized mastery-weighted batch
  const sampleNewBatch = useCallback(
    (deck: StudyItem[], count = 15) => {
      if (deck.length === 0) {
        setStudyBatch([]);
        setCurrentIndex(0);
        return;
      }
      const sampled = sampleMasteryBatch(deck, count, true);
      setStudyBatch(sampled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setQuizSelectedOption(null);
      setQuizAnswerRevealed(false);
    },
    []
  );

  // Resample batch when filters change
  useEffect(() => {
    if (!isMistakeMode) {
      sampleNewBatch(filteredMasterPool, 15);
    }
  }, [filteredMasterPool, isMistakeMode, sampleNewBatch]);

  // Active current item
  const currentItem: StudyItem | undefined = useMemo(() => {
    if (isMistakeMode) {
      const mistake = mistakesQueue[currentIndex];
      if (!mistake) return undefined;
      const q = mistake.question;
      return (
        (q.relatedItem as StudyItem) || {
          id: q.id,
          expr: q.prompt.match(/【(.*?)】/) ? q.prompt.match(/【(.*?)】/)![1] : q.prompt.slice(0, 4),
          reading: q.options[q.correct] || '',
          meaningEn: q.explanationEn,
          meaningAr: q.explanationAr,
          example: q.prompt,
          exampleEn: q.sentenceTranslationEn,
          exampleAr: q.sentenceTranslationAr,
          source: 'Mistakes Queue',
          subskill: 'Vocab',
          masteryLevel: 1,
        }
      );
    }
    return studyBatch[currentIndex];
  }, [isMistakeMode, mistakesQueue, studyBatch, currentIndex]);

  // Next intervals for FSRS
  const nextIntervals = useMemo(() => {
    if (!currentItem) return null;
    return getNextIntervals(currentItem, settings.examCap5Days);
  }, [currentItem, settings.examCap5Days]);

  // Reset timer on card change
  useEffect(() => {
    setCardStartTime(Date.now());
    setIsFlipped(false);
    setQuizSelectedOption(null);
    setQuizAnswerRevealed(false);
  }, [currentIndex, currentItem?.id]);

  // Pacing metric
  const avgSeconds = useMemo(() => {
    if (paceTimes.length === 0) return 0;
    const sum = paceTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / paceTimes.length) * 10) / 10;
  }, [paceTimes]);

  const recordPaceTime = () => {
    const elapsedSec = (Date.now() - cardStartTime) / 1000;
    setPaceTimes((prev) => [...prev.slice(-19), elapsedSec]);
  };

  // Flashcard rating handler
  const handleRate = useCallback(
    (grade: 1 | 2 | 3 | 4) => {
      if (!currentItem) return;
      recordPaceTime();
      rateVocab(currentItem.id, grade);
      setIsFlipped(false);

      const totalItems = isMistakeMode ? mistakesQueue.length : studyBatch.length;
      if (currentIndex < totalItems - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        if (!isMistakeMode) {
          sampleNewBatch(filteredMasterPool, 15);
          addToast('Generated next randomized study set!', 'info');
        } else {
          setCurrentIndex(0);
        }
      }
    },
    [
      currentItem,
      currentIndex,
      isMistakeMode,
      mistakesQueue.length,
      studyBatch.length,
      rateVocab,
      sampleNewBatch,
      filteredMasterPool,
      addToast,
    ]
  );

  // Generate Rich Quiz Question (Migii JLPT Mondai Structure)
  useEffect(() => {
    if (!currentItem) {
      setRichQuizData(null);
      return;
    }

    // If in mistake mode and we have the full original MockQuestion stored
    if (isMistakeMode) {
      const mistake = mistakesQueue[currentIndex];
      if (mistake && mistake.question) {
        const q = mistake.question;
        const clickableWords: ClickableWord[] = q.clickableWords || (q.relatedItem ? [
          {
            expr: q.relatedItem.expr,
            reading: q.relatedItem.reading,
            meaningEn: q.relatedItem.meaningEn,
            meaningAr: q.relatedItem.meaningAr,
          },
        ] : []);

        const optionGlosses: OptionGloss[] =
          q.optionGlosses ||
          q.options.map((opt, idx) => ({
            option: opt,
            meaningEn: idx === q.correct ? q.explanationEn : 'Distractor choice',
            meaningAr: idx === q.correct ? q.explanationAr : '',
            isCorrect: idx === q.correct,
          }));

        setRichQuizData({
          promptText: q.prompt,
          sentenceContext: q.passageText,
          sentenceTranslationEn: q.sentenceTranslationEn,
          sentenceTranslationAr: q.sentenceTranslationAr,
          options: q.options,
          correctIndex: q.correct,
          explanationEn: q.explanationEn,
          explanationAr: q.explanationAr,
          optionGlosses,
          clickableWords,
          sourceQuestionId: q.id,
          relatedItem: q.relatedItem,
        });
        return;
      }
    }

    // Dynamic Mondai generator from currentItem
    const targetExpr = currentItem.expr;
    const targetReading = currentItem.reading || currentItem.expr;
    const meaningEn = currentItem.meaningEn || '';
    const meaningAr = currentItem.meaningAr || '';
    const example = currentItem.example || '';
    const exampleEn = currentItem.exampleEn || '';
    const exampleAr = currentItem.exampleAr || '';

    let promptText = '';
    let correctOption = '';
    let distractors: string[] = [];
    let explanationEn = '';
    let explanationAr = '';

    if (mondaiSubtype === 'Mondai1_Reading') {
      // Mondai 1: Kanji Reading
      if (example && example.includes(targetExpr)) {
        promptText = example.replace(targetExpr, `【${targetExpr}】`);
      } else {
        promptText = `次の文の【${targetExpr}】の正しい読み方を一つ選びなさい。`;
      }
      correctOption = targetReading;
      distractors = generateSmartDistractors(currentItem, filteredMasterPool, 'KanjiReading', 3);
      explanationEn = `「${targetExpr}」is read as「${targetReading}」(${meaningEn}).`;
      explanationAr = `تُقرأ كلمة「${targetExpr}」بـ「${targetReading}」(بمعنى: ${meaningAr || meaningEn}).`;
    } else if (mondaiSubtype === 'Mondai2_Orthography') {
      // Mondai 2: Orthography (Hiragana -> Kanji)
      if (example && example.includes(targetExpr)) {
        promptText = example.replace(targetExpr, `【${targetReading}】`);
      } else {
        promptText = `次の文の【${targetReading}】は漢字でどう書きますか。(${meaningEn})`;
      }
      correctOption = targetExpr;
      distractors = generateSmartDistractors(currentItem, filteredMasterPool, 'Orthography', 3);
      explanationEn = `「${targetReading}」is written with the kanji「${targetExpr}」(${meaningEn}).`;
      explanationAr = `يُكتب اللفظ「${targetReading}」بالكانجي「${targetExpr}」(بمعنى: ${meaningAr || meaningEn}).`;
    } else if (mondaiSubtype === 'Mondai3_Contextual') {
      // Mondai 3: Context Vocab (Fill in the blank)
      if (example && example.includes(targetExpr)) {
        promptText = example.replace(targetExpr, '【　　】');
      } else {
        promptText = `次の文の【　　】に入る最も適当な語句を選びなさい：(${meaningEn})`;
      }
      correctOption = targetExpr;
      distractors = generateSmartDistractors(currentItem, filteredMasterPool, 'Contextual', 3);
      explanationEn = `The blank requires「${targetExpr}」(${meaningEn}), which fits the context appropriately.`;
      explanationAr = `السياق يتطلب توظيف「${targetExpr}」(بمعنى: ${meaningAr || meaningEn}) ليكتمل المعنى بصورة صحيحة.`;
    } else if (mondaiSubtype === 'Mondai4_Paraphrase') {
      // Mondai 4: Paraphrases / Synonyms
      promptText = `「${targetExpr}」に最も意味が近い表現を一つ選びなさい。(${meaningEn})`;
      correctOption = meaningEn;
      distractors = shuffleArray(
        filteredMasterPool
          .filter((i) => i.id !== currentItem.id && i.meaningEn)
          .map((i) => i.meaningEn)
      ).slice(0, 3);
      explanationEn = `「${targetExpr}」(${targetReading}) closely translates to: "${meaningEn}".`;
      explanationAr = `أقرب مرادف لمعنى「${targetExpr}」هو: "${meaningAr || meaningEn}".`;
    } else {
      // Mondai 5: Usage (用法)
      promptText = `次の言葉の使い方として最も適切なものを一つ選びなさい。【${targetExpr}】`;
      const correctSentence = example ? example : `この文章では「${targetExpr}」が自然に使われている。`;
      correctOption = correctSentence;
      const otherExamples = filteredMasterPool
        .filter((i) => i.id !== currentItem.id && i.example)
        .map((i) => i.example!);
      distractors = shuffleArray(otherExamples).slice(0, 3);
      while (distractors.length < 3) {
        distractors.push(`文脈に合わない例文サンプル${distractors.length + 1}。`);
      }
      explanationEn = `「${targetExpr}」is correctly used in: "${correctSentence}".`;
      explanationAr = `الاستخدام الصحيح والسليم لكلمة「${targetExpr}」هو في الجملة: "${correctSentence}".`;
    }

    const { options, correctIndex } = shuffleQuestionOptions(correctOption, distractors);

    // Build Option Glosses
    const optionGlosses: OptionGloss[] = options.map((opt, idx) => {
      const isCorrect = idx === correctIndex;
      if (isCorrect) {
        return {
          option: opt,
          meaningEn: `${targetExpr} (${meaningEn})`,
          meaningAr: meaningAr || 'الصواب',
          isCorrect: true,
        };
      }
      const matched = filteredMasterPool.find((i) => i.expr === opt || i.reading === opt);
      return {
        option: opt,
        meaningEn: matched ? `${matched.expr} (${matched.meaningEn})` : 'Alternative distractor option',
        meaningAr: matched?.meaningAr || '',
        whyWrongEn: 'Does not fit the question prompt or target reading',
        isCorrect: false,
      };
    });

    const clickableWords: ClickableWord[] = [
      {
        expr: targetExpr,
        reading: targetReading,
        meaningEn,
        meaningAr,
      },
    ];

    setRichQuizData({
      promptText,
      sentenceTranslationEn: exampleEn || meaningEn,
      sentenceTranslationAr: exampleAr || meaningAr,
      options,
      correctIndex,
      explanationEn,
      explanationAr,
      optionGlosses,
      clickableWords,
      sourceQuestionId: currentItem.id,
      relatedItem: currentItem
        ? {
            expr: currentItem.expr,
            reading: currentItem.reading,
            meaningEn: currentItem.meaningEn,
            meaningAr: currentItem.meaningAr,
            subskill: currentItem.subskill,
          }
        : undefined,
    });
  }, [currentItem, mondaiSubtype, filteredMasterPool, isMistakeMode, mistakesQueue, currentIndex]);

  // Handle quiz option selection
  const handleSelectQuizOption = (optIdx: number) => {
    if (quizAnswerRevealed || !richQuizData) return;
    setQuizSelectedOption(optIdx);
    setQuizAnswerRevealed(true);
    recordPaceTime();

    const isCorrect = optIdx === richQuizData.correctIndex;

    if (isCorrect) {
      if (currentItem) rateVocab(currentItem.id, 3); // Good
      if (isMistakeMode && richQuizData.sourceQuestionId) {
        const graduated = recordCorrectMistake(richQuizData.sourceQuestionId);
        if (graduated) {
          addToast('Question answered correctly 2x! Graduated from Mistakes queue!', 'success');
        }
        refreshMistakes();
      }
    } else {
      if (currentItem) rateVocab(currentItem.id, 1); // Again / Weak
      // Record to mistakes queue
      const mockQToSave: MockQuestion = {
        id: richQuizData.sourceQuestionId || `quiz-err-${Date.now()}`,
        block: 1,
        section: mondaiSubtype === 'Mondai1_Reading' ? 'KanjiReading' : 'Contextual',
        mondai: 'mondai-1',
        prompt: richQuizData.promptText,
        options: richQuizData.options,
        correct: richQuizData.correctIndex,
        explanationEn: richQuizData.explanationEn,
        explanationAr: richQuizData.explanationAr,
        sentenceTranslationEn: richQuizData.sentenceTranslationEn,
        sentenceTranslationAr: richQuizData.sentenceTranslationAr,
        optionGlosses: richQuizData.optionGlosses,
        clickableWords: richQuizData.clickableWords,
        relatedItem: richQuizData.relatedItem,
      };
      recordMistake(mockQToSave);
      refreshMistakes();
      addToast('Saved to "Practice My Mistakes" queue!', 'info');
    }
  };

  const nextQuizCard = () => {
    setQuizSelectedOption(null);
    setQuizAnswerRevealed(false);

    const totalItems = isMistakeMode ? mistakesQueue.length : studyBatch.length;
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (!isMistakeMode) {
        sampleNewBatch(filteredMasterPool, 15);
        addToast('Sampled 15 fresh randomized cards!', 'info');
      } else {
        refreshMistakes();
        setCurrentIndex(0);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (subView === 'drill') {
        if (mode === 'flashcard') {
          if (!isFlipped && e.key === ' ') {
            e.preventDefault();
            setIsFlipped(true);
          } else if (isFlipped) {
            if (e.key === '1') handleRate(1);
            else if (e.key === '2') handleRate(2);
            else if (e.key === '3' || e.key === ' ') {
              e.preventDefault();
              handleRate(3);
            } else if (e.key === '4') handleRate(4);
          }
        } else if (mode === 'quiz') {
          if (!quizAnswerRevealed && richQuizData) {
            if (e.key === '1' && richQuizData.options[0]) handleSelectQuizOption(0);
            else if (e.key === '2' && richQuizData.options[1]) handleSelectQuizOption(1);
            else if (e.key === '3' && richQuizData.options[2]) handleSelectQuizOption(2);
            else if (e.key === '4' && richQuizData.options[3]) handleSelectQuizOption(3);
          } else if (quizAnswerRevealed && e.key === ' ') {
            e.preventDefault();
            nextQuizCard();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subView, mode, isFlipped, quizAnswerRevealed, richQuizData, handleRate]);

  // Current mistake info if in mistake mode
  const currentMistakeInfo = isMistakeMode ? mistakesQueue[currentIndex] : undefined;

  return (
    <div className="space-y-4">
      {/* 1. Standard Section Context Header */}
      <SectionContextHeader
        section="vocab"
        breadcrumbs={[
          'Study',
          subView === 'kanji-grid'
            ? 'Kanji Visual Grid'
            : subView === 'categories'
            ? 'Thematic Categories'
            : isMistakeMode
            ? `Practice My Mistakes (${mistakesQueue.length})`
            : selectedCategory !== 'all'
            ? selectedCategory
            : mode === 'flashcard'
            ? 'Randomized Vocab & Kanji SRS'
            : 'Migii JLPT Mini-Quiz Engine',
        ]}
        currentStep={subView === 'drill' ? currentIndex + 1 : undefined}
        totalSteps={
          subView === 'drill'
            ? isMistakeMode
              ? mistakesQueue.length
              : studyBatch.length
            : undefined
        }
        targetPaceText={subView === 'drill' ? (avgSeconds > 0 ? `${avgSeconds}s avg` : '<50s per Q') : undefined}
        onExit={() => setActivePillar('today')}
        rightElement={
          subView === 'drill' && (
            <div className="flex items-center gap-1.5">
              {/* 1-Tap Shuffle Now Button */}
              {!isMistakeMode && (
                <button
                  onClick={() => {
                    sampleNewBatch(filteredMasterPool, 15);
                    addToast('Reshuffled active queue!', 'success');
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold border bg-stationery-surface border-stationery-border text-ink-muted hover:text-indigo-primary hover:border-indigo-primary/40 transition flex items-center gap-1 shadow-xs"
                  title="Reshuffle active queue now"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Shuffle Now</span>
                </button>
              )}

              {/* Mistakes Mode Toggle Button */}
              <button
                onClick={() => {
                  const nextState = !isMistakeMode;
                  setIsMistakeMode(nextState);
                  setCurrentIndex(0);
                  refreshMistakes();
                  if (nextState) {
                    setMode('quiz');
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                  isMistakeMode
                    ? 'bg-vermilion text-white border-vermilion shadow-xs'
                    : mistakesQueue.length > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                    : 'bg-stationery-surface border-stationery-border text-ink-muted'
                }`}
                title="Practice questions you answered incorrectly (Leaves queue after 2 correct answers)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mistakes ({mistakesQueue.length})</span>
              </button>

              <button
                onClick={() => {
                  setUnmasteredOnly(!unmasteredOnly);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                  unmasteredOnly
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-stationery-surface border-stationery-border text-ink-muted hover:text-ink'
                }`}
                title="Only review items with mastery degree < 4"
              >
                {unmasteredOnly ? 'Unmastered' : 'All Cards'}
              </button>

              <button
                onClick={() => {
                  setLeechOnly(!leechOnly);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                  leechOnly
                    ? 'bg-vermilion text-white border-vermilion shadow-xs'
                    : 'bg-stationery-surface border-stationery-border text-ink-muted hover:text-ink'
                }`}
                title="Filter weak problem cards (Degree 1)"
              >
                {leechOnly ? 'Weak Only' : 'Weak'}
              </button>
            </div>
          )
        }
      />

      {/* 2. Top Sub-View Switcher Pills */}
      <div className="max-w-4xl mx-auto px-4 pt-1">
        <div className="bg-white p-1.5 rounded-2xl border border-stationery-border shadow-xs flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setIsMistakeMode(false);
              setSubView('drill');
            }}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              subView === 'drill' && !isMistakeMode
                ? 'bg-indigo-primary text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="sm:hidden">Study ({studyBatch.length})</span>
            <span className="hidden sm:inline">Randomized Drill &amp; Quiz ({studyBatch.length})</span>
          </button>

          <button
            onClick={() => setSubView('categories')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              subView === 'categories'
                ? 'bg-indigo-primary text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="sm:hidden">Themes (10)</span>
            <span className="hidden sm:inline">Thematic Themes (10)</span>
          </button>

          <button
            onClick={() => setSubView('kanji-grid')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              subView === 'kanji-grid'
                ? 'bg-indigo-primary text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="sm:hidden">Kanji Grid ({kanjiItems.length})</span>
            <span className="hidden sm:inline">Kanji Visual Grid ({kanjiItems.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-View: Thematic Categories */}
      {subView === 'categories' && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <VocabCategoryHub
            vocabItems={vocabItems}
            onSelectCategoryDrill={(category, onlyUnmastered) => {
              setSelectedCategory(category);
              setUnmasteredOnly(onlyUnmastered);
              setIsMistakeMode(false);
              setCurrentIndex(0);
              setSubView('drill');
            }}
          />
        </div>
      )}

      {/* 4. Sub-View: Kanji Visual Mastery Grid */}
      {subView === 'kanji-grid' && (
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <KanjiMasteryGrid
            kanjiItems={kanjiItems}
            onUpdateMastery={updateItemMastery}
            onDrillUnmastered={() => {
              setSubskillFilter('Kanji');
              setUnmasteredOnly(true);
              setIsMistakeMode(false);
              setCurrentIndex(0);
              setSubView('drill');
            }}
          />
        </div>
      )}

      {/* 5. Sub-View: Active Study & Drill Canvas */}
      {subView === 'drill' && (
        <div className="max-w-2xl mx-auto px-4 py-2 sm:py-4 space-y-4 animate-fade-in">
          {/* Mistakes Banner if in Mistakes Mode */}
          {isMistakeMode && (
            <div className="bg-rose-50 border border-rose-300 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-rose-900 shadow-xs">
              <span className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Practice My Mistakes: {mistakesQueue.length} question(s) waiting</span>
              </span>
              <button
                onClick={() => {
                  setIsMistakeMode(false);
                  setCurrentIndex(0);
                }}
                className="underline hover:text-rose-950 font-bold"
              >
                Exit Mistakes
              </button>
            </div>
          )}

          {/* Active Category banner if filtered */}
          {selectedCategory !== 'all' && !isMistakeMode && (
            <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
              <span className="font-bold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filtering by Theme: {selectedCategory}
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className="underline hover:text-indigo-primary font-semibold"
              >
                Clear Theme Filter
              </button>
            </div>
          )}

          {/* Mode Selector & Subskill Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-stationery-border shadow-xs">
            <div className="flex items-center gap-1 bg-stationery-surface p-1 rounded-xl border border-stationery-border text-xs">
              <button
                onClick={() => setMode('flashcard')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  mode === 'flashcard'
                    ? 'bg-white text-indigo-primary shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Flashcard (Space)
              </button>
              <button
                onClick={() => setMode('quiz')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  mode === 'quiz'
                    ? 'bg-white text-indigo-primary shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Migii JLPT Quiz
              </button>
            </div>

            {/* Subskill Filters (Only in normal study mode) */}
            {!isMistakeMode && (
              <div className="flex items-center gap-1 text-xs">
                {(['all', 'Vocab', 'Kanji', 'Grammar'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSubskillFilter(filter);
                      setCurrentIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      subskillFilter === filter
                        ? 'bg-indigo-wash text-indigo-primary font-bold'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Migii Official Mondai Subtype Selector (when in Quiz mode) */}
          {mode === 'quiz' && !isMistakeMode && (
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-stationery-border text-xs overflow-x-auto scrollbar-none">
              {(
                [
                  { id: 'Mondai1_Reading', label: 'Mondai 1: 漢字読み (Reading)' },
                  { id: 'Mondai2_Orthography', label: 'Mondai 2: 表記 (Orthography)' },
                  { id: 'Mondai3_Contextual', label: 'Mondai 3: 文脈規定 (Context)' },
                  { id: 'Mondai4_Paraphrase', label: 'Mondai 4: 言い換え (Paraphrase)' },
                  { id: 'Mondai5_Usage', label: 'Mondai 5: 用法 (Usage)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMondaiSubtype(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition whitespace-nowrap text-center ${
                    mondaiSubtype === tab.id
                      ? 'bg-indigo-primary text-white font-bold shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!currentItem && (
            <div className="bg-white rounded-3xl border border-stationery-border p-10 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-jade-wash text-jade mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-ink">
                {isMistakeMode ? 'No Mistakes in Queue!' : 'Active Study Deck Completed!'}
              </h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                {isMistakeMode
                  ? 'Great job! You have cleared all your mistakes or haven’t missed any questions yet.'
                  : 'No cards match your current filter. You can switch to All Cards or generate a new batch.'}
              </p>
              <button
                onClick={() => {
                  if (isMistakeMode) {
                    setIsMistakeMode(false);
                  } else {
                    setUnmasteredOnly(false);
                    setLeechOnly(false);
                    setSelectedCategory('all');
                    setSubskillFilter('all');
                    sampleNewBatch(vocabItems, 15);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-primary text-white text-xs font-bold hover:bg-indigo-light transition shadow-xs"
              >
                {isMistakeMode ? 'Return to Study' : 'Reset All Filters & Reshuffle'}
              </button>
            </div>
          )}

          {/* Flashcard Mode Display */}
          {mode === 'flashcard' && currentItem && (
            <div className="space-y-4">
              <div
                onClick={() => !isFlipped && setIsFlipped(true)}
                className={`cursor-pointer rounded-3xl border border-stationery-border bg-white shadow-sm hover:shadow transition-all duration-200 p-4 sm:p-8 text-center flex flex-col justify-between min-h-[280px] sm:min-h-[340px] ${
                  !isFlipped ? 'hover:border-indigo-primary/50' : ''
                }`}
              >
                {/* Card Top Metadata & 1-Click Mastery Override */}
                <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stationery-surface text-ink-muted border border-stationery-border">
                      {currentItem.subskill}
                    </span>
                    {currentItem.category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {currentItem.category}
                      </span>
                    )}
                  </div>

                  {/* 1-Click Mastery Override */}
                  <MasteryPillSelector
                    currentLevel={currentItem.masteryLevel || 2}
                    onSelect={(level) => updateItemMastery(currentItem.id, level)}
                    size="sm"
                    showHints={false}
                  />
                </div>

                {/* Card Main Canvas */}
                <div className="py-4 sm:py-6 flex flex-col items-center justify-center space-y-4">
                  {!isFlipped ? (
                    /* Front: Japanese Hero Prompt */
                    <div className="space-y-3">
                      <div className="text-3xl sm:text-5xl font-bold font-jp text-ink tracking-wide leading-tight">
                        <FuriganaText expr={currentItem.expr} />
                      </div>
                      <div className="text-xs text-ink-muted font-mono tracking-widest opacity-60">
                        [SPACE TO REVEAL MEANING]
                      </div>
                    </div>
                  ) : (
                    /* Back: Trilingual Meaning Breakdown with Tap-to-Lookup Words */
                    <div className="w-full text-left space-y-4 animate-fade-in">
                      <BilingualBlock
                        expr={currentItem.expr}
                        reading={currentItem.reading}
                        meaningEn={currentItem.meaningEn}
                        meaningAr={currentItem.meaningAr}
                        example={currentItem.example}
                        exampleEn={currentItem.exampleEn}
                        exampleAr={currentItem.exampleAr}
                        variant="breakdown"
                      />

                      {currentItem.example && (
                        <div className="pt-2 border-t border-stationery-border/70">
                          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                            Tap Sentence Words to Lookup &amp; Add:
                          </span>
                          <InteractiveSentence
                            sentence={currentItem.example}
                            clickableWords={[
                              {
                                expr: currentItem.expr,
                                reading: currentItem.reading,
                                meaningEn: currentItem.meaningEn,
                                meaningAr: currentItem.meaningAr,
                              },
                            ]}
                            onAddToWeakQueue={(word) => enqueueWeakItem(word)}
                            className="text-sm text-ink-secondary"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer prompt */}
                <div className="text-[11px] text-ink-muted opacity-60">
                  {!isFlipped ? 'Recall meaning before flipping' : 'Rate recall accuracy below'}
                </div>
              </div>

              {/* FSRS Rating Buttons */}
              <div className="sticky bottom-0 z-20 -mx-4 -mb-2 p-3 sm:static sm:p-0 sm:m-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-t-0 border-stationery-border pb-dock-safe sm:pb-0 shadow-lg sm:shadow-none">
                {isFlipped && nextIntervals ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 animate-slide-in">
                    {/* Again (1) - Weak */}
                    <button
                      onClick={() => handleRate(1)}
                      className="min-h-[50px] flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 font-bold transition shadow-xs group"
                    >
                      <span className="text-xs">Again (1)</span>
                      <span className="text-xs font-mono font-bold text-rose-900 mt-0.5">
                        {nextIntervals[1].interval}
                      </span>
                      <span className="text-[10px] text-rose-600/90 font-normal mt-0.5">
                        {nextIntervals[1].hint}
                      </span>
                    </button>

                    {/* Hard (2) - Shaky */}
                    <button
                      onClick={() => handleRate(2)}
                      className="min-h-[50px] flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 font-bold transition shadow-xs group"
                    >
                      <span className="text-xs">Hard (2)</span>
                      <span className="text-xs font-mono font-bold text-amber-950 mt-0.5">
                        {nextIntervals[2].interval}
                      </span>
                      <span className="text-[10px] text-amber-700/90 font-normal mt-0.5">
                        {nextIntervals[2].hint}
                      </span>
                    </button>

                    {/* Good (3) ★ */}
                    <button
                      onClick={() => handleRate(3)}
                      className="min-h-[50px] flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-indigo-primary hover:bg-indigo-light text-white font-bold transition shadow-md group"
                    >
                      <span className="text-xs">Good (3) ★</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5">
                        {nextIntervals[3].interval}
                      </span>
                      <span className="text-[10px] text-white/90 font-normal mt-0.5">
                        {nextIntervals[3].hint}
                      </span>
                    </button>

                    {/* Easy (4) - Mastered */}
                    <button
                      onClick={() => handleRate(4)}
                      className="min-h-[50px] flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 font-bold transition shadow-xs group"
                    >
                      <span className="text-xs">Easy (4)</span>
                      <span className="text-xs font-mono font-bold text-emerald-950 mt-0.5">
                        {nextIntervals[4].interval}
                      </span>
                      <span className="text-[10px] text-emerald-700/90 font-normal mt-0.5">
                        {nextIntervals[4].hint}
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Unflipped CTA */
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-indigo-primary hover:bg-indigo-light text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>Show Meaning (Space)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Migii Official JLPT Quiz Mode Display */}
          {mode === 'quiz' && currentItem && richQuizData && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between text-xs text-ink-muted border-b border-stationery-border pb-3">
                  <span className="font-semibold text-indigo-primary flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {isMistakeMode
                      ? `Reviewing Mistake #${currentIndex + 1}`
                      : `Official N3: ${mondaiSubtype.replace('_', ' ')}`}
                  </span>
                  <MasteryPillSelector
                    currentLevel={currentItem.masteryLevel || 2}
                    onSelect={(level) => updateItemMastery(currentItem.id, level)}
                    size="sm"
                    showHints={false}
                  />
                </div>

                {/* Prompt with Tap-to-Lookup Words */}
                <div className="text-lg sm:text-xl font-bold font-jp text-ink leading-relaxed py-2">
                  <InteractiveSentence
                    sentence={richQuizData.promptText}
                    clickableWords={richQuizData.clickableWords}
                    onAddToWeakQueue={(word) => enqueueWeakItem(word)}
                  />
                </div>

                {/* 4 Bubble Options (Fisher-Yates Shuffled) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {richQuizData.options.map((opt, idx) => {
                    const isSelected = quizSelectedOption === idx;
                    const isCorrect = idx === richQuizData.correctIndex;

                    let optStyle =
                      'bg-white border-stationery-border text-ink hover:border-indigo-primary/50';

                    if (quizAnswerRevealed) {
                      if (isCorrect) {
                        optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                      } else if (isSelected) {
                        optStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                      } else {
                        optStyle =
                          'bg-stationery-surface/50 border-stationery-border/60 text-ink-muted opacity-50';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuizOption(idx)}
                        disabled={quizAnswerRevealed}
                        className={`flex items-center justify-between p-4 rounded-2xl border text-left text-sm sm:text-base font-jp transition-all duration-150 ${optStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-stationery-surface border border-current/20 flex items-center justify-center font-mono font-bold text-xs opacity-75">
                            {idx + 1}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {quizAnswerRevealed && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                        {quizAnswerRevealed && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Migii Learning Feedback Card */}
              {quizAnswerRevealed && (
                <MigiiFeedbackCard
                  isCorrect={quizSelectedOption === richQuizData.correctIndex}
                  selectedOptionIndex={quizSelectedOption !== null ? quizSelectedOption : -1}
                  options={richQuizData.options}
                  correctOptionIndex={richQuizData.correctIndex}
                  optionGlosses={richQuizData.optionGlosses}
                  sentenceTranslationEn={richQuizData.sentenceTranslationEn}
                  sentenceTranslationAr={richQuizData.sentenceTranslationAr}
                  explanationEn={richQuizData.explanationEn}
                  explanationAr={richQuizData.explanationAr}
                  currentMasteryLevel={currentItem.masteryLevel || 2}
                  onRateMastery={(level) => updateItemMastery(currentItem.id, level)}
                  onNextQuestion={nextQuizCard}
                  isMistakeMode={isMistakeMode}
                  consecutiveCorrect={currentMistakeInfo?.consecutiveCorrect || 0}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
