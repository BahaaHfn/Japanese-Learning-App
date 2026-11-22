import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FuriganaText } from '../components/common/FuriganaText';
import { ArabicText } from '../components/common/ArabicText';
import { PaceTimer } from '../components/common/PaceTimer';
import { SectionContextHeader } from '../components/common/SectionContextHeader';
import { ClickableWord, ReadingPassage } from '../types';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ReadingLab: React.FC = () => {
  const { readingPassages, enqueueWeakItem, addToast, settings, setActivePillar } = useApp();

  const [selectedPassageId, setSelectedPassageId] = useState<string>(
    readingPassages[0]?.id || ''
  );
  const [mobileReadingTab, setMobileReadingTab] = useState<'passage' | 'questions'>('passage');
  const [strategyHelper, setStrategyHelper] = useState<boolean>(true);
  const [strategyCollapsed, setStrategyCollapsed] = useState<boolean>(false);

  // Per-question user answers: { [qId: string]: number }
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [answersSubmitted, setAnswersSubmitted] = useState<boolean>(false);

  // Active passage
  const currentPassage: ReadingPassage | undefined = readingPassages.find(
    (p) => p.id === selectedPassageId
  );

  // One-click bilingual word capture with clean toast notification
  const handleWordClick = (word: ClickableWord) => {
    enqueueWeakItem({
      expr: word.expr,
      reading: word.reading,
      meaningEn: word.meaningEn,
      meaningAr: word.meaningAr,
      source: 'Reading Lab Capture',
      subskill: 'Vocab',
    });
    addToast(`Captured 「${word.expr}」 to your Vocab SRS queue!`, 'success');
  };

  const handleSelectAnswer = (qId: string, optIdx: number) => {
    if (answersSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => {
    setAnswersSubmitted(true);
    addToast('Reading questions submitted. Review explanations below!', 'info');
  };

  const handleResetPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setUserAnswers({});
    setAnswersSubmitted(false);
  };

  // Helper to highlight conjunctions / discourse markers and clickable vocabulary
  const renderParagraph = (paragraph: string) => {
    if (!currentPassage) return paragraph;

    const clickableMap = new Map<string, ClickableWord>();
    currentPassage.clickableWords.forEach((w) => clickableMap.set(w.expr, w));

    const markers = strategyHelper ? currentPassage.conjunctions : [];
    const allKeywords = [...currentPassage.clickableWords.map((w) => w.expr), ...markers];
    if (allKeywords.length === 0) {
      return <FuriganaText expr={paragraph} />;
    }

    const sortedEscaped = [...allKeywords]
      .sort((a, b) => b.length - a.length)
      .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const pattern = new RegExp(`(${sortedEscaped.join('|')})`, 'g');
    const segments = paragraph.split(pattern);

    return (
      <span className="font-jp leading-loose text-base text-ink">
        {segments.map((seg, i) => {
          if (markers.includes(seg)) {
            return (
              <mark
                key={i}
                className="bg-amber-100 text-amber-950 font-bold px-1.5 py-0.5 rounded border border-amber-300 mx-0.5"
                title="Discourse Marker (接続表現)"
              >
                {seg}
              </mark>
            );
          }

          const word = clickableMap.get(seg);
          if (word) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleWordClick(word)}
                className="underline decoration-emerald-500 decoration-2 underline-offset-4 text-emerald-800 font-semibold hover:bg-emerald-50 px-1 py-0.5 rounded transition text-left inline-block active:bg-emerald-100 min-h-[30px]"
                title={`Click to capture to FSRS:\n${word.expr} (${word.reading})\n${word.meaningEn}\n${word.meaningAr}`}
              >
                <FuriganaText expr={word.expr} reading={word.reading} />
              </button>
            );
          }

          return <FuriganaText key={i} expr={seg} />;
        })}
      </span>
    );
  };

  if (!currentPassage) return null;

  return (
    <div className="space-y-4">
      {/* 1. Standard Section Context Header */}
      <SectionContextHeader
        section="reading"
        breadcrumbs={['Study', 'Reading Lab', currentPassage.type]}
        rightElement={
          <div className="flex items-center gap-2">
            <PaceTimer targetSeconds={currentPassage.targetSec} key={currentPassage.id} />
          </div>
        }
        onExit={() => setActivePillar('today')}
      />

      {/* 2. Passage Selector Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="bg-white rounded-2xl border border-stationery-border p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {readingPassages.map((p) => {
              const isSelected = p.id === selectedPassageId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleResetPassage(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-stationery-surface text-ink-muted hover:text-ink border-stationery-border'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {p.type}: {p.title.slice(0, 20)}...
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    ({Math.round(p.targetSec / 60)}m)
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStrategyHelper(!strategyHelper)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                strategyHelper
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-stationery-surface text-ink-muted border-stationery-border'
              }`}
              title="Toggle Discourse Markers & Keyword Highlights"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Marker Highlights {strategyHelper ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Strategy Accordion */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl overflow-hidden text-xs text-amber-950 transition-all">
          <button
            onClick={() => setStrategyCollapsed(!strategyCollapsed)}
            className="w-full p-3.5 flex items-center justify-between font-bold text-left hover:bg-amber-100/40 transition"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>JLPT N3 Reading Strategy: Read Questions First!</span>
            </div>
            {strategyCollapsed ? (
              <ChevronDown className="w-4 h-4 text-amber-700" />
            ) : (
              <ChevronUp className="w-4 h-4 text-amber-700" />
            )}
          </button>

          {!strategyCollapsed && (
            <div className="px-4 pb-3.5 pt-1 text-ink-muted leading-relaxed border-t border-amber-200/50">
              Scan the question prompts on the right before reading the passage. Look out for highlighted
              discourse markers like <mark className="bg-amber-200 px-1 rounded font-bold">しかし</mark>{' '}
              (contrast), <mark className="bg-amber-200 px-1 rounded font-bold">そのため</mark>{' '}
              (cause/consequence), and <mark className="bg-amber-200 px-1 rounded font-bold">つまり</mark>{' '}
              (conclusion). <strong>Underlined words</strong> can be clicked directly to capture into your FSRS review queue!
            </div>
          )}
        </div>
      </div>

      {/* 4. Mobile Segmented Switcher (< lg) & Pace Timer */}
      <div className="lg:hidden sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stationery-border py-2 px-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex-1 flex items-center p-1 rounded-xl bg-stationery-surface border border-stationery-border text-xs font-bold">
            <button
              onClick={() => setMobileReadingTab('passage')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
                mobileReadingTab === 'passage'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Passage
            </button>
            <button
              onClick={() => setMobileReadingTab('questions')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
                mobileReadingTab === 'questions'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Questions ({Object.keys(userAnswers).length}/{currentPassage.questions.length})
            </button>
          </div>
          <div className="flex-shrink-0">
            <PaceTimer targetSeconds={currentPassage.targetSec} key={currentPassage.id} />
          </div>
        </div>
      </div>

      {/* 5. Two-Column Workspace (Passage 60% Left, Questions 40% Right) */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Japanese Passage (lg:col-span-7) */}
          <div className={`lg:col-span-7 bg-white rounded-3xl border border-stationery-border p-4 sm:p-8 shadow-sm space-y-6 ${mobileReadingTab !== 'passage' ? 'hidden lg:block' : 'block'}`}>
            <div className="border-b border-stationery-border/60 pb-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {currentPassage.type} ({Math.round(currentPassage.targetSec / 60)} min target)
                </span>
                <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                  <BookmarkPlus className="w-3.5 h-3.5" /> Click underlined word to save
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-jp text-ink mt-3">
                <FuriganaText expr={currentPassage.title} />
              </h2>
            </div>

            {/* Paragraphs */}
            <div className="space-y-6">
              {currentPassage.paragraphs.map((p, idx) => (
                <p key={idx} className="leading-relaxed whitespace-pre-line">
                  {renderParagraph(p)}
                </p>
              ))}
            </div>

            {/* Clickable Words List Footer */}
            <div className="pt-6 border-t border-stationery-border/60">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5">
                Bilingual Vocabulary Captured in this passage:
              </div>
              <div className="flex flex-wrap gap-2">
                {currentPassage.clickableWords.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => handleWordClick(word)}
                    className="px-2.5 py-1.5 rounded-xl bg-stationery-surface hover:bg-emerald-50 border border-stationery-border hover:border-emerald-300 text-xs font-jp text-ink transition flex items-center gap-1.5 shadow-xs"
                    title="Click to capture"
                  >
                    <span className="font-bold text-emerald-800">{word.expr}</span>
                    <span className="text-ink-muted text-[11px]">({word.reading})</span>
                    <span className="text-stationery-border">|</span>
                    <span className="text-ink-muted">{word.meaningEn}</span>
                    {settings.showArabic && (
                      <span className="text-[11px] font-semibold text-[#14532D] font-arabic" dir="rtl">
                        • {word.meaningAr}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Comprehension Questions (lg:col-span-5) */}
          <div className={`lg:col-span-5 space-y-6 lg:sticky lg:top-16 ${mobileReadingTab !== 'questions' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-3xl border border-stationery-border p-4 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3">
                <h3 className="font-bold text-emerald-900 text-base">
                  Comprehension Questions
                </h3>
                <span className="text-xs font-mono text-ink-muted">
                  {Object.keys(userAnswers).length} / {currentPassage.questions.length} Answered
                </span>
              </div>

              <div className="space-y-6">
                {currentPassage.questions.map((q, qIndex) => {
                  const selectedOpt = userAnswers[q.id];
                  const isCorrect = selectedOpt === q.correct;

                  return (
                    <div
                      key={q.id}
                      className="space-y-3 border-b border-stationery-border/60 last:border-b-0 pb-6 last:pb-0"
                    >
                      <div className="text-sm font-bold font-jp text-ink leading-relaxed flex items-start gap-2">
                        <span className="font-mono text-emerald-800 font-bold">Q{qIndex + 1}.</span>
                        <FuriganaText expr={q.prompt} />
                      </div>

                      {/* 4 Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isThisSelected = selectedOpt === optIdx;
                          let optStyle =
                            'bg-stationery-surface border-stationery-border text-ink hover:border-emerald-400';

                          if (answersSubmitted) {
                            if (optIdx === q.correct) {
                              optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (isThisSelected) {
                              optStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                            } else {
                              optStyle =
                                'bg-stationery-surface/50 border-stationery-border text-ink-muted opacity-50';
                            }
                          } else if (isThisSelected) {
                            optStyle =
                              'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              disabled={answersSubmitted}
                              className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm font-jp transition flex items-center justify-between ${optStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-white border border-current/20 flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                                  {optIdx + 1}
                                </span>
                                <span>{opt}</span>
                              </div>

                              {answersSubmitted && optIdx === q.correct && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              )}
                              {answersSubmitted && isThisSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation after submitting */}
                      {answersSubmitted && (
                        <div className="p-3.5 rounded-2xl bg-stationery-surface border border-stationery-border text-xs space-y-2 animate-fade-in">
                          <div className="font-semibold text-emerald-900">Explanation:</div>
                          <p className="text-ink leading-relaxed">{q.explanationEn}</p>
                          {settings.showArabic && q.explanationAr && (
                            <div
                              className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-xs leading-relaxed"
                              dir="rtl"
                              lang="ar"
                            >
                              <ArabicText
                                text={q.explanationAr}
                                className="text-xs font-semibold text-[#14532D] block"
                                asBlock
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Reset Actions */}
              <div className="pt-2">
                {!answersSubmitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length === 0}
                    className="w-full py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-40 transition shadow-sm"
                  >
                    Submit &amp; Check Answers
                  </button>
                ) : (
                  <button
                    onClick={() => handleResetPassage(currentPassage.id)}
                    className="w-full py-3 bg-stationery-surface hover:bg-stationery-border/50 text-emerald-900 text-xs font-bold rounded-2xl border border-stationery-border transition"
                  >
                    Retry This Passage
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
