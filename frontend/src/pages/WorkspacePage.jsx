// frontend/src/pages/WorkspacePage.jsx
// Main workspace orchestrator: board canvas + task inspector + simulation drawer.
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  updateTaskStatus,
  resetDemoData,
  fetchChangeOrders,
  isUsingFallback
} from '../services/boardApi';
import { simulateChangeOrder, commitChangeOrder } from '../services/changeOrderApi';
import { submitChangeRequest, fetchChangeRequests, approveChangeRequest, rejectChangeRequest } from '../services/requestApi';
import { useAuth } from '../auth/authContext';
import { can, changeAction } from '../auth/permissions';

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
    info:    { bg: 'color-mix(in srgb, var(--text-muted) 12%, transparent)', border: 'color-mix(in srgb, var(--text-muted) 35%, transparent)', color: 'var(--text-secondary)' },
  };
  const s = styles[msg.type] || styles.info;
  const icon = msg.type === 'success' ? '✓' : msg.type === 'error' ? '⚠' : 'ℹ';

  return (
    // Solid surface (tint layered on top) so it never blends into the content behind it;
    // bottom-centre, above the zoom controls, keeps it clear of the metrics banner, legend and drawer.
    <div
      role={msg.type === 'error' ? 'alert' : 'status'}
      aria-live={msg.type === 'error' ? 'assertive' : 'polite'}
      style={{
        position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 1100,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 10,
        background: `linear-gradient(${s.bg}, ${s.bg}), var(--bg-surface-elevated)`,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 14, fontWeight: 600,
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn 0.2s ease',
        width: 'max-content', maxWidth: 'min(520px, calc(100vw - 32px))', wordBreak: 'break-word',
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0 }}>{icon}</span>
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
            Approve change
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function WorkspacePage({ activePage, onNavigate, onProjectNameChange, onStartTour, onRequestsChanged }) {
  const { user } = useAuth();
  const action = changeAction(user);
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [showBoardTip, setShowBoardTip] = useState(() => {
    try { return localStorage.getItem('scopeledger.tip.board') !== 'dismissed'; } catch { return true; }
  });
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
  const [pendingRequests, setPendingRequests] = useState([]); // shared on the server, same for every profile

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, payload: null });

  // Toast helper
  const showToast = (text, type = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Load board
  // Skeleton only on the first load; later refreshes keep the board (and its zoom/pan) on screen.
  const hasLoadedBoard = useRef(false);
  const loadBoardData = useCallback(async () => {
    if (!hasLoadedBoard.current) setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchProjectBoard(1);
      hasLoadedBoard.current = true;
      setBoard(data);
      setIsOffline(isUsingFallback());
      if (data?.name) onProjectNameChange?.(data.name);
      return data;
    } catch (err) {
      setErrorMsg('Failed to connect to backend: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onProjectNameChange]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // Pending change requests (from any profile). Refreshed on load, after every action and every
  // 20 s, so a request sent from another account shows up on the board without a reload.
  const loadRequests = useCallback(async () => {
    try {
      const list = await fetchChangeRequests(1);
      setPendingRequests(Array.isArray(list) ? list.filter((r) => r.status === 'PENDING') : []);
    } catch {
      setPendingRequests([]); // server unreachable: show none rather than stale ones
    }
  }, []);
  useEffect(() => {
    loadRequests();
    const timer = setInterval(loadRequests, 20000);
    return () => clearInterval(timer);
  }, [loadRequests]);

  const pendingByTask = useMemo(() => {
    const counts = {};
    for (const r of pendingRequests) counts[r.targetTaskId] = (counts[r.targetTaskId] || 0) + 1;
    return counts;
  }, [pendingRequests]);

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
  // Opens empty: nothing is estimated until the user enters the change and asks for it.
  const handleOpenSimulation = () => {
    if (!selectedTask) return;
    setSimulationData(null);
    setDroppedTaskIds([]);
    setSimulationDrawerOpen(true);
  };

  // Client: send the explored change to the approvers instead of applying it.
  const handleSubmitRequest = async (payload) => {
    try {
      await submitChangeRequest(1, payload);
      showToast('Request sent. The project manager and finance lead will see it on the board and under Change requests.', 'success');
      await loadRequests();
      setSimulationData(null);
      setDroppedTaskIds([]);
      setSimulationDrawerOpen(false);
      setInspectorOpen(true);
      onRequestsChanged?.();
    } catch (err) {
      showToast('Could not send the request: ' + err.message, 'error');
    }
  };

  // Approver deciding a request from the task inspector (same rules as the Change requests page).
  const handleDecideRequest = async (request, mode, note) => {
    try {
      if (mode === 'approve') await approveChangeRequest(1, request.id, note);
      else await rejectChangeRequest(1, request.id, note);
      showToast(mode === 'approve' ? 'Request approved. The plan and budget are updated.' : 'Request rejected.', 'success');
      onRequestsChanged?.();
      await loadRequests();
      if (mode === 'approve') {
        // Keep the inspector on the same task, now with its updated hours and cost.
        const fresh = await loadBoardData();
        const updated = fresh?.tasks?.find((t) => t.id === request.targetTaskId);
        if (updated) setSelectedTask(updated);
      }
      return true;
    } catch (err) {
      showToast('Could not save the decision: ' + err.message, 'error');
      await loadRequests(); // someone else may have decided it already
      return false;
    }
  };

  // Team member / project manager: record progress on the selected task.
  const handleChangeStatus = async (task, status) => {
    try {
      await updateTaskStatus(1, task.id, status);
      const fresh = await loadBoardData();
      const updated = fresh?.tasks?.find((t) => t.id === task.id);
      if (updated) setSelectedTask(updated);
      showToast(`“${task.title}” marked as ${status === 'COMPLETED' ? 'done' : status === 'IN_PROGRESS' ? 'in progress' : 'not started'}.`, 'success');
      return true;
    } catch (err) {
      showToast('Could not update progress: ' + err.message, 'error');
      return false;
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
      showToast('Change approved and saved to the change history.', 'success');
      onRequestsChanged?.();
      loadRequests();
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
      await loadRequests();
      onRequestsChanged?.();
      showToast('Sample data restored. Earlier requests and approvals were cleared.', 'success');
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
    const links = (taskData.dependsOnTaskIds?.length || 0) + (taskData.neededByTaskIds?.length || 0);
    showToast(`Task "${taskData.title}" added${links ? ` and linked to ${links} task${links === 1 ? '' : 's'}` : ''}.`, 'success');
    await loadBoardData();
  };

  // Create dependency
  const handleCreateDependency = async (depData) => {
    await createTaskDependency(1, depData);
    showToast('Tasks linked.', 'success');
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
        onResetDemo={can(user, 'reset') ? handleResetDemo : undefined}
        onOpenAddModal={can(user, 'editPlan') ? () => setIsAddModalOpen(true) : undefined}
        isLiveApi={!errorMsg && !isOffline}
        onOpenHelp={onStartTour}
      />

      {/* Metrics Banner */}
      <MetricsBanner
        project={board}
        simulationData={simulationData}
        taskCount={board?.tasks?.length || 0}
        tasks={board?.tasks || []}
      />

      {/* Error banner */}
      {(errorMsg || isOffline) && (
        <div style={{
          padding: '8px 24px',
          background: 'color-mix(in srgb, var(--accent-coral) 8%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--accent-coral) 20%, transparent)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13,
          color: 'var(--accent-coral)',
        }}>
          <span>⚠</span>
          <span>Can’t reach the server, so you’re seeing sample data. Changes you make here won’t be saved.</span>
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
          {showBoardTip && !isLoading && !selectedTask && (
            <div
              role="note"
              style={{
                position: 'absolute', top: 16, left: 16, zIndex: 25, maxWidth: 420,
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', fontSize: 13, color: 'var(--text-secondary)',
              }}
            >
              <span aria-hidden="true" style={{ color: 'var(--accent-cyan)', fontSize: 16, lineHeight: 1.2 }}>💡</span>
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> click any task to see its details, then
                choose <em>Explore a change</em> to see what it would cost. Arrows show which tasks depend on others.
              </span>
              <button
                type="button"
                className="sl-btn sl-btn-ghost sl-icon-btn"
                aria-label="Dismiss tip"
                onClick={() => {
                  setShowBoardTip(false);
                  try { localStorage.setItem('scopeledger.tip.board', 'dismissed'); } catch { /* ignore */ }
                }}
                style={{ minHeight: 24, minWidth: 24, padding: 2 }}
              >
                ×
              </button>
            </div>
          )}
          {isLoading ? (
            <BoardSkeleton />
          ) : (
            <DependencyBoardCanvas
              tasks={board?.tasks || []}
              dependencies={board?.dependencies || []}
              selectedTaskId={selectedTask?.id}
              simulationData={simulationData}
              droppedTaskIds={droppedTaskIds}
              pendingByTask={pendingByTask}
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
            pendingRequests={pendingRequests.filter((r) => r.targetTaskId === selectedTask.id)}
            canDecide={can(user, 'approve')}
            onDecideRequest={handleDecideRequest}
            canUpdateProgress={can(user, 'progress')}
            onChangeStatus={handleChangeStatus}
          />
        )}

        {/* Simulation Drawer (Dev2 component — do not modify) */}
        {simulationDrawerOpen && selectedTask && (
          <SimulationDrawer
            targetTask={selectedTask}
            simulationData={simulationData}
            onSimulate={handleSimulate}
            onCommit={handleCommitRequest}
            onRequest={handleSubmitRequest}
            action={action}
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
        title="Approve this change?"
        message={`This updates "${selectedTask?.title}", removes any extras you switched off, and adjusts the agreed budget and timeline. It is recorded in the change history and cannot be undone.`}
        onConfirm={handleConfirmCommit}
        onCancel={handleCancelCommit}
      />

      {/* Add Task / Link Dependency Modal */}
      <AddTaskDependencyModal
        isOpen={isAddModalOpen}
        tasks={board?.tasks || []}
        dependencies={board?.dependencies || []}
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
