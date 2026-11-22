import React from 'react';
import { StudyItem, MasteryDegree } from '../../types';
import { FuriganaText } from '../common/FuriganaText';
import { ArabicText } from '../common/ArabicText';
import { MasteryPillSelector } from '../common/MasteryPillSelector';
import { X, BookOpen, Clock } from 'lucide-react';

interface KanjiDetailModalProps {
  item: StudyItem | null;
  onClose: () => void;
  onUpdateMastery: (id: string, level: MasteryDegree) => void;
}

export const KanjiDetailModal: React.FC<KanjiDetailModalProps> = ({
  item,
  onClose,
  onUpdateMastery,
}) => {
  if (!item) return null;

  const currentLevel = item.masteryLevel || 2;

  // Split on/kun readings if formatted with slash or bullets
  const readingParts = item.reading.split(/[/・、\s]+/);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl md:rounded-3xl border border-stationery-border shadow-2xl w-full max-w-lg max-h-[88dvh] overflow-y-auto space-y-4 p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-slide-in md:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="md:hidden w-12 h-1.5 bg-stationery-border rounded-full mx-auto -mt-1 mb-1 opacity-70" />

        {/* Header with Exit */}
        <div className="flex items-center justify-between border-b border-stationery-border/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
            <span className="px-2 py-0.5 rounded-full bg-stationery-surface border border-stationery-border">
              N3 Kanji #{item.id.replace('kanji-all-', '').replace('kanji-', '')}
            </span>
            {item.category && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[150px]">
                {item.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-ink-muted hover:text-ink hover:bg-stationery-surface transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kanji Hero Card */}
        <div className="flex items-start gap-3.5 sm:gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-wash/40 border-2 border-indigo-primary/20 flex items-center justify-center text-4xl sm:text-5xl font-bold font-jp text-indigo-primary shadow-xs flex-shrink-0">
            {item.expr}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div>
              <div className="text-[11px] text-ink-muted font-bold uppercase tracking-wider">
                On/Kun Readings
              </div>
              <div className="text-sm sm:text-base font-bold font-jp text-ink mt-0.5 flex flex-wrap gap-1">
                {readingParts.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-stationery-surface border border-stationery-border text-xs"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-ink-muted font-bold uppercase tracking-wider">
                English Meaning
              </div>
              <div className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                {item.meaningEn}
              </div>
            </div>
          </div>
        </div>

        {/* Arabic Meaning in Soft Jade Clarity Box */}
        {item.meaningAr && (
          <div
            className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] space-y-1"
            dir="rtl"
            lang="ar"
          >
            <div className="text-xs font-bold opacity-80">المعنى بالعربية:</div>
            <ArabicText
              text={item.meaningAr}
              className="text-sm font-semibold text-[#14532D]"
              asBlock
            />
          </div>
        )}

        {/* Example Sentence if present */}
        {item.example && (
          <div className="p-3.5 rounded-2xl bg-stationery-surface border border-stationery-border space-y-1.5 text-xs">
            <div className="font-bold text-indigo-primary flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Example Usage</span>
            </div>
            <div className="text-sm font-jp text-ink">
              <FuriganaText expr={item.example} />
            </div>
            {item.exampleEn && (
              <div className="text-ink-muted">{item.exampleEn}</div>
            )}
            {item.exampleAr && (
              <div className="text-[#14532D] font-arabic" dir="rtl">
                {item.exampleAr}
              </div>
            )}
          </div>
        )}

        {/* 1-Click Mastery Level Override */}
        <div className="pt-2 border-t border-stationery-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink">Set Mastery Degree:</span>
            <span className="text-[11px] text-ink-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> Controls review frequency
            </span>
          </div>

          <MasteryPillSelector
            currentLevel={currentLevel}
            onSelect={(level) => onUpdateMastery(item.id, level)}
            showHints={true}
            className="w-full justify-between"
          />
        </div>
      </div>
    </div>
  );
};
