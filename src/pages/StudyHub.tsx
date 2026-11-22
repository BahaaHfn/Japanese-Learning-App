import React from 'react';
import { useApp } from '../context/AppContext';
import { BrainCircuit, Languages, BookOpen } from 'lucide-react';
import { VocabSRS } from './VocabSRS';
import { GrammarDrills } from './GrammarDrills';
import { ReadingLab } from './ReadingLab';
import { StudySubTab } from '../types';

export const StudyHub: React.FC = () => {
  const { studySubTab, setStudySubTab, vocabItems, confusablePairs } = useApp();

  const dueVocabCount = vocabItems.filter(
    (item) => !item.suspended && new Date(item.due).getTime() <= Date.now()
  ).length;

  const weakConfusablesCount = confusablePairs.filter((p) => p.weak).length;

  const subTabs: {
    id: StudySubTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }[] = [
    {
      id: 'vocab',
      label: 'Vocab & Kanji',
      sublabel: 'FSRS Cram & Quiz',
      icon: BrainCircuit,
      badge: dueVocabCount > 0 ? `${dueVocabCount} due` : undefined,
    },
    {
      id: 'grammar',
      label: 'Grammar & ★',
      sublabel: 'Forms, Stars & Pairs',
      icon: Languages,
      badge: weakConfusablesCount > 0 ? `${weakConfusablesCount} weak` : undefined,
    },
    {
      id: 'reading',
      label: 'Reading Lab',
      sublabel: 'Timed Passages & Capture',
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 3-Pill Top Switcher */}
      <div className="bg-white/95 backdrop-blur border-b border-stationery-border py-2 px-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center p-1 rounded-2xl bg-stationery-surface border border-stationery-border gap-1 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = studySubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStudySubTab(tab.id)}
                className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[38px] ${
                  isActive
                    ? 'bg-indigo-primary text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-primary'}`} />
                <span className="sm:hidden">
                  {tab.id === 'vocab' ? 'Vocab' : tab.id === 'grammar' ? 'Grammar' : 'Reading'}
                </span>
                <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden sm:inline-flex px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-vermilion-wash text-vermilion border border-vermilion/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sub-module View */}
      <div>
        {studySubTab === 'vocab' && <VocabSRS />}
        {studySubTab === 'grammar' && <GrammarDrills />}
        {studySubTab === 'reading' && <ReadingLab />}
      </div>
    </div>
  );
};
