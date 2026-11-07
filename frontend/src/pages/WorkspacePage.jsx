// frontend/src/pages/WorkspacePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import TopNavBar from '../components/layout/TopNavBar';
import MetricsBanner from '../components/layout/MetricsBanner';
import DependencyBoardCanvas from '../components/board/DependencyBoardCanvas';
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

export default function WorkspacePage() {
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Modals & Panels
  const [selectedTask, setSelectedTask] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [changeOrders, setChangeOrders] = useState([]);
  const [droppedTaskIds, setDroppedTaskIds] = useState([]);

  // Toast notification helper
  const showToast = (message, type = "info") => {
    setToastMsg({ text: message, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Load project board data
  const loadBoardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchProjectBoard(1);
      setBoard(data);
    } catch (err) {
      setErrorMsg("Failed to connect to backend: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // When a task is clicked on the canvas
  const handleSelectTask = async (task) => {
    setSelectedTask(task);
    setDroppedTaskIds([]);

    // Automatically trigger initial dry-run simulation for the target deliverable
    try {
      const sim = await simulateChangeOrder(1, {
        targetTaskId: task.id,
        changeDescription: `Scope modification for ${task.title}`,
        addedHours: 12,
        addedDays: 2,
        droppedOptionalTaskIds: []
      });
      setSimulationData(sim);
    } catch (err) {
      console.warn("Simulation failed:", err.message);
    }
  };

  // When user clicks 'Run Simulation' or toggles trade-offs inside SimulationDrawer
  const handleSimulate = async (payload) => {
    setDroppedTaskIds(payload.droppedOptionalTaskIds || []);
    try {
      const sim = await simulateChangeOrder(1, payload);
      setSimulationData(sim);
    } catch (err) {
      showToast("Simulation calculation failed: " + err.message, "error");
    }
  };

  // When user clicks 'Commit Scope' inside SimulationDrawer
  const handleCommit = async (payload) => {
    try {
      await commitChangeOrder(1, payload);
      showToast("Scope change committed successfully to project ledger!", "success");
      setSelectedTask(null);
      setSimulationData(null);
      setDroppedTaskIds([]);
      await loadBoardData();
    } catch (err) {
      showToast("Commit failed: " + err.message, "error");
    }
  };

  // Handle Demo Reset
  const handleResetDemo = async () => {
    try {
      await resetDemoData();
      setSelectedTask(null);
      setSimulationData(null);
      setDroppedTaskIds([]);
      await loadBoardData();
      showToast("Demo project data reset to initial 8-node baseline state.", "success");
    } catch (err) {
      showToast("Reset failed: " + err.message, "error");
    }
  };

  // Handle Open Audit Log
  const handleOpenAudit = async () => {
    try {
      const logs = await fetchChangeOrders(1);
      setChangeOrders(logs || []);
    } catch {
      setChangeOrders([]);
    }
    setIsAuditModalOpen(true);
  };

  // Handle Add Task
  const handleCreateTask = async (taskData) => {
    await createDeliverableTask(1, taskData);
    showToast(`Task "${taskData.title}" created.`, "success");
    await loadBoardData();
  };

  // Handle Add Dependency Link
  const handleCreateDependency = async (depData) => {
    await createTaskDependency(1, depData);
    showToast("Dependency edge connected.", "success");
    await loadBoardData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Header Navigation */}
      <TopNavBar
        projectName={board?.name || "ScopeLedger Project"}
        onResetDemo={handleResetDemo}
        onOpenAuditLog={handleOpenAudit}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isLiveApi={!errorMsg}
      />

      {/* Metrics Ledger KPI Banner */}
      <MetricsBanner
        project={board}
        simulationData={simulationData}
        taskCount={board?.tasks?.length || 0}
      />

      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-2.5 rounded-lg border font-mono text-xs shadow-2xl flex items-center gap-2 ${
            toastMsg.type === "error"
              ? "bg-rose-950/90 border-rose-700 text-rose-200"
              : toastMsg.type === "success"
                ? "bg-emerald-950/90 border-emerald-700 text-emerald-200"
                : "bg-slate-900 border-slate-700 text-slate-200"
          }`}>
            <span>{toastMsg.type === "success" ? "✓" : toastMsg.type === "error" ? "⚠" : "ℹ"}</span>
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center font-mono text-xs text-slate-400 gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            Loading Deliverable Dependency DAG...
          </div>
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

        {/* Slide-over Change Order Simulation Drawer (Dev2 Component) */}
        {selectedTask && (
          <SimulationDrawer
            targetTask={selectedTask}
            simulationData={simulationData}
            onSimulate={handleSimulate}
            onCommit={handleCommit}
            onClose={() => {
              setSelectedTask(null);
              setSimulationData(null);
              setDroppedTaskIds([]);
            }}
          />
        )}
      </main>

      {/* Add Task / Add Dependency Modal */}
      <AddTaskDependencyModal
        isOpen={isAddModalOpen}
        tasks={board?.tasks || []}
        onClose={() => setIsAddModalOpen(false)}
        onCreateTask={handleCreateTask}
        onCreateDependency={handleCreateDependency}
      />

      {/* Change Order History / Audit Log Modal */}
      <ChangeOrderHistoryModal
        isOpen={isAuditModalOpen}
        changeOrders={changeOrders}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
