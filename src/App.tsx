import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/common/Toast';
import { ShortcutsModal } from './components/common/ShortcutsModal';

// 4 Pillar Container Hubs & Pages
import { Dashboard } from './pages/Dashboard';
import { StudyHub } from './pages/StudyHub';
import { MockExam } from './pages/MockExam';
import { LibraryHub } from './pages/LibraryHub';

const MainContent: React.FC = () => {
  const { activePillar } = useApp();

  return (
    <>
      {activePillar === 'today' && <Dashboard />}
      {activePillar === 'study' && <StudyHub />}
      {activePillar === 'mock' && <MockExam />}
      {activePillar === 'library' && <LibraryHub />}
    </>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell>
        <MainContent />
      </AppShell>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <ShortcutsModal />
    </AppProvider>
  );
}

export default App;
