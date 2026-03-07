import { useState } from 'react'
import { useApp } from '../context/useApp'
import { totalTasks, doneTasks } from '../lib/utils'
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

  function openEdit(phaseId) {
    setEditingPhaseId(phaseId)
    setPhaseModalOpen(true)
  }

  return (
    <div className={`sidebar${className ? ' ' + className : ''}`}>
      <div className="sb-head">
        <div className="sb-title">Phases &amp; Tasks</div>
        <div className="sb-pct">{pct}%</div>
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
