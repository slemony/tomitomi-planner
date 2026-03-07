import { useState } from 'react'
import { useApp } from './context/useApp'
import { totalTasks, doneTasks } from './lib/utils'
import {
  PawPrint, Settings, ListChecks, CalendarDays, Users, ArrowLeft,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import CalendarView from './components/CalendarView'
import SettingsModal from './components/SettingsModal'

function SignInOverlay() {
  const { signInWithGoogle, redirecting } = useApp()
  return (
    <div id="signinOverlay">
      <div style={{ color: 'var(--accent)' }}><PawPrint size={52} strokeWidth={1.5} /></div>
      <h1>tomitomi Planner</h1>
      {redirecting ? (
        <p>Redirecting to Google…</p>
      ) : (
        <>
          <p>Sign in to save your planner to the cloud and sync across all your devices.</p>
          <button className="signin-btn" onClick={signInWithGoogle}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width={20}
              alt="Google"
            />
            Sign in with Google
          </button>
        </>
      )}
    </div>
  )
}

function GuestBanner() {
  const { user, workspaceId, switchToOwnWorkspace } = useApp()
  if (!user || !workspaceId || workspaceId === user.uid) return null
  return (
    <div className="guest-banner">
      <span className="guest-banner-text">
        <Users size={14} />
        You&apos;re viewing a shared workspace
      </span>
      <button className="guest-banner-btn" onClick={switchToOwnWorkspace}>
        <ArrowLeft size={14} />
        Return to my workspace
      </button>
    </div>
  )
}

function Header({ onOpenSettings }) {
  const { appState, phases, updateState, syncStatus, user, signOutUser } = useApp()
  const total = totalTasks(phases)
  const done  = doneTasks(appState.completedTasks)
  const pct   = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="header">
      <div className="header-logo"><PawPrint size={22} strokeWidth={1.5} /></div>
      <input
        className="brand-input"
        value={appState.brandName}
        maxLength={20}
        title="Click to edit"
        onChange={e => updateState({ brandName: e.target.value })}
      />
      <div className="h-sep" />
      <div className="h-progress">
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="prog-lbl">{done} / {total}</div>
      </div>
      {appState.startDate && (
        <div className="h-date">
          <CalendarDays size={14} />
          {new Date(appState.startDate + 'T00:00:00').toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </div>
      )}
      <div className={`sync-dot${syncStatus ? ' ' + syncStatus : ''}`} title="Sync status" />
      <button className="icon-btn" title="Settings" onClick={onOpenSettings}>
        <Settings size={18} />
      </button>
      {user?.photoURL && (
        <img
          className="user-avatar"
          src={user.photoURL}
          onClick={signOutUser}
          title="Sign out"
          alt="You"
        />
      )}
    </div>
  )
}

export default function App() {
  const { user, redirecting } = useApp()
  const [activeTab,    setActiveTab]    = useState('cal') // 'tasks' | 'cal'
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Auth loading or mid-redirect — show nothing / overlay
  if (user === undefined || redirecting) return <SignInOverlay />
  if (!user) return <SignInOverlay />

  return (
    <>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <GuestBanner />

      <div className="main">
        <Sidebar className={activeTab === 'tasks' ? 'tab-active' : ''} />

        <div className={`cal-area${activeTab === 'cal' ? '' : ' tab-hidden'}`}>
          <CalendarView />
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* Mobile tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'tasks' ? ' active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="tab-icon"><ListChecks size={20} /></span>Tasks
        </button>
        <button
          className={`tab-btn${activeTab === 'cal' ? ' active' : ''}`}
          onClick={() => setActiveTab('cal')}
        >
          <span className="tab-icon"><CalendarDays size={20} /></span>Calendar
        </button>
      </div>
    </>
  )
}
