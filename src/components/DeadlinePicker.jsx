import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/useApp'
import { Check, X } from 'lucide-react'

export default function DeadlinePicker({ task, phase, onClose }) {
  const { updateState } = useApp()
  const [mode, setMode] = useState(task.deadline ? 'date' : 'days')
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.type === 'number') inputRef.current.select()
    }
  }, [mode])

  function save() {
    let updates = {}
    if (mode === 'days') {
      const days = parseInt(inputRef.current?.value)
      if (!isNaN(days) && days > 0) updates = { duration: days, deadline: null }
    } else {
      const date = inputRef.current?.value
      if (date) updates = { deadline: date, duration: null }
    }
    if (Object.keys(updates).length) {
      updateState(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phase.id
            ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, ...updates } : t) }
            : p
        ),
      }))
    }
    onClose()
  }

  function clear() {
    updateState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phase.id
          ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, deadline: null, duration: null } : t) }
          : p
      ),
    }))
    onClose()
  }

  const hasDl = !!(task.deadline || task.duration)

  return (
    <div className="dl-picker-row">
      <div className="dp-toggle">
        <button className={`dp-tab${mode === 'days' ? ' active' : ''}`} onClick={() => setMode('days')}>Days</button>
        <button className={`dp-tab${mode === 'date' ? ' active' : ''}`} onClick={() => setMode('date')}>Date</button>
      </div>

      {mode === 'days' ? (
        <>
          <input
            ref={inputRef}
            className="dp-num"
            type="number"
            min={1}
            max={365}
            defaultValue={task.duration || ''}
            placeholder="e.g. 7"
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
          />
          <span className="dp-unit">days to complete</span>
        </>
      ) : (
        <input
          ref={inputRef}
          className="dp-date"
          type="date"
          defaultValue={task.deadline || ''}
          onKeyDown={e => { if (e.key === 'Escape') onClose() }}
        />
      )}

      <button className="t-confirm-btn ok"     onClick={save}><Check size={13} /></button>
      <button className="t-confirm-btn cancel" onClick={onClose}><X size={13} /></button>
      {hasDl && <button className="dp-clear-btn" onClick={clear}>clear</button>}
    </div>
  )
}
