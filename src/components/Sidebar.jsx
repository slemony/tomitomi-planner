import { useState } from 'react'
import { useApp } from '../context/useApp'
import { totalTasks, doneTasks, getTaskLoggedMin, fmtDuration } from '../lib/utils'
import { Plus } from 'lucide-react'
import PhaseCard from './PhaseCard'
import PhaseEditModal from './PhaseEditModal'

export default function Sidebar({ className }) {
  const { phases, appState } = useApp()
  const [phaseModalOpen, setPhaseModalOpen] = useState(false)
  const [editingPhaseId, setEditingPhaseId] = useState(null) // null = new

  const done  = doneTasks(appState.completedTasks)
  const total = totalTasks(phases)
  const pct   = total ? Math.round((done / total) * 100) : 0

  // Grand total logged time across all tasks in all phases
  const grandTotalMin = phases.reduce(
    (sum, p) => sum + p.tasks.reduce((s, t) => s + getTaskLoggedMin(t, appState.activeTimer), 0),
    0
  )

  function openEdit(phaseId) {
    setEditingPhaseId(phaseId)
    setPhaseModalOpen(true)
  }

  return (
    <div className={`sidebar${className ? ' ' + className : ''}`}>
      <div className="sb-head">
        <div className="sb-title">Phases &amp; Tasks</div>
        <div style={{ textAlign: 'right' }}>
          <div className="sb-pct">{pct}%</div>
          {grandTotalMin > 0 && (
            <div style={{ fontSize: '10px', color: '#15803d', marginTop: '1px' }}>
              ⏱ {fmtDuration(grandTotalMin)} logged
            </div>
          )}
        </div>
      </div>

      <div className="sb-scroll">
        {phases.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            onEdit={() => openEdit(phase.id)}
          />
        ))}
      </div>

      <div className="sb-add-phase">
        <button className="add-phase-btn" onClick={() => openEdit(null)}>
          <Plus size={15} />
          Add Phase
        </button>
      </div>

      {phaseModalOpen && (
        <PhaseEditModal
          phaseId={editingPhaseId}
          onClose={() => setPhaseModalOpen(false)}
        />
      )}
    </div>
  )
}
