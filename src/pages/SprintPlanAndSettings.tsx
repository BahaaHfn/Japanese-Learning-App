import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Settings as SettingsIcon,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface SprintPlanAndSettingsProps {
  mode?: 'all' | 'plan' | 'settings';
}

export const SprintPlanAndSettings: React.FC<SprintPlanAndSettingsProps> = ({ mode = 'all' }) => {
  const {
    dailyPlans,
    toggleSprintTask,
    settings,
    updateSettings,
    toggleExamCap,
    toggleFurigana,
    toggleArabic,
    exportBackupJson,
    importBackupJson,
    resetAllData,
    setActiveTab,
    addToast,
  } = useApp();

  const [activePhase, setActivePhase] = useState<number | 'all'>('all');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Filter plans by phase
  const filteredPlans = dailyPlans.filter((p) =>
    activePhase === 'all' ? true : p.phase === activePhase
  );

  // Overall sprint task progress
  const totalTasks = dailyPlans.flatMap((p) => p.tasks).length;
  const completedTasks = dailyPlans.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const progressPercent = Math.round((completedTasks / (totalTasks || 1)) * 100);

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jlpt-n3-sprint-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup .json exported successfully!', 'success');
  };

  const handleExecuteImport = () => {
    if (!importJsonText.trim()) return;
    const ok = importBackupJson(importJsonText);
    if (ok) {
      setImportModalOpen(false);
      setImportJsonText('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8 animate-fade-in">
      {(mode === 'all' || mode === 'plan') && (
        <>
          {/* 1. Header & Sprint Progress Bar */}
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-wash text-indigo-primary">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-primary">
                14-Day Sprint Checklist &amp; Settings
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted">
                Nov 22 – Dec 5, 2026 Structured Roadmap ahead of Sunday, Dec 6 exam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-indigo-primary">
              {completedTasks}/{totalTasks} Completed
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-jade-wash text-jade-dark border border-jade/30">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stationery-surface h-2.5 rounded-full border border-stationery-border overflow-hidden">
          <div
            className="bg-jade h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Interactive 14-Day Checklist */}
      <div className="space-y-4">
        {/* Phase Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-indigo-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-jade" />
            14-Day Sprint Roadmap
          </h2>

          <div className="flex items-center gap-1 bg-stationery-surface p-1 rounded-xl border border-stationery-border text-xs overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setActivePhase('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex-shrink-0 min-h-[36px] ${
                activePhase === 'all'
                  ? 'bg-white shadow-sm text-indigo-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All 14 Days
            </button>
            <button
              onClick={() => setActivePhase(1)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex-shrink-0 min-h-[36px] ${
                activePhase === 1
                  ? 'bg-white shadow-sm text-indigo-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="sm:hidden">P1: Diagnostic</span>
              <span className="hidden sm:inline">Phase 1: Diagnostic (Days 1–3)</span>
            </button>
            <button
              onClick={() => setActivePhase(2)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex-shrink-0 min-h-[36px] ${
                activePhase === 2
                  ? 'bg-white shadow-sm text-indigo-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="sm:hidden">P2: Sprint</span>
              <span className="hidden sm:inline">Phase 2: Sprint (Days 4–10)</span>
            </button>
            <button
              onClick={() => setActivePhase(3)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex-shrink-0 min-h-[36px] ${
                activePhase === 3
                  ? 'bg-white shadow-sm text-indigo-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="sm:hidden">P3: Taper</span>
              <span className="hidden sm:inline">Phase 3: Taper (Days 11–14)</span>
            </button>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isAllDone = plan.tasks.every((t) => t.done);

            return (
              <div
                key={plan.day}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all duration-200 space-y-4 ${
                  isAllDone
                    ? 'border-jade/40 bg-jade-wash/10'
                    : 'border-stationery-border hover:border-indigo-primary/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stationery-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stationery-surface border border-stationery-border text-ink-muted">
                        Day {plan.day}
                      </span>
                      <h3 className="font-bold text-base text-ink">
                        {plan.title}
                      </h3>
                      <span className="text-xs text-ink-muted hidden sm:inline">
                        • {plan.dateStr}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">{plan.subtitle}</p>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold self-start sm:self-auto ${
                      isAllDone ? 'text-jade' : 'text-ink-muted'
                    }`}
                  >
                    {plan.tasks.filter((t) => t.done).length}/{plan.tasks.length} done
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2.5">
                  {plan.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stationery-surface hover:bg-stationery-subtle border border-stationery-border/60 transition gap-3"
                    >
                      <button
                        onClick={() => toggleSprintTask(plan.day, task.id)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        {task.done ? (
                          <CheckCircle2 className="w-5 h-5 text-jade flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-stationery-border hover:text-indigo-primary flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs sm:text-sm font-medium ${
                            task.done ? 'line-through text-ink-muted' : 'text-ink'
                          }`}
                        >
                          {task.label}
                        </span>
                      </button>

                      {/* Jump to Module Button */}
                      <button
                        onClick={() => setActiveTab(task.module)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-indigo-wash text-indigo-primary border border-stationery-border hover:border-indigo-primary/40 transition flex-shrink-0 shadow-sm"
                        title={`Open ${task.module}`}
                      >
                        <span>Open {task.module}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* 3. Settings & Data Management */}
      {(mode === 'all' || mode === 'settings') && (
      <div className="bg-white rounded-3xl border border-stationery-border p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-stationery-border pb-4">
          <SettingsIcon className="w-5 h-5 text-indigo-primary" />
          <div>
            <h2 className="text-base font-bold text-indigo-primary">
              Global Preferences &amp; FSRS Settings
            </h2>
            <p className="text-xs text-ink-muted">
              Configure exam cap, daily study target, and manage backup data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FSRS 14-Day Sprint Cap */}
          <div className="p-4 rounded-2xl border border-stationery-border bg-stationery-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-jade" />
                14-Day Exam Interval Cap (5 Days Max)
              </span>
              <button
                onClick={toggleExamCap}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.examCap5Days ? 'bg-jade' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.examCap5Days ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              When ON, the FSRS algorithm caps maximum intervals at 5 days so all fragile cards resurface before December 6.
            </p>
          </div>

          {/* Daily Study Time Target */}
          <div className="p-4 rounded-2xl border border-stationery-border bg-stationery-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-primary" />
                Daily Target: {settings.dailyTargetMinutes} mins ({Math.round(settings.dailyTargetMinutes / 60)} hrs/day)
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={360}
              step={15}
              value={settings.dailyTargetMinutes}
              onChange={(e) => updateSettings({ dailyTargetMinutes: Number(e.target.value) })}
              className="w-full accent-indigo-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-muted font-mono">
              <span>1 hr</span>
              <span>3 hrs</span>
              <span>6 hrs</span>
            </div>
          </div>
        </div>

        {/* Global Display Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-4 rounded-xl border border-stationery-border">
            <div>
              <div className="text-xs font-bold text-ink">Furigana Annotations (F)</div>
              <div className="text-xs text-ink-muted">Display Japanese phonetic ruby above kanji</div>
            </div>
            <button
              onClick={toggleFurigana}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                settings.furigana
                  ? 'bg-indigo-wash border-indigo-primary/30 text-indigo-primary'
                  : 'bg-stationery-surface text-ink-muted border-stationery-border'
              }`}
            >
              {settings.furigana ? 'Enabled' : 'Hidden'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-stationery-border">
            <div>
              <div className="text-xs font-bold text-ink">Arabic Translations (A)</div>
              <div className="text-xs text-ink-muted">Display RTL Arabic meanings on cards and grammar</div>
            </div>
            <button
              onClick={toggleArabic}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                settings.showArabic
                  ? 'bg-jade-wash border-jade/30 text-jade-dark'
                  : 'bg-stationery-surface text-ink-muted border-stationery-border'
              }`}
            >
              {settings.showArabic ? 'Enabled' : 'Hidden'}
            </button>
          </div>
        </div>

        {/* Backup & Restore Section */}
        <div className="pt-6 border-t border-stationery-border space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Data Portability &amp; Local-First Storage
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-primary text-white text-xs font-bold hover:bg-indigo-light transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Dated .json Backup</span>
            </button>

            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stationery-border text-indigo-primary text-xs font-bold hover:bg-stationery-subtle transition shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Import .json Backup</span>
            </button>

            <button
              onClick={() => setResetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-vermilion/30 text-vermilion text-xs font-bold hover:bg-vermilion-wash transition shadow-sm ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Seed Demo State</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Confirmation Modal for Reset */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={
          <span className="flex items-center gap-2 text-vermilion">
            <AlertTriangle className="w-5 h-5 text-vermilion" />
            Reset All Data Confirmation
          </span>
        }
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink border border-stationery-border"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetAllData();
                setResetModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-vermilion text-white hover:bg-vermilion-dark"
            >
              Yes, Reset Everything
            </button>
          </div>
        }
      >
        <p className="text-sm text-ink leading-relaxed">
          Are you sure you want to reset all your FSRS card progress, mock exam scores, and checklist tasks back to the default sprint seed state? This action cannot be undone unless you have an exported .json backup.
        </p>
      </Modal>

      {/* Import Backup Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title={
          <span className="flex items-center gap-2 text-indigo-primary">
            <Upload className="w-5 h-5 text-indigo-primary" />
            Import Backup JSON
          </span>
        }
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink border border-stationery-border"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={!importJsonText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-primary text-white hover:bg-indigo-light disabled:opacity-40"
            >
              Restore Data
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Paste your previously exported JSON backup content below to restore all your card review history, settings, and mock attempts:
          </p>
          <textarea
            rows={8}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Paste backup JSON here..."
            className="w-full p-3 font-mono text-xs rounded-xl border border-stationery-border bg-stationery-surface text-ink focus:outline-none focus:ring-1 focus:ring-indigo-primary"
          />
        </div>
      </Modal>
    </div>
  );
};
