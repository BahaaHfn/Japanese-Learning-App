import React, { useState } from 'react';
import { ArabicText } from './ArabicText';
import { FuriganaText } from './FuriganaText';
import { BookmarkPlus, Check, X } from 'lucide-react';

export interface ClickableWord {
  expr: string;
  reading: string;
  meaningEn: string;
  meaningAr?: string;
}

interface InteractiveSentenceProps {
  sentence: string;
  clickableWords?: ClickableWord[];
  onAddToWeakQueue?: (word: ClickableWord) => void;
  className?: string;
}

export const InteractiveSentence: React.FC<InteractiveSentenceProps> = ({
  sentence,
  clickableWords = [],
  onAddToWeakQueue,
  className = '',
}) => {
  const [activeWord, setActiveWord] = useState<ClickableWord | null>(null);
  const [addedExprs, setAddedExprs] = useState<Set<string>>(new Set());

  const handleAdd = (word: ClickableWord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToWeakQueue) {
      onAddToWeakQueue(word);
      setAddedExprs((prev) => new Set([...prev, word.expr]));
    }
  };

  // If no specific clickable words are defined, highlight bracketed parts 【...】
  const wordsToFind = clickableWords.length > 0 ? clickableWords : [];

  if (wordsToFind.length === 0) {
    return (
      <div className={`font-jp ${className}`}>
        <FuriganaText expr={sentence} />
      </div>
    );
  }

  // Build regex from wordsToFind expressions
  const pattern = new RegExp(
    `(${wordsToFind.map((w) => w.expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );

  const parts = sentence.split(pattern);

  return (
    <div className={`relative font-jp leading-relaxed ${className}`}>
      {parts.map((part, idx) => {
        const matched = wordsToFind.find((w) => w.expr === part);
        if (!matched) {
          return <span key={idx}>{part}</span>;
        }

        const isOpen = activeWord?.expr === matched.expr;

        return (
          <span key={idx} className="relative inline-block mx-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveWord(isOpen ? null : matched);
              }}
              className={`underline decoration-indigo-400 decoration-2 underline-offset-4 hover:bg-indigo-50 px-1 py-0.5 rounded transition font-bold text-indigo-950 ${
                isOpen ? 'bg-indigo-100 ring-2 ring-indigo-400' : ''
              }`}
              title="Tap to lookup word & add to weak queue"
            >
              {matched.expr}
            </button>

            {/* Inline Gloss Popover */}
            {isOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-indigo-200 p-3 text-left animate-fade-in"
              >
                <div className="flex items-start justify-between gap-1 border-b border-stationery-border pb-2 mb-2">
                  <div>
                    <div className="text-base font-bold font-jp text-ink flex items-center gap-1.5">
                      <span>{matched.expr}</span>
                      <span className="text-xs font-normal text-ink-muted">({matched.reading})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveWord(null)}
                    className="text-ink-muted hover:text-ink p-1 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-ink font-medium leading-snug">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">EN</span>
                    {matched.meaningEn}
                  </div>
                  {matched.meaningAr && (
                    <div className="text-ink-muted">
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">AR</span>
                      <ArabicText text={matched.meaningAr} className="text-xs text-ink-secondary" />
                    </div>
                  )}
                </div>

                {onAddToWeakQueue && (
                  <div className="pt-2.5 mt-2 border-t border-stationery-border flex justify-end">
                    <button
                      onClick={(e) => handleAdd(matched, e)}
                      disabled={addedExprs.has(matched.expr)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        addedExprs.has(matched.expr)
                          ? 'bg-jade text-white'
                          : 'bg-indigo-primary text-white hover:bg-indigo-light'
                      }`}
                    >
                      {addedExprs.has(matched.expr) ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Added to Weak Queue</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3 h-3" />
                          <span>Add to Weak Queue</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </span>
        );
      })}
    </div>
  );
};
