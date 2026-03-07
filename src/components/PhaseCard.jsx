import { useState } from 'react'
import { useApp } from '../context/useApp'
import { fmtDate, uid } from '../lib/utils'
import { Check, ChevronDown, Pencil, X } from 'lucide-react'
import TaskItem from './TaskItem'

export default function PhaseCard({ phase, onEdit }) {
  const { appState, updateState } = useApp()
  const [editingTaskId,     setEditingTaskId]     = useState(null) // { taskId, isNew } | null
  const [editingDeadlineId, setEditingDeadlineId] = useState(null) // taskId | null

  const isOpen  = !!appState.openPhases[phase.id]
  const done    = phase.tasks.filter(t => appState.completedTasks[t.id]).length
  const total   = phase.tasks.length
  const pct     = total ? (done / total) * 100 : 0
  const allDone = done === total && total > 0

  const rangeLabel = (phase.useDates && phase.dateStart && phase.dateEnd)
    ? `${fmtDate(phase.dateStart)} – ${fmtDate(phase.dateEnd)}`
    : `Wk ${phase.weekStart}–${phase.weekEnd}`

  function togglePhase() {
    updateState(prev => ({
      ...prev,
      openPhases: { ...prev.openPhases, [phase.id]: !prev.openPhases[phase.id] },
    }))
  }

  function deletePhase() {
    if (!confirm(`Delete phase "${phase.name}"?`)) return
    updateState(prev => ({
      ...prev,
      phases: prev.phases.filter(p => p.id !== phase.id),
    }))
  }

  function addTask() {
    const newId = uid()
    updateState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phase.id
          ? { ...p, tasks: [...p.tasks, { id: newId, text: '' }] }
          : p
      ),
      openPhases: { ...prev.openPhases, [phase.id]: true },
    }))
    setEditingTaskId({ taskId: newId, isNew: true })
  }

  return (
    <div
      className="phase-card"
      style={allDone ? { background: 'linear-gradient(90deg,#f8fef9,#fffef5)' } : undefined}
    >
      <div className="phase-header-wrap">
        <button className="phase-header" onClick={togglePhase}>
          <span className="ph-emoji">{phase.emoji}</span>
          <div className="ph-info">
            <div className="ph-name">{phase.name}</div>
            <div className="ph-sub">{rangeLabel} · {done}/{total}</div>
          </div>
          {allDone
            ? <span className="ph-done-tag"><Check size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />Done</span>
            : (
              <div className="ph-bar-wrap">
                <div className="ph-bar-fill" style={{ width: `${pct}%`, background: phase.color }} />
              </div>
            )
          }
          <span className={`ph-chevron${isOpen ? ' open' : ''}`}><ChevronDown size={14} /></span>
        </button>
        <div className="ph-actions">
          <button className="t-btn" onClick={onEdit} title="Edit phase"><Pencil size={13} /></button>
          <button className="t-btn del" onClick={deletePhase} title="Delete phase"><X size={13} /></button>
        </div>
      </div>

      <div className={`task-list${isOpen ? ' open' : ''}`}>
        {phase.tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            phase={phase}
            editingTaskId={editingTaskId}
            setEditingTaskId={setEditingTaskId}
            editingDeadlineId={editingDeadlineId}
            setEditingDeadlineId={setEditingDeadlineId}
          />
        ))}
        <div className="add-task-row">
          <button className="add-task-btn" onClick={addTask}>+ Add task</button>
        </div>
      </div>
    </div>
  )
}
