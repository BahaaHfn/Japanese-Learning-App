import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FuriganaText } from '../components/common/FuriganaText';
import { ArabicText } from '../components/common/ArabicText';
import { SectionContextHeader } from '../components/common/SectionContextHeader';
import { InteractiveSentence } from '../components/common/InteractiveSentence';
import {
  MOCK_TESTS_METADATA,
  MOCK_TEST_1_QUESTIONS,
  MOCK_TEST_2_QUESTIONS,
  MOCK_TEST_3_QUESTIONS,
  getMockQuestionsByTestId,
} from '../data/mockTestSets';
import { SEED_MOCK_QUESTIONS } from '../data/seedData';
import {
  deduplicateMockQuestions,
  getSeenMockQuestionIds,
  markMockQuestionsAsSeen,
  recordMistake,
  shuffleArray,
} from '../lib/questionEngine';
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
  Sparkles,
  RotateCcw,
} from 'lucide-react';

type ExamMode = 'select' | 'exam' | 'report';
type BlockSelection = 'full' | 'block1' | 'block2';
type ReviewFilter = 'all' | 'wrong' | 'flagged';

export const MockExam: React.FC = () => {
  const {
    saveMockAttempt,
    pushMissedMockItemsToFSRS,
    addToast,
    setFocusMode,
    setActivePillar,
    settings,
    enqueueWeakItem,
  } = useApp();

  const [mode, setMode] = useState<ExamMode>('select');
  const [selectedBlock, setSelectedBlock] = useState<BlockSelection>('full');
  const [activeTestTitle, setActiveTestTitle] = useState<string>('Mock Test 1');

  // Active question pool for current test attempt
  const [activeTestPool, setActiveTestPool] = useState<MockQuestion[]>(MOCK_TEST_1_QUESTIONS);

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
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [retryQuestionsOnly, setRetryQuestionsOnly] = useState<MockQuestion[] | null>(null);

  // Filter questions based on block
  const questions: MockQuestion[] = useMemo(() => {
    const base = retryQuestionsOnly || activeTestPool;
    if (selectedBlock === 'block1') {
      return base.filter((q) => q.block === 1);
    }
    if (selectedBlock === 'block2') {
      return base.filter((q) => q.block === 2);
    }
    // Full: block 1 first, then block 2
    return base.filter((q) => q.block === currentBlock);
  }, [selectedBlock, currentBlock, activeTestPool, retryQuestionsOnly]);

  const activeQuestion: MockQuestion | undefined = questions[currentQIndex];

  // Start exam with a specific test set
  const startExamWithSet = (
    testId: string,
    testTitle: string,
    blockType: BlockSelection,
    customQuestions?: MockQuestion[]
  ) => {
    const rawPool = customQuestions || getMockQuestionsByTestId(testId);
    const deduplicated = deduplicateMockQuestions(rawPool);

    setActiveTestTitle(testTitle);
    setActiveTestPool(deduplicated);
    setRetryQuestionsOnly(null);

    // Mark questions as seen
    markMockQuestionsAsSeen(deduplicated.map((q) => q.id));

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

  // Generate Fresh Unseen Mock Test dynamically
  const handleGenerateFreshMock = () => {
    const seenIds = getSeenMockQuestionIds();
    const allPools: MockQuestion[] = [
      ...MOCK_TEST_1_QUESTIONS,
      ...MOCK_TEST_2_QUESTIONS,
      ...MOCK_TEST_3_QUESTIONS,
      ...SEED_MOCK_QUESTIONS,
    ];

    let unseen = allPools.filter((q) => !seenIds.has(q.id));
    let poolExhausted = false;

    if (unseen.length < 24) {
      poolExhausted = true;
      addToast(
        'All standard questions have been seen! Assembling a fresh mixture with priority to missed items.',
        'info'
      );
      unseen = shuffleArray(allPools);
    }

    // Split into Block 1 (Vocab) and Block 2 (Grammar & Reading)
    const block1Pool = unseen.filter((q) => q.block === 1);
    const block2Pool = unseen.filter((q) => q.block === 2);

    const freshB1 = shuffleArray(block1Pool).slice(0, 12);
    const freshB2 = shuffleArray(block2Pool).slice(0, 12);
    const combined = deduplicateMockQuestions([...freshB1, ...freshB2]);

    const generatedId = `fresh-mock-${Date.now()}`;
    const generatedTitle = `Fresh Unseen Mock (${new Date().toLocaleDateString()})`;

    startExamWithSet(generatedId, generatedTitle, 'full', combined);
    addToast(
      poolExhausted
        ? 'Fresh mock generated from full pool!'
        : 'Fresh unseen mock successfully assembled!',
      'success'
    );
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

    const allQuestions = activeTestPool;

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
        // Record mistake to the dedicated "Practice My Mistakes" queue
        recordMistake(q);
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

    let scaledLang = 0;
    let scaledRead = 0;
    let langPassed = false;
    let readingPassed = false;
    let overallPassed = false;
    let totalScaled = 0;

    if (selectedBlock === 'block1') {
      scaledLang = Math.round((b1Correct / (b1Total || 1)) * 60);
      scaledRead = -1;
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
    setReviewFilter('all');
    setMode('report');
  };

  const handlePushMissedToFSRS = () => {
    if (!latestAttempt) return;
    const count = pushMissedMockItemsToFSRS(latestAttempt.id);
    addToast(`Pushed ${count} missed mock items into FSRS Weak Queue!`, 'success');
  };

  const handleRetryWrongOnly = () => {
    if (!latestAttempt) return;
    const missedQuestions = activeTestPool.filter((q) =>
      latestAttempt.missedQuestionIds.includes(q.id)
    );
    if (missedQuestions.length === 0) {
      addToast('No wrong questions to retry! You answered everything correctly!', 'success');
      return;
    }
    setRetryQuestionsOnly(missedQuestions);
    setAnswers({});
    setFlagged({});
    setCurrentQIndex(0);
    setCurrentBlock(1);
    setTimeRemainingSec(missedQuestions.length * 90);
    setIsTimerRunning(true);
    setFocusMode(true);
    setMode('exam');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Review items filter
  const reviewQuestions = useMemo(() => {
    if (!latestAttempt) return [];
    const pool = activeTestPool;
    if (reviewFilter === 'wrong') {
      return pool.filter((q) => latestAttempt.missedQuestionIds.includes(q.id));
    }
    if (reviewFilter === 'flagged') {
      return pool.filter((q) => flagged[q.id]);
    }
    return pool;
  }, [activeTestPool, latestAttempt, reviewFilter, flagged]);

  return (
    <div className="space-y-4">
      {/* MODE 1: SELECTOR SCREEN */}
      {mode === 'select' && (
        <>
          <SectionContextHeader
            section="mock"
            breadcrumbs={['Mock', 'Structured Exams & Fresh Generator']}
            onExit={() => setActivePillar('today')}
          />

          <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stationery-border/60 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-rose-950">
                      Mock Shiken (模擬試験) Center
                    </h1>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1">
                      Choose a pre-structured numbered test set or generate a dynamically assembled unseen mock.
                    </p>
                  </div>
                </div>

                {/* Fresh Unseen Mock CTA Button */}
                <button
                  onClick={handleGenerateFreshMock}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Fresh Unseen Mock</span>
                </button>
              </div>

              {/* Numbered Mock Tests (Migii Style) */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Official Numbered Mock Tests
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MOCK_TESTS_METADATA.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl border border-stationery-border bg-white hover:border-rose-400 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {test.id.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-ink-muted font-medium">
                            {test.totalQuestions} Questions
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-rose-950">{test.title}</h3>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {test.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stationery-border/60">
                        <button
                          onClick={() => startExamWithSet(test.id, test.title, 'full')}
                          className="w-full py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-700 transition shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Full Mock (100m)</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <button
                            onClick={() => startExamWithSet(test.id, test.title, 'block1')}
                            className="py-1.5 px-2 bg-stationery-surface hover:bg-indigo-50 border border-stationery-border text-indigo-900 rounded-lg font-medium transition text-center"
                          >
                            Block 1 (30m)
                          </button>
                          <button
                            onClick={() => startExamWithSet(test.id, test.title, 'block2')}
                            className="py-1.5 px-2 bg-stationery-surface hover:bg-emerald-50 border border-stationery-border text-emerald-900 rounded-lg font-medium transition text-center"
                          >
                            Block 2 (70m)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
              activeTestTitle,
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

                {/* Prompt with tap-to-lookup words */}
                <div className="text-lg sm:text-xl font-bold font-jp text-ink leading-relaxed py-2">
                  <InteractiveSentence
                    sentence={activeQuestion.prompt}
                    clickableWords={activeQuestion.clickableWords}
                    onAddToWeakQueue={(word) => enqueueWeakItem(word)}
                  />
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

      {/* MODE 3: DIAGNOSTIC REPORT & ERROR LOOP (Migii Rich Feedback) */}
      {mode === 'report' && latestAttempt && (
        <div className="space-y-4 animate-fade-in">
          <SectionContextHeader
            section="mock"
            breadcrumbs={['Mock', 'Diagnostic Results & Error Review']}
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
                    Completed on {new Date(latestAttempt.date).toLocaleString()} • {activeTestTitle}
                  </p>
                </div>

                {/* Actions: Retry Wrong Only & Push Missed to FSRS */}
                <div className="flex flex-wrap items-center gap-2">
                  {latestAttempt.missedQuestionIds.length > 0 && (
                    <>
                      <button
                        onClick={handleRetryWrongOnly}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Wrong Questions ({latestAttempt.missedQuestionIds.length})</span>
                      </button>

                      <button
                        onClick={handlePushMissedToFSRS}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Push to FSRS</span>
                      </button>
                    </>
                  )}
                </div>
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

              {/* Missed Questions Breakdown & Filter */}
              <div className="pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stationery-border pb-3">
                  <h3 className="font-bold text-rose-950 text-base">
                    Question Review ({reviewQuestions.length} Questions)
                  </h3>

                  {/* Filter Pills: All, Wrong Only, Flagged */}
                  <div className="flex items-center gap-1 bg-stationery-surface p-1 rounded-xl border border-stationery-border text-xs">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        reviewFilter === 'all'
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      All ({activeTestPool.length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('wrong')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        reviewFilter === 'wrong'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-ink-muted hover:text-rose-700'
                      }`}
                    >
                      Wrong Only ({latestAttempt.missedQuestionIds.length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('flagged')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        reviewFilter === 'flagged'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Flagged ({Object.values(flagged).filter(Boolean).length})
                    </button>
                  </div>
                </div>

                {/* Question List */}
                <div className="space-y-4">
                  {reviewQuestions.map((q, idx) => {
                    const userAns = answers[q.id];
                    const isCorrect = userAns === q.correct;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border space-y-3.5 ${
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

                        {q.passageText && (
                          <div className="p-3.5 rounded-xl bg-white/80 border border-stationery-border text-xs leading-relaxed text-ink font-jp">
                            <FuriganaText expr={q.passageText} />
                          </div>
                        )}

                        <div className="text-sm font-bold font-jp text-ink">
                          <InteractiveSentence
                            sentence={q.prompt}
                            clickableWords={q.clickableWords}
                            onAddToWeakQueue={(word) => enqueueWeakItem(word)}
                          />
                        </div>

                        {/* Sentence Translation EN + RTL AR */}
                        {(q.sentenceTranslationEn || q.sentenceTranslationAr) && (
                          <div className="p-3 bg-white/70 rounded-xl border border-stationery-border/60 text-xs space-y-1">
                            {q.sentenceTranslationEn && (
                              <div className="text-ink font-medium">
                                <span className="font-bold text-[10px] text-indigo-700 uppercase block">Sentence Meaning:</span>
                                {q.sentenceTranslationEn}
                              </div>
                            )}
                            {settings.showArabic && q.sentenceTranslationAr && (
                              <div className="pt-1 border-t border-stationery-border/40" dir="rtl" lang="ar">
                                <ArabicText text={q.sentenceTranslationAr} className="text-xs text-ink-secondary" asBlock />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Option Glosses */}
                        {q.optionGlosses && q.optionGlosses.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                              Option Choices Breakdown:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {q.optionGlosses.map((gloss, gIdx) => (
                                <div
                                  key={gIdx}
                                  className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-1.5 ${
                                    gloss.isCorrect || gIdx === q.correct
                                      ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950 font-semibold'
                                      : gIdx === userAns
                                      ? 'bg-rose-100/60 border-rose-300 text-rose-950'
                                      : 'bg-white/80 border-stationery-border text-ink-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-white border border-current/20 flex items-center justify-center font-mono text-[10px] font-bold">
                                      {gIdx + 1}
                                    </span>
                                    <span className="font-jp">{gloss.option}</span>
                                  </div>
                                  <div className="text-right text-[11px]">
                                    <span>{gloss.meaningEn}</span>
                                    {settings.showArabic && gloss.meaningAr && (
                                      <ArabicText text={gloss.meaningAr} className="block text-[10px] text-ink-muted" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Explanations EN + RTL AR */}
                        <div className="text-xs text-ink-muted space-y-1.5 pt-1">
                          <div>
                            <strong className="text-rose-950">Explanation (EN):</strong> {q.explanationEn}
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
