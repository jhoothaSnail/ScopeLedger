// frontend/src/components/board/DependencyBoardCanvas.jsx
import React, { useState, useRef } from 'react';
import TaskCard from './TaskCard';

const CARD_WIDTH = 260;
const CARD_HEIGHT = 120;

export default function DependencyBoardCanvas({
  tasks = [],
  dependencies = [],
  selectedTaskId,
  simulationData,
  droppedTaskIds = [],
  onSelectTask
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  // Map tasks by ID for quick O(1) lookup
  const taskMap = React.useMemo(() => {
    const map = new Map();
    tasks.forEach(t => map.set(t.id, t));
    return map;
  }, [tasks]);

  // Build impacted tasks lookup: taskId -> ImpactedTaskDto
  const impactedMap = React.useMemo(() => {
    const map = new Map();
    if (simulationData?.impactedTasks) {
      simulationData.impactedTasks.forEach(item => {
        map.set(item.taskId, item);
      });
    }
    return map;
  }, [simulationData]);

  // Handle canvas dragging (Panning)
  const handleMouseDown = (e) => {
    // Only pan if clicking on empty canvas or SVG
    if (e.target.closest('.task-card') || e.target.closest('button')) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPosition({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.5));
  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 40, y: 40 });
  };

  return (
    <div
      ref={viewportRef}
      className="board-viewport relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom / Viewport Toolbar */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-sm transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <span className="text-[10px] font-mono text-slate-400 px-1 select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-sm transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <button
          onClick={handleResetView}
          className="px-2 h-7 rounded hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset Canvas View"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 backdrop-blur-md text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" /> Direct Change
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Downstream Rework
        </span>
      </div>

      {/* Pannable & Zoomable Canvas Workspace */}
      <div
        className={`board-container ${isPanning ? 'is-panning' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
        }}
      >
        {/* SVG Bezier Connectors Layer */}
        <svg className="board-svg-layer">
          <defs>
            {/* Standard Arrow Marker */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>

            {/* Impacted Rework Marker */}
            <marker
              id="arrow-rework"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>

            {/* Direct Change Marker */}
            <marker
              id="arrow-direct"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
          </defs>

          {dependencies.map((dep) => {
            const fromTask = taskMap.get(dep.prerequisiteTaskId);
            const toTask = taskMap.get(dep.dependentTaskId);

            if (!fromTask || !toTask) return null;

            // Connect from right edge of prerequisite to left edge of dependent
            const x1 = (fromTask.posX || 0) + CARD_WIDTH;
            const y1 = (fromTask.posY || 0) + (CARD_HEIGHT / 2);
            const x2 = toTask.posX || 0;
            const y2 = (toTask.posY || 0) + (CARD_HEIGHT / 2);

            // Compute control points for smooth horizontal S-curve
            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const isToTaskImpacted = impactedMap.has(toTask.id);
            const isFromTaskTarget = simulationData?.targetTaskId === fromTask.id;

            let pathClass = "connector-path";
            let marker = "url(#arrow-default)";

            if (isFromTaskTarget && isToTaskImpacted) {
              pathClass = "connector-path impacted-rework";
              marker = "url(#arrow-rework)";
            } else if (isToTaskImpacted) {
              pathClass = "connector-path impacted-rework";
              marker = "url(#arrow-rework)";
            }

            return (
              <g key={`dep-${dep.id || `${dep.prerequisiteTaskId}-${dep.dependentTaskId}`}`}>
                <path
                  d={pathData}
                  className={pathClass}
                  markerEnd={marker}
                />
              </g>
            );
          })}
        </svg>

        {/* HTML5 Task Nodes */}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            impactData={impactedMap.get(task.id)}
            isDropped={droppedTaskIds.includes(task.id)}
            onSelectTask={onSelectTask}
          />
        ))}

        {/* Empty state when project has no tasks */}
        {tasks.length === 0 && (
          <div className="absolute top-40 left-80 p-8 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">No tasks in this project yet</h3>
            <p className="text-xs text-slate-400">Click &ldquo;Add Node / Edge&rdquo; in the top navigation to add your first deliverable task.</p>
          </div>
        )}
      </div>
    </div>
  );
}
