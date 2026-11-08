// frontend/src/App.jsx
// Root: theme + demo-auth providers, sign-in gate, then sidebar + workspace shell.
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import WorkspacePage from './pages/WorkspacePage';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import ThemeProvider from './theme/ThemeProvider';
import AuthProvider from './auth/AuthProvider';
import { useAuth } from './auth/authContext';
import './styles/global.css';
import './styles/board.css';
import './styles/ui.css';

function AppShell() {
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [projectName, setProjectName] = useState('');

  if (!user) {
    return <LoginPage />;
  }

  const handleSignOut = () => {
    setActivePage('overview');
    signOut();
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
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {activePage === 'overview' ? (
          <OverviewPage user={user} onNavigate={setActivePage} onProjectNameChange={setProjectName} />
        ) : (
          <WorkspacePage activePage={activePage} onNavigate={setActivePage} onProjectNameChange={setProjectName} />
        )}
      </div>
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
