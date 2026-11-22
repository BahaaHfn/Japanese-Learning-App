import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FuriganaText } from '../components/common/FuriganaText';
import { ArabicText } from '../components/common/ArabicText';
import { SectionContextHeader } from '../components/common/SectionContextHeader';
import { SEED_MOCK_QUESTIONS } from '../data/seedData';
import { MockQuestion, MockAttempt } from '../types';
import {
  GraduationCap,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  Play,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ListChecks,
  X,
} from 'lucide-react';

type ExamMode = 'select' | 'exam' | 'report';
type BlockSelection = 'full' | 'block1' | 'block2';

export const MockExam: React.FC = () => {
  const {
    saveMockAttempt,
    pushMissedMockItemsToFSRS,
    addToast,
    setFocusMode,
    setActivePillar,
    settings,
  } = useApp();

  const [mode, setMode] = useState<ExamMode>('select');
  const [selectedBlock, setSelectedBlock] = useState<BlockSelection>('full');

  // Exam session state
  const [currentBlock, setCurrentBlock] = useState<1 | 2>(1);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeRemainingSec, setTimeRemainingSec] = useState(1800); // 30 min default
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Completed Attempt Report state
  const [latestAttempt, setLatestAttempt] = useState<MockAttempt | null>(null);

  // Filter questions based on block
  const questions: MockQuestion[] = useMemo(() => {
    if (selectedBlock === 'block1') {
      return SEED_MOCK_QUESTIONS.filter((q) => q.block === 1);
    }
    if (selectedBlock === 'block2') {
      return SEED_MOCK_QUESTIONS.filter((q) => q.block === 2);
    }
    // Full: block 1 first, then block 2
    return SEED_MOCK_QUESTIONS.filter((q) => q.block === currentBlock);
  }, [selectedBlock, currentBlock]);

  const activeQuestion: MockQuestion | undefined = questions[currentQIndex];

  // Start exam handler
  const startExam = (blockType: BlockSelection) => {
    setSelectedBlock(blockType);
    setAnswers({});
    setFlagged({});
    setCurrentQIndex(0);

    if (blockType === 'block2') {
      setCurrentBlock(2);
      setTimeRemainingSec(70 * 60); // 70 min
    } else {
      setCurrentBlock(1);
      setTimeRemainingSec(30 * 60); // 30 min
    }

    setIsTimerRunning(true);
    setFocusMode(true);
    setMode('exam');
  };

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (mode === 'exam' && isTimerRunning) {
      interval = setInterval(() => {
        setTimeRemainingSec((prev) => {
          if (prev <= 1) {
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, isTimerRunning, currentBlock, selectedBlock]);

  const handleTimeExpired = () => {
    addToast('Time expired for current block!', 'warning');
    if (selectedBlock === 'full' && currentBlock === 1) {
      // Transition to Block 2
      setCurrentBlock(2);
      setCurrentQIndex(0);
      setTimeRemainingSec(70 * 60); // 70 min
      addToast('Starting Block 2: Grammar & Reading (70 min)', 'info');
    } else {
      finishExam();
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleNextOrFinish = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else if (selectedBlock === 'full' && currentBlock === 1) {
      // Move to block 2
      setCurrentBlock(2);
      setCurrentQIndex(0);
      setTimeRemainingSec(70 * 60);
      addToast('Block 1 complete! Now entering Block 2: Grammar & Reading (70 min)', 'info');
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    setIsTimerRunning(false);
    setFocusMode(false);

    // Calculate score
    const allQuestions =
      selectedBlock === 'block1'
        ? SEED_MOCK_QUESTIONS.filter((q) => q.block === 1)
        : selectedBlock === 'block2'
        ? SEED_MOCK_QUESTIONS.filter((q) => q.block === 2)
        : SEED_MOCK_QUESTIONS;

    let b1Correct = 0;
    let b1Total = 0;
    let b2LangCorrect = 0;
    let b2LangTotal = 0;
    let b2ReadingCorrect = 0;
    let b2ReadingTotal = 0;

    const missedIds: string[] = [];

    allQuestions.forEach((q) => {
      const isCorrect = answers[q.id] === q.correct;
      if (!isCorrect) {
        missedIds.push(q.id);
      }

      if (q.block === 1) {
        b1Total++;
        if (isCorrect) b1Correct++;
      } else {
        if (q.section === 'ReadingPassage') {
          b2ReadingTotal++;
          if (isCorrect) b2ReadingCorrect++;
        } else {
          b2LangTotal++;
          if (isCorrect) b2LangCorrect++;
        }
      }
    });

    // Scaled scoring calculation
    let scaledLang = 0;
    let scaledRead = 0;
    let langPassed = false;
    let readingPassed = false;
    let overallPassed = false;
    let totalScaled = 0;

    if (selectedBlock === 'block1') {
      scaledLang = Math.round((b1Correct / (b1Total || 1)) * 60);
      scaledRead = -1; // Untested in block 1 drill
      langPassed = scaledLang >= 19;
      readingPassed = true;
      overallPassed = langPassed;
      totalScaled = scaledLang;
    } else if (selectedBlock === 'block2') {
      scaledLang = Math.round((b2LangCorrect / (b2LangTotal || 1)) * 60);
      scaledRead = Math.round((b2ReadingCorrect / (b2ReadingTotal || 1)) * 60);
      langPassed = scaledLang >= 19;
      readingPassed = scaledRead >= 19;
      overallPassed = langPassed && readingPassed;
      totalScaled = scaledLang + scaledRead;
    } else {
      // Full 100-min simulation
      const totalLangQuestions = b1Total + b2LangTotal || 1;
      const totalLangScore = b1Correct + b2LangCorrect;
      scaledLang = Math.round((totalLangScore / totalLangQuestions) * 60);
      const totalReadQuestions = b2ReadingTotal || 1;
      scaledRead = Math.round((b2ReadingCorrect / totalReadQuestions) * 60);
      totalScaled = scaledLang + scaledRead;
      langPassed = scaledLang >= 19;
      readingPassed = scaledRead >= 19;
      overallPassed = langPassed && readingPassed && totalScaled >= 65;
    }

    const attempt: MockAttempt = {
      id: `attempt-${Date.now()}`,
      date: new Date().toISOString(),
      type: selectedBlock,
      block1Score: b1Correct,
      block2Score: b2LangCorrect + b2ReadingCorrect,
      scaledLanguageKnowledge: scaledLang,
      scaledReading: scaledRead,
      totalScaled,
      languagePassed: langPassed,
      readingPassed: readingPassed,
      overallPassed,
      timeSpentSec: 0,
      missedQuestionIds: missedIds,
    };

    saveMockAttempt(attempt);
    setLatestAttempt(attempt);
    setMode('report');
  };

  const handlePushMissedToFSRS = () => {
    if (!latestAttempt) return;
    const count = pushMissedMockItemsToFSRS(latestAttempt.id);
    addToast(`Pushed ${count} missed mock items into FSRS Weak Queue!`, 'success');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* MODE 1: SELECTOR SCREEN */}
      {mode === 'select' && (
        <>
          <SectionContextHeader
            section="mock"
            breadcrumbs={['Mock', '100m Written Simulation']}
            onExit={() => setActivePillar('today')}
          />

          <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
            <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-stationery-border/60 pb-6">
                <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-rose-950">
                    100-Minute Written Mock Exam Simulator
                  </h1>
                  <p className="text-xs sm:text-sm text-ink-muted mt-1">
                    Strictly aligned with official JLPT N3 sections, time limits, and the critical 19/60 sectional passing floor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Option 1: Full 100-Min Mock */}
                <div
                  onClick={() => startExam('full')}
                  className="cursor-pointer bg-white hover:bg-rose-50/20 p-6 rounded-2xl border-2 border-rose-200 hover:border-rose-500 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      Full Simulation
                    </span>
                    <h3 className="font-bold text-base text-rose-950">
                      Full 100-Min Written Mock
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Block 1 (30m Vocab) followed immediately by Block 2 (70m Grammar &amp; Reading).
                    </p>
                  </div>
                  <button className="w-full py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 transition shadow-xs">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Full Mock</span>
                  </button>
                </div>

                {/* Option 2: 30-Min Vocab Block Only */}
                <div
                  onClick={() => startExam('block1')}
                  className="cursor-pointer bg-white hover:bg-stationery-surface p-6 rounded-2xl border border-stationery-border hover:border-rose-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      Section Drill
                    </span>
                    <h3 className="font-bold text-base text-indigo-950">
                      Block 1: Vocabulary (30m)
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Kanji Reading, Orthography, and Contextual Expressions with strict 30-minute timer.
                    </p>
                  </div>
                  <button className="w-full py-2.5 bg-stationery-surface border border-stationery-border text-indigo-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start 30m Vocab</span>
                  </button>
                </div>

                {/* Option 3: 70-Min Grammar & Reading */}
                <div
                  onClick={() => startExam('block2')}
                  className="cursor-pointer bg-white hover:bg-stationery-surface p-6 rounded-2xl border border-stationery-border hover:border-rose-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Section Drill
                    </span>
                    <h3 className="font-bold text-base text-emerald-950">
                      Block 2: Grammar &amp; Reading (70m)
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Form Selection, Star (★) Drills, and timed comprehension passages with 70-minute timer.
                    </p>
                  </div>
                  <button className="w-full py-2.5 bg-stationery-surface border border-stationery-border text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start 70m Block</span>
                  </button>
                </div>
              </div>

              {/* Scoring benchmark notes */}
              <div className="p-4 rounded-2xl bg-stationery-surface border border-stationery-border text-xs text-ink-muted space-y-1">
                <div className="font-bold text-ink">Exam Floor Benchmark:</div>
                <p>
                  You must achieve at least <strong>19/60</strong> in both Knowledge &amp; Reading sections to pass. Scoring below 19 on any section results in an automatic exam failure, regardless of total points.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODE 2: ACTIVE EXAM SIMULATOR (FOCUS MODE) */}
      {mode === 'exam' && activeQuestion && (
        <div className="space-y-4 animate-fade-in">
          <SectionContextHeader
            section="mock"
            breadcrumbs={[
              'Mock',
              selectedBlock === 'full'
                ? `Block ${currentBlock} of 2: ${currentBlock === 1 ? 'Vocab (30m)' : 'Grammar & Reading (70m)'}`
                : selectedBlock === 'block1'
                ? 'Block 1: Vocabulary (30m)'
                : 'Block 2: Grammar & Reading (70m)',
            ]}
            currentStep={currentQIndex + 1}
            totalSteps={questions.length}
            rightElement={
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs ${
                    timeRemainingSec < 300
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      : 'bg-white text-ink border-stationery-border'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 opacity-75" />
                  <span>{formatTime(timeRemainingSec)}</span>
                </div>

                <button
                  onClick={finishExam}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white transition"
                >
                  End &amp; Grade
                </button>
              </div>
            }
            onExit={() => {
              if (window.confirm('Are you sure you want to exit the mock exam? Current progress will be graded.')) {
                finishExam();
              }
            }}
          />

          <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Active Question Prompt & Options (lg:col-span-8) */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-stationery-border p-4 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3 text-xs text-ink-muted">
                  <span className="font-semibold text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    {activeQuestion.section}
                  </span>
                  <button
                    onClick={() => toggleFlag(activeQuestion.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition ${
                      flagged[activeQuestion.id]
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-stationery-surface text-ink-muted border-stationery-border hover:text-ink'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{flagged[activeQuestion.id] ? 'Flagged' : 'Flag for Review'}</span>
                  </button>
                </div>

                {/* Passage text if reading question */}
                {activeQuestion.passageText && (
                  <div className="p-4 rounded-2xl bg-stationery-surface border border-stationery-border text-sm font-jp leading-relaxed text-ink">
                    <FuriganaText expr={activeQuestion.passageText} />
                  </div>
                )}

                {/* Prompt */}
                <div className="text-lg sm:text-xl font-bold font-jp text-ink leading-relaxed py-2">
                  <FuriganaText expr={activeQuestion.prompt} />
                </div>

                {/* 4 Bubble Options */}
                <div className="space-y-3 pt-2">
                  {activeQuestion.options.map((opt, optIdx) => {
                    const isSelected = answers[activeQuestion.id] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border text-sm sm:text-base font-jp transition flex items-center justify-between min-h-[48px] ${
                          isSelected
                            ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs'
                            : 'bg-white border-stationery-border text-ink hover:border-rose-300 hover:bg-stationery-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono font-bold text-xs transition flex-shrink-0 ${
                              isSelected
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-stationery-surface border-stationery-border text-ink'
                            }`}
                          >
                            {optIdx + 1}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Next / Previous Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-stationery-border/60">
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQIndex === 0}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-30 border border-stationery-border transition min-h-[44px]"
                  >
                    Previous
                  </button>

                  <button
                    onClick={handleNextOrFinish}
                    className="px-5 sm:px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 shadow-sm min-h-[44px]"
                  >
                    <span>
                      {currentQIndex === questions.length - 1
                        ? selectedBlock === 'full' && currentBlock === 1
                          ? 'Proceed to Block 2 →'
                          : 'Finish & Grade Exam'
                        : 'Next Question'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Digital Bubble Mark-Sheet (Desktop Only lg:block) */}
              <div className="hidden lg:block lg:col-span-4 bg-white rounded-3xl border border-stationery-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3">
                  <h3 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-rose-600" /> Digital Mark-Sheet
                  </h3>
                  <span className="text-xs font-mono text-ink-muted">
                    {Object.keys(answers).length} / {questions.length} answered
                  </span>
                </div>

                {/* Bubble grid */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentQIndex;
                    const selectedOpt = answers[q.id];
                    const isFlagged = flagged[q.id];

                    return (
                      <div
                        key={q.id}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`cursor-pointer flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                          isCurrent
                            ? 'border-rose-500 bg-rose-50/60 font-bold'
                            : 'border-stationery-border bg-stationery-surface hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-ink-muted w-6">Q{idx + 1}</span>
                          {isFlagged && <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </div>

                        {/* Bubbles 1-4 */}
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3].map((optIdx) => {
                            const isFilled = selectedOpt === optIdx;
                            return (
                              <span
                                key={optIdx}
                                className={`w-6 h-6 rounded-full border text-[11px] font-mono font-bold flex items-center justify-center transition ${
                                  isFilled
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white border-stationery-border text-ink-muted'
                                }`}
                              >
                                {optIdx + 1}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Mark-Sheet Button (< lg) */}
          <div className="lg:hidden fixed bottom-4 right-4 z-30">
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xl border border-white/20 active:scale-95 transition min-h-[44px]"
            >
              <ListChecks className="w-4 h-4" />
              <span>Mark-Sheet ({Object.keys(answers).length}/{questions.length})</span>
            </button>
          </div>

          {/* Mobile Mark-Sheet Slide-up Drawer (< lg) */}
          {mobileSheetOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-fade-in"
              onClick={() => setMobileSheetOpen(false)}
            >
              <div
                className="bg-white rounded-t-3xl border border-stationery-border shadow-2xl w-full max-h-[82dvh] overflow-y-auto p-5 pb-dock-safe space-y-4 animate-slide-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-stationery-border rounded-full mx-auto -mt-1 mb-1 opacity-70" />

                <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3">
                  <h3 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-rose-600" /> Digital Mark-Sheet
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-ink-muted">
                      {Object.keys(answers).length} / {questions.length} answered
                    </span>
                    <button
                      onClick={() => setMobileSheetOpen(false)}
                      className="p-1 rounded-xl text-ink-muted hover:text-ink hover:bg-stationery-surface transition min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bubble grid */}
                <div className="space-y-2 max-h-[60dvh] overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentQIndex;
                    const selectedOpt = answers[q.id];
                    const isFlagged = flagged[q.id];

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setCurrentQIndex(idx);
                          setMobileSheetOpen(false);
                        }}
                        className={`cursor-pointer flex items-center justify-between p-2.5 rounded-xl border text-xs transition min-h-[44px] ${
                          isCurrent
                            ? 'border-rose-500 bg-rose-50/60 font-bold'
                            : 'border-stationery-border bg-stationery-surface hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-ink-muted w-6">Q{idx + 1}</span>
                          {isFlagged && <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </div>

                        {/* Bubbles 1-4 */}
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3].map((optIdx) => {
                            const isFilled = selectedOpt === optIdx;
                            return (
                              <span
                                key={optIdx}
                                className={`w-6 h-6 rounded-full border text-[11px] font-mono font-bold flex items-center justify-center transition ${
                                  isFilled
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white border-stationery-border text-ink-muted'
                                }`}
                              >
                                {optIdx + 1}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: DIAGNOSTIC REPORT & ERROR LOOP */}
      {mode === 'report' && latestAttempt && (
        <div className="space-y-4 animate-fade-in">
          <SectionContextHeader
            section="mock"
            breadcrumbs={['Mock', 'Diagnostic Results Report']}
            onExit={() => setMode('select')}
          />

          <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
            <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stationery-border/60 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-rose-950">
                      Diagnostic Mock Results
                    </h1>
                    {latestAttempt.overallPassed ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> PASSED
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-rose-600" /> BELOW FLOOR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    Completed on {new Date(latestAttempt.date).toLocaleString()}
                  </p>
                </div>

                {/* Error to FSRS Action */}
                {latestAttempt.missedQuestionIds.length > 0 && (
                  <button
                    onClick={handlePushMissedToFSRS}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-sm"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Push Missed Items to FSRS Queue ({latestAttempt.missedQuestionIds.length})</span>
                  </button>
                )}
              </div>

              {/* Score Cards with 19/60 Floor Warning */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Language Knowledge */}
                <div className="p-5 rounded-2xl border border-stationery-border bg-stationery-surface space-y-2">
                  <span className="text-xs font-bold uppercase text-ink-muted">
                    Language Knowledge (Vocab &amp; Grammar)
                  </span>
                  <div className="text-3xl font-mono font-bold text-rose-950">
                    {latestAttempt.scaledLanguageKnowledge} <span className="text-sm font-normal text-ink-muted">/ 60</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {latestAttempt.languagePassed ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Met 19/60 Floor
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> FAILED 19 Floor
                      </span>
                    )}
                  </div>
                </div>

                {/* Reading */}
                <div className="p-5 rounded-2xl border border-stationery-border bg-stationery-surface space-y-2">
                  <span className="text-xs font-bold uppercase text-ink-muted">
                    Reading Section
                  </span>
                  {latestAttempt.type === 'block1' ? (
                    <>
                      <div className="text-xl font-mono font-semibold text-ink-muted">
                        Not Tested
                      </div>
                      <span className="text-xs text-ink-muted">Block 1 Vocab Drill Only</span>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-mono font-bold text-rose-950">
                        {latestAttempt.scaledReading} <span className="text-sm font-normal text-ink-muted">/ 60</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {latestAttempt.readingPassed ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Met 19/60 Floor
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> FAILED 19 Floor
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Combined Written Subtotal */}
                <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-2">
                  <span className="text-xs font-bold uppercase text-rose-900">
                    {latestAttempt.type === 'full' ? 'Combined Written Subtotal' : 'Drill Score'}
                  </span>
                  <div className="text-3xl font-mono font-bold text-rose-950">
                    {latestAttempt.totalScaled}{' '}
                    <span className="text-sm font-normal text-ink-muted">
                      / {latestAttempt.type === 'full' ? '120' : '60'}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted font-medium">
                    {latestAttempt.type === 'full' ? 'Pass benchmark: 95/180' : '19/60 Minimum Floor'}
                  </span>
                </div>
              </div>

              {/* Missed Questions Breakdown */}
              <div className="pt-4 space-y-4">
                <h3 className="font-bold text-rose-950 text-base">
                  Question Review &amp; Error Diagnostic ({latestAttempt.type === 'block1' ? 'Block 1 Only' : latestAttempt.type === 'block2' ? 'Block 2 Only' : 'Full Mock'})
                </h3>

                <div className="space-y-4">
                  {(latestAttempt.type === 'block1'
                    ? SEED_MOCK_QUESTIONS.filter((q) => q.block === 1)
                    : latestAttempt.type === 'block2'
                    ? SEED_MOCK_QUESTIONS.filter((q) => q.block === 2)
                    : SEED_MOCK_QUESTIONS
                  ).map((q, idx) => {
                    const userAns = answers[q.id];
                    const isCorrect = userAns === q.correct;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border space-y-3 ${
                          isCorrect
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-rose-200 bg-rose-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold font-mono">
                            Q{idx + 1}. Block {q.block} ({q.section})
                          </span>
                          <span
                            className={`font-bold flex items-center gap-1 ${
                              isCorrect ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-rose-600" /> Incorrect (Picked Option {(userAns !== undefined ? userAns + 1 : 'None')})
                              </>
                            )}
                          </span>
                        </div>

                        <div className="text-sm font-bold font-jp text-ink">
                          <FuriganaText expr={q.prompt} />
                        </div>

                        <div className="text-xs text-ink-muted space-y-2">
                          <div>
                            <strong className="text-rose-950">Correct Answer:</strong> Option {q.correct + 1} ({q.options[q.correct]})
                          </div>
                          <div>
                            <strong className="text-rose-950">EN:</strong> {q.explanationEn}
                          </div>
                          {settings.showArabic && q.explanationAr && (
                            <div
                              className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-xs leading-relaxed"
                              dir="rtl"
                              lang="ar"
                            >
                              <ArabicText text={q.explanationAr} className="text-xs font-semibold text-[#14532D] block" asBlock />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setMode('select')}
                  className="px-6 py-3 bg-stationery-surface hover:bg-stationery-border/50 text-rose-950 text-xs font-bold rounded-xl border border-stationery-border transition"
                >
                  Back to Mock Simulator Selection
                </button>

                <button
                  onClick={() => setActivePillar('today')}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Return to Today's Dashboard →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
