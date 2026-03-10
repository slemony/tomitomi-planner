import { DEFAULT_PHASES } from './defaultData'

export function toISO(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function fromISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function uid() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

export function getPhases(phases) {
  return phases || DEFAULT_PHASES
}

export function phaseRange(phase, startDate) {
  if (phase.useDates && phase.dateStart && phase.dateEnd) {
    return { s: fromISO(phase.dateStart), e: fromISO(phase.dateEnd) }
  }
  if (!startDate) return null
  const base = fromISO(startDate)
  const s = new Date(base); s.setDate(base.getDate() + (phase.weekStart - 1) * 7)
  const e = new Date(base); e.setDate(base.getDate() + phase.weekEnd * 7 - 1)
  return { s, e }
}

export function fmtDate(iso) {
  if (!iso) return ''
  return fromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function phasesOnDate(iso, phases, startDate) {
  const d = fromISO(iso)
  return getPhases(phases).filter(p => {
    const r = phaseRange(p, startDate)
    return r && d >= r.s && d <= r.e
  })
}

export function phaseFirstVisible(phase, viewY, viewM, startDate) {
  const r = phaseRange(phase, startDate)
  if (!r) return null
  const monthStart = new Date(viewY, viewM, 1)
  const monthEnd   = new Date(viewY, viewM + 1, 0)
  if (r.e < monthStart || r.s > monthEnd) return null
  return r.s >= monthStart ? r.s : monthStart
}

export function totalTasks(phases) {
  return getPhases(phases).reduce((a, p) => a + p.tasks.length, 0)
}

export function doneTasks(completedTasks) {
  return Object.values(completedTasks || {}).filter(Boolean).length
}

export function fmtDeadlineBadge(task) {
  if (task.deadline) {
    return fromISO(task.deadline)
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
  if (task.duration) return task.duration + 'd'
  return ''
}

export function getDeadlineClass(task) {
  if (!task.deadline) return ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dl    = fromISO(task.deadline)
  const diff  = Math.floor((dl - today) / 86400000)
  if (diff < 0)  return 'overdue'
  if (diff <= 3) return 'soon'
  return ''
}

export function getTaskDeadlineDate(task, phase, startDate) {
  if (task.deadline) return fromISO(task.deadline)
  if (task.duration) {
    const r = phaseRange(phase, startDate)
    if (r) {
      const d = new Date(r.s)
      d.setDate(d.getDate() + task.duration - 1)
      return d
    }
  }
  return null
}

// ── Time tracking helpers ────────────────────────────────────────────────

// Total minutes logged for a task, including the currently-running timer if it
// belongs to this task. Accepts the activeTimer object from appState.
export function getTaskLoggedMin(task, activeTimer) {
  const base = (task.timeEntries || []).reduce((sum, e) => sum + (e.minutes || 0), 0)
  if (activeTimer?.taskId === task.id) {
    return base + Math.floor((Date.now() - activeTimer.startedAt) / 60000)
  }
  return base
}

// Format a total-minutes number into a human-readable string.
// 0 → '', 45 → '45m', 90 → '1h 30m', 120 → '2h'
export function fmtDuration(totalMin) {
  if (!totalMin) return ''
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

export function getTasksWithDeadlineOn(iso, phases, startDate) {
  const results = []
  getPhases(phases).forEach(phase => {
    phase.tasks.forEach(task => {
      const dl = getTaskDeadlineDate(task, phase, startDate)
      if (!dl) return
      if (toISO(dl.getFullYear(), dl.getMonth(), dl.getDate()) === iso)
        results.push({ task, phase })
    })
  })
  return results
}
