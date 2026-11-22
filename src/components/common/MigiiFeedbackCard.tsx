import React from 'react';
import { ArabicText } from './ArabicText';
import { MasteryPillSelector } from './MasteryPillSelector';
import { OptionGloss, MasteryDegree } from '../../types';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface MigiiFeedbackCardProps {
  isCorrect: boolean;
  selectedOptionIndex: number;
  options?: string[];
  correctOptionIndex: number;
  optionGlosses?: OptionGloss[];
  sentenceTranslationEn?: string;
  sentenceTranslationAr?: string;
  explanationEn: string;
  explanationAr: string;
  currentMasteryLevel?: MasteryDegree;
  onRateMastery?: (level: MasteryDegree) => void;
  onNextQuestion: () => void;
  nextButtonLabel?: string;
  isMistakeMode?: boolean;
  consecutiveCorrect?: number;
}

export const MigiiFeedbackCard: React.FC<MigiiFeedbackCardProps> = ({
  isCorrect,
  selectedOptionIndex,
  options: _options,
  correctOptionIndex,
  optionGlosses,
  sentenceTranslationEn,
  sentenceTranslationAr,
  explanationEn,
  explanationAr,
  currentMasteryLevel = 2,
  onRateMastery,
  onNextQuestion,
  nextButtonLabel = 'Next Question (Space)',
  isMistakeMode = false,
  consecutiveCorrect = 0,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stationery-border shadow-md overflow-hidden animate-fade-in space-y-4">
      {/* 1. Header Banner */}
      <div
        className={`px-5 py-3.5 flex items-center justify-between text-white font-bold text-sm ${
          isCorrect ? 'bg-jade' : 'bg-vermilion'
        }`}
      >
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Correct Answer! (正解)</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-white" />
              <span>Incorrect (不正解)</span>
            </>
          )}
        </div>

        {isMistakeMode && (
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-mono">
            {isCorrect
              ? consecutiveCorrect >= 2
                ? '★ Graduated from Mistakes!'
                : `Progress: ${consecutiveCorrect}/2 Correct`
              : 'Mistake Saved for Repetition'}
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* 2. Bilingual Sentence Translation (if provided) */}
        {(sentenceTranslationEn || sentenceTranslationAr) && (
          <div className="bg-stationery-surface p-4 rounded-2xl border border-stationery-border space-y-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-indigo-primary" /> Full Sentence Meaning
            </span>
            {sentenceTranslationEn && (
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                {sentenceTranslationEn}
              </p>
            )}
            {sentenceTranslationAr && (
              <div className="pt-1 border-t border-stationery-border/60">
                <ArabicText
                  text={sentenceTranslationAr}
                  className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-arabic"
                />
              </div>
            )}
          </div>
        )}

        {/* 3. Detailed Explanation Card */}
        <div className="bg-indigo-wash/30 border border-indigo-200/70 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-primary" />
            <span>Why This Is Correct / Key Examination Point</span>
          </div>
          <p className="text-xs sm:text-sm text-ink leading-relaxed">{explanationEn}</p>
          {explanationAr && (
            <div className="pt-2 border-t border-indigo-100">
              <ArabicText
                text={explanationAr}
                className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-arabic"
              />
            </div>
          )}
        </div>

        {/* 4. Complete Option Breakdown (Migii Style: All 4 choices explained) */}
        {optionGlosses && optionGlosses.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
              <span>All 4 Options Breakdown (選択肢の解説)</span>
              <span className="text-[11px] font-normal text-ink-muted">Study wrong choices</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {optionGlosses.map((gloss, idx) => {
                const isThisCorrect = gloss.isCorrect || idx === correctOptionIndex;
                const wasSelected = idx === selectedOptionIndex;

                let badgeColor = 'bg-stationery-surface text-ink-muted border-stationery-border';
                if (isThisCorrect) {
                  badgeColor = 'bg-jade-wash text-jade border-jade/40 font-bold';
                } else if (wasSelected) {
                  badgeColor = 'bg-vermilion-wash text-vermilion border-vermilion/40 font-bold';
                }

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isThisCorrect
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : wasSelected
                        ? 'bg-rose-50/50 border-rose-300'
                        : 'bg-white border-stationery-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs border ${badgeColor}`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-jp font-bold text-sm text-ink">{gloss.option}</span>
                      {isThisCorrect && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          正解 Correct
                        </span>
                      )}
                      {wasSelected && !isThisCorrect && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                          Your choice
                        </span>
                      )}
                    </div>

                    <div className="text-right sm:max-w-md space-y-0.5">
                      <div className="text-xs text-ink font-medium">
                        {gloss.meaningEn}
                        {gloss.whyWrongEn && (
                          <span className="text-rose-600 ml-1.5 font-normal">
                            ({gloss.whyWrongEn})
                          </span>
                        )}
                      </div>
                      {gloss.meaningAr && (
                        <ArabicText
                          text={gloss.meaningAr}
                          className="text-[11px] text-ink-muted block font-arabic"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. In-Card Mastery Degree Selector */}
        {onRateMastery && (
          <div className="p-3.5 bg-stationery-surface rounded-2xl border border-stationery-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-ink block">Mastery Degree Frequency</span>
              <span className="text-[11px] text-ink-muted">
                Adjust how often you want to see this item
              </span>
            </div>
            <MasteryPillSelector
              currentLevel={currentMasteryLevel}
              onSelect={onRateMastery}
              size="md"
              showHints={false}
            />
          </div>
        )}

        {/* 6. Primary CTA Next Button */}
        <button
          onClick={onNextQuestion}
          className="w-full py-3.5 px-4 rounded-2xl bg-indigo-primary hover:bg-indigo-light text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
        >
          <span>{nextButtonLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
