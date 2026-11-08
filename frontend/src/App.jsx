// frontend/src/App.jsx
// Root application shell: sidebar + content area layout.
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import WorkspacePage from './pages/WorkspacePage';
import './styles/global.css';
import './styles/board.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('board');
  const [projectName, setProjectName] = useState('');

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Sidebar Navigation Shell */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        activePage={activePage}
        onNavigate={setActivePage}
        projectName={projectName}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <WorkspacePage
          activePage={activePage}
          onNavigate={setActivePage}
          onProjectNameChange={setProjectName}
        />
      </div>
    </div>
  );
}

export default App;
