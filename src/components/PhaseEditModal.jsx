import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/useApp'
import { DEFAULT_PHASES } from '../lib/defaultData'
import { Plus, Pencil, CalendarDays, Calendar } from 'lucide-react'

const PHASE_COLORS = [
  { color: '#f4845f', light: '#fde8df' },
  { color: '#f5a623', light: '#fef3cd' },
  { color: '#50b86c', light: '#e6f4ea' },
  { color: '#4a9edd', light: '#ddeeff' },
  { color: '#a27be8', light: '#ede6fa' },
  { color: '#e84a8a', light: '#fce3f0' },
  { color: '#00bcd4', light: '#e0f7fa' },
  { color: '#795548', light: '#efebe9' },
]

export default function PhaseEditModal({ phaseId, onClose }) {
  const { appState, updateState } = useApp()
  const phases        = appState.phases || DEFAULT_PHASES
  const existingPhase = phaseId != null ? phases.find(p => p.id === phaseId) : null
  const isNew         = !existingPhase

  const nameRef = useRef(null)
  const nextWk  = phases.length ? Math.max(...phases.map(p => p.weekEnd || 0)) + 1 : 1

  const [emoji,     setEmoji]     = useState(existingPhase?.emoji     ?? '📌')
  const [name,      setName]      = useState(existingPhase?.name      ?? '')
  const [tfMode,    setTfMode]    = useState(existingPhase?.useDates  ? 'dates' : 'weeks')
  const [wkStart,   setWkStart]   = useState(existingPhase?.weekStart ?? nextWk)
  const [wkEnd,     setWkEnd]     = useState(existingPhase?.weekEnd   ?? nextWk + 1)
  const [dateStart, setDateStart] = useState(existingPhase?.dateStart ?? '')
  const [dateEnd,   setDateEnd]   = useState(existingPhase?.dateEnd   ?? '')

  useEffect(() => { if (isNew) nameRef.current?.focus() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    const trimName = name.trim()
    if (!trimName) { nameRef.current?.focus(); return }

    const tf = tfMode === 'dates'
      ? { useDates: true,  dateStart, dateEnd, weekStart: +wkStart, weekEnd: +wkEnd }
      : { useDates: false, weekStart: +wkStart, weekEnd: +wkEnd, dateStart: null, dateEnd: null }

    if (isNew) {
      const ci = phases.length % PHASE_COLORS.length
      const newPhase = {
        id: Date.now(),
        emoji: emoji.trim() || '📌',
        name: trimName,
        color: PHASE_COLORS[ci].color,
        light: PHASE_COLORS[ci].light,
        tasks: [],
        ...tf,
      }
      updateState(prev => ({
        ...prev,
        phases: [...(prev.phases || DEFAULT_PHASES), newPhase],
      }))
    } else {
      updateState(prev => ({
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phaseId
            ? { ...p, emoji: emoji.trim() || '📌', name: trimName, ...tf }
            : p
        ),
      }))
    }
    onClose()
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="overlay open" onClick={handleOverlayClick}>
      <div className="panel">
        <div className="panel-title">
          {isNew
            ? <><Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />New Phase</>
            : <><Pencil size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Edit Phase</>
          }
        </div>

        {/* Emoji + Name */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--muted)', marginBottom: 5 }}>
              Emoji
            </label>
            <input
              type="text"
              className="emoji-input"
              maxLength={2}
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              placeholder="📌"
            />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Phase Name</label>
            <input
              ref={nameRef}
              type="text"
              maxLength={40}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Brand Identity"
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </div>
        </div>

        {/* Timeframe toggle */}
        <div style={{ marginBottom: 4 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--muted)', marginBottom: 6 }}>
            Timeframe
          </label>
          <div className="tf-toggle">
            <button className={`tf-btn${tfMode === 'weeks' ? ' active' : ''}`} onClick={() => setTfMode('weeks')}>
              <CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Weeks
            </button>
            <button className={`tf-btn${tfMode === 'dates' ? ' active' : ''}`} onClick={() => setTfMode('dates')}>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Specific Dates
            </button>
          </div>
        </div>

        {tfMode === 'weeks' && (
          <div className="field">
            <label>
              Week Range{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                (relative to project start)
              </span>
            </label>
            <div className="wk-range-row">
              <span>Week</span>
              <input type="number" min={1} max={52} value={wkStart} onChange={e => setWkStart(e.target.value)} />
              <span>to Week</span>
              <input type="number" min={1} max={52} value={wkEnd}   onChange={e => setWkEnd(e.target.value)} />
            </div>
          </div>
        )}

        {tfMode === 'dates' && (
          <div className="tf-date-row">
            <div className="field">
              <label>Start Date</label>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div className="field">
              <label>End Date</label>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
          </div>
        )}

        <div className="actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"   onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
