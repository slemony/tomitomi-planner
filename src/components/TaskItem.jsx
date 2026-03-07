import { useRef, useEffect, useState } from 'react'
import { useApp } from '../context/useApp'
import { fmtDeadlineBadge, getDeadlineClass } from '../lib/utils'
import { Check, X, Clock, Pencil, MoreHorizontal } from 'lucide-react'
import DeadlinePicker from './DeadlinePicker'

export default function TaskItem({
  task, phase,
  editingTaskId, setEditingTaskId,
  editingDeadlineId, setEditingDeadlineId,
}) {
  const { appState, updateState } = useApp()
  const inputRef = useRef(null)
  const moreRef  = useRef(null)

  const isEditing   = editingTaskId?.taskId === task.id
  const isEditingDl = editingDeadlineId === task.id
  const checked     = !!appState.completedTasks[task.id]
  const hasDl       = !!(task.deadline || task.duration)

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (!editingTaskId?.isNew) inputRef.current.select()
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu if editing starts
  useEffect(() => {
    if (isEditing || isEditingDl) setMenuOpen(false)
  }, [isEditing, isEditingDl])

  function toggleTask() {
    updateState(prev => ({
      ...prev,
      completedTasks: { ...prev.completedTasks, [task.id]: !prev.completedTasks[task.id] },
    }))
  }

  function saveEdit(value) {
    const text = value.trim()
    if (text) {
      updateState(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phase.id
            ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, text } : t) }
            : p
        ),
      }))
    } else if (editingTaskId?.isNew) {
      updateState(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phase.id
            ? { ...p, tasks: p.tasks.filter(t => t.id !== task.id) }
            : p
        ),
      }))
    }
    setEditingTaskId(null)
  }

  function cancelEdit() {
    if (editingTaskId?.isNew) {
      updateState(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phase.id
            ? { ...p, tasks: p.tasks.filter(t => t.id !== task.id) }
            : p
        ),
      }))
    }
    setEditingTaskId(null)
  }

  function deleteTask() {
    updateState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phase.id
          ? { ...p, tasks: p.tasks.filter(t => t.id !== task.id) }
          : p
      ),
      completedTasks: Object.fromEntries(
        Object.entries(prev.completedTasks).filter(([k]) => k !== task.id)
      ),
    }))
  }

  function openDeadlinePicker() {
    setEditingTaskId(null)
    setEditingDeadlineId(task.id)
  }

  function openMenu() {
    if (!moreRef.current) return
    const r = moreRef.current.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    setMenuOpen(true)
  }

  if (isEditing) {
    return (
      <div className="task-row editing">
        <input className="t-cb" type="checkbox" disabled />
        <input
          ref={inputRef}
          className="t-edit-input"
          defaultValue={task.text}
          placeholder="Task name…"
          onKeyDown={e => {
            if (e.key === 'Enter')  saveEdit(e.target.value)
            if (e.key === 'Escape') cancelEdit()
          }}
        />
        <div className="t-edit-btns">
          <button className="t-confirm-btn ok"     onClick={() => saveEdit(inputRef.current?.value || '')}><Check size={13} /></button>
          <button className="t-confirm-btn cancel" onClick={cancelEdit}><X size={13} /></button>
        </div>
      </div>
    )
  }

  const badgeClass = hasDl ? getDeadlineClass(task) : ''

  return (
    <>
      <div className="task-row">
        <input
          className="t-cb"
          type="checkbox"
          id={`cb${task.id}`}
          checked={checked}
          onChange={toggleTask}
        />
        <label className={`t-text${checked ? ' done' : ''}`} htmlFor={`cb${task.id}`}>
          {task.text}
        </label>
        {hasDl && (
          <span
            className={`t-dl-badge${badgeClass ? ' ' + badgeClass : ''}`}
            onClick={openDeadlinePicker}
            title="Edit deadline"
          >
            {fmtDeadlineBadge(task)}
          </span>
        )}

        {/* Desktop: 3-button hover cluster */}
        <div className="t-actions">
          <button className="t-btn" onClick={openDeadlinePicker} title="Set deadline"><Clock size={13} /></button>
          <button className="t-btn" onClick={() => setEditingTaskId({ taskId: task.id, isNew: false })} title="Edit"><Pencil size={13} /></button>
          <button className="t-btn del" onClick={deleteTask} title="Delete"><X size={13} /></button>
        </div>

        {/* Mobile: single ⋯ button */}
        <button ref={moreRef} className="t-more-btn" onClick={openMenu} aria-label="Task actions">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Mobile overflow dropdown (fixed-position to escape overflow:auto containers) */}
      {menuOpen && (
        <>
          <div className="t-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="t-menu" style={{ top: menuPos.top, right: menuPos.right }}>
            <button className="t-menu-item" onClick={() => { openDeadlinePicker(); setMenuOpen(false) }}>
              <Clock size={14} /> Set deadline
            </button>
            <button className="t-menu-item" onClick={() => { setEditingTaskId({ taskId: task.id, isNew: false }); setMenuOpen(false) }}>
              <Pencil size={14} /> Edit
            </button>
            <button className="t-menu-item del" onClick={() => { deleteTask(); setMenuOpen(false) }}>
              <X size={14} /> Delete
            </button>
          </div>
        </>
      )}

      {isEditingDl && (
        <DeadlinePicker
          task={task}
          phase={phase}
          onClose={() => setEditingDeadlineId(null)}
        />
      )}
    </>
  )
}
