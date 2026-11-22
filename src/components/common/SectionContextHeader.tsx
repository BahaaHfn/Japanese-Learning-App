import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';

export type ExamSection = 'vocab' | 'grammar' | 'reading' | 'mock';

export interface SectionContextHeaderProps {
  section: ExamSection;
  breadcrumbs: string[]; // e.g. ['Study', 'Grammar', '★ Sentence Reordering']
  currentStep?: number;
  totalSteps?: number;
  onExit?: () => void;
  targetPaceText?: string;
  targetPaceSec?: number;
  extraRight?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

const SECTION_CONFIG: Record<
  ExamSection,
  {
    label: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barColor: string;
  }
> = {
  vocab: {
    label: 'Language Knowledge • Vocabulary (30m Block)',
    shortLabel: 'Vocab (30m)',
    badgeBg: 'bg-[#1E3A5F]/10',
    badgeText: 'text-[#1E3A5F]',
    badgeBorder: 'border-[#1E3A5F]/20',
    barColor: 'bg-[#1E3A5F]',
  },
  grammar: {
    label: 'Language Knowledge • Grammar (70m Block)',
    shortLabel: 'Grammar (70m)',
    badgeBg: 'bg-[#B45309]/10',
    badgeText: 'text-[#B45309]',
    badgeBorder: 'border-[#B45309]/20',
    barColor: 'bg-[#B45309]',
  },
  reading: {
    label: 'Reading Comprehension (70m Block)',
    shortLabel: 'Reading (70m)',
    badgeBg: 'bg-[#1F7A5A]/10',
    badgeText: 'text-[#1F7A5A]',
    badgeBorder: 'border-[#1F7A5A]/20',
    barColor: 'bg-[#1F7A5A]',
  },
  mock: {
    label: 'Exam Simulation • 100m Written Mock',
    shortLabel: 'Mock (100m)',
    badgeBg: 'bg-[#C84B31]/10',
    badgeText: 'text-[#C84B31]',
    badgeBorder: 'border-[#C84B31]/20',
    barColor: 'bg-[#C84B31]',
  },
};

export const SectionContextHeader: React.FC<SectionContextHeaderProps> = ({
  section,
  breadcrumbs,
  currentStep,
  totalSteps,
  onExit,
  targetPaceText,
  targetPaceSec,
  extraRight,
  rightElement,
  className = '',
}) => {
  const config = SECTION_CONFIG[section];
  const hasSteps = currentStep !== undefined && totalSteps !== undefined && totalSteps > 0;
  const progressPercent = hasSteps
    ? Math.min(100, Math.round((currentStep / totalSteps) * 100))
    : 0;

  const displayPace = targetPaceText || (targetPaceSec ? `<${targetPaceSec}s` : undefined);
  const rightSlot = rightElement || extraRight;

  return (
    <div className={`sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stationery-border shadow-xs ${className}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Exit button + Section Badge + Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onExit && (
            <button
              onClick={onExit}
              className="p-1.5 -ml-1 text-ink-muted hover:text-ink hover:bg-stationery-surface rounded-lg transition text-xs font-semibold flex items-center gap-1 flex-shrink-0"
              title="Exit session"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}

          {/* Color-Coded Exam Section Badge */}
          <span
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border whitespace-nowrap flex-shrink-0 ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
          >
            <span className="sm:hidden">{config.shortLabel}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </span>

          {/* Breadcrumb Path */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-muted truncate font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="opacity-40">›</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-ink' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right: Steps / Pacing / Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {displayPace && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-ink-muted bg-stationery-surface px-2 py-0.5 rounded border border-stationery-border">
              <Clock className="w-3 h-3 text-ink-muted" />
              <span>{displayPace}</span>
            </div>
          )}

          {hasSteps && (
            <div className="text-[11px] sm:text-xs font-mono font-bold text-ink">
              <span className="sm:hidden">{currentStep}/{totalSteps}</span>
              <span className="hidden sm:inline">Item {currentStep} of {totalSteps}</span>
              <span className="text-ink-muted ml-1 sm:ml-1.5 font-normal">({progressPercent}%)</span>
            </div>
          )}

          {rightSlot}
        </div>
      </div>

      {/* Live Session Progress Strip */}
      {hasSteps && (
        <div className="w-full h-1 bg-stationery-subtle overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${config.barColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
