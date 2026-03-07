import { useState } from 'react'
import { useApp } from '../context/useApp'
import {
  toISO, fromISO, phaseRange, phaseFirstVisible,
  phasesOnDate, getTasksWithDeadlineOn,
} from '../lib/utils'
import { ChevronLeft, ChevronRight, Bell, Star } from 'lucide-react'
import DayModal from './DayModal'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function DayCell({ dateStr, viewM, phaseFirstDays, onOpen }) {
  const { appState, phases } = useApp()
  const d = fromISO(dateStr)

  const today       = new Date(); today.setHours(0, 0, 0, 0)
  const isToday     = d.getTime() === today.getTime()
  const isCurMonth  = d.getMonth() === viewM
  const dayNote     = appState.dayNotes[dateStr]
  const activePhases = phasesOnDate(dateStr, phases, appState.startDate)
  const dueTasks    = getTasksWithDeadlineOn(dateStr, phases, appState.startDate)
  const labelPhases = phaseFirstDays[dateStr] || []

  return (
    <div
      className={`cal-cell${isToday ? ' today' : ''}${isCurMonth ? '' : ' other-month'}`}
      onClick={() => isCurMonth && onOpen(dateStr)}
    >
      <div className="cal-day-num">{d.getDate()}</div>

      {/* Phase label chips — first visible day of each phase */}
      {labelPhases.map(p => (
        <div
          key={p.id}
          className="cal-phase-chip"
          style={{ background: p.color + '22', color: p.color }}
        >
          {p.emoji} {p.name}
        </div>
      ))}

      {/* Due tasks count */}
      {dueTasks.length > 0 && (
        <div className="cal-due-count">
          <Bell size={11} />
          {dueTasks.length} due
        </div>
      )}

      {/* Day note */}
      {dayNote?.note && (
        <div className="cal-note-chip">{dayNote.note}</div>
      )}

      {/* Milestone */}
      {dayNote?.milestone && (
        <div className="cal-milestone"><Star size={13} fill="currentColor" /></div>
      )}

      {/* Phase color bars at the bottom */}
      {activePhases.length > 0 && (
        <div className="cal-day-bars">
          {activePhases.map(p => (
            <div
              key={p.id}
              className="cal-day-bar"
              style={{ background: p.color }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CalendarView() {
  const { appState, phases } = useApp()

  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [dayModal, setDayModal] = useState(null)

  const startDate = appState.startDate

  function prevMonth() {
    if (viewM === 0) { setViewY(y => y - 1); setViewM(11) }
    else setViewM(m => m - 1)
  }
  function nextMonth() {
    if (viewM === 11) { setViewY(y => y + 1); setViewM(0) }
    else setViewM(m => m + 1)
  }
  function goToday() {
    setViewY(now.getFullYear())
    setViewM(now.getMonth())
  }

  // Build grid dates (Sun-aligned, 6 rows = 42 cells)
  const firstOfMonth = new Date(viewY, viewM, 1)
  const firstDow     = firstOfMonth.getDay() // 0=Sun
  const gridStart    = new Date(firstOfMonth)
  gridStart.setDate(1 - firstDow)

  const dates = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    dates.push(toISO(d.getFullYear(), d.getMonth(), d.getDate()))
  }

  const monthLabel = firstOfMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Build phaseFirstDays: dateStr → phases[] whose bar starts on that date
  const phaseFirstDays = {}
  if (startDate) {
    phases.forEach(p => {
      const first = phaseFirstVisible(p, viewY, viewM, startDate)
      if (!first) return
      const iso = toISO(first.getFullYear(), first.getMonth(), first.getDate())
      if (!phaseFirstDays[iso]) phaseFirstDays[iso] = []
      phaseFirstDays[iso].push(p)
    })
  }

  // Legend: phases visible this month
  const visiblePhases = phases.filter(p => {
    const r = phaseRange(p, startDate)
    if (!r) return false
    const monthStart = new Date(viewY, viewM, 1)
    const monthEnd   = new Date(viewY, viewM + 1, 0)
    return r.s <= monthEnd && r.e >= monthStart
  })

  return (
    <div className="cal-wrap">
      {/* Month nav */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
        <span className="cal-nav-label">{monthLabel}</span>
        <button className="cal-today-btn" onClick={goToday}>Today</button>
        <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
      </div>

      {!startDate && (
        <div className="cal-no-start">
          Set a project start date in Settings to display phase bars.
        </div>
      )}

      {/* Phase legend */}
      {visiblePhases.length > 0 && (
        <div className="cal-legend">
          {visiblePhases.map(p => (
            <div key={p.id} className="cal-legend-item">
              <span className="cal-legend-dot" style={{ background: p.color }} />
              <span>{p.emoji} {p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="cal-grid">
        {WEEKDAYS.map(d => (
          <div key={d} className="cal-hdr">{d}</div>
        ))}
        {dates.map(ds => (
          <DayCell
            key={ds}
            dateStr={ds}
            viewM={viewM}
            phaseFirstDays={phaseFirstDays}
            onOpen={setDayModal}
          />
        ))}
      </div>

      {dayModal && (
        <DayModal dateStr={dayModal} onClose={() => setDayModal(null)} />
      )}
    </div>
  )
}
