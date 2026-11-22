import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FuriganaText } from '../components/common/FuriganaText';
import { ArabicText } from '../components/common/ArabicText';
import { SectionContextHeader } from '../components/common/SectionContextHeader';
import { MasteryPillSelector } from '../components/common/MasteryPillSelector';
import { ALL_OFFICIAL_GRAMMAR } from '../data/allOfficialResources';
import {
  Star,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  BookmarkPlus,
  BookMarked,
  Search,
  Plus,
  ListFilter,
  Sliders,
} from 'lucide-react';

type GrammarTab = 'form' | 'star' | 'confusables' | 'library';
type SessionSize = 10 | 15 | 'all';

export const GrammarDrills: React.FC = () => {
  const {
    grammarFormQuestions,
    grammarStarQuestions,
    grammarClozeQuestions,
    confusablePairs,
    toggleConfusableWeak,
    enqueueWeakItem,
    updateGrammarMastery,
    settings,
    setActivePillar,
  } = useApp();

  const [activeTab, setActiveTab] = useState<GrammarTab>('form');
  const [grammarSearch, setGrammarSearch] = useState('');

  // Session Size & Prioritize Unmastered Filter
  const [sessionSize, setSessionSize] = useState<SessionSize>('all');
  const [prioritizeWeak, setPrioritizeWeak] = useState<boolean>(true);

  // Mode A (Form Selection) state
  const [formIdx, setFormIdx] = useState(0);
  const [formSelectedOption, setFormSelectedOption] = useState<number | null>(null);
  const [formRevealed, setFormRevealed] = useState(false);

  // Mode B (Star Reordering) state
  const [starIdx, setStarIdx] = useState(0);
  const [starSlots, setStarSlots] = useState<(number | null)[]>([null, null, null, null]);
  const [starRevealed, setStarRevealed] = useState(false);

  // Mode C (Discourse & Confusables Cloze) state
  const [clozeIdx, setClozeIdx] = useState(0);
  const [clozeSelectedOption, setClozeSelectedOption] = useState<number | null>(null);
  const [clozeRevealed, setClozeRevealed] = useState(false);
  const [showConfusableCards, setShowConfusableCards] = useState(false);

  // Filtered & Weighted Question Pools
  const activeFormList = useMemo(() => {
    let list = [...grammarFormQuestions];
    if (prioritizeWeak) {
      list.sort((a, b) => (a.masteryLevel || 2) - (b.masteryLevel || 2));
    }
    if (sessionSize !== 'all') {
      list = list.slice(0, sessionSize);
    }
    return list;
  }, [grammarFormQuestions, prioritizeWeak, sessionSize]);

  const activeStarList = useMemo(() => {
    let list = [...grammarStarQuestions];
    if (prioritizeWeak) {
      list.sort((a, b) => (a.masteryLevel || 2) - (b.masteryLevel || 2));
    }
    if (sessionSize !== 'all') {
      list = list.slice(0, sessionSize);
    }
    return list;
  }, [grammarStarQuestions, prioritizeWeak, sessionSize]);

  const activeClozeList = useMemo(() => {
    let list = [...grammarClozeQuestions];
    if (prioritizeWeak) {
      list.sort((a, b) => (a.masteryLevel || 2) - (b.masteryLevel || 2));
    }
    if (sessionSize !== 'all') {
      list = list.slice(0, sessionSize);
    }
    return list;
  }, [grammarClozeQuestions, prioritizeWeak, sessionSize]);

  // Current Questions
  const currentFormQ = activeFormList[formIdx] || activeFormList[0];
  const currentStarQ = activeStarList[starIdx] || activeStarList[0];
  const currentClozeQ = activeClozeList[clozeIdx] || activeClozeList[0];

  // Section Mastery Stats
  const formMasteredCount = grammarFormQuestions.filter((q) => q.masteryLevel === 4).length;
  const starMasteredCount = grammarStarQuestions.filter((q) => q.masteryLevel === 4).length;
  const clozeMasteredCount = grammarClozeQuestions.filter((q) => q.masteryLevel === 4).length;

  // Mode A Handlers
  const handleFormSelect = (optIdx: number) => {
    if (formRevealed || !currentFormQ) return;
    setFormSelectedOption(optIdx);
    setFormRevealed(true);

    if (optIdx === currentFormQ.correct) {
      updateGrammarMastery('form', currentFormQ.id, 4); // Mastered
    } else {
      updateGrammarMastery('form', currentFormQ.id, 1); // Weak
      enqueueWeakItem({
        expr: currentFormQ.pattern,
        reading: currentFormQ.pattern,
        meaningEn: currentFormQ.explanationEn,
        meaningAr: currentFormQ.explanationAr,
        source: 'Grammar Form Missed',
        subskill: 'Grammar',
      });
    }
  };

  const nextFormQ = () => {
    setFormSelectedOption(null);
    setFormRevealed(false);
    setFormIdx((prev) => (prev + 1) % activeFormList.length);
  };

  // Mode B Handlers
  const handlePlaceChunk = (chunkIndex: number) => {
    if (starRevealed) return;
    if (starSlots.includes(chunkIndex)) {
      setStarSlots((prev) => prev.map((s) => (s === chunkIndex ? null : s)));
      return;
    }
    const firstEmpty = starSlots.findIndex((s) => s === null);
    if (firstEmpty !== -1) {
      const updated = [...starSlots];
      updated[firstEmpty] = chunkIndex;
      setStarSlots(updated);
    }
  };

  const handleRemoveFromSlot = (slotIdx: number) => {
    if (starRevealed) return;
    const updated = [...starSlots];
    updated[slotIdx] = null;
    setStarSlots(updated);
  };

  const handleCheckStarOrder = () => {
    if (!currentStarQ || starSlots.includes(null)) return;
    setStarRevealed(true);

    const starChunkIndex = starSlots[currentStarQ.starSlot];
    const expectedStarChunkIndex = currentStarQ.correctOrder[currentStarQ.starSlot];
    const isStarCorrect = starChunkIndex === expectedStarChunkIndex;

    if (isStarCorrect) {
      updateGrammarMastery('star', currentStarQ.id, 4); // Mastered
    } else {
      updateGrammarMastery('star', currentStarQ.id, 1); // Weak
      enqueueWeakItem({
        expr: currentStarQ.chunks[expectedStarChunkIndex],
        reading: currentStarQ.chunks[expectedStarChunkIndex],
        meaningEn: currentStarQ.explanationEn,
        meaningAr: currentStarQ.explanationAr,
        source: 'Grammar Star Missed',
        subskill: 'Grammar',
      });
    }
  };

  const resetStarSlots = () => {
    setStarSlots([null, null, null, null]);
    setStarRevealed(false);
  };

  const nextStarQ = () => {
    resetStarSlots();
    setStarIdx((prev) => (prev + 1) % activeStarList.length);
  };

  // Mode C Cloze Handlers
  const handleClozeSelect = (optIdx: number) => {
    if (clozeRevealed || !currentClozeQ) return;
    setClozeSelectedOption(optIdx);
    setClozeRevealed(true);

    if (optIdx === currentClozeQ.correct) {
      updateGrammarMastery('cloze', currentClozeQ.id, 4); // Mastered
    } else {
      updateGrammarMastery('cloze', currentClozeQ.id, 1); // Weak
      enqueueWeakItem({
        expr: currentClozeQ.pattern,
        reading: currentClozeQ.pattern,
        meaningEn: currentClozeQ.explanationEn,
        meaningAr: currentClozeQ.explanationAr,
        source: 'Grammar Cloze Missed',
        subskill: 'Grammar',
      });
    }
  };

  const nextClozeQ = () => {
    setClozeSelectedOption(null);
    setClozeRevealed(false);
    setClozeIdx((prev) => (prev + 1) % activeClozeList.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (activeTab === 'form') {
        if (!formRevealed && currentFormQ) {
          if (e.key === '1' && currentFormQ.options[0]) handleFormSelect(0);
          else if (e.key === '2' && currentFormQ.options[1]) handleFormSelect(1);
          else if (e.key === '3' && currentFormQ.options[2]) handleFormSelect(2);
          else if (e.key === '4' && currentFormQ.options[3]) handleFormSelect(3);
        } else if (formRevealed && e.key === ' ') {
          e.preventDefault();
          nextFormQ();
        }
      } else if (activeTab === 'star') {
        if (!starRevealed && !starSlots.includes(null) && e.key === ' ') {
          e.preventDefault();
          handleCheckStarOrder();
        } else if (starRevealed && e.key === ' ') {
          e.preventDefault();
          nextStarQ();
        }
      } else if (activeTab === 'confusables' && !showConfusableCards) {
        if (!clozeRevealed && currentClozeQ) {
          if (e.key === '1' && currentClozeQ.options[0]) handleClozeSelect(0);
          else if (e.key === '2' && currentClozeQ.options[1]) handleClozeSelect(1);
          else if (e.key === '3' && currentClozeQ.options[2]) handleClozeSelect(2);
          else if (e.key === '4' && currentClozeQ.options[3]) handleClozeSelect(3);
        } else if (clozeRevealed && e.key === ' ') {
          e.preventDefault();
          nextClozeQ();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    formRevealed,
    currentFormQ,
    starRevealed,
    starSlots,
    clozeRevealed,
    currentClozeQ,
    showConfusableCards,
  ]);

  return (
    <div className="space-y-4">
      {/* 1. Section Context Header */}
      {activeTab === 'form' && (
        <SectionContextHeader
          section="grammar"
          breadcrumbs={['Study', 'Grammar', `Form Selection (${grammarFormQuestions.length} Questions)`]}
          currentStep={formIdx + 1}
          totalSteps={activeFormList.length}
          targetPaceSec={40}
          onExit={() => setActivePillar('today')}
        />
      )}
      {activeTab === 'star' && (
        <SectionContextHeader
          section="grammar"
          breadcrumbs={['Study', 'Grammar', `★ Sentence Reordering (${grammarStarQuestions.length} Questions)`]}
          currentStep={starIdx + 1}
          totalSteps={activeStarList.length}
          targetPaceSec={60}
          onExit={() => setActivePillar('today')}
        />
      )}
      {activeTab === 'confusables' && (
        <SectionContextHeader
          section="grammar"
          breadcrumbs={['Study', 'Grammar', `Discourse & Confusables (${grammarClozeQuestions.length} Questions)`]}
          currentStep={!showConfusableCards ? clozeIdx + 1 : undefined}
          totalSteps={!showConfusableCards ? activeClozeList.length : undefined}
          targetPaceSec={45}
          onExit={() => setActivePillar('today')}
        />
      )}
      {activeTab === 'library' && (
        <SectionContextHeader
          section="grammar"
          breadcrumbs={['Study', 'Grammar', 'All 56 Official Patterns']}
          onExit={() => setActivePillar('today')}
        />
      )}

      {/* 2. Sub-mode Switcher */}
      <div className="max-w-3xl mx-auto px-4 pt-1">
        <div className="bg-white p-1.5 rounded-2xl border border-stationery-border shadow-xs flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'form'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span className="sm:hidden">Form ({grammarFormQuestions.length})</span>
            <span className="hidden sm:inline">Form Drill ({grammarFormQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('star')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'star'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="sm:hidden">★ Reorder ({grammarStarQuestions.length})</span>
            <span className="hidden sm:inline">★ Reordering ({grammarStarQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('confusables')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'confusables'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="sm:hidden">Cloze ({grammarClozeQuestions.length})</span>
            <span className="hidden sm:inline">Discourse &amp; Cloze ({grammarClozeQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'library'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span className="sm:hidden">56 Patterns</span>
            <span className="hidden sm:inline">56 Library</span>
          </button>
        </div>
      </div>

      {/* 3. Session Size & Filter Controls Bar (for Mode A, B, C) */}
      {activeTab !== 'library' && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white p-3 rounded-2xl border border-stationery-border shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Session Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-ink-muted font-bold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Size:
              </span>
              {([10, 15, 'all'] as SessionSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSessionSize(size);
                    setFormIdx(0);
                    setStarIdx(0);
                    setClozeIdx(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    sessionSize === size
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stationery-surface text-ink-muted hover:text-ink'
                  }`}
                >
                  {size === 'all' ? 'All 30+' : `${size}Q`}
                </button>
              ))}
            </div>

            {/* Prioritize Unmastered / Weak First */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={prioritizeWeak}
                onChange={(e) => setPrioritizeWeak(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="font-semibold text-ink">Prioritize Weak / Unmastered</span>
            </label>

            {/* Section Mastery Progress */}
            <div className="text-[11px] font-mono text-ink-muted bg-stationery-surface px-2.5 py-1 rounded-lg border border-stationery-border">
              Mastered:{' '}
              <strong className="text-emerald-700">
                {activeTab === 'form'
                  ? `${formMasteredCount} / ${grammarFormQuestions.length}`
                  : activeTab === 'star'
                  ? `${starMasteredCount} / ${grammarStarQuestions.length}`
                  : `${clozeMasteredCount} / ${grammarClozeQuestions.length}`}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Grammar Canvas */}
      <div className="max-w-2xl mx-auto px-4 py-2 sm:py-4 space-y-6">
        {/* MODE A: FORM SELECTION (32 Questions) */}
        {activeTab === 'form' && currentFormQ && (
          <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-10 shadow-sm space-y-6 animate-fade-in">
            {/* Header with Pattern and 1-Click Mastery Override */}
            <div className="flex items-center justify-between text-xs text-ink-muted border-b border-stationery-border/60 pb-3">
              <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Pattern: {currentFormQ.pattern}
              </span>
              <MasteryPillSelector
                currentLevel={currentFormQ.masteryLevel || 2}
                onSelect={(level) => updateGrammarMastery('form', currentFormQ.id, level)}
                size="sm"
                showHints={false}
              />
            </div>

            {/* Sentence with blank */}
            <div className="text-xl sm:text-2xl font-bold font-jp text-ink leading-relaxed py-3">
              <FuriganaText expr={currentFormQ.sentence} />
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentFormQ.options.map((opt, idx) => {
                const isSelected = formSelectedOption === idx;
                const isCorrect = idx === currentFormQ.correct;

                let btnStyle =
                  'bg-white border-stationery-border text-ink hover:border-amber-400 hover:bg-stationery-surface';

                if (formRevealed) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                  } else {
                    btnStyle = 'bg-stationery-surface/50 border-stationery-border/60 text-ink-muted opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleFormSelect(idx)}
                    disabled={formRevealed}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left text-base font-jp transition-all duration-150 ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-stationery-surface border border-current/20 flex items-center justify-center font-mono font-bold text-xs opacity-75">
                        {idx + 1}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {formRevealed && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    )}
                    {formRevealed && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Breakdown Banner */}
            {formRevealed && (
              <div className="mt-6 p-6 rounded-2xl bg-stationery-surface border border-stationery-border space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Grammar Rule &amp; Bilingual Explanation
                  </span>
                  <button
                    onClick={nextFormQ}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition shadow-sm"
                  >
                    <span>Next Drill (Space)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Connection rule */}
                <div className="bg-white p-3 rounded-xl border border-stationery-border text-xs font-mono font-semibold text-amber-900">
                  接続 (Connection): {currentFormQ.connection}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-ink leading-relaxed">
                    <strong className="text-amber-800">EN:</strong> {currentFormQ.explanationEn}
                  </p>

                  {settings.showArabic && currentFormQ.explanationAr && (
                    <div
                      className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-sm leading-relaxed"
                      dir="rtl"
                      lang="ar"
                    >
                      <div className="text-xs font-bold mb-1 opacity-80">الشرح بالعربية:</div>
                      <ArabicText
                        text={currentFormQ.explanationAr}
                        className="text-sm font-semibold text-[#14532D] block"
                        asBlock
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE B: STAR (★) REORDERING (30 Questions) */}
        {activeTab === 'star' && currentStarQ && (
          <div className="bg-white rounded-3xl border border-stationery-border p-4 sm:p-8 shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-ink-muted border-b border-stationery-border/60 pb-3">
              <span className="font-semibold text-amber-800 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                Sentence Reordering Drill
              </span>
              <MasteryPillSelector
                currentLevel={currentStarQ.masteryLevel || 2}
                onSelect={(level) => updateGrammarMastery('star', currentStarQ.id, level)}
                size="sm"
                showHints={false}
              />
            </div>

            {/* Sentence with 4 interactive blank slots */}
            <div className="p-4 sm:p-6 rounded-2xl bg-stationery-surface border border-stationery-border space-y-4">
              <div className="text-base sm:text-lg font-bold font-jp text-ink flex flex-wrap items-center gap-1.5 sm:gap-2 leading-loose">
                <span>{currentStarQ.prefix}</span>

                {starSlots.map((chunkIdx, slotI) => {
                  const isStar = slotI === currentStarQ.starSlot;
                  const chunkText = chunkIdx !== null ? currentStarQ.chunks[chunkIdx] : null;

                  let slotStyle =
                    'border-dashed border-2 border-stationery-border bg-white text-ink-muted hover:border-amber-400';

                  if (chunkText) {
                    slotStyle =
                      'border-solid border-2 border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs';
                  }

                  if (starRevealed) {
                    const expectedChunk = currentStarQ.correctOrder[slotI];
                    if (chunkIdx === expectedChunk) {
                      slotStyle =
                        'border-solid border-2 border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    } else {
                      slotStyle =
                        'border-solid border-2 border-rose-400 bg-rose-50 text-rose-800 font-bold';
                    }
                  }

                  return (
                    <button
                      key={slotI}
                      onClick={() => handleRemoveFromSlot(slotI)}
                      disabled={starRevealed}
                      className={`min-w-[65px] sm:min-w-[90px] min-h-[44px] h-11 px-2 sm:px-3 rounded-xl inline-flex items-center justify-center text-xs sm:text-sm font-jp transition relative ${slotStyle}`}
                      title={chunkText ? 'Click to remove' : `Slot ${slotI + 1}`}
                    >
                      {isStar && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded-full text-[10px] flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-current" /> ★
                        </span>
                      )}
                      {chunkText ? chunkText : <span className="opacity-40">____</span>}
                    </button>
                  );
                })}

                <span>{currentStarQ.suffix}</span>
              </div>

              <p className="text-xs text-ink-muted">
                Click phrase chunks below to arrange. Grade is scored on the starred (★) slot!
              </p>
            </div>

            {/* Shuffled phrase chunks pool */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                Available Chunks (Click to insert):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {currentStarQ.chunks.map((chunk, i) => {
                  const isPlaced = starSlots.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => handlePlaceChunk(i)}
                      disabled={starRevealed || isPlaced}
                      className={`min-h-[44px] p-2.5 sm:p-3.5 rounded-xl border text-center font-jp text-xs sm:text-sm font-medium transition ${
                        isPlaced
                          ? 'opacity-30 border-stationery-border bg-stationery-subtle cursor-not-allowed line-through'
                          : 'bg-white border-stationery-border hover:border-amber-500 hover:shadow-xs text-ink'
                      }`}
                    >
                      <span className="text-xs text-ink-muted font-mono mr-1">{i + 1}.</span>
                      {chunk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={resetStarSlots}
                disabled={starRevealed}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset slots</span>
              </button>

              {!starRevealed ? (
                <button
                  onClick={handleCheckStarOrder}
                  disabled={starSlots.includes(null)}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-40 transition shadow-sm"
                >
                  Check Answer &amp; Grade (★)
                </button>
              ) : (
                <button
                  onClick={nextStarQ}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition shadow-sm"
                >
                  <span>Next Question (Space)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bilingual Syntactic Explanation Banner */}
            {starRevealed && (() => {
              const isStarCorrect =
                starSlots[currentStarQ.starSlot] === currentStarQ.correctOrder[currentStarQ.starSlot];
              const isFullCorrect = currentStarQ.correctOrder.every(
                (expectedIdx, slotI) => starSlots[slotI] === expectedIdx
              );

              return (
                <div className="mt-4 p-6 rounded-2xl bg-stationery-surface border border-stationery-border space-y-4 animate-fade-in">
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      isStarCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isStarCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span>
                        {isStarCorrect
                          ? '★ Star Slot: Correct! Full credit earned.'
                          : `★ Star Slot: Missed (Expected: "${currentStarQ.chunks[currentStarQ.correctOrder[currentStarQ.starSlot]]}")`}
                      </span>
                    </div>
                    {isFullCorrect && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">
                        100% Perfect Sentence Order!
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Syntactic Structure &amp; Bilingual Explanation
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-ink leading-relaxed">
                      <strong className="text-amber-800">EN:</strong> {currentStarQ.explanationEn}
                    </p>
                    {settings.showArabic && currentStarQ.explanationAr && (
                      <div
                        className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-sm leading-relaxed"
                        dir="rtl"
                        lang="ar"
                      >
                        <div className="text-xs font-bold mb-1 opacity-80">الترتيب النحوي:</div>
                        <ArabicText
                          text={currentStarQ.explanationAr}
                          className="text-sm font-semibold text-[#14532D] block"
                          asBlock
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* MODE C: DISCOURSE & CONFUSABLES CLOZE (30 Questions + Nuance Cards) */}
        {activeTab === 'confusables' && (
          <div className="space-y-5 animate-fade-in">
            {/* Sub-toggle between 30 Cloze Questions and 6 Reference Cards */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stationery-border shadow-xs text-xs">
              <span className="font-bold text-amber-950">
                {showConfusableCards ? 'Viewing Nuance Comparison Cards' : 'Discourse & Confusables Cloze Drill (30 Questions)'}
              </span>
              <button
                onClick={() => setShowConfusableCards(!showConfusableCards)}
                className="px-3 py-1.5 rounded-xl bg-stationery-surface hover:bg-stationery-subtle text-amber-900 border border-stationery-border font-semibold transition"
              >
                {showConfusableCards ? 'Switch to 30 Cloze Questions' : 'View Nuance Cards (6)'}
              </button>
            </div>

            {/* 30 Cloze Drill Questions */}
            {!showConfusableCards && currentClozeQ && (
              <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-10 shadow-sm space-y-6">
                <div className="flex items-center justify-between text-xs text-ink-muted border-b border-stationery-border/60 pb-3">
                  <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Focus: {currentClozeQ.pattern}
                  </span>
                  <MasteryPillSelector
                    currentLevel={currentClozeQ.masteryLevel || 2}
                    onSelect={(level) => updateGrammarMastery('cloze', currentClozeQ.id, level)}
                    size="sm"
                    showHints={false}
                  />
                </div>

                {/* Sentence with blank */}
                <div className="text-xl sm:text-2xl font-bold font-jp text-ink leading-relaxed py-3">
                  <FuriganaText expr={currentClozeQ.sentence} />
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentClozeQ.options.map((opt, idx) => {
                    const isSelected = clozeSelectedOption === idx;
                    const isCorrect = idx === currentClozeQ.correct;

                    let btnStyle =
                      'bg-white border-stationery-border text-ink hover:border-amber-400 hover:bg-stationery-surface';

                    if (clozeRevealed) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                      } else {
                        btnStyle = 'bg-stationery-surface/50 border-stationery-border/60 text-ink-muted opacity-50';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleClozeSelect(idx)}
                        disabled={clozeRevealed}
                        className={`flex items-center justify-between p-4 rounded-2xl border text-left text-base font-jp transition-all duration-150 ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-stationery-surface border border-current/20 flex items-center justify-center font-mono font-bold text-xs opacity-75">
                            {idx + 1}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {clozeRevealed && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                        {clozeRevealed && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Banner */}
                {clozeRevealed && (
                  <div className="mt-6 p-6 rounded-2xl bg-stationery-surface border border-stationery-border space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Discourse Rule &amp; Nuance Breakdown
                      </span>
                      <button
                        onClick={nextClozeQ}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition shadow-sm"
                      >
                        <span>Next Question (Space)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-stationery-border text-xs font-mono font-semibold text-amber-900">
                      文脈/接続: {currentClozeQ.connection}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-ink leading-relaxed">
                        <strong className="text-amber-800">EN:</strong> {currentClozeQ.explanationEn}
                      </p>

                      {settings.showArabic && currentClozeQ.explanationAr && (
                        <div
                          className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-sm leading-relaxed"
                          dir="rtl"
                          lang="ar"
                        >
                          <div className="text-xs font-bold mb-1 opacity-80">الشرح والتفريق الدلالي:</div>
                          <ArabicText
                            text={currentClozeQ.explanationAr}
                            className="text-sm font-semibold text-[#14532D] block"
                            asBlock
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Static Reference Cards (when toggled) */}
            {showConfusableCards && (
              <div className="space-y-4">
                {confusablePairs.map((pair) => (
                  <div
                    key={pair.id}
                    className={`bg-white rounded-2xl border p-6 shadow-xs transition-all duration-200 ${
                      pair.weak ? 'border-amber-400 bg-amber-50/20' : 'border-stationery-border'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-base sm:text-lg font-bold font-jp text-amber-800">
                          {pair.left}
                        </span>
                        <span className="text-xs font-bold text-ink-muted uppercase">VS</span>
                        <span className="text-base sm:text-lg font-bold font-jp text-amber-800">
                          {pair.right}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleConfusableWeak(pair.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                          pair.weak
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stationery-surface text-ink-muted hover:text-ink border-stationery-border'
                        }`}
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>{pair.weak ? 'Marked Weak' : 'Mark as Weak'}</span>
                      </button>
                    </div>

                    <div className="py-4 space-y-3">
                      <p className="text-sm text-ink leading-relaxed">
                        <strong className="text-amber-800 font-semibold">Nuance (EN):</strong>{' '}
                        {pair.diffEn}
                      </p>

                      {settings.showArabic && pair.diffAr && (
                        <div
                          className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-sm leading-relaxed"
                          dir="rtl"
                          lang="ar"
                        >
                          <div className="text-xs font-bold mb-1 opacity-80">الفارق الدلالي:</div>
                          <ArabicText
                            text={pair.diffAr}
                            className="text-sm font-semibold text-[#14532D] block"
                            asBlock
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-stationery-border/60">
                      <div className="bg-stationery-surface p-3.5 rounded-xl border border-stationery-border">
                        <span className="text-xs font-bold text-amber-800 font-mono block mb-1">
                          Example [Left]:
                        </span>
                        <p className="text-xs font-jp text-ink leading-relaxed">
                          <FuriganaText expr={pair.exampleL} />
                        </p>
                      </div>

                      <div className="bg-stationery-surface p-3.5 rounded-xl border border-stationery-border">
                        <span className="text-xs font-bold text-amber-800 font-mono block mb-1">
                          Example [Right]:
                        </span>
                        <p className="text-xs font-jp text-ink leading-relaxed">
                          <FuriganaText expr={pair.exampleR} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODE D: ALL 56 OFFICIAL GRAMMAR PATTERNS MASTER */}
        {activeTab === 'library' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-stationery-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-amber-600" />
                  All 56 Official N3 Grammar Patterns (Master)
                </h2>
                <p className="text-xs text-ink-muted">
                  From 450815793-The-JLPT-N3-Grammar-List.md with Romaji, functional Arabic, and 1-click queue capture.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={grammarSearch}
                  onChange={(e) => setGrammarSearch(e.target.value)}
                  placeholder="Search grammar or romaji..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-stationery-border bg-stationery-surface text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-56"
                />
              </div>
            </div>

            <div className="space-y-3">
              {ALL_OFFICIAL_GRAMMAR.filter(
                (g) =>
                  g.expr.toLowerCase().includes(grammarSearch.toLowerCase()) ||
                  g.reading.toLowerCase().includes(grammarSearch.toLowerCase()) ||
                  g.meaningEn.toLowerCase().includes(grammarSearch.toLowerCase()) ||
                  g.meaningAr.toLowerCase().includes(grammarSearch.toLowerCase())
              ).map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stationery-border p-4 sm:p-5 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-lg font-bold font-jp text-amber-900">
                        {item.expr}
                      </span>
                      <span className="text-xs font-mono text-ink-muted bg-stationery-surface px-2 py-0.5 rounded border border-stationery-border">
                        {item.reading}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-ink pl-8">
                      {item.meaningEn}
                    </div>

                    {settings.showArabic && item.meaningAr && (
                      <div className="pl-8 pt-0.5">
                        <div
                          className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-xs leading-relaxed"
                          dir="rtl"
                          lang="ar"
                        >
                          <ArabicText
                            text={item.meaningAr}
                            className="text-xs font-semibold text-[#14532D]"
                          />
                        </div>
                      </div>
                    )}

                    {item.example && (
                      <div className="pl-8 pt-2 mt-2 border-t border-stationery-border/60 text-xs font-jp text-ink">
                        <span className="font-bold text-amber-800">例文: </span>
                        <FuriganaText expr={item.example} />
                        <div className="text-[11px] text-ink-muted mt-0.5">{item.exampleEn}</div>
                        {settings.showArabic && item.exampleAr && (
                          <div className="mt-0.5 text-[11px] text-[#14532D] font-arabic" dir="rtl">
                            {item.exampleAr}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      enqueueWeakItem({
                        expr: item.expr,
                        reading: item.reading,
                        meaningEn: item.meaningEn,
                        meaningAr: item.meaningAr,
                        example: item.example,
                        exampleEn: item.exampleEn,
                        exampleAr: item.exampleAr,
                        source: item.source,
                        subskill: 'Grammar',
                      });
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                    title="Add to FSRS drill queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Queue</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
