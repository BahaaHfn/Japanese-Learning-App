import React from 'react';
import { useApp, TabType } from '../../context/AppContext';
import {
  LayoutDashboard,
  BrainCircuit,
  Languages,
  BookOpen,
  GraduationCap,
  DownloadCloud,
  CalendarCheck,
  Flame,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

interface NavItem {
  id: TabType;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, vocabItems, confusablePairs, settings } = useApp();

  // Due items count
  const now = new Date();
  const dueVocabCount = vocabItems.filter(
    (item) => !item.suspended && new Date(item.due).getTime() <= now.getTime()
  ).length;

  const leechCount = vocabItems.filter(
    (item) => !item.suspended && item.status === 'Leech'
  ).length;

  const weakConfusablesCount = confusablePairs.filter((p) => p.weak).length;

  const navItems: NavItem[] = [
    {
      id: 'Dashboard',
      label: 'Command Center',
      sub: 'Countdown & Readiness',
      icon: LayoutDashboard,
    },
    {
      id: 'VocabSRS',
      label: 'Vocab & Kanji SRS',
      sub: 'FSRS Cram & Quiz',
      icon: BrainCircuit,
      badge: dueVocabCount > 0 ? `${dueVocabCount} due` : undefined,
    },
    {
      id: 'GrammarDrills',
      label: 'Grammar & ★ Drills',
      sub: 'Forms, Stars & Pairs',
      icon: Languages,
      badge: weakConfusablesCount > 0 ? `${weakConfusablesCount} weak` : undefined,
    },
    {
      id: 'ReadingLab',
      label: 'Timed Reading Lab',
      sub: 'Paced Passage Drills',
      icon: BookOpen,
    },
    {
      id: 'MockExam',
      label: '100-Min Mock Exam',
      sub: 'Vocab (30m) + Grammar/Read (70m)',
      icon: GraduationCap,
    },
    {
      id: 'ImportResources',
      label: 'Resource Ingestion',
      sub: 'Presets, TSV & Decks',
      icon: DownloadCloud,
    },
    {
      id: 'SprintPlanAndSettings',
      label: '14-Day Sprint Plan',
      sub: 'Checklist & FSRS Settings',
      icon: CalendarCheck,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-stationery-border lg:min-h-[calc(100vh-57px)] flex flex-col justify-between p-3 lg:p-4">
      {/* Top: Nav Links */}
      <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-primary text-white shadow-sm font-semibold'
                  : 'text-ink hover:bg-stationery-subtle hover:text-indigo-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-primary'}`} />
                <div className="hidden lg:block">
                  <div className="text-sm font-medium leading-tight">{item.label}</div>
                  <div
                    className={`text-[11px] leading-tight ${
                      isActive ? 'text-indigo-wash/80' : 'text-ink-muted'
                    }`}
                  >
                    {item.sub}
                  </div>
                </div>
                {/* Mobile text */}
                <span className="lg:hidden text-xs font-medium whitespace-nowrap">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`hidden lg:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-vermilion-wash text-vermilion border border-vermilion/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Sprint Stats Summary Widget */}
      <div className="hidden lg:block mt-6 pt-4 border-t border-stationery-border space-y-3">
        {/* Streak & Daily Minutes */}
        <div className="bg-stationery-surface p-3 rounded-xl border border-stationery-border space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-ink">
            <span className="flex items-center gap-1.5 text-vermilion">
              <Flame className="w-4 h-4 fill-vermilion" />
              {settings.streakDays} Day Streak
            </span>
            <span className="text-jade-dark font-medium">
              {Math.round((settings.studyMinutesLogged / (settings.dailyTargetMinutes || 180)) * 100)}%
            </span>
          </div>

          <div className="w-full bg-stationery-border rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-jade h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  (settings.studyMinutesLogged / (settings.dailyTargetMinutes || 180)) * 100
                )}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-ink-muted">
            <span>Logged: {settings.studyMinutesLogged}m</span>
            <span>Goal: {settings.dailyTargetMinutes}m</span>
          </div>
        </div>

        {/* Leech warning pill */}
        {leechCount > 0 && (
          <div
            onClick={() => setActiveTab('VocabSRS')}
            className="cursor-pointer flex items-center justify-between p-2.5 rounded-lg bg-vermilion-wash border border-vermilion/30 text-vermilion text-xs font-medium hover:bg-vermilion-wash/80 transition"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 flex-shrink-0" />
              <span>{leechCount} Fragile Leech{leechCount > 1 ? 'es' : ''}</span>
            </div>
            <span className="font-bold underline text-[11px]">Cram →</span>
          </div>
        )}

        {/* 14-day Cap pill */}
        <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-primary" />
            14-Day Sprint Cap (5d):
          </span>
          <span className={`font-semibold ${settings.examCap5Days ? 'text-jade-dark' : 'text-ink-muted'}`}>
            {settings.examCap5Days ? 'Active' : 'Off'}
          </span>
        </div>
      </div>
    </aside>
  );
};
