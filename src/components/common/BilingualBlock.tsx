import React from 'react';
import { useApp } from '../../context/AppContext';
import { FuriganaText } from './FuriganaText';
import { ArabicText } from './ArabicText';

interface BilingualBlockProps {
  expr?: string;
  reading?: string;
  meaningEn?: string;
  meaningAr?: string;
  example?: string;
  exampleEn?: string;
  exampleAr?: string;
  variant?: 'hero' | 'compact' | 'breakdown';
  className?: string;
}

export const BilingualBlock: React.FC<BilingualBlockProps> = ({
  expr,
  reading,
  meaningEn,
  meaningAr,
  example,
  exampleEn,
  exampleAr,
  variant = 'hero',
  className = '',
}) => {
  const { settings } = useApp();

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        {expr && (
          <div className="text-lg font-bold font-jp text-ink">
            <FuriganaText expr={expr} reading={reading} />
          </div>
        )}
        {meaningEn && (
          <div className="text-sm text-ink-muted">
            {meaningEn}
          </div>
        )}
        {settings.showArabic && meaningAr && (
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-3.5 py-2 text-[#14532D] text-xs font-semibold">
            <ArabicText text={meaningAr} asBlock />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'breakdown') {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-stationery-surface border border-stationery-border space-y-3 ${className}`}>
        <div className="space-y-1">
          {expr && (
            <div className="text-base sm:text-lg font-bold font-jp text-ink flex flex-wrap items-baseline gap-2">
              <FuriganaText expr={expr} reading={reading} />
              {meaningEn && (
                <span className="text-xs sm:text-sm font-normal text-ink-muted">
                  — {meaningEn}
                </span>
              )}
            </div>
          )}
        </div>

        {settings.showArabic && meaningAr && (
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-3.5 py-2 text-[#14532D]">
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75 mb-0.5">
              المعنى باللغة العربية
            </span>
            <ArabicText text={meaningAr} className="text-sm font-semibold" asBlock />
          </div>
        )}

        {example && (
          <div className="pt-2 border-t border-stationery-border/80 text-xs text-ink space-y-1">
            <div className="font-jp">
              <span className="font-bold text-indigo-primary">例文: </span>
              <FuriganaText expr={example} />
            </div>
            {exampleEn && <div className="text-ink-muted text-[11px]">{exampleEn}</div>}
            {settings.showArabic && exampleAr && (
              <div className="pt-0.5">
                <ArabicText text={exampleAr} className="text-[11px] text-jade-dark" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Hero variant (used on Flashcards and detail views)
  return (
    <div className={`space-y-4 text-center ${className}`}>
      {/* 1. Japanese Hero */}
      {expr && (
        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-jp text-[#1C1917] tracking-wide py-2">
          <FuriganaText expr={expr} reading={reading} />
        </div>
      )}

      {/* 2. English Secondary */}
      {meaningEn && (
        <div className="pt-2 border-t border-stationery-border/70 max-w-lg mx-auto">
          <div className="text-base sm:text-lg font-medium text-[#475569]">
            {meaningEn}
          </div>
        </div>
      )}

      {/* 3. Arabic Isolated Clarity Block */}
      {settings.showArabic && meaningAr && (
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-4 py-2.5 text-[#14532D] max-w-md mx-auto shadow-xs">
          <ArabicText
            text={meaningAr}
            className="text-base sm:text-lg font-bold"
            asBlock
          />
        </div>
      )}

      {/* 4. Example Sentence */}
      {example && (
        <div className="mt-4 pt-4 border-t border-stationery-border text-left max-w-lg mx-auto bg-stationery-surface p-4 rounded-xl space-y-1.5 text-xs text-ink">
          <div className="font-jp text-sm">
            <span className="font-bold text-indigo-primary">例文: </span>
            <FuriganaText expr={example} />
          </div>
          {exampleEn && <div className="text-ink-muted text-xs">{exampleEn}</div>}
          {settings.showArabic && exampleAr && (
            <div className="pt-1">
              <ArabicText text={exampleAr} className="text-xs font-semibold text-jade-dark" asBlock />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
