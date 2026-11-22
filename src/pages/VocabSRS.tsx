import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { FuriganaText } from '../components/common/FuriganaText';
import { SectionContextHeader } from '../components/common/SectionContextHeader';
import { BilingualBlock } from '../components/common/BilingualBlock';
import { MasteryPillSelector } from '../components/common/MasteryPillSelector';
import { VocabCategoryHub } from '../components/vocab/VocabCategoryHub';
import { KanjiMasteryGrid } from '../components/kanji/KanjiMasteryGrid';
import { getNextIntervals, getMasteryPriorityWeight } from '../lib/fsrs';
import { StudyItem, ThematicCategory } from '../types';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Layers,
  LayoutGrid,
  Filter,
} from 'lucide-react';

type SubView = 'drill' | 'categories' | 'kanji-grid';
type Mode = 'flashcard' | 'quiz';
type QuizSubtype = 'KanjiReading' | 'Orthography' | 'Contextual';

interface QuizQuestion {
  promptText: string;
  options: string[];
  correctIndex: number;
}

export const VocabSRS: React.FC = () => {
  const { vocabItems, rateVocab, updateItemMastery, settings, setActivePillar } = useApp();

  const [subView, setSubView] = useState<SubView>('drill');
  const [mode, setMode] = useState<Mode>('flashcard');
  const [leechOnly, setLeechOnly] = useState<boolean>(false);
  const [unmasteredOnly, setUnmasteredOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ThematicCategory | 'all'>('all');
  const [subskillFilter, setSubskillFilter] = useState<'all' | 'Vocab' | 'Kanji' | 'Grammar'>('all');
  const [quizSubtype, setQuizSubtype] = useState<QuizSubtype>('KanjiReading');

  // Flashcard state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Pacing stats
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [paceTimes, setPaceTimes] = useState<number[]>([]);

  // Quiz state
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerRevealed, setQuizAnswerRevealed] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<QuizQuestion | null>(null);

  // Separate kanji items for the visual grid
  const kanjiItems = useMemo(() => {
    return vocabItems.filter((i) => i.subskill === 'Kanji');
  }, [vocabItems]);

  // Active study deck filtered and prioritized by Mastery Degree
  const activeDeck = useMemo(() => {
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

    // Sort by priority weight: 1 (Weak: 3x) -> 2 (Shaky: 2x) -> 3 (Familiar: 1x) -> 4 (Mastered: 0.2x)
    return [...list].sort((a, b) => {
      const wA = getMasteryPriorityWeight(a.masteryLevel || 2);
      const wB = getMasteryPriorityWeight(b.masteryLevel || 2);
      return wB - wA;
    });
  }, [vocabItems, leechOnly, unmasteredOnly, selectedCategory, subskillFilter]);

  const currentItem: StudyItem | undefined = activeDeck[currentIndex];

  // Calculate next adaptive sprint intervals for current card
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

  // Average seconds per question pacing metric
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

      if (currentIndex < activeDeck.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    },
    [currentItem, currentIndex, activeDeck.length, rateVocab]
  );

  // Generate stable quiz question for current item
  useEffect(() => {
    if (!currentItem || activeDeck.length < 2) {
      setQuizData(null);
      return;
    }

    let promptText = '';
    let targetAnswer = '';

    if (quizSubtype === 'KanjiReading') {
      if (currentItem.subskill === 'Kanji') {
        promptText = `What is the correct On/Kun reading for「${currentItem.expr}」?`;
      } else {
        promptText = `What is the correct hiragana reading for「${currentItem.expr}」?`;
      }
      targetAnswer = currentItem.reading;
    } else if (quizSubtype === 'Orthography') {
      promptText = `Which kanji correctly corresponds to the reading「${currentItem.reading}」(${currentItem.meaningEn})?`;
      targetAnswer = currentItem.expr;
    } else {
      promptText = currentItem.example
        ? currentItem.example.replace(currentItem.expr, '【　　】')
        : `Choose the correct term matching: "${currentItem.meaningEn}"`;
      targetAnswer = currentItem.expr;
    }

    // Distractor candidates
    const distractors = activeDeck
      .filter((i) => i.id !== currentItem.id)
      .map((i) => (quizSubtype === 'KanjiReading' ? i.reading : i.expr))
      .filter((val) => val && val !== targetAnswer);

    const uniqueDistractors = Array.from(new Set(distractors)).slice(0, 3);

    while (uniqueDistractors.length < 3) {
      uniqueDistractors.push(`ダミー${uniqueDistractors.length + 1}`);
    }

    const optionsPool = [targetAnswer, ...uniqueDistractors];
    // Deterministic shuffle
    const hash = currentItem.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const shuffled = [...optionsPool].sort((a, b) => {
      const hA = (a.charCodeAt(0) * 17 + hash) % 100;
      const hB = (b.charCodeAt(0) * 17 + hash) % 100;
      return hA - hB;
    });

    const correctIndex = shuffled.indexOf(targetAnswer);

    setQuizData({
      promptText,
      options: shuffled,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
    });
  }, [currentItem?.id, quizSubtype, activeDeck.length]);

  const handleSelectQuizOption = (optIdx: number) => {
    if (quizAnswerRevealed || !quizData) return;
    setQuizSelectedOption(optIdx);
    setQuizAnswerRevealed(true);
    recordPaceTime();

    if (optIdx === quizData.correctIndex) {
      if (currentItem) rateVocab(currentItem.id, 3); // Good
    } else {
      if (currentItem) rateVocab(currentItem.id, 1); // Again / Weak
    }
  };

  const nextQuizCard = () => {
    setQuizSelectedOption(null);
    setQuizAnswerRevealed(false);
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
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
          if (!quizAnswerRevealed && quizData) {
            if (e.key === '1' && quizData.options[0]) handleSelectQuizOption(0);
            else if (e.key === '2' && quizData.options[1]) handleSelectQuizOption(1);
            else if (e.key === '3' && quizData.options[2]) handleSelectQuizOption(2);
            else if (e.key === '4' && quizData.options[3]) handleSelectQuizOption(3);
          } else if (quizAnswerRevealed && e.key === ' ') {
            e.preventDefault();
            nextQuizCard();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subView, mode, isFlipped, quizAnswerRevealed, quizData, handleRate]);

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
            : selectedCategory !== 'all'
            ? selectedCategory
            : mode === 'flashcard'
            ? 'Vocab & Kanji SRS Flashcards'
            : 'JLPT Multiple-Choice Quiz',
        ]}
        currentStep={subView === 'drill' ? currentIndex + 1 : undefined}
        totalSteps={subView === 'drill' ? activeDeck.length : undefined}
        targetPaceText={subView === 'drill' ? (avgSeconds > 0 ? `${avgSeconds}s avg` : '<50s per Q') : undefined}
        onExit={() => setActivePillar('today')}
        rightElement={
          subView === 'drill' && (
            <div className="flex items-center gap-1.5">
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
            onClick={() => setSubView('drill')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              subView === 'drill'
                ? 'bg-indigo-primary text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="sm:hidden">Drill ({activeDeck.length})</span>
            <span className="hidden sm:inline">Drill &amp; Quiz ({activeDeck.length})</span>
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
              setCurrentIndex(0);
              setSubView('drill');
            }}
          />
        </div>
      )}

      {/* 5. Sub-View: Active Study & Drill Canvas */}
      {subView === 'drill' && (
        <div className="max-w-2xl mx-auto px-4 py-2 sm:py-4 space-y-5 animate-fade-in">
          {/* Active Category banner if filtered */}
          {selectedCategory !== 'all' && (
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
                Quiz Mode
              </button>
            </div>

            {/* Subskill Filters */}
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
          </div>

          {/* Quiz Subtype Selector (when in Quiz mode) */}
          {mode === 'quiz' && (
            <div className="flex items-center justify-center gap-1 bg-white p-1.5 rounded-2xl border border-stationery-border text-xs">
              {(['KanjiReading', 'Orthography', 'Contextual'] as const).map((subtype) => (
                <button
                  key={subtype}
                  onClick={() => setQuizSubtype(subtype)}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition ${
                    quizSubtype === subtype
                      ? 'bg-indigo-primary text-white font-bold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {subtype === 'KanjiReading'
                    ? 'Reading (読み)'
                    : subtype === 'Orthography'
                    ? 'Orthography (表記)'
                    : 'Contextual (文脈)'}
                </button>
              ))}
            </div>
          )}

          {/* Deck Empty State */}
          {!currentItem && (
            <div className="bg-white rounded-3xl border border-stationery-border p-10 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-jade-wash text-jade mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-ink">Active Review Deck Completed!</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                No cards match your current filter. You can switch to All Cards or clear the unmastered filter.
              </p>
              <button
                onClick={() => {
                  setUnmasteredOnly(false);
                  setLeechOnly(false);
                  setSelectedCategory('all');
                  setSubskillFilter('all');
                  setCurrentIndex(0);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-primary text-white text-xs font-bold hover:bg-indigo-light transition shadow-xs"
              >
                Reset All Filters
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
                    /* Back: Trilingual Meaning Breakdown */
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
                    </div>
                  )}
                </div>

                {/* Card Footer prompt */}
                <div className="text-[11px] text-ink-muted opacity-60">
                  {!isFlipped ? 'Recall meaning before flipping' : 'Rate recall accuracy below'}
                </div>
              </div>

              {/* FSRS Rating Buttons with Live Frequency Hints & Mobile Thumb Dock */}
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

                    {/* Good (3) ★ - High-contrast Primary Button */}
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
                  /* Unflipped Single Primary CTA */
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

          {/* Official JLPT Quiz Mode Display */}
          {mode === 'quiz' && currentItem && quizData && (
            <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between text-xs text-ink-muted border-b border-stationery-border pb-3">
                <span className="font-semibold text-indigo-primary">
                  N3 Practice: {quizSubtype}
                </span>
                <MasteryPillSelector
                  currentLevel={currentItem.masteryLevel || 2}
                  onSelect={(level) => updateItemMastery(currentItem.id, level)}
                  size="sm"
                  showHints={false}
                />
              </div>

              {/* Prompt */}
              <div className="text-xl sm:text-2xl font-bold font-jp text-ink leading-relaxed py-2">
                <FuriganaText expr={quizData.promptText} />
              </div>

              {/* 4 Bubble Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {quizData.options.map((opt, idx) => {
                  const isSelected = quizSelectedOption === idx;
                  const isCorrect = idx === quizData.correctIndex;

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
                      className={`flex items-center justify-between p-4 rounded-2xl border text-left text-base font-jp transition-all duration-150 ${optStyle}`}
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

              {/* Answer Breakdown after answering */}
              {quizAnswerRevealed && (
                <div className="space-y-4 pt-2 animate-fade-in">
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

                  {/* Single Primary Action Button */}
                  <button
                    onClick={nextQuizCard}
                    className="w-full py-3.5 rounded-2xl bg-indigo-primary text-white text-xs sm:text-sm font-bold hover:bg-indigo-light transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Next Question (Space)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
