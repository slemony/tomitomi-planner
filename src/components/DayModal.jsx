import { useState } from 'react'
import { useApp } from '../context/useApp'
import { phasesOnDate, getTasksWithDeadlineOn, fmtDate } from '../lib/utils'
import { X, Star } from 'lucide-react'

export default function DayModal({ dateStr, onClose }) {
  const { appState, phases, updateState } = useApp()

  const dayData      = appState.dayNotes[dateStr] || {}
  const [note,       setNote]      = useState(dayData.note      || '')
  const [milestone,  setMilestone] = useState(dayData.milestone || false)

  const activePhases   = phasesOnDate(dateStr, phases, appState.startDate)
  const tasksWithDl    = getTasksWithDeadlineOn(dateStr, phases, appState.startDate)

  function save() {
    if (!note.trim() && !milestone) {
      updateState(prev => {
        const { [dateStr]: _removed, ...rest } = prev.dayNotes
        return { ...prev, dayNotes: rest }
      })
    } else {
      updateState(prev => ({
        ...prev,
        dayNotes: { ...prev.dayNotes, [dateStr]: { note: note.trim(), milestone } },
      }))
    }
    onClose()
  }

  function clearDay() {
    updateState(prev => {
      const { [dateStr]: _removed, ...rest } = prev.dayNotes
      return { ...prev, dayNotes: rest }
    })
    onClose()
  }

  function toggleTask(taskId) {
    updateState(prev => ({
      ...prev,
      completedTasks: {
        ...prev.completedTasks,
        [taskId]: !prev.completedTasks[taskId],
      },
    }))
  }

  const displayDate = fmtDate(dateStr)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box day-modal-box">
        <div className="modal-header">
          <h2>{displayDate}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {activePhases.length > 0 && (
          <div className="day-modal-section">
            <div className="day-modal-label">Active phases</div>
            <div className="day-phase-tags">
              {activePhases.map(p => (
                <span key={p.id} className="day-phase-tag" style={{ background: p.color + '33', color: p.color }}>
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {tasksWithDl.length > 0 && (
          <div className="day-modal-section">
            <div className="day-modal-label">Due today</div>
            {tasksWithDl.map(({ task, phase }) => (
              <div key={task.id} className="day-task-row">
                <input
                  type="checkbox"
                  id={`dm${task.id}`}
                  checked={!!appState.completedTasks[task.id]}
                  onChange={() => toggleTask(task.id)}
                />
                <label htmlFor={`dm${task.id}`} className={appState.completedTasks[task.id] ? 'done' : ''}>
                  {task.text}
                  <span className="day-task-phase"> · {phase.emoji} {phase.name}</span>
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="day-modal-section">
          <div className="day-modal-label">Note</div>
          <textarea
            className="day-note-input"
            placeholder="Add a note for this day…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </div>

        <div className="day-modal-section">
          <label className="day-milestone-row">
            <input
              type="checkbox"
              checked={milestone}
              onChange={e => setMilestone(e.target.checked)}
            />
            <span className="day-milestone-label">
              Mark as milestone
              <Star size={13} fill={milestone ? 'currentColor' : 'none'} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
            </span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={clearDay}>Clear</button>
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
