import { createContext, useState, useEffect, useRef, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { DEFAULT_PHASES } from '../lib/defaultData'
import { phaseRange, uid, toISO } from '../lib/utils'

const STORAGE_KEY = 'tomitomi_v1'
const WS_KEY      = 'tomitomi_wsId'

const defaultState = {
  brandName:      'tomitomi',
  startDate:      null,         // 'YYYY-MM-DD'
  phases:         null,         // populated on first load
  completedTasks: {},           // taskId: boolean
  dayNotes:       {},           // 'YYYY-MM-DD': { note, milestone }
  openPhases:     { 1: true },
  activeTimer:    null,         // { taskId, phaseId, startedAt: number } | null
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  // undefined = auth loading, null = signed out, object = signed in
  const [user, setUser]             = useState(undefined)
  const [redirecting, setRedirecting] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')   // '' | 'syncing' | 'synced'
  const [appState, setAppState]     = useState(loadFromStorage)

  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem(WS_KEY) || null)
  const [focusMode, setFocusMode]     = useState(null)  // { taskId, phaseId } | null — UI only, not persisted

  const workspaceIdRef  = useRef(null)
  const saveTimerRef    = useRef(null)
  const snapshotUnsubRef = useRef(null)

  // ── Derived (always sorted by timeframe) ─────────────────────────────
  const phases = (appState.phases || DEFAULT_PHASES)
    .slice() // don't mutate stored array
    .sort((a, b) => {
      const startDate = appState.startDate
      const ra = phaseRange(a, startDate)
      const rb = phaseRange(b, startDate)
      if (ra && rb) return ra.s - rb.s                       // both resolve → compare by actual start date
      if (ra) return -1                                       // only a resolves → a first
      if (rb) return 1                                        // only b resolves → b first
      return (a.weekStart || 0) - (b.weekStart || 0)         // neither resolves (no startDate) → by weekStart
    })

  // ── Persist + debounced Firestore write ──────────────────────────────
  const save = useCallback((state) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}

    if (!workspaceIdRef.current) return
    setSyncStatus('syncing')
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, 'workspaces', workspaceIdRef.current),
          { state: JSON.stringify(state) },
          { merge: true }
        )
        setSyncStatus('synced')
      } catch (e) {
        console.error('Firestore save failed:', e)
        setSyncStatus('')
      }
    }, 1000)
  }, [])

  // ── State updater ────────────────────────────────────────────────────
  const updateState = useCallback((updater) => {
    setAppState(prev => {
      // Normalize phases to an array so updater callbacks can safely call .map()
      // (appState.phases is null by default until first write)
      const normalizedPrev = { ...prev, phases: prev.phases || DEFAULT_PHASES }
      const next = typeof updater === 'function'
        ? updater(normalizedPrev)
        : { ...normalizedPrev, ...updater }
      save(next)
      return next
    })
  }, [save])

  // ── Real-time Firestore listener ─────────────────────────────────────
  const setupSnapshot = useCallback((wsRef) => {
    if (snapshotUnsubRef.current) {
      snapshotUnsubRef.current()
      snapshotUnsubRef.current = null
    }
    snapshotUnsubRef.current = onSnapshot(wsRef, snap => {
      if (snap.metadata.hasPendingWrites) return
      if (snap.exists() && snap.data().state) {
        try {
          const remote = JSON.parse(snap.data().state)
          setAppState(prev => {
            const next = { ...prev, ...remote }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            return next
          })
          setSyncStatus('synced')
        } catch (e) {
          console.error('Snapshot parse error:', e)
        }
      }
    }, err => console.error('onSnapshot error:', err))
  }, [])

  // ── Load workspace ───────────────────────────────────────────────────
  const loadWorkspace = useCallback(async (wsId, authUser) => {
    workspaceIdRef.current = wsId
    setWorkspaceId(wsId)
    localStorage.setItem(WS_KEY, wsId)
    const wsRef = doc(db, 'workspaces', wsId)
    try {
      const snap = await getDoc(wsRef)
      if (snap.exists() && snap.data().state) {
        const remote = JSON.parse(snap.data().state)
        const next   = { ...defaultState, ...remote }
        setAppState(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } else {
        // New workspace — seed from local data
        const current = loadFromStorage()
        await setDoc(wsRef, {
          state:     JSON.stringify(current),
          owner:     authUser.uid,
          members:   [authUser.uid],
          createdAt: serverTimestamp(),
        })
      }
      await updateDoc(wsRef, { members: arrayUnion(authUser.uid) })
    } catch (e) {
      console.error('loadWorkspace failed:', e)
    }
    setupSnapshot(wsRef)
  }, [setupSnapshot])

  // ── Auth actions ─────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(() => {
    setRedirecting(true)
    signInWithRedirect(auth, new GoogleAuthProvider())
  }, [])

  const signOutUser = useCallback(async () => {
    if (!confirm('Sign out of tomitomi Planner?')) return
    if (snapshotUnsubRef.current) {
      snapshotUnsubRef.current()
      snapshotUnsubRef.current = null
    }
    workspaceIdRef.current = null
    await signOut(auth)
  }, [])

  const resetAll = useCallback(async () => {
    if (!user) return
    if (!confirm('Reset all data to defaults? This cannot be undone.')) return
    clearTimeout(saveTimerRef.current)
    if (snapshotUnsubRef.current) {
      snapshotUnsubRef.current()
      snapshotUnsubRef.current = null
    }
    const fresh = { ...defaultState, phases: DEFAULT_PHASES }
    setAppState(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    const wsRef = doc(db, 'workspaces', user.uid)
    workspaceIdRef.current = user.uid
    setWorkspaceId(user.uid)
    localStorage.setItem(WS_KEY, user.uid)
    try {
      await setDoc(wsRef, {
        state:     JSON.stringify(fresh),
        owner:     user.uid,
        members:   [user.uid],
        createdAt: serverTimestamp(),
      })
    } catch (e) {
      console.error('resetAll Firestore write failed:', e)
    }
    setupSnapshot(wsRef)
  }, [user, setupSnapshot])

  const switchToOwnWorkspace = useCallback(async () => {
    if (!user) return
    setSyncStatus('syncing')
    await loadWorkspace(user.uid, user)
    setSyncStatus('synced')
  }, [user, loadWorkspace])

  const joinWorkspace = useCallback(async (rawInput) => {
    if (!user) { alert('Please sign in first.'); return }
    let wsId = rawInput.trim()
    try {
      const url = new URL(wsId)
      wsId = url.searchParams.get('join') || wsId
    } catch {}
    if (!wsId || wsId.length < 5) { alert('Invalid workspace ID.'); return }
    setSyncStatus('syncing')
    await loadWorkspace(wsId, user)
    setSyncStatus('synced')
  }, [user, loadWorkspace])

  // ── Timer helpers ────────────────────────────────────────────────────
  // Build a time entry for "right now"
  const _makeTimerEntry = (minutes, note, source) => {
    const now = new Date()
    return { id: uid(), date: toISO(now.getFullYear(), now.getMonth(), now.getDate()), minutes, note, source }
  }

  // Append an entry to a specific task inside the phases array
  const _appendEntry = (phases, phaseId, taskId, entry) =>
    phases.map(p =>
      p.id === phaseId
        ? { ...p, tasks: p.tasks.map(t =>
              t.id === taskId
                ? { ...t, timeEntries: [...(t.timeEntries || []), entry] }
                : t
            )}
        : p
    )

  // ── Timer actions ─────────────────────────────────────────────────────
  const startTimer = useCallback((phaseId, taskId) => {
    updateState(prev => {
      let { phases } = prev
      // Auto-save any currently running timer first (if ≥ 1 min elapsed)
      if (prev.activeTimer) {
        const { taskId: pt, phaseId: pp, startedAt } = prev.activeTimer
        const minutes = Math.floor((Date.now() - startedAt) / 60000)
        if (minutes >= 1) {
          phases = _appendEntry(phases, pp, pt, _makeTimerEntry(minutes, '', 'timer'))
        }
      }
      return { ...prev, phases, activeTimer: { taskId, phaseId, startedAt: Date.now() } }
    })
  }, [updateState])

  const stopTimer = useCallback((note = '') => {
    updateState(prev => {
      if (!prev.activeTimer) return prev
      const { taskId, phaseId, startedAt } = prev.activeTimer
      const minutes = Math.floor((Date.now() - startedAt) / 60000)
      let { phases } = prev
      if (minutes >= 1) {
        phases = _appendEntry(phases, phaseId, taskId, _makeTimerEntry(minutes, note, 'timer'))
      }
      return { ...prev, phases, activeTimer: null }
    })
  }, [updateState])

  const addTimeEntry = useCallback((phaseId, taskId, entry) => {
    updateState(prev => ({
      ...prev,
      phases: _appendEntry(prev.phases, phaseId, taskId, entry),
    }))
  }, [updateState])

  const deleteTimeEntry = useCallback((phaseId, taskId, entryId) => {
    updateState(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.map(t =>
                t.id === taskId
                  ? { ...t, timeEntries: (t.timeEntries || []).filter(e => e.id !== entryId) }
                  : t
              )}
          : p
      ),
    }))
  }, [updateState])

  // ── Focus mode ────────────────────────────────────────────────────────
  const enterFocus = useCallback((phaseId, taskId) => {
    setFocusMode({ phaseId, taskId })
  }, [])

  const exitFocus = useCallback(() => {
    setFocusMode(null)
  }, [])

  // ── Handle redirect result on page load ─────────────────────────────
  useEffect(() => {
    getRedirectResult(auth).catch(e => {
      if (e.code !== 'auth/no-current-user') {
        alert('Sign-in failed. Please try again.\n\n' + e.message)
      }
      setRedirecting(false)
    })
  }, [])

  // ── Auth state listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      setRedirecting(false)
      setUser(authUser)
      if (authUser) {
        const urlJoin = new URLSearchParams(location.search).get('join')
        let wsId
        if (urlJoin) {
          wsId = urlJoin
          history.replaceState({}, '', location.pathname)
        } else {
          wsId = localStorage.getItem(WS_KEY) || authUser.uid
        }
        await loadWorkspace(wsId, authUser)
      } else {
        workspaceIdRef.current = null
        if (snapshotUnsubRef.current) {
          snapshotUnsubRef.current()
          snapshotUnsubRef.current = null
        }
      }
    })
    return unsub
  }, [loadWorkspace])

  // ── Cleanup ──────────────────────────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(saveTimerRef.current)
    if (snapshotUnsubRef.current) snapshotUnsubRef.current()
  }, [])

  const value = {
    user,
    redirecting,
    appState,
    phases,
    syncStatus,
    updateState,
    signInWithGoogle,
    signOutUser,
    switchToOwnWorkspace,
    joinWorkspace,
    workspaceId,
    resetAll,
    // Time tracking
    startTimer,
    stopTimer,
    addTimeEntry,
    deleteTimeEntry,
    // Focus mode
    focusMode,
    enterFocus,
    exitFocus,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

