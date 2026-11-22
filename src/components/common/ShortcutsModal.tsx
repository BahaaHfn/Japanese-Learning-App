import React from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { Keyboard } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useApp();

  const shortcuts = [
    { key: 'F', action: 'Toggle Furigana <ruby> annotations globally on/off' },
    { key: 'A', action: 'Toggle Arabic translations (العربية) globally on/off' },
    { key: 'Space', action: 'Flip card / Reveal answer in Vocab SRS Flashcards' },
    { key: '1', action: 'Rate "Again (1)" / Select option 1' },
    { key: '2', action: 'Rate "Hard (2)" / Select option 2' },
    { key: '3', action: 'Rate "Good (3)" / Select option 3' },
    { key: '4', action: 'Rate "Easy (4)" / Select option 4' },
    { key: '?', action: 'Toggle this Keyboard Shortcuts reference guide' },
    { key: 'Esc', action: 'Close active modal / Dismiss overlay' },
  ];

  return (
    <Modal
      isOpen={shortcutsModalOpen}
      onClose={() => setShortcutsModalOpen(false)}
      title={
        <span className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-indigo-primary" />
          Global Keyboard Shortcuts
        </span>
      }
      footer={
        <button
          onClick={() => setShortcutsModalOpen(false)}
          className="px-4 py-2 bg-indigo-primary text-white text-sm font-medium rounded-lg hover:bg-indigo-light transition"
        >
          Got it
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">
          Speed up your 14-day study sprint with these single-stroke keyboard shortcuts anywhere in the app:
        </p>
        <div className="divide-y divide-stationery-border border border-stationery-border rounded-xl overflow-hidden bg-stationery-surface">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-3 text-sm">
              <span className="text-ink-muted">{s.action}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-white border border-stationery-border shadow-sm rounded-md text-indigo-primary">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
