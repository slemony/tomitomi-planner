import { useRef, useEffect, useState } from 'react'
import { useApp } from '../context/useApp'
import {
  fmtDeadlineBadge, getDeadlineClass,
  getTaskLoggedMin, fmtDuration, fmtDate, uid, toISO,
} from '../lib/utils'
import { Check, X, Clock, Pencil, MoreHorizontal, Play, Timer } from 'lucide-react'
import DeadlinePicker from './DeadlinePicker'

export default function TaskItem({
  task, phase,
  editingTaskId, setEditingTaskId,
  editingDeadlineId, setEditingDeadlineId,
}) {
  const {
    appState, updateState,
    enterFocus, addTimeEntry, deleteTimeEntry,
  } = useApp()

  const inputRef = useRef(null)
  const moreRef  = useRef(null)

  const isEditing   = editingTaskId?.taskId === task.id
  const isEditingDl = editingDeadlineId === task.id
  const checked     = !!appState.completedTasks[task.id]
  const hasDl       = !!(task.deadline || task.duration)

  const [menuOpen,     setMenuOpen]     = useState(false)
  const [menuPos,      setMenuPos]      = useState({ top: 0, right: 0 })
  const [showLog,      setShowLog]      = useState(false)
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [, setTick]                    = useState(0)  // for badge refresh

  // ── Add-entry form fields ──
  const todayISO = toISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const [entryDate,  setEntryDate]  = useState(todayISO)
  const [entryHours, setEntryHours] = useState(0)
  const [entryMin,   setEntryMin]   = useState(30)
  const [entryNote,  setEntryNote]  = useState('')

  // ── Inline-edit state for existing entries ──
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editDate,  setEditDate]  = useState('')
  const [editHours, setEditHours] = useState(0)
  const [editMin,   setEditMin]   = useState(0)
  const [editNote,  setEditNote]  = useState('')

  // Derived: is this task's timer running?
  const isTimerRunning = appState.activeTimer?.taskId === task.id
  const totalMin       = getTaskLoggedMin(task, appState.activeTimer)
  const hasTime        = isTimerRunning || totalMin > 0

  // Refresh badge every 30 s while this task's timer is running
  useEffect(() => {
    if (!isTimerRunning) return
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [isTimerRunning])

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

  function openFocus() {
    enterFocus(phase.id, task.id)
  }

  function toggleLog() {
    setShowLog(v => !v)
    setShowAddForm(false)
    setEditingEntryId(null)
  }

  function openAddForm() {
    setEntryDate(todayISO)
    setEntryHours(0)
    setEntryMin(30)
    setEntryNote('')
    setEditingEntryId(null)
    setShowAddForm(true)
    setShowLog(true)
  }

  function saveEntry() {
    const minutes = (parseInt(entryHours, 10) || 0) * 60 + (parseInt(entryMin, 10) || 0)
    if (minutes < 1) return
    addTimeEntry(phase.id, task.id, {
      id:      uid(),
      date:    entryDate || todayISO,
      minutes,
      note:    entryNote.trim(),
      source:  'manual',
    })
    setShowAddForm(false)
  }

  function startEditEntry(entry) {
    setEditingEntryId(entry.id)
    setEditDate(entry.date)
    setEditHours(Math.floor(entry.minutes / 60))
    setEditMin(entry.minutes % 60)
    setEditNote(entry.note || '')
    setShowAddForm(false)
  }

  function saveEditEntry(entryId) {
    const minutes = (parseInt(editHours, 10) || 0) * 60 + (parseInt(editMin, 10) || 0)
    if (minutes < 1) return
    updateState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phase.id
          ? {
              ...p, tasks: p.tasks.map(t =>
                t.id === task.id
                  ? {
                      ...t, timeEntries: (t.timeEntries || []).map(e =>
                        e.id === entryId
                          ? { ...e, date: editDate || todayISO, minutes, note: editNote.trim() }
                          : e
                      )
                    }
                  : t
              )
            }
          : p
      ),
    }))
    setEditingEntryId(null)
  }

  // ── Editing view ────────────────────────────────────────────────────────
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
  const entries    = task.timeEntries || []

  return (
    <>
      {/* ── Main task row ── */}
      <div className={`task-row${isTimerRunning ? ' timing' : ''}`}>
        <input
          className="t-cb"
          type="checkbox"
          id={`cb${task.id}`}
          checked={checked}
          onChange={toggleTask}
        />
        {/* Cell: title + badges — stacks vertically on mobile so title never wraps */}
        <div className="t-cell">
          <label className={`t-text${checked ? ' done' : ''}`} htmlFor={`cb${task.id}`}>
            {task.text}
          </label>

          {(hasDl || hasTime) && (
            <div className="t-badges">
              {hasDl && (
                <span
                  className={`t-dl-badge${badgeClass ? ' ' + badgeClass : ''}`}
                  onClick={openDeadlinePicker}
                  title="Edit deadline"
                >
                  {fmtDeadlineBadge(task)}
                </span>
              )}
              {hasTime && (
                <span
                  className={`t-time-badge${isTimerRunning ? ' running' : ''}`}
                  onClick={toggleLog}
                  title="View time log"
                >
                  <Clock size={11} />
                  {isTimerRunning && !totalMin ? '● Running' : fmtDuration(totalMin)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop: action buttons */}
        <div className="t-actions">
          <button className="t-btn" onClick={openFocus}          title="Focus & Timer"><Play size={13} /></button>
          <button className="t-btn" onClick={toggleLog}          title="Time log"><Timer size={13} /></button>
          <button className="t-btn" onClick={openDeadlinePicker} title="Set deadline"><Clock size={13} /></button>
          <button className="t-btn" onClick={() => setEditingTaskId({ taskId: task.id, isNew: false })} title="Edit"><Pencil size={13} /></button>
          <button className="t-btn del" onClick={deleteTask}     title="Delete"><X size={13} /></button>
        </div>

        {/* Mobile: ⋯ button */}
        <button ref={moreRef} className="t-more-btn" onClick={openMenu} aria-label="Task actions">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* ── Time log panel ── */}
      {showLog && !showAddForm && (
        <div className="time-log-panel">
          <div className="time-log-header">
            <span>⏱ Time log</span>
            <div className="time-log-header-right">
              {totalMin > 0 && <span className="time-log-total">Total: {fmtDuration(totalMin)}</span>}
              <button className="time-entry-del" onClick={() => setShowLog(false)} title="Close"><X size={11} /></button>
            </div>
          </div>

          {entries.length === 0 && !isTimerRunning && (
            <div className="time-log-empty">No time logged yet.</div>
          )}

          {isTimerRunning && (
            <div className="time-entry-row">
              <span className="time-entry-date">Now</span>
              <span className="time-entry-dur" style={{ color: '#15803d' }}>● Running</span>
              <span className="time-entry-note">Timer active</span>
            </div>
          )}

          {entries.map(e => {
            if (editingEntryId === e.id) {
              return (
                <div key={e.id} className="time-entry-row editing">
                  <input
                    type="date"
                    className="te-edit-date"
                    value={editDate}
                    max={todayISO}
                    onChange={ev => setEditDate(ev.target.value)}
                  />
                  <div className="tef-dur compact">
                    <input type="number" min="0" max="23" value={editHours} onChange={ev => setEditHours(ev.target.value)} />
                    <span>h</span>
                    <input type="number" min="0" max="59" value={editMin}   onChange={ev => setEditMin(ev.target.value)} />
                    <span>m</span>
                  </div>
                  <input
                    type="text"
                    className="te-edit-note"
                    placeholder="Note…"
                    value={editNote}
                    onChange={ev => setEditNote(ev.target.value)}
                    onKeyDown={ev => {
                      if (ev.key === 'Enter')  saveEditEntry(e.id)
                      if (ev.key === 'Escape') setEditingEntryId(null)
                    }}
                  />
                  <button className="time-entry-del ok" onClick={() => saveEditEntry(e.id)} title="Save"><Check size={11} /></button>
                  <button className="time-entry-del"    onClick={() => setEditingEntryId(null)} title="Cancel"><X size={11} /></button>
                </div>
              )
            }
            return (
              <div key={e.id} className="time-entry-row">
                <span className="time-entry-date">{fmtDate(e.date)}</span>
                <span className="time-entry-dur">{fmtDuration(e.minutes)}</span>
                <span className="time-entry-note" title={e.note}>{e.note || '—'}</span>
                <button className="time-entry-edit" onClick={() => startEditEntry(e)} title="Edit entry"><Pencil size={11} /></button>
                <button className="time-entry-del"  onClick={() => deleteTimeEntry(phase.id, task.id, e.id)} title="Delete entry"><X size={11} /></button>
              </div>
            )
          })}

          <button className="time-log-add-btn" onClick={openAddForm}>+ Add entry</button>
        </div>
      )}

      {/* ── Manual entry form ── */}
      {showLog && showAddForm && (
        <div className="time-entry-form">
          <div className="tef-row">
            <label>Date</label>
            <input
              type="date"
              value={entryDate}
              max={todayISO}
              onChange={e => setEntryDate(e.target.value)}
            />
          </div>
          <div className="tef-row">
            <label>Duration</label>
            <div className="tef-dur">
              <input
                type="number" min="0" max="23"
                value={entryHours}
                onChange={e => setEntryHours(e.target.value)}
              />
              <span>h</span>
              <input
                type="number" min="0" max="59"
                value={entryMin}
                onChange={e => setEntryMin(e.target.value)}
              />
              <span>min</span>
            </div>
          </div>
          <div className="tef-row">
            <label>Note</label>
            <input
              type="text"
              placeholder="What did you work on?"
              value={entryNote}
              onChange={e => setEntryNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveEntry()}
            />
          </div>
          <div className="tef-actions">
            <button className="tef-btn"    onClick={() => setShowAddForm(false)}>Cancel</button>
            <button className="tef-btn ok" onClick={saveEntry}>Save ✓</button>
          </div>
        </div>
      )}

      {/* ── Mobile overflow dropdown ── */}
      {menuOpen && (
        <>
          <div className="t-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="t-menu" style={{ top: menuPos.top, right: menuPos.right }}>
            <button className="t-menu-item" onClick={() => { openFocus(); setMenuOpen(false) }}>
              🎯 Focus &amp; Timer
            </button>
            <button className="t-menu-item" onClick={() => { setShowLog(true); setShowAddForm(false); setEditingEntryId(null); setMenuOpen(false) }}>
              🕐 Time log
            </button>
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
