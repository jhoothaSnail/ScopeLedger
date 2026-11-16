// frontend/src/App.jsx
// Root: theme + demo-auth providers, sign-in gate, then sidebar + page shell (overview, board, requests, history).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import WorkspacePage from './pages/WorkspacePage';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import RequestsPage from './pages/RequestsPage';
import GuidedTour from './components/common/GuidedTour';
import { getTourSteps } from './content/tourSteps';
import ThemeProvider from './theme/ThemeProvider';
import AuthProvider from './auth/AuthProvider';
import { useAuth, FRESH_SIGN_IN_KEY } from './auth/authContext';
import { fetchChangeRequests } from './services/requestApi';
import './styles/global.css';
import './styles/board.css';
import './styles/ui.css';

const REQUEST_POLL_MS = 30000;

/** True (once) right after this tab signed in; a page refresh does not count as a new sign-in. */
function consumeFreshSignIn(userId) {
  try {
    if (sessionStorage.getItem(FRESH_SIGN_IN_KEY) !== userId) return false;
    sessionStorage.removeItem(FRESH_SIGN_IN_KEY);
    return true;
  } catch {
    return false;
  }
}

function AppShell() {
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [projectName, setProjectName] = useState('');
  const [tourOpen, setTourOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const tourSteps = useMemo(() => getTourSteps(user?.role), [user?.role]);

  // Every new sign-in starts the tour for that person's role; "Skip tour" closes it.
  useEffect(() => {
    if (user && consumeFreshSignIn(user.id)) setTourOpen(true);
  }, [user]);

  // Pending-request badge: shared on the server, so refresh on navigation and every 30 s.
  const refreshRequests = useCallback(async () => {
    try {
      const list = await fetchChangeRequests(1);
      setPendingCount(Array.isArray(list) ? list.filter((r) => r.status === 'PENDING').length : 0);
    } catch {
      setPendingCount(0); // server unreachable: no badge rather than a stale one
    }
  }, []);
  useEffect(() => {
    if (!user) return undefined;
    refreshRequests();
    const timer = setInterval(refreshRequests, REQUEST_POLL_MS);
    return () => clearInterval(timer);
  }, [user, activePage, refreshRequests]);

  if (!user) {
    return <LoginPage />;
  }

  const handleSignOut = () => {
    setActivePage('overview');
    setTourOpen(false);
    signOut();
  };

  const startTour = () => setTourOpen(true);
  const shared = { onNavigate: setActivePage, onProjectNameChange: setProjectName, onStartTour: startTour, onRequestsChanged: refreshRequests };

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
        pendingCount={pendingCount}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {activePage === 'overview' ? (
          <OverviewPage user={user} {...shared} />
        ) : activePage === 'requests' ? (
          <RequestsPage {...shared} />
        ) : (
          <WorkspacePage activePage={activePage} {...shared} />
        )}
      </div>
      {/* Keyed by person so a tour interrupted by sign-out never resumes mid-way for someone else. */}
      <GuidedTour key={user.id} steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} activePage={activePage} onNavigate={setActivePage} />
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
