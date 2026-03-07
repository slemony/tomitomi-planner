import { useState } from 'react'
import { useApp } from '../context/useApp'
import { X, Users, Check } from 'lucide-react'

export default function SettingsModal({ onClose }) {
  const {
    appState, updateState,
    workspaceId, user,
    joinWorkspace, switchToOwnWorkspace,
    resetAll,
  } = useApp()

  const [brandName, setBrandName]   = useState(appState.brandName)
  const [startDate, setStartDate]   = useState(appState.startDate || '')
  const [joinInput, setJoinInput]   = useState('')
  const [copied,    setCopied]      = useState(false)

  const inviteLink = workspaceId && user
    ? `${location.origin}${location.pathname}?join=${workspaceId}`
    : ''

  const isGuestWs = workspaceId && user && workspaceId !== user.uid

  function save() {
    updateState(prev => ({
      ...prev,
      brandName: brandName.trim() || prev.brandName,
      startDate: startDate || null,
    }))
    onClose()
  }

  function copyInvite() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleJoin() {
    if (!joinInput.trim()) return
    await joinWorkspace(joinInput)
    setJoinInput('')
    onClose()
  }

  async function handleReturnOwn() {
    await switchToOwnWorkspace()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="settings-section">
          <label className="settings-label">Brand name</label>
          <input
            className="settings-input"
            value={brandName}
            maxLength={20}
            onChange={e => setBrandName(e.target.value)}
          />
        </div>

        <div className="settings-section">
          <label className="settings-label">Project start date</label>
          <input
            className="settings-input"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <p className="settings-hint">Used to position phase bars on the calendar.</p>
        </div>

        <div className="settings-section">
          <label className="settings-label">Workspace sharing</label>
          {isGuestWs && (
            <div className="settings-guest-banner">
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              You&apos;re viewing a shared workspace.{' '}
              <button className="link-btn" onClick={handleReturnOwn}>Return to your own</button>
            </div>
          )}
          <p className="settings-hint">Share your invite link so others can view &amp; edit this workspace.</p>
          <div className="settings-invite-row">
            <input
              className="settings-input"
              readOnly
              value={inviteLink}
              placeholder="Sign in to get invite link"
            />
            <button className="settings-copy-btn" onClick={copyInvite} disabled={!inviteLink}>
              {copied
                ? <><Check size={13} style={{ verticalAlign: 'middle', marginRight: 2 }} />Copied</>
                : 'Copy'
              }
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label className="settings-label">Join a workspace</label>
          <div className="settings-invite-row">
            <input
              className="settings-input"
              value={joinInput}
              placeholder="Paste invite link or workspace ID"
              onChange={e => setJoinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button className="settings-copy-btn" onClick={handleJoin}>Join</button>
          </div>
        </div>

        <div className="settings-section settings-danger">
          <button className="danger-btn" onClick={resetAll}>Reset all data to defaults</button>
          <p className="settings-hint">Clears all tasks, deadlines, and notes. Cannot be undone.</p>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
