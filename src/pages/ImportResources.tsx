import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArabicText } from '../components/common/ArabicText';
import {
  RESOURCE_PRESETS,
  SAMPLE_TSV_TEMPLATE,
  ResourcePreset,
} from '../data/resourcePresets';
import { StudyItem, SubskillType } from '../types';
import {
  DownloadCloud,
  FileSpreadsheet,
  Layers,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Search,
  Plus,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

export const ImportResources: React.FC = () => {
  const { vocabItems, importVocabItems, replaceVocabDeck, toggleSuspendVocab, addToast } = useApp();

  // TSV / Pipe text area state
  const [inputText, setInputText] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('Custom Import');

  // Search & Filter in Table
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subskillFilter, setSubskillFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Deck keys set for fast membership check
  const deckKeys = useMemo(
    () => new Set(vocabItems.map((i) => `${i.expr}::${i.subskill}`)),
    [vocabItems]
  );

  // Parse rows live from text area
  const parsedItems = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText.trim().split(/\r?\n/);
    const items: StudyItem[] = [];

    lines.forEach((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Skip header if line starts with Kanji or #
      if (
        cleanLine.toLowerCase().startsWith('kanji') ||
        cleanLine.toLowerCase().startsWith('#') ||
        cleanLine.toLowerCase().startsWith('expression')
      ) {
        return;
      }

      // Check delimiter: tab (\t), pipe (|), multi-space (\s{2,}), or comma (,)
      let cols: string[] = [];
      if (cleanLine.includes('\t')) {
        cols = cleanLine.split('\t');
      } else if (cleanLine.includes('|')) {
        cols = cleanLine.split('|');
      } else if (/\s{2,}/.test(cleanLine)) {
        cols = cleanLine.split(/\s{2,}/);
      } else if (cleanLine.includes(',')) {
        cols = cleanLine.split(',');
      } else {
        cols = cleanLine.split(/\s+/);
      }

      cols = cols.map((c) => c.trim()).filter(Boolean);

      if (cols.length >= 2) {
        const expr = cols[0];
        const reading = cols[1] || expr;
        const meaningEn = cols[2] || '';
        let meaningAr = '';
        let example = '';
        let source = sourceName || 'Custom Import';

        if (cols.length === 4) {
          if (/[\u0600-\u06FF]/.test(cols[3])) {
            meaningAr = cols[3];
          } else {
            example = cols[3];
          }
        } else if (cols.length === 5) {
          if (/[\u0600-\u06FF]/.test(cols[3])) {
            meaningAr = cols[3];
            example = cols[4];
          } else {
            example = cols[3];
            source = cols[4] || sourceName || 'Custom Import';
          }
        } else if (cols.length >= 6) {
          if (/[\u0600-\u06FF]/.test(cols[3])) {
            meaningAr = cols[3];
            example = cols[4];
            source = cols[5] || sourceName || 'Custom Import';
          } else {
            example = cols[3];
            source = cols[4] || sourceName || 'Custom Import';
          }
        }

        // Guess subskill
        let subskill: SubskillType = 'Vocab';
        if (expr.length === 1 && /[\u4e00-\u9faf]/.test(expr)) {
          subskill = 'Kanji';
        } else if (expr.includes('べき') || expr.includes('わけ') || expr.includes('として')) {
          subskill = 'Grammar';
        }

        items.push({
          id: `import-${Date.now()}-${idx}`,
          expr,
          reading,
          meaningEn,
          meaningAr,
          example,
          source,
          subskill,
          lapses: 0,
          intervalDays: 0,
          due: new Date().toISOString(),
          suspended: false,
          status: 'New',
        });
      }
    });

    return items;
  }, [inputText, sourceName]);

  const handleExecuteImport = () => {
    if (parsedItems.length === 0) return;
    importVocabItems(parsedItems);
    setInputText('');
  };

  const handleImportPreset = (preset: ResourcePreset) => {
    importVocabItems(preset.items);
  };

  const handleLoadSampleTemplate = () => {
    setInputText(SAMPLE_TSV_TEMPLATE);
    setSourceName('Kanzen Master N3');
    addToast('Loaded sample TSV template into the ingestion box!', 'info');
  };

  // Filtered Table Items
  const filteredTableItems = useMemo(() => {
    return vocabItems.filter((item) => {
      const matchesSearch =
        item.expr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaningEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaningAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      const matchesSubskill =
        subskillFilter === 'all' ? true : item.subskill === subskillFilter;

      const matchesSource =
        sourceFilter === 'all' ? true : item.source.toLowerCase().includes(sourceFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesSubskill && matchesSource;
    });
  }, [vocabItems, searchTerm, statusFilter, subskillFilter, sourceFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTableItems.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedItems = filteredTableItems.slice(startIndex, startIndex + pageSize);

  // Counts by subskill
  const vocabCount = vocabItems.filter((i) => i.subskill === 'Vocab').length;
  const kanjiCount = vocabItems.filter((i) => i.subskill === 'Kanji').length;
  const grammarCount = vocabItems.filter((i) => i.subskill === 'Grammar').length;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-wash text-indigo-primary">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-primary">
                Resource Ingestion &amp; Master Deck Library
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted">
                Loaded with all official resource files: <strong>1,804 Vocab</strong>, <strong>370 Kanji</strong>, and <strong>56 Grammar Patterns</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-stationery-surface px-3 py-1.5 rounded-xl border border-stationery-border text-xs font-mono font-bold text-indigo-primary flex items-center gap-1.5 shadow-sm">
              <Database className="w-4 h-4 text-jade" />
              <span>{vocabItems.length.toLocaleString()} Active Deck Cards</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. One-Click Full Resource Ingestion Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-indigo-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-jade" />
            Official Resource Packages (Complete Coverage from Workspace Files)
          </h2>
          <span className="text-xs text-ink-muted">Live Deck Status Tracking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESOURCE_PRESETS.map((preset) => {
            const isFullBundle = preset.id === 'full-bundle-pack';
            const inDeckCount = preset.items.filter((p) =>
              deckKeys.has(`${p.expr}::${p.subskill}`)
            ).length;
            const isFullyLoaded = inDeckCount >= preset.count;
            const remainingCount = preset.count - inDeckCount;

            return (
              <div
                key={preset.id}
                className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isFullyLoaded
                    ? 'border-jade/50 bg-jade-wash/10 shadow-sm'
                    : isFullBundle
                    ? 'border-2 border-indigo-primary bg-indigo-wash/10 shadow-md'
                    : 'border-stationery-border hover:border-indigo-primary/40 hover:shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isFullyLoaded
                          ? 'bg-jade-wash text-jade-dark border-jade/40'
                          : isFullBundle
                          ? 'bg-indigo-primary text-white border-indigo-primary'
                          : 'bg-stationery-surface text-ink-muted border-stationery-border'
                      }`}
                    >
                      {isFullyLoaded
                        ? `✓ All ${preset.count.toLocaleString()} Loaded`
                        : `${inDeckCount} / ${preset.count.toLocaleString()} Loaded`}
                    </span>
                    <BookOpen
                      className={`w-4 h-4 ${isFullyLoaded ? 'text-jade' : isFullBundle ? 'text-indigo-primary' : 'text-ink-muted'}`}
                    />
                  </div>
                  <h3 className="font-bold text-sm text-ink">{preset.name}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                    {preset.description}
                  </p>
                </div>

                {isFullyLoaded ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-jade-wash text-jade-dark border border-jade/30 flex items-center justify-center gap-1.5 cursor-default shadow-sm"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>✓ Loaded in Deck</span>
                    </button>
                    <button
                      onClick={() => replaceVocabDeck(preset.items)}
                      className="p-2 rounded-xl border border-stationery-border bg-stationery-surface hover:bg-stationery-subtle text-ink-muted hover:text-ink transition"
                      title="Reset and reload this pack fresh as your active deck"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleImportPreset(preset)}
                      className={`w-full py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm ${
                        isFullBundle
                          ? 'bg-indigo-primary hover:bg-indigo-light text-white'
                          : 'bg-indigo-wash hover:bg-indigo-primary hover:text-white text-indigo-primary border border-indigo-primary/20'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ingest {remainingCount.toLocaleString()} Cards</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quick-Paste Bulk Adder & CSV/TSV Importer */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stationery-border pb-4">
          <div>
            <h2 className="text-base font-bold text-indigo-primary flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-primary" />
              Quick-Paste Bulk Importer (TSV / CSV / Pipe / Spaces)
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Paste rows from Excel, Anki, or notes: <code className="bg-stationery-surface px-1.5 py-0.5 rounded text-[11px] font-mono">Kanji | Reading | English | Arabic (optional) | Example | Source</code>
            </p>
          </div>

          <button
            onClick={handleLoadSampleTemplate}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stationery-surface hover:bg-stationery-border/50 text-indigo-primary border border-stationery-border transition"
          >
            Load Sample Template
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste rows here (tab, pipe, comma, or multi-space separated), e.g.:&#10;相手   あいて   partner, companion   شريك، خصم   テニスの相手を探しています。   Kanzen Master"
              className="w-full p-4 rounded-2xl border border-stationery-border bg-stationery-surface font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-indigo-primary/30 leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted">Default Source Tag:</span>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stationery-border bg-stationery-surface text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-indigo-primary"
              />
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md transition ${
                  parsedItems.length > 0
                    ? 'bg-jade-wash text-jade-dark border border-jade/30'
                    : 'bg-stationery-surface text-ink-muted border border-stationery-border'
                }`}
              >
                Parsed: {parsedItems.length} {parsedItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={parsedItems.length === 0}
              className="px-6 py-2.5 bg-indigo-primary text-white text-xs font-bold rounded-xl hover:bg-indigo-light disabled:opacity-40 transition shadow-sm flex items-center justify-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Import {parsedItems.length} Items into Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Deck Coverage & Suspension Manager */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stationery-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-indigo-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-primary" />
                Deck Coverage &amp; Suspension Manager
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-wash text-indigo-primary border border-indigo-primary/30">
                {vocabItems.length.toLocaleString()} Active Cards
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-muted mt-1">
              <span>Vocab: <strong className="text-ink">{vocabCount.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Kanji: <strong className="text-ink">{kanjiCount.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Grammar: <strong className="text-ink">{grammarCount.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search deck..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stationery-border bg-stationery-surface text-xs focus:outline-none focus:ring-1 focus:ring-indigo-primary w-40 sm:w-52"
              />
            </div>

            <select
              value={subskillFilter}
              onChange={(e) => {
                setSubskillFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-stationery-border bg-stationery-surface text-xs text-ink focus:outline-none font-medium"
            >
              <option value="all">All Subskills</option>
              <option value="Vocab">Vocabulary Only ({vocabCount.toLocaleString()})</option>
              <option value="Kanji">Kanji Only ({kanjiCount.toLocaleString()})</option>
              <option value="Grammar">Grammar Patterns Only ({grammarCount.toLocaleString()})</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-stationery-border bg-stationery-surface text-xs text-ink focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Learning">Learning</option>
              <option value="Review">Review</option>
              <option value="Mastered">Mastered</option>
              <option value="Leech">Leech</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-stationery-border bg-stationery-surface text-xs text-ink focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="JLPT-N3-Vocabulary">JLPT-N3-Vocabulary-.md</option>
              <option value="JLPT-N3-Kanji">JLPT-N3-Kanji-List-PDF.md</option>
              <option value="The-JLPT-N3-Grammar">The-JLPT-N3-Grammar-List.md</option>
            </select>
          </div>
        </div>

        {/* Table Summary & Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-muted">
          <div>
            Showing <strong className="text-ink">{filteredTableItems.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredTableItems.length)}</strong> of <strong className="text-ink">{filteredTableItems.length.toLocaleString()}</strong> filtered cards
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Show per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-stationery-border bg-stationery-surface text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="p-1 rounded border border-stationery-border hover:bg-stationery-surface disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono px-2">
                {validCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="p-1 rounded border border-stationery-border hover:bg-stationery-surface disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards View (< md) */}
        <div className="md:hidden space-y-2.5">
          {paginatedItems.length === 0 ? (
            <div className="py-8 text-center text-ink-muted text-xs">
              No items match current filters. Click a preset above to load cards!
            </div>
          ) : (
            paginatedItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border bg-white space-y-2 transition shadow-2xs ${
                  item.suspended ? 'opacity-50 bg-gray-50 border-gray-200' : 'border-stationery-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-bold font-jp text-indigo-primary">
                      {item.expr}
                    </div>
                    <div className="text-xs font-jp text-ink-muted">
                      {item.reading}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Leech'
                          ? 'bg-vermilion-wash text-vermilion border border-vermilion/30'
                          : item.status === 'Mastered'
                          ? 'bg-jade-wash text-jade-dark border border-jade/30'
                          : item.status === 'Review'
                          ? 'bg-indigo-wash text-indigo-primary border border-indigo-primary/30'
                          : 'bg-stationery-surface text-ink-muted border border-stationery-border'
                      }`}
                    >
                      {item.status}
                    </span>

                    <button
                      onClick={() => toggleSuspendVocab(item.id)}
                      className={`p-2 rounded-xl border transition min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        item.suspended
                          ? 'bg-jade-wash text-jade-dark border-jade/30'
                          : 'bg-stationery-surface text-ink-muted border-stationery-border hover:text-vermilion'
                      }`}
                      title={item.suspended ? 'Unsuspend Card' : 'Suspend Card'}
                    >
                      {item.suspended ? (
                        <PlayCircle className="w-4 h-4 text-jade" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-ink font-medium">
                  {item.meaningEn}
                </div>

                {item.meaningAr && (
                  <div
                    className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[#14532D] text-xs font-semibold"
                    dir="rtl"
                    lang="ar"
                  >
                    <ArabicText text={item.meaningAr} className="text-xs" asBlock />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-stationery-border/50 text-[10px] text-ink-muted">
                  <span className="font-mono bg-stationery-surface px-1.5 py-0.5 rounded border border-stationery-border">
                    {item.subskill}
                  </span>
                  <span className="truncate max-w-[180px]">
                    {item.source}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (md:block) */}
        <div className="hidden md:block overflow-x-auto border border-stationery-border rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stationery-surface text-ink-muted uppercase tracking-wider font-semibold border-b border-stationery-border">
              <tr>
                <th className="py-3 px-4">Expression</th>
                <th className="py-3 px-4">Reading / Pronunciation</th>
                <th className="py-3 px-4">English Meaning</th>
                <th className="py-3 px-4">Arabic Meaning (العربية)</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stationery-border font-medium">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted">
                    No items match the current search or filters. Click a preset above to load cards!
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-stationery-subtle transition ${
                      item.suspended ? 'opacity-40 bg-gray-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold font-jp text-base text-indigo-primary whitespace-nowrap">
                      {item.expr}
                    </td>
                    <td className="py-3 px-4 font-jp text-ink max-w-xs truncate">
                      {item.reading}
                    </td>
                    <td className="py-3 px-4 text-ink max-w-xs truncate" title={item.meaningEn}>
                      {item.meaningEn}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={item.meaningAr}>
                      <ArabicText text={item.meaningAr} className="text-xs font-semibold" />
                    </td>
                    <td className="py-3 px-4 text-ink-muted truncate max-w-[140px]" title={item.source}>
                      {item.source}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Leech'
                            ? 'bg-vermilion-wash text-vermilion border border-vermilion/30'
                            : item.status === 'Mastered'
                            ? 'bg-jade-wash text-jade-dark border border-jade/30'
                            : item.status === 'Review'
                            ? 'bg-indigo-wash text-indigo-primary border border-indigo-primary/30'
                            : 'bg-stationery-surface text-ink-muted border border-stationery-border'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSuspendVocab(item.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          item.suspended
                            ? 'bg-jade-wash text-jade-dark border-jade/30 hover:bg-jade-wash/80'
                            : 'bg-stationery-surface text-ink-muted border-stationery-border hover:text-vermilion hover:border-vermilion/30'
                        }`}
                        title={item.suspended ? 'Unsuspend Card' : 'Suspend Card (Skip in reviews)'}
                      >
                        {item.suspended ? (
                          <PlayCircle className="w-4 h-4" />
                        ) : (
                          <PauseCircle className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
