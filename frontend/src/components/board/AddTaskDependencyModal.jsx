// frontend/src/components/board/AddTaskDependencyModal.jsx
import React, { useState } from 'react';

export default function AddTaskDependencyModal({
  tasks = [],
  isOpen,
  onClose,
  onCreateTask,
  onCreateDependency
}) {
  const [tab, setTab] = useState("task"); // "task" | "dependency"

  // Task form state
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("NOT_STARTED");
  const [estimatedHours, setEstimatedHours] = useState(16);
  const [hourlyRate, setHourlyRate] = useState(1000);
  const [durationDays, setDurationDays] = useState(2);
  const [isOptional, setIsOptional] = useState(false);

  // Dependency form state
  const [prereqId, setPrereqId] = useState("");
  const [dependentId, setDependentId] = useState("");

  // Validation / Error state
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a deliverable title.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await onCreateTask({
        title,
        status,
        estimatedHours: Number(estimatedHours),
        hourlyRate: Number(hourlyRate),
        durationDays: Number(durationDays),
        isOptional,
        posX: 100 + (tasks.length % 3) * 340,
        posY: 180 + Math.floor(tasks.length / 3) * 190
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDependencySubmit = async (e) => {
    e.preventDefault();
    if (!prereqId || !dependentId) {
      setErrorMsg("Please select both a prerequisite and dependent task.");
      return;
    }
    if (prereqId === dependentId) {
      setErrorMsg("A task cannot depend on itself (self-cycle).");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await onCreateDependency({
        prerequisiteTaskId: Number(prereqId),
        dependentTaskId: Number(dependentId)
      });
      onClose();
    } catch (err) {
      // Highlights circular dependency error returned from Spring Boot DFS cycle check
      setErrorMsg(err.message || "Circular dependency loop detected. Link rejected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex gap-4">
            <button
              onClick={() => { setTab("task"); setErrorMsg(""); }}
              className={`text-xs font-mono font-semibold pb-1 border-b-2 transition-colors ${
                tab === "task" ? "border-cyan-400 text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              + Add Deliverable Task
            </button>
            <button
              onClick={() => { setTab("dependency"); setErrorMsg(""); }}
              className={`text-xs font-mono font-semibold pb-1 border-b-2 transition-colors ${
                tab === "dependency" ? "border-cyan-400 text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              + Link Dependency Edge
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
            <span className="text-rose-400 font-bold">⚠</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Create Task */}
        {tab === "task" && (
          <form onSubmit={handleTaskSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">Deliverable Title</label>
              <input
                type="text"
                placeholder="e.g. Payment Gateway Webhook Handler"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:border-cyan-400 outline-none"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase">Estimated Hours</label>
                <input
                  type="number"
                  min="1"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase">Hourly Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="optionalCheck"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="optionalCheck" className="text-slate-300 font-medium select-none cursor-pointer">
                Mark as Optional Work (Eligible for budget trade-offs)
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 font-mono text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 font-mono text-white font-medium shadow-lg shadow-cyan-950 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Link Dependency Edge */}
        {tab === "dependency" && (
          <form onSubmit={handleDependencySubmit} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                Prerequisite Deliverable (Upstream)
              </label>
              <select
                value={prereqId}
                onChange={(e) => setPrereqId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:border-cyan-400 outline-none font-mono"
              >
                <option value="">Select prerequisite task...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-slate-400 font-mono text-sm">
              ↓ depends on ↓
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                Dependent Deliverable (Downstream)
              </label>
              <select
                value={dependentId}
                onChange={(e) => setDependentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:border-cyan-400 outline-none font-mono"
              >
                <option value="">Select dependent task...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-slate-400">
              Note: The backend will run a Depth-First Search (DFS) to prevent cyclic dependency deadlocks.
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 font-mono text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 font-mono text-white font-medium shadow-lg shadow-cyan-950 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Linking..." : "Connect Edge"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
