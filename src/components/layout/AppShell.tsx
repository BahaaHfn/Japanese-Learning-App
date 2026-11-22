import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { PillarType } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavPillar {
  id: PillarType;
  label: string;
  badge?: number | string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    activePillar,
    setActivePillar,
    settings,
    toggleFurigana,
    toggleArabic,
    addStudyMinutes,
    setShortcutsModalOpen,
    vocabItems,
    confusablePairs,
    focusMode,
    setFocusMode,
  } = useApp();

  // Due counts for badges
  const now = new Date();
  const dueVocabCount = vocabItems.filter(
    (item) => !item.suspended && new Date(item.due).getTime() <= now.getTime()
  ).length;

  const weakConfusablesCount = confusablePairs.filter((p) => p.weak).length;
  const totalStudyDue = dueVocabCount + weakConfusablesCount;

  // Countdown calculations
  const examDate = new Date(2026, 11, 6);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const daysUntilExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const sprintStart = new Date(2026, 10, 22);
  const sprintElapsed = Math.floor((today.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const sprintDay = Math.min(14, Math.max(1, sprintElapsed));

  const pillars: NavPillar[] = [
    {
      id: 'today',
      label: 'Today',
      icon: Sparkles,
    },
    {
      id: 'study',
      label: 'Study',
      icon: BookOpen,
      badge: totalStudyDue > 0 ? totalStudyDue : undefined,
    },
    {
      id: 'mock',
      label: 'Mock',
      icon: GraduationCap,
    },
    {
      id: 'library',
      label: 'Library',
      icon: Layers,
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-stationery-surface text-ink selection:bg-indigo-wash selection:text-indigo-primary">
      {/* 1. Global Slim Mobile-First Top Header (<= 56px, zero multi-row wrap) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stationery-border px-3 sm:px-4 lg:px-8 h-14 flex items-center">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full max-w-7xl mx-auto">
          {/* Left: Brand + Countdown Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                setFocusMode(false);
                setActivePillar('today');
              }}
              className="flex items-center gap-2 text-left group min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-primary flex items-center justify-center text-white font-bold font-jp shadow-sm group-hover:bg-indigo-light transition flex-shrink-0">
                N3
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-indigo-primary text-xs sm:text-sm tracking-tight truncate">
                    N3 Sprint
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.2 rounded-full text-[10px] font-bold bg-vermilion-wash text-vermilion border border-vermilion/30 flex-shrink-0 whitespace-nowrap">
                    Day {sprintDay}/14
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-ink-muted truncate hidden sm:block">
                  Exam: <strong className="text-ink">Dec 6</strong> •{' '}
                  <span className="font-semibold text-vermilion">{daysUntilExam}d left</span>
                </div>
              </div>
            </button>
          </div>

          {/* Right: Slim Toggle Pills (ふ + ع) & Desktop Extras */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick study logger (Desktop/Tablet) */}
            <button
              onClick={() => addStudyMinutes(15)}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stationery-subtle text-ink hover:bg-stationery-border/70 border border-stationery-border transition"
              title="Log 15 minutes of study"
            >
              <PlusCircle className="w-3.5 h-3.5 text-jade" />
              <span>+15m</span>
            </button>

            {/* Furigana Quick-Toggle (ふ on mobile, 振 Furigana on sm+) */}
            <button
              onClick={toggleFurigana}
              className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium border transition min-h-[36px] ${
                settings.furigana
                  ? 'bg-indigo-wash border-indigo-primary/30 text-indigo-primary font-bold shadow-xs'
                  : 'bg-white border-stationery-border text-ink-muted hover:text-ink'
              }`}
              title="Toggle Furigana [F]"
            >
              <span className="font-jp text-xs font-bold">ふ</span>
              <span className="hidden sm:inline">Furigana</span>
            </button>

            {/* Arabic Quick-Toggle (ع on mobile, العربية on sm+) */}
            <button
              onClick={toggleArabic}
              className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium border transition min-h-[36px] ${
                settings.showArabic
                  ? 'bg-jade-wash border-jade/30 text-jade-dark font-bold shadow-xs'
                  : 'bg-white border-stationery-border text-ink-muted hover:text-ink'
              }`}
              title="Toggle Arabic Translations [A]"
            >
              <span className="font-arabic font-bold text-xs">ع</span>
              <span className="hidden sm:inline font-arabic">العربية</span>
            </button>

            {/* Shortcuts Guide Button (Tablet/Desktop) */}
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="hidden sm:inline-flex p-1.5 text-ink-muted hover:text-ink hover:bg-stationery-subtle rounded-lg border border-transparent hover:border-stationery-border transition"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className={`flex-1 flex flex-col lg:flex-row ${focusMode ? 'pb-0' : 'pb-[calc(60px+env(safe-area-inset-bottom))] lg:pb-0'}`}>
        {/* Desktop Left Rail (Slim 4-Pillar Nav) - Hidden below lg: and in Focus Mode */}
        {!focusMode ? (
          <aside className="hidden lg:flex w-56 bg-white border-r border-stationery-border flex-col justify-between p-3 flex-shrink-0 select-none">
            <nav className="space-y-1.5">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                const isActive = activePillar === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setActivePillar(pillar.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-primary text-white shadow-sm font-bold'
                        : 'text-ink hover:bg-stationery-surface hover:text-indigo-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-indigo-primary'
                        }`}
                      />
                      <span className="inline text-sm">{pillar.label}</span>
                    </div>

                    {pillar.badge !== undefined && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-vermilion-wash text-vermilion border border-vermilion/30'
                        }`}
                      >
                        {pillar.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Rail Info */}
            <div className="p-3 rounded-xl bg-stationery-surface border border-stationery-border text-[11px] text-ink-muted space-y-1">
              <div className="font-semibold text-indigo-primary">Exam Floor Guard</div>
              <div>19/60 min per section</div>
              <div className="font-mono text-[10px] text-ink-faint">Dec 6, 2026 Target</div>
            </div>
          </aside>
        ) : null}

        {/* Dynamic Center Canvas */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100dvh-56px)]">
          {children}
        </main>
      </div>

      {/* 3. Mobile Bottom Tab Bar (4 Pillars) - Rendered below lg:, Hidden in Focus Mode */}
      {!focusMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-stationery-border px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] min-h-[60px] flex items-center justify-around shadow-lg">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = activePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-medium transition ${
                  isActive
                    ? 'text-indigo-primary font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-primary' : 'text-ink-muted'}`} />
                  {pillar.badge !== undefined && (
                    <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-vermilion text-white text-[9px] font-bold flex items-center justify-center">
                      {typeof pillar.badge === 'number' && pillar.badge > 99 ? '99+' : pillar.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 tracking-tight">{pillar.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
