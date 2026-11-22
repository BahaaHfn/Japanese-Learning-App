import React from 'react';
import { useApp } from '../context/AppContext';
import { DownloadCloud, CalendarCheck, Settings as SettingsIcon } from 'lucide-react';
import { ImportResources } from './ImportResources';
import { SprintPlanAndSettings } from './SprintPlanAndSettings';
import { LibrarySubTab } from '../types';

export const LibraryHub: React.FC = () => {
  const { librarySubTab, setLibrarySubTab, vocabItems } = useApp();

  const subTabs: {
    id: LibrarySubTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }[] = [
    {
      id: 'resources',
      label: 'My Resources & Ingestion',
      sublabel: 'Presets, Custom TSV & Decks',
      icon: DownloadCloud,
      badge: `${vocabItems.length} cards`,
    },
    {
      id: 'plan',
      label: '14-Day Sprint Plan',
      sublabel: 'Daily Task Checklist',
      icon: CalendarCheck,
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      sublabel: 'FSRS Cap, Export & Reset',
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 3-Pill Top Sub-navigation */}
      <div className="bg-white/95 backdrop-blur border-b border-stationery-border py-2 px-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center p-1 rounded-2xl bg-stationery-surface border border-stationery-border gap-1 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = librarySubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setLibrarySubTab(tab.id)}
                className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[38px] ${
                  isActive
                    ? 'bg-indigo-primary text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-primary'}`} />
                <span className="sm:hidden">
                  {tab.id === 'resources' ? 'Resources' : tab.id === 'plan' ? 'Sprint Plan' : 'Settings'}
                </span>
                <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden sm:inline-flex px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stationery-subtle text-ink-muted border border-stationery-border'
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
        {librarySubTab === 'resources' && <ImportResources />}
        {librarySubTab === 'plan' && <SprintPlanAndSettings mode="plan" />}
        {librarySubTab === 'settings' && <SprintPlanAndSettings mode="settings" />}
      </div>
    </div>
  );
};
