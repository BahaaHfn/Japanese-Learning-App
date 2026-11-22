import React from 'react';
import { useApp } from '../../context/AppContext';

interface FuriganaTextProps {
  expr: string;
  reading?: string;
  className?: string;
  rubyClassName?: string;
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({
  expr,
  reading,
  className = '',
  rubyClassName = 'text-xs text-ink-muted select-none',
}) => {
  const { settings } = useApp();

  // If furigana toggle is OFF, just render the expression
  if (!settings.furigana) {
    // Only strip ruby bracket syntax following kanji e.g. 漢字[かんじ] -> 漢字
    const cleanExpr = expr.replace(/(\p{Script=Han}+)\[[^\]]+\]/gu, '$1');
    return <span className={className}>{cleanExpr}</span>;
  }

  // If reading is directly provided and differs from expr
  if (reading && reading !== expr) {
    return (
      <ruby className={`font-jp inline-flex flex-col items-center leading-none ${className}`}>
        <rt className={`${rubyClassName} mb-0.5`}>{reading}</rt>
        <span className="leading-tight">{expr}</span>
      </ruby>
    );
  }

  // Support inline brackets notation e.g., "私[わたし]は日本[にほん]に行[い]く"
  if (expr.includes('[') && expr.includes(']')) {
    const parts = expr.split(/(\p{Script=Han}+\[[^\]]+\])/gu);
    return (
      <span className={`font-jp ${className}`}>
        {parts.map((part, idx) => {
          const match = part.match(/^(\p{Script=Han}+)\[([^\]]+)\]$/u);
          if (match) {
            const kanji = match[1];
            const kana = match[2];
            return (
              <ruby key={idx} className="inline-flex flex-col items-center leading-none mx-0.5">
                <rt className={`${rubyClassName} mb-0.5`}>{kana}</rt>
                <span className="leading-tight">{kanji}</span>
              </ruby>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  }

  return <span className={`font-jp ${className}`}>{expr}</span>;
};
