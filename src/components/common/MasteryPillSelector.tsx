import React from 'react';
import { MasteryDegree } from '../../types';

interface MasteryPillSelectorProps {
  currentLevel?: MasteryDegree;
  onSelect: (level: MasteryDegree) => void;
  size?: 'sm' | 'md';
  showHints?: boolean;
  className?: string;
}

const MASTERY_CONFIG: Record<
  MasteryDegree,
  {
    label: string;
    sublabel: string;
    activeClass: string;
    inactiveClass: string;
    dotColor: string;
  }
> = {
  1: {
    label: '1 Weak',
    sublabel: 'Daily / 10m',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold',
    inactiveClass: 'bg-rose-50/60 text-rose-800 border-rose-200/80 hover:bg-rose-100',
    dotColor: 'bg-rose-500',
  },
  2: {
    label: '2 Shaky',
    sublabel: 'Every 1–2d',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-xs font-bold',
    inactiveClass: 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:bg-amber-100',
    dotColor: 'bg-amber-500',
  },
  3: {
    label: '3 Familiar',
    sublabel: 'Every 3–4d',
    activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold',
    inactiveClass: 'bg-indigo-50/60 text-indigo-900 border-indigo-200/80 hover:bg-indigo-100',
    dotColor: 'bg-indigo-600',
  },
  4: {
    label: '4 Mastered',
    sublabel: 'Parked 5–7d',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold',
    inactiveClass: 'bg-emerald-50/60 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100',
    dotColor: 'bg-emerald-600',
  },
};

export const MasteryPillSelector: React.FC<MasteryPillSelectorProps> = ({
  currentLevel = 2,
  onSelect,
  size = 'md',
  showHints = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 p-1 rounded-2xl bg-stationery-surface border border-stationery-border ${className}`}>
      {([1, 2, 3, 4] as MasteryDegree[]).map((level) => {
        const config = MASTERY_CONFIG[level];
        const isActive = currentLevel === level;

        return (
          <button
            key={level}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(level);
            }}
            className={`transition-all rounded-xl border flex flex-col items-center justify-center ${
              size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            } ${isActive ? config.activeClass : config.inactiveClass}`}
            title={`Set to Mastery Degree ${level} (${config.sublabel})`}
          >
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : config.dotColor}`} />
              <span className="font-semibold">{config.label}</span>
            </div>
            {showHints && (
              <span className={`text-[9px] mt-0.5 ${isActive ? 'text-white/80' : 'text-ink-muted'}`}>
                {config.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
