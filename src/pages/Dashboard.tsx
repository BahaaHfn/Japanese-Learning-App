import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    settings,
    vocabItems,
    confusablePairs,
    mockAttempts,
    dailyPlans,
    toggleSprintTask,
    setActivePillar,
    setStudySubTab,
  } = useApp();

  // Target exam date: Sunday, December 6, 2026
  const examDate = new Date(2026, 11, 6);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const daysUntilExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // 14-day sprint progress
  const sprintStart = new Date(2026, 10, 22);
  const sprintElapsed = Math.floor((today.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentSprintDay = Math.min(14, Math.max(1, sprintElapsed));

  // Current day sprint plan
  const todayPlan =
    dailyPlans.find((p) => p.day === currentSprintDay) ||
    dailyPlans[0] || {
      day: currentSprintDay,
      dateStr: 'Day ' + currentSprintDay,
      phase: 1,
      title: 'Foundation & Core Alignment',
      subtitle: 'Vocab FSRS review & grammar drill',
      tasks: [],
    };

  // Due counts
  const now = new Date();
  const dueVocab = vocabItems.filter(
    (i) => !i.suspended && new Date(i.due).getTime() <= now.getTime()
  );
  const leeches = vocabItems.filter((i) => !i.suspended && i.status === 'Leech');
  const weakConfusables = confusablePairs.filter((p) => p.weak);

  // Scaled Readiness calculations from latest mock or diagnostic
  const latestFullMock = mockAttempts.find((m) => m.type === 'full') || mockAttempts[0];
  const projectedLang =
    latestFullMock && latestFullMock.scaledLanguageKnowledge >= 0
      ? latestFullMock.scaledLanguageKnowledge
      : 32; // Baseline
  const projectedReading =
    latestFullMock && latestFullMock.scaledReading >= 0
      ? latestFullMock.scaledReading
      : 28; // Baseline
  const projectedTotal = projectedLang + projectedReading;

  // Determine ONE Primary High-Yield Session CTA
  let heroTitle = "Review Due FSRS Deck";
  let heroDescription = `You have ${dueVocab.length} vocabulary and kanji cards due for memory reinforcement today.`;
  let heroButtonText = `Start Vocab Review (${dueVocab.length} Cards) →`;
  let heroAction = () => {
    setStudySubTab('vocab');
    setActivePillar('study');
  };

  if (dueVocab.length === 0 && leeches.length > 0) {
    heroTitle = "Leech Rescue Cram";
    heroDescription = `${leeches.length} persistent problem cards flagged with 3+ consecutive lapses need targeted reinforcement.`;
    heroButtonText = `Cram ${leeches.length} Leech Cards →`;
    heroAction = () => {
      setStudySubTab('vocab');
      setActivePillar('study');
    };
  } else if (dueVocab.length === 0 && weakConfusables.length > 0) {
    heroTitle = "Clarify Weak Confusables";
    heroDescription = `${weakConfusables.length} grammar nuance pairs flagged for fine distinction drills.`;
    heroButtonText = `Review ${weakConfusables.length} Confusable Pairs →`;
    heroAction = () => {
      setStudySubTab('grammar');
      setActivePillar('study');
    };
  } else if (dueVocab.length === 0) {
    heroTitle = "Complete 100m Written Simulation";
    heroDescription = "No cards due! Benchmark your exam pacing with the official 30m + 70m written mock.";
    heroButtonText = "Launch Written Mock Simulator →";
    heroAction = () => {
      setActivePillar('mock');
    };
  }

  const handleLaunchModule = (module: string) => {
    if (module === 'VocabSRS') {
      setStudySubTab('vocab');
      setActivePillar('study');
    } else if (module === 'GrammarDrills') {
      setStudySubTab('grammar');
      setActivePillar('study');
    } else if (module === 'ReadingLab') {
      setStudySubTab('reading');
      setActivePillar('study');
    } else if (module === 'MockExam') {
      setActivePillar('mock');
    } else {
      setActivePillar('library');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Slim Sprint Header Bar */}
      <div className="bg-white rounded-2xl border border-stationery-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vermilion-wash border border-vermilion/20 flex items-center justify-center text-vermilion flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-ink">
                Sunday, Dec 6, 2026 Official Exam
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-vermilion text-white">
                {daysUntilExam} Days Left
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              14-Day Rapid Score Sprint • Day {currentSprintDay} of 14 (Phase {todayPlan.phase})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Study streak pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{settings.streakDays} Day Streak</span>
          </div>

          {/* Time logged pill */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stationery-surface text-ink-muted border border-stationery-border text-xs font-medium">
            <span>{settings.studyMinutesLogged}m / {settings.dailyTargetMinutes}m today</span>
          </div>
        </div>
      </div>

      {/* 2. Duolingo/Linear-Inspired Hero Next Action Card (1 Primary CTA) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-primary to-[#2C4875] text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-indigo-100 backdrop-blur-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Recommended Next Session</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {heroTitle}
          </h2>

          <p className="text-sm text-indigo-100/90 leading-relaxed">
            {heroDescription}
          </p>

          <div className="pt-2">
            <button
              onClick={heroAction}
              className="px-6 py-3 rounded-2xl bg-white text-indigo-primary font-bold text-xs sm:text-sm hover:bg-stationery-surface transition shadow-sm hover:shadow flex items-center gap-2"
            >
              <span>{heroButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-10 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-20 -top-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* 3. Scaled Readiness & 19/60 Floor Section Gauges */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stationery-border pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-jade" />
              Official Sectional Score Readiness
            </h3>
            <p className="text-xs text-ink-muted">
              Projected Written Total: <strong className="text-ink">{projectedTotal} / 120</strong> • 19/60 minimum passing floor required in each section
            </p>
          </div>

          <div className="text-[11px] text-ink-muted bg-stationery-surface px-2.5 py-1 rounded-lg border border-stationery-border">
            Target benchmark: &gt;= 95/180 total
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Section 1: Language Knowledge (Vocab & Grammar) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                Language Knowledge (Vocab &amp; Grammar)
              </span>
              <span className="font-mono font-bold text-indigo-primary">
                {projectedLang} / 60 pts
              </span>
            </div>

            <div className="relative w-full h-3 bg-stationery-subtle rounded-full overflow-hidden border border-stationery-border">
              {/* Floor marker at 19/60 (31.6%) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-vermilion z-10"
                style={{ left: `${(19 / 60) * 100}%` }}
                title="19/60 Passing Floor"
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  projectedLang >= 19 ? 'bg-indigo-primary' : 'bg-vermilion'
                }`}
                style={{ width: `${(projectedLang / 60) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span className="text-vermilion font-medium">Floor line: 19 pts</span>
              <span className={projectedLang >= 19 ? 'text-jade font-semibold' : 'text-vermilion font-bold'}>
                {projectedLang >= 19 ? '✓ Above Passing Floor' : '⚠ Below 19/60 Floor!'}
              </span>
            </div>
          </div>

          {/* Section 2: Reading Comprehension */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                Reading Comprehension
              </span>
              <span className="font-mono font-bold text-jade-dark">
                {projectedReading} / 60 pts
              </span>
            </div>

            <div className="relative w-full h-3 bg-stationery-subtle rounded-full overflow-hidden border border-stationery-border">
              {/* Floor marker at 19/60 (31.6%) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-vermilion z-10"
                style={{ left: `${(19 / 60) * 100}%` }}
                title="19/60 Passing Floor"
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  projectedReading >= 19 ? 'bg-jade' : 'bg-vermilion'
                }`}
                style={{ width: `${(projectedReading / 60) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span className="text-vermilion font-medium">Floor line: 19 pts</span>
              <span className={projectedReading >= 19 ? 'text-jade font-semibold' : 'text-vermilion font-bold'}>
                {projectedReading >= 19 ? '✓ Above Passing Floor' : '⚠ Below 19/60 Floor!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Today's 3-Step Actionable Checklist */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stationery-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-ink">
              Today's Sprint Tasks (Day {currentSprintDay})
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stationery-surface text-ink-muted border border-stationery-border font-medium">
              Phase {todayPlan.phase}: {todayPlan.title}
            </span>
          </div>

          <span className="text-xs text-ink-muted">
            Target: {settings.dailyTargetMinutes}m
          </span>
        </div>

        <div className="space-y-2.5">
          {todayPlan.tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleSprintTask(todayPlan.day, task.id)}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer select-none ${
                task.done
                  ? 'bg-jade-wash/20 border-jade/30 text-ink-muted'
                  : 'bg-stationery-surface border-stationery-border hover:border-indigo-primary/40 text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                {task.done ? (
                  <CheckCircle2 className="w-5 h-5 text-jade flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-ink-muted flex-shrink-0" />
                )}
                <div>
                  <span className={`text-xs sm:text-sm font-medium ${task.done ? 'line-through text-ink-muted' : ''}`}>
                    {task.label}
                  </span>
                  <div className="text-[11px] text-ink-muted font-mono capitalize">
                    {task.module}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchModule(task.module);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-stationery-border text-indigo-primary hover:bg-indigo-wash transition shadow-2xs"
              >
                Launch Drill →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
