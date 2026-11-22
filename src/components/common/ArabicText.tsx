import React from 'react';
import { useApp } from '../../context/AppContext';

interface ArabicTextProps {
  text: string;
  className?: string;
  asBlock?: boolean;
}

export const ArabicText: React.FC<ArabicTextProps> = ({
  text,
  className = '',
  asBlock = false,
}) => {
  const { settings } = useApp();

  if (!settings.showArabic || !text) {
    return null;
  }

  const baseClasses = "font-arabic text-right text-jade-dark antialiased leading-relaxed tracking-normal";
  const inlineStyles: React.CSSProperties = {
    direction: 'rtl',
    unicodeBidi: 'isolate',
  };

  if (asBlock) {
    return (
      <div
        dir="rtl"
        lang="ar"
        style={inlineStyles}
        className={`${baseClasses} ${className}`}
      >
        {text}
      </div>
    );
  }

  return (
    <span
      dir="rtl"
      lang="ar"
      style={inlineStyles}
      className={`${baseClasses} ${className}`}
    >
      {text}
    </span>
  );
};
