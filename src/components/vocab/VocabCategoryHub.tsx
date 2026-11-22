import React from 'react';
import { StudyItem, ThematicCategory } from '../../types';
import { THEMATIC_CATEGORIES, calculateCategoryStats } from '../../lib/categorizer';
import {
  Briefcase,
  Users,
  Heart,
  Home,
  Compass,
  Activity,
  Sun,
  Building,
  Zap,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface VocabCategoryHubProps {
  vocabItems: StudyItem[];
  onSelectCategoryDrill: (category: ThematicCategory, unmasteredOnly: boolean) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Users,
  Heart,
  Home,
  Compass,
  Activity,
  Sun,
  Building,
  Zap,
  Layers,
};

export const VocabCategoryHub: React.FC<VocabCategoryHubProps> = ({
  vocabItems,
  onSelectCategoryDrill,
}) => {
  // Only vocab items (or kanji if requested)
  const allVocab = vocabItems.filter((i) => i.subskill === 'Vocab');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview header */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-ink">
          Thematic Vocabulary Hub (10 JLPT N3 Modules)
        </h2>
        <p className="text-xs text-ink-muted mt-1">
          Study words grouped by semantic themes for faster cognitive retention and targeted unmastered drilling.
        </p>
      </div>

      {/* 10 Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMATIC_CATEGORIES.map((cat) => {
          const stats = calculateCategoryStats(allVocab, cat.id);
          const Icon = ICON_MAP[cat.iconName] || Layers;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-3xl border border-stationery-border p-4 sm:p-6 shadow-xs hover:border-indigo-primary/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${cat.bgColor} ${cat.textColor} border ${cat.borderColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-ink">{cat.nameEn}</h3>
                      <div className="text-xs text-ink-muted font-jp font-semibold">{cat.nameJp}</div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-stationery-surface border border-stationery-border text-ink-muted">
                    {stats.total} Words
                  </span>
                </div>

                {/* Mastery progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>Mastery Progress</span>
                    <span className="font-mono font-bold text-ink">
                      {stats.mastered} / {stats.total} ({stats.progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stationery-subtle rounded-full overflow-hidden border border-stationery-border">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${stats.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Level counts breakdown */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200" title="Weak">
                    1: {stats.weak}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200" title="Shaky">
                    2: {stats.shaky}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200" title="Familiar">
                    3: {stats.familiar}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200" title="Mastered">
                    4: {stats.mastered}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-stationery-border/60">
                {stats.unmastered > 0 ? (
                  <button
                    onClick={() => onSelectCategoryDrill(cat.id, true)}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Drill Unmastered ({stats.unmastered})</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 text-center min-h-[40px] flex items-center justify-center">
                    ✓ All Words Mastered
                  </div>
                )}

                <button
                  onClick={() => onSelectCategoryDrill(cat.id, false)}
                  className="py-2 px-3 bg-stationery-surface hover:bg-stationery-subtle text-ink text-xs font-semibold rounded-xl border border-stationery-border transition flex items-center gap-1 min-h-[40px]"
                  title="Drill all words in this theme"
                >
                  <span>All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
