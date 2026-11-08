// frontend/src/pages/WorkspacePage.jsx
// Main workspace orchestrator: board canvas + task inspector + simulation drawer.
import React, { useState, useEffect, useCallback } from 'react';
import TopNavBar from '../components/layout/TopNavBar';
import MetricsBanner from '../components/layout/MetricsBanner';
import DependencyBoardCanvas from '../components/board/DependencyBoardCanvas';
import TaskInspector from '../components/board/TaskInspector';
import AddTaskDependencyModal from '../components/board/AddTaskDependencyModal';
import ChangeOrderHistoryModal from '../components/simulator/ChangeOrderHistoryModal';
import SimulationDrawer from '../components/simulator/SimulationDrawer';
import {
  fetchProjectBoard,
  createDeliverableTask,
  createTaskDependency,
  resetDemoData,
  fetchChangeOrders
} from '../services/boardApi';
import { simulateChangeOrder, commitChangeOrder } from '../services/changeOrderApi';

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function BoardSkeleton() {
  return (
    <div style={{ padding: '32px 40px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {[180, 240, 160, 220, 190].map((w, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width: w,
            height: 112,
            borderRadius: 12,
            flexShrink: 0,
            animationDelay: `${i * 80}ms`
          }}
        />
      ))}
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  const styles = {
    error:   { bg: 'color-mix(in srgb, var(--accent-coral) 12%, transparent)',  border: 'color-mix(in srgb, var(--accent-coral) 30%, transparent)',   color: 'var(--accent-coral)' },
    success: { bg: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)', border: 'color-mix(in srgb, var(--accent-emerald) 30%, transparent)',  color: 'var(--accent-emerald)' },
    info:    { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', color: 'var(--text-secondary)' },
  };
  const s = styles[msg.type] || styles.info;
  const icon = msg.type === 'success' ? '✓' : msg.type === 'error' ? '⚠' : 'ℹ';

  return (
    <div style={{
      position: 'fixed', top: 72, right: 20, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 14px', borderRadius: 8,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
      boxShadow: 'var(--shadow-lg)',
      animation: 'fadeIn 0.2s ease',
      maxWidth: 400, wordBreak: 'break-word',
    }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span>{msg.text}</span>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '24px 24px 20px',
        width: 380, maxWidth: '90vw',
        boxShadow: 'var(--shadow-xl)',
      }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: 'color-mix(in srgb, var(--accent-cyan) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-cyan) 25%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16
        }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent-cyan)" strokeWidth={1.5}
            style={{ width: 20, height: 20 }} aria-hidden="true">
            <path d="M10 2L2 18h16L10 2z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 8v4M10 14h.01" strokeLinecap="round"/>
          </svg>
        </div>

        <h3
          id="confirm-dialog-title"
          style={{
            margin: '0 0 8px',
            fontSize: 15, fontWeight: 700,
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)'
          }}
        >
          {title}
        </h3>
        <p style={{
          margin: '0 0 20px',
          fontSize: 13, color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)', lineHeight: 1.5
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: 7,
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--ink) 5%, transparent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: 7,
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-cyan) 18%, transparent), color-mix(in srgb, var(--accent-teal) 12%, transparent))',
              border: '1px solid color-mix(in srgb, var(--accent-cyan) 40%, transparent)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, color-mix(in srgb, var(--accent-cyan) 26%, transparent), color-mix(in srgb, var(--accent-teal) 20%, transparent))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, color-mix(in srgb, var(--accent-cyan) 18%, transparent), color-mix(in srgb, var(--accent-teal) 12%, transparent))'; }}
          >
            Commit Change
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function WorkspacePage({ activePage, onNavigate, onProjectNameChange }) {
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Panels & modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [simulationDrawerOpen, setSimulationDrawerOpen] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [changeOrders, setChangeOrders] = useState([]);
  const [droppedTaskIds, setDroppedTaskIds] = useState([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, payload: null });

  // Toast helper
  const showToast = (text, type = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Load board
  const loadBoardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchProjectBoard(1);
      setBoard(data);
      if (data?.name) onProjectNameChange?.(data.name);
    } catch (err) {
      setErrorMsg('Failed to connect to backend: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onProjectNameChange]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // Open audit log
  const handleOpenAudit = useCallback(async () => {
    try {
      const logs = await fetchChangeOrders(1);
      setChangeOrders(logs || []);
    } catch {
      setChangeOrders([]);
    }
    setIsAuditModalOpen(true);
  }, []);

  // Open audit log when sidebar navigates to 'changeorders'
  useEffect(() => {
    if (activePage === 'changeorders') {
      handleOpenAudit();
    }
  }, [activePage, handleOpenAudit]);

  // Task click → open inspector panel first
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setInspectorOpen(true);
    setSimulationDrawerOpen(false);
    setDroppedTaskIds([]);
    setSimulationData(null);
  };

  // Inspector CTA → open simulation drawer
  const handleOpenSimulation = async () => {
    if (!selectedTask) return;
    setSimulationDrawerOpen(true);

    // Auto-trigger initial dry-run
    try {
      const sim = await simulateChangeOrder(1, {
        targetTaskId: selectedTask.id,
        changeDescription: `Scope modification for ${selectedTask.title}`,
        addedHours: 12,
        addedDays: 2,
        droppedOptionalTaskIds: []
      });
      setSimulationData(sim);
    } catch (err) {
      console.warn('Initial simulation failed:', err.message);
    }
  };

  // Simulation drawer: run simulation
  const handleSimulate = async (payload) => {
    setDroppedTaskIds(payload.droppedOptionalTaskIds || []);
    try {
      const sim = await simulateChangeOrder(1, payload);
      setSimulationData(sim);
    } catch (err) {
      showToast('Simulation calculation failed: ' + err.message, 'error');
    }
  };

  // Simulation drawer: commit → show confirm dialog first
  const handleCommitRequest = (payload) => {
    setConfirmDialog({ isOpen: true, payload });
  };

  const handleConfirmCommit = async () => {
    const { payload } = confirmDialog;
    setConfirmDialog({ isOpen: false, payload: null });
    try {
      await commitChangeOrder(1, payload);
      showToast('Scope change committed successfully to project ledger!', 'success');
      setSelectedTask(null);
      setSimulationData(null);
      setDroppedTaskIds([]);
      setInspectorOpen(false);
      setSimulationDrawerOpen(false);
      await loadBoardData();
    } catch (err) {
      showToast('Commit failed: ' + err.message, 'error');
    }
  };

  const handleCancelCommit = () => {
    setConfirmDialog({ isOpen: false, payload: null });
  };

  // Close inspector
  const handleCloseInspector = () => {
    setInspectorOpen(false);
    setSimulationDrawerOpen(false);
    setSelectedTask(null);
    setSimulationData(null);
    setDroppedTaskIds([]);
  };

  // Reset demo
  const handleResetDemo = async () => {
    try {
      await resetDemoData();
      setSelectedTask(null);
      setSimulationData(null);
      setDroppedTaskIds([]);
      setInspectorOpen(false);
      setSimulationDrawerOpen(false);
      await loadBoardData();
      showToast('Demo project data reset to initial baseline state.', 'success');
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  };

  // Audit modal close → navigate back to board
  const handleCloseAudit = () => {
    setIsAuditModalOpen(false);
    if (activePage === 'changeorders') onNavigate?.('board');
  };

  // Create task
  const handleCreateTask = async (taskData) => {
    await createDeliverableTask(1, taskData);
    showToast(`Task "${taskData.title}" created.`, 'success');
    await loadBoardData();
  };

  // Create dependency
  const handleCreateDependency = async (depData) => {
    await createTaskDependency(1, depData);
    showToast('Dependency edge connected.', 'success');
    await loadBoardData();
  };

  // Compute impact data map (taskId → impact) for board canvas ripple states
  const impactMap = {};
  if (simulationData?.impactedTasks) {
    for (const impact of simulationData.impactedTasks) {
      impactMap[impact.taskId] = impact;
    }
  }

  // Inspector: get impact for currently selected task
  const selectedTaskImpact = selectedTask ? impactMap[selectedTask.id] : null;
  const selectedTaskIsDropped = selectedTask
    ? droppedTaskIds.includes(selectedTask.id)
    : false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-app)',
        overflow: 'hidden',
      }}
    >
      {/* Top Nav */}
      <TopNavBar
        projectName={board?.name || 'ScopeLedger Project'}
        onResetDemo={handleResetDemo}
        onOpenAuditLog={handleOpenAudit}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isLiveApi={!errorMsg}
      />

      {/* Metrics Banner */}
      <MetricsBanner
        project={board}
        simulationData={simulationData}
        taskCount={board?.tasks?.length || 0}
        tasks={board?.tasks || []}
      />

      {/* Error banner */}
      {errorMsg && (
        <div style={{
          padding: '8px 24px',
          background: 'color-mix(in srgb, var(--accent-coral) 8%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--accent-coral) 20%, transparent)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--accent-coral)',
        }}>
          <span>⚠</span>
          <span>{errorMsg} — running in offline mock mode</span>
        </div>
      )}

      {/* Main Canvas Row */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
        }}
        aria-label="Dependency board workspace"
      >
        {/* Board Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {isLoading ? (
            <BoardSkeleton />
          ) : (
            <DependencyBoardCanvas
              tasks={board?.tasks || []}
              dependencies={board?.dependencies || []}
              selectedTaskId={selectedTask?.id}
              simulationData={simulationData}
              droppedTaskIds={droppedTaskIds}
              onSelectTask={handleSelectTask}
            />
          )}
        </div>

        {/* Task Inspector (right slide-over, inline) */}
        {inspectorOpen && selectedTask && !simulationDrawerOpen && (
          <TaskInspector
            task={selectedTask}
            allTasks={board?.tasks || []}
            dependencies={board?.dependencies || []}
            impactData={selectedTaskImpact}
            isDropped={selectedTaskIsDropped}
            onOpenSimulation={handleOpenSimulation}
            onClose={handleCloseInspector}
          />
        )}

        {/* Simulation Drawer (Dev2 component — do not modify) */}
        {simulationDrawerOpen && selectedTask && (
          <SimulationDrawer
            targetTask={selectedTask}
            simulationData={simulationData}
            onSimulate={handleSimulate}
            onCommit={handleCommitRequest}
            onClose={() => {
              setSimulationDrawerOpen(false);
              setInspectorOpen(true);
            }}
          />
        )}
      </main>

      {/* Toast */}
      <Toast msg={toastMsg} />

      {/* Confirm Commit Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Commit Scope Change?"
        message={`This will permanently update "${selectedTask?.title}" and recalculate downstream impacts on the project ledger. This action cannot be undone.`}
        onConfirm={handleConfirmCommit}
        onCancel={handleCancelCommit}
      />

      {/* Add Task / Link Dependency Modal */}
      <AddTaskDependencyModal
        isOpen={isAddModalOpen}
        tasks={board?.tasks || []}
        onClose={() => setIsAddModalOpen(false)}
        onCreateTask={handleCreateTask}
        onCreateDependency={handleCreateDependency}
      />

      {/* Change Order Audit Log Modal */}
      <ChangeOrderHistoryModal
        isOpen={isAuditModalOpen}
        changeOrders={changeOrders}
        onClose={handleCloseAudit}
      />
    </div>
  );
}
