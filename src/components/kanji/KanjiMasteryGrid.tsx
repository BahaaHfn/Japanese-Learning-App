import React, { useState, useMemo } from 'react';
import { StudyItem, MasteryDegree, ThematicCategory } from '../../types';
import { THEMATIC_CATEGORIES } from '../../lib/categorizer';
import { KanjiDetailModal } from './KanjiDetailModal';
import { Search, Filter, Sparkles, CheckCircle2 } from 'lucide-react';

interface KanjiMasteryGridProps {
  kanjiItems: StudyItem[];
  onUpdateMastery: (id: string, level: MasteryDegree) => void;
  onDrillUnmastered?: (items: StudyItem[]) => void;
}

type QuickFilter = 'all' | 'unmastered' | 'weak' | 'mastered';

const MASTERY_COLOR_STYLES: Record<
  MasteryDegree,
  {
    border: string;
    bg: string;
    text: string;
    badge: string;
    dot: string;
  }
> = {
  1: {
    border: 'border-rose-300 hover:border-rose-500',
    bg: 'bg-rose-50/70 hover:bg-rose-100/70',
    text: 'text-rose-950',
    badge: 'bg-rose-200 text-rose-900',
    dot: 'bg-rose-500',
  },
  2: {
    border: 'border-amber-300 hover:border-amber-500',
    bg: 'bg-amber-50/70 hover:bg-amber-100/70',
    text: 'text-amber-950',
    badge: 'bg-amber-200 text-amber-900',
    dot: 'bg-amber-500',
  },
  3: {
    border: 'border-indigo-300 hover:border-indigo-500',
    bg: 'bg-indigo-50/60 hover:bg-indigo-100/70',
    text: 'text-indigo-950',
    badge: 'bg-indigo-200 text-indigo-900',
    dot: 'bg-indigo-600',
  },
  4: {
    border: 'border-emerald-300 hover:border-emerald-500',
    bg: 'bg-emerald-50/60 hover:bg-emerald-100/70',
    text: 'text-emerald-950',
    badge: 'bg-emerald-200 text-emerald-900',
    dot: 'bg-emerald-600',
  },
};

export const KanjiMasteryGrid: React.FC<KanjiMasteryGridProps> = ({
  kanjiItems,
  onUpdateMastery,
  onDrillUnmastered,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ThematicCategory | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKanji, setSelectedKanji] = useState<StudyItem | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = kanjiItems.length;
    const weak = kanjiItems.filter((k) => (k.masteryLevel || 2) === 1).length;
    const shaky = kanjiItems.filter((k) => (k.masteryLevel || 2) === 2).length;
    const familiar = kanjiItems.filter((k) => (k.masteryLevel || 2) === 3).length;
    const mastered = kanjiItems.filter((k) => (k.masteryLevel || 2) === 4).length;
    const unmastered = total - mastered;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return { total, weak, shaky, familiar, mastered, unmastered, percent };
  }, [kanjiItems]);

  // Filtered Items
  const filteredKanji = useMemo(() => {
    return kanjiItems.filter((k) => {
      const level = k.masteryLevel || 2;

      // Quick Filter
      if (quickFilter === 'unmastered' && level === 4) return false;
      if (quickFilter === 'weak' && level !== 1) return false;
      if (quickFilter === 'mastered' && level !== 4) return false;

      // Category Filter
      if (selectedCategory !== 'all' && k.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesExpr = k.expr.includes(query);
        const matchesReading = k.reading.toLowerCase().includes(query);
        const matchesMeaning = k.meaningEn.toLowerCase().includes(query);
        const matchesArabic = k.meaningAr.toLowerCase().includes(query);
        if (!matchesExpr && !matchesReading && !matchesMeaning && !matchesArabic) {
          return false;
        }
      }

      return true;
    });
  }, [kanjiItems, quickFilter, selectedCategory, searchQuery]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Header Banner & Stats */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-primary" />
                N3 Kanji Visual Mastery Grid (370 Characters)
              </h2>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Color-coded by Mastery Degree. Click any kanji tile to inspect readings, definitions, and update mastery.
            </p>
          </div>

          {onDrillUnmastered && stats.unmastered > 0 && (
            <button
              onClick={() => onDrillUnmastered(kanjiItems.filter((k) => (k.masteryLevel || 2) < 4))}
              className="px-4 py-2 bg-indigo-primary hover:bg-indigo-light text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Drill Unmastered Only ({stats.unmastered})</span>
            </button>
          )}
        </div>

        {/* 4 Mastery Level Indicators with Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-800">1 Weak (Daily)</div>
              <div className="text-lg font-mono font-bold text-rose-950">{stats.weak}</div>
            </div>
            <span className="w-3 h-3 rounded-full bg-rose-500" />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-800">2 Shaky (1-2d)</div>
              <div className="text-lg font-mono font-bold text-amber-950">{stats.shaky}</div>
            </div>
            <span className="w-3 h-3 rounded-full bg-amber-500" />
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-indigo-800">3 Familiar (3-4d)</div>
              <div className="text-lg font-mono font-bold text-indigo-950">{stats.familiar}</div>
            </div>
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-800">4 Mastered (5-7d)</div>
              <div className="text-lg font-mono font-bold text-emerald-950">{stats.mastered}</div>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Overall Kanji Mastery</span>
            <span className="font-mono font-bold text-ink">
              {stats.mastered} / {stats.total} ({stats.percent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-stationery-subtle rounded-full overflow-hidden border border-stationery-border">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-stationery-border p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                quickFilter === 'all'
                  ? 'bg-indigo-primary text-white border-indigo-primary shadow-xs'
                  : 'bg-stationery-surface text-ink-muted hover:text-ink border-stationery-border'
              }`}
            >
              All ({kanjiItems.length})
            </button>

            <button
              onClick={() => setQuickFilter('unmastered')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                quickFilter === 'unmastered'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-stationery-surface text-amber-900 border-amber-200 hover:bg-amber-50'
              }`}
            >
              Unmastered ({stats.unmastered})
            </button>

            <button
              onClick={() => setQuickFilter('weak')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                quickFilter === 'weak'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-stationery-surface text-rose-800 border-rose-200 hover:bg-rose-50'
              }`}
            >
              Weak Only ({stats.weak})
            </button>

            <button
              onClick={() => setQuickFilter('mastered')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                quickFilter === 'mastered'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-stationery-surface text-emerald-800 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Mastered ({stats.mastered})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kanji, reading, meaning..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-stationery-border bg-stationery-surface text-xs focus:outline-none focus:ring-1 focus:ring-indigo-primary w-full sm:w-64"
            />
          </div>
        </div>

        {/* Thematic Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-stationery-border/60">
          <span className="text-[11px] text-ink-muted font-bold mr-1 flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3 h-3" /> Theme:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-indigo-wash text-indigo-primary font-bold'
                : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
            }`}
          >
            All Themes
          </button>
          {THEMATIC_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-wash text-indigo-primary font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-stationery-surface'
              }`}
            >
              {cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* 3. The Visual Kanji Tile Grid */}
      <div className="bg-white rounded-3xl border border-stationery-border p-5 sm:p-6 shadow-xs">
        <div className="text-xs text-ink-muted mb-3 flex items-center justify-between">
          <span>Showing {filteredKanji.length} of {kanjiItems.length} Kanji</span>
          <span className="text-[11px]">Click any kanji to view details &amp; set mastery</span>
        </div>

        {filteredKanji.length === 0 ? (
          <div className="text-center py-12 text-ink-muted text-sm">
            No kanji match the current filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {filteredKanji.map((kanji) => {
              const level = kanji.masteryLevel || 2;
              const style = MASTERY_COLOR_STYLES[level];

              return (
                <button
                  key={kanji.id}
                  onClick={() => setSelectedKanji(kanji)}
                  className={`p-2 rounded-2xl border-2 min-h-[56px] transition-all flex flex-col items-center justify-center relative group text-center hover:shadow-md hover:scale-105 active:scale-95 ${style.border} ${style.bg}`}
                  title={`${kanji.expr}: ${kanji.reading}\n${kanji.meaningEn}`}
                >
                  <span className={`text-2xl font-bold font-jp ${style.text}`}>
                    {kanji.expr}
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono truncate max-w-full mt-0.5 opacity-80">
                    {kanji.reading.split(/[/・、\s]+/)[0]}
                  </span>

                  {/* Top-right small mastery degree badge */}
                  <span
                    className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold font-mono flex items-center justify-center text-white shadow-2xs ${style.dot}`}
                  >
                    {level}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Popover Modal */}
      {selectedKanji && (
        <KanjiDetailModal
          item={selectedKanji}
          onClose={() => setSelectedKanji(null)}
          onUpdateMastery={(id, level) => {
            onUpdateMastery(id, level);
            setSelectedKanji((prev) => (prev ? { ...prev, masteryLevel: level } : null));
          }}
        />
      )}
    </div>
  );
};
