import { useState, useEffect } from 'react'
import { useApp } from '../context/useApp'
import { uid, toISO } from '../lib/utils'
import { Square, SkipForward, RotateCcw, Pause, Play } from 'lucide-react'

const WORK_SEC   = 25 * 60
const SHORT_SEC  = 5  * 60
const LONG_SEC   = 15 * 60
const LONG_EVERY = 4   // long break after every N sessions

function pad(n) { return String(n).padStart(2, '0') }
function fmtMSS(sec)  { return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}` }
function fmtHMSS(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function FocusModal() {
  const {
    appState, phases, focusMode,
    exitFocus, startTimer, stopTimer, addTimeEntry,
  } = useApp()

  const { phaseId, taskId } = focusMode
  const phase = phases.find(p => p.id === phaseId)
  const task  = phase?.tasks.find(t => t.id === taskId)

  // ── Mode ───────────────────────────────────────────────────────────────
  const [pomodoroMode, setPomodoroMode] = useState(false)
  const [isPaused,     setIsPaused]     = useState(false)
  const [isBreak,      setIsBreak]      = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(WORK_SEC)

  // Free-timer display: re-render tick (actual elapsed read from appState)
  const [, setTick] = useState(0)

  // ── On mount: start global free timer ─────────────────────────────────
  useEffect(() => {
    startTimer(phaseId, taskId)
    return () => { document.title = 'tomitomi Planner' }
  }, []) // intentionally once

  // ── Free-timer tick ───────────────────────────────────────────────────
  useEffect(() => {
    if (pomodoroMode) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [pomodoroMode])

  // ── Pomodoro countdown tick ───────────────────────────────────────────
  useEffect(() => {
    if (!pomodoroMode || isPaused) return
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [pomodoroMode, isPaused])

  // ── Pomodoro: handle reaching 0 ───────────────────────────────────────
  useEffect(() => {
    if (!pomodoroMode || isPaused || timeLeft > 0) return
    if (!isBreak) {
      // Work session done → log 25 min entry, start break
      const now = new Date()
      addTimeEntry(phaseId, taskId, {
        id: uid(),
        date: toISO(now.getFullYear(), now.getMonth(), now.getDate()),
        minutes: 25,
        note: '',
        source: 'pomodoro',
      })
      const nextCount = sessionCount + 1
      setSessionCount(nextCount)
      setIsBreak(true)
      setTimeLeft(nextCount % LONG_EVERY === 0 ? LONG_SEC : SHORT_SEC)
    } else {
      // Break done → next work session
      setIsBreak(false)
      setTimeLeft(WORK_SEC)
    }
  }, [timeLeft, pomodoroMode, isPaused, isBreak, sessionCount, phaseId, taskId, addTimeEntry])

  // ── Document title ────────────────────────────────────────────────────
  useEffect(() => {
    const name = task?.text || 'Focus'
    if (pomodoroMode) {
      const icon = isBreak ? '☕' : '🍅'
      document.title = `${icon} ${fmtMSS(timeLeft)} — ${name}`
    } else {
      const at  = appState.activeTimer
      const sec = at?.taskId === taskId ? Math.floor((Date.now() - at.startedAt) / 1000) : 0
      document.title = `⏱ ${fmtHMSS(sec)} — ${name}`
    }
  })

  // ── Handlers ──────────────────────────────────────────────────────────
  const switchToPomodoro = () => {
    stopTimer('')          // save any partial free-timer time, clear activeTimer
    setPomodoroMode(true)
    setIsPaused(false)
    setIsBreak(false)
    setTimeLeft(WORK_SEC)
  }

  const switchToFree = () => {
    startTimer(phaseId, taskId)  // restart global timer from now
    setPomodoroMode(false)
    setIsPaused(false)
  }

  const skipBreak = () => {
    setIsBreak(false)
    setTimeLeft(WORK_SEC)
  }

  const skipWork = () => {
    // Skip current work session without logging it
    const breakSec = sessionCount > 0 && (sessionCount + 1) % LONG_EVERY === 0 ? LONG_SEC : SHORT_SEC
    setIsBreak(true)
    setTimeLeft(breakSec)
  }

  const resetSession = () => {
    setTimeLeft(WORK_SEC)
    setIsPaused(false)
    setIsBreak(false)
  }

  const handleClose = () => {
    if (!pomodoroMode) stopTimer('')   // save elapsed free-timer time
    // In pomodoro mode: completed sessions already logged — no extra save needed
    exitFocus()
  }

  if (!phase || !task) return null

  // Elapsed seconds for free timer display
  const at  = appState.activeTimer
  const elapsedSec = at?.taskId === taskId ? Math.floor((Date.now() - at.startedAt) / 1000) : 0

  // Pomodoro progress bar
  const totalSec   = isBreak
    ? (sessionCount % LONG_EVERY === 0 && sessionCount > 0 ? LONG_SEC : SHORT_SEC)
    : WORK_SEC
  const progressPct = ((totalSec - timeLeft) / totalSec) * 100

  const breakLabel = isBreak && sessionCount % LONG_EVERY === 0 ? '☕ Long Break' : '☕ Short Break'

  return (
    <div className="focus-overlay" onClick={e => e.currentTarget === e.target && handleClose()}>
      <div className="focus-modal">
        <button className="focus-close" onClick={handleClose}>✕ Close</button>

        {/* Phase + task */}
        <div className="focus-phase-label">{phase.emoji} {phase.name}</div>
        <div className="focus-task-label">✦ {task.text}</div>

        {/* Session indicator */}
        {pomodoroMode && (
          <div className="focus-mode-indicator">
            {isBreak ? breakLabel : `🍅 Session #${sessionCount + 1}`}
          </div>
        )}

        {/* Timer */}
        <div className={`focus-timer${pomodoroMode ? (isBreak ? ' break' : ' pomo') : ''}`}>
          {pomodoroMode ? fmtMSS(timeLeft) : fmtHMSS(elapsedSec)}
        </div>

        {/* Pomodoro progress bar */}
        {pomodoroMode && (
          <div className="pomo-progress">
            <div
              className={`pomo-progress-fill ${isBreak ? 'break' : 'work'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Completed session dots */}
        {pomodoroMode && sessionCount > 0 && (
          <div className="pomo-dots">
            {'🍅'.repeat(sessionCount)}
            <span className="pomo-dots-label">
              ({sessionCount} session{sessionCount !== 1 ? 's' : ''} done)
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="focus-controls">
          {!pomodoroMode && (
            <>
              <button className="focus-btn stop" onClick={handleClose}>
                <Square size={14} /> Stop & Save
              </button>
              <button className="focus-btn pomo-switch" onClick={switchToPomodoro}>
                🍅 Switch to Pomodoro
              </button>
            </>
          )}

          {pomodoroMode && !isBreak && (
            <>
              <button className="focus-btn secondary" onClick={() => setIsPaused(p => !p)}>
                {isPaused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
              </button>
              <button className="focus-btn secondary" onClick={skipWork}>
                <SkipForward size={14} /> Skip
              </button>
              <button className="focus-btn secondary" onClick={resetSession}>
                <RotateCcw size={14} /> Reset
              </button>
              <button className="focus-btn stop" onClick={handleClose}>
                End & Save Time
              </button>
            </>
          )}

          {pomodoroMode && isBreak && (
            <>
              <button className="focus-btn primary" onClick={skipBreak}>
                <SkipForward size={14} /> Skip Break
              </button>
              <button className="focus-btn stop" onClick={handleClose}>
                End & Save Time
              </button>
            </>
          )}
        </div>

        {/* Switch back to free timer */}
        {pomodoroMode && (
          <button
            className="focus-btn secondary"
            onClick={switchToFree}
            style={{ marginTop: -4, fontSize: '11px', padding: '6px 14px' }}
          >
            ↩ Free timer
          </button>
        )}
      </div>
    </div>
  )
}
