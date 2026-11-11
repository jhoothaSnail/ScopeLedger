// frontend/src/App.jsx
// Root: theme + demo-auth providers, sign-in gate, then sidebar + workspace shell.
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import WorkspacePage from './pages/WorkspacePage';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import GuidedTour from './components/common/GuidedTour';
import { TOUR_STEPS } from './content/tourSteps';
import ThemeProvider from './theme/ThemeProvider';
import AuthProvider from './auth/AuthProvider';
import { useAuth } from './auth/authContext';
import './styles/global.css';
import './styles/board.css';
import './styles/ui.css';

const tourKey = (userId) => `scopeledger.tour.done.${userId}`;

function hasSeenTour(userId) {
  try {
    return localStorage.getItem(tourKey(userId)) === '1';
  } catch {
    return true; // storage blocked: don't nag on every load
  }
}

function AppShell() {
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [projectName, setProjectName] = useState('');
  const [tourOpen, setTourOpen] = useState(false);
  const [tourCheckedFor, setTourCheckedFor] = useState(null);

  // First sign-in for this person → start the tour once (render-time sync, no effect needed).
  if (user && tourCheckedFor !== user.id) {
    setTourCheckedFor(user.id);
    setTourOpen(!hasSeenTour(user.id));
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSignOut = () => {
    setActivePage('overview');
    setTourOpen(false);
    signOut();
  };

  const startTour = () => setTourOpen(true);
  const closeTour = () => {
    setTourOpen(false);
    try {
      localStorage.setItem(tourKey(user.id), '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        activePage={activePage}
        onNavigate={setActivePage}
        projectName={projectName}
        user={user}
        onSignOut={handleSignOut}
        onStartTour={startTour}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {activePage === 'overview' ? (
          <OverviewPage user={user} onNavigate={setActivePage} onProjectNameChange={setProjectName} onStartTour={startTour} />
        ) : (
          <WorkspacePage activePage={activePage} onNavigate={setActivePage} onProjectNameChange={setProjectName} onStartTour={startTour} />
        )}
      </div>
      <GuidedTour steps={TOUR_STEPS} isOpen={tourOpen} onClose={closeTour} activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
