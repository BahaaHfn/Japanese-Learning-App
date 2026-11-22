import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  PlusCircle,
  HelpCircle,
  Languages as LangIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    settings,
    toggleFurigana,
    toggleArabic,
    addStudyMinutes,
    setShortcutsModalOpen,
  } = useApp();

  // Target exam date: Sunday, December 6, 2026
  const examDate = new Date(2026, 11, 6); // Month index 11 = December
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const daysUntilExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate sprint day (out of 14)
  const sprintStart = new Date(2026, 10, 22); // Nov 22, 2026
  const sprintElapsed = Math.floor((today.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const sprintDay = Math.min(14, Math.max(1, sprintElapsed));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stationery-border px-4 lg:px-8 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: App Title and Sprint Day */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-primary flex items-center justify-center text-white font-bold font-jp shadow-sm">
            N3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-indigo-primary text-base sm:text-lg tracking-tight">
                JLPT N3 Sprint
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-vermilion-wash text-vermilion border border-vermilion/30">
                14-Day Sprint
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>Exam: <strong className="text-ink">Sun, Dec 6, 2026</strong></span>
              <span className="text-stationery-border">•</span>
              <span className="font-semibold text-vermilion">
                {daysUntilExam} days remaining (Day {sprintDay}/14)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Study Log, Quick Toggles & Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick study logger */}
          <button
            onClick={() => addStudyMinutes(15)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stationery-subtle text-ink hover:bg-stationery-border/70 border border-stationery-border transition"
            title="Log 15 minutes of off-app study time"
          >
            <PlusCircle className="w-3.5 h-3.5 text-jade" />
            <span>+15m Logged</span>
            <span className="text-ink-muted text-[11px]">
              ({settings.studyMinutesLogged}m/{settings.dailyTargetMinutes}m)
            </span>
          </button>

          {/* Furigana Toggle */}
          <button
            onClick={toggleFurigana}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              settings.furigana
                ? 'bg-indigo-wash border-indigo-primary/30 text-indigo-primary font-semibold'
                : 'bg-white border-stationery-border text-ink-muted hover:text-ink'
            }`}
            title="Toggle Furigana annotations (F)"
          >
            <span className="font-jp text-[13px] font-bold">振</span>
            <span className="hidden sm:inline">Furigana [F]</span>
          </button>

          {/* Arabic Toggle */}
          <button
            onClick={toggleArabic}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              settings.showArabic
                ? 'bg-jade-wash border-jade/30 text-jade-dark font-semibold'
                : 'bg-white border-stationery-border text-ink-muted hover:text-ink'
            }`}
            title="Toggle Arabic translations (A)"
          >
            <LangIcon className="w-3.5 h-3.5" />
            <span className="font-arabic font-bold text-[13px]">العربية [A]</span>
          </button>

          {/* Shortcuts Modal Button */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-stationery-subtle border border-transparent hover:border-stationery-border transition"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
