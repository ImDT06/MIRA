import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useSim } from '../../store/useSim'
import type { Card, Slot } from '../../store/types'
import { ActionConfirm } from '../permissions/ActionConfirm'
import { describeAction, executeEmail, executeNote, executeReschedule, executeSchedule, patchCard, swapSlot, type MessageRef } from './actions'
import { slotLabel } from './script'

interface ConfirmDialogProps {
  card: Card
  target: MessageRef
  onClose: () => void
}

export function ConfirmDialog({ card, target, onClose }: ConfirmDialogProps) {
  const [conflict, setConflict] = useState<{ taken: Slot; replacement: Slot } | null>(null)
  const summary = describeAction(card)
  if (!summary) return null

  const cancel = () => {
    if (card.kind === 'email') {
      patchCard(target, 'email', (current) => {
        current.state = 'cancelled'
      })
    }
    if (card.kind === 'reschedule') {
      patchCard(target, 'reschedule', (current) => {
        current.state = 'kept'
      })
    }
    onClose()
  }

  const confirm = () => {
    const sim = useSim.getState()
    if (card.kind === 'schedule') {
      if (sim.scheduleConflict && card.alternatives.length > 0) {
        sim.set({ scheduleConflict: false })
        setConflict({ taken: card.slots[0], replacement: card.alternatives[0] })
        return
      }
      executeSchedule(target)
    }
    if (card.kind === 'reschedule') executeReschedule(target)
    if (card.kind === 'note') executeNote(target)
    if (card.kind === 'email') {
      executeEmail(target, sim.sendFailure)
      sim.set({ sendFailure: false })
    }
    onClose()
  }

  if (conflict) {
    return (
      <Dialog
        open
        onClose={cancel}
        title="Khung giờ vừa bị trùng"
        footer={
          <>
            <Button variant="secondary" onClick={cancel}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                swapSlot(target, conflict.taken.id, conflict.replacement)
                setConflict(null)
              }}
            >
              Đổi sang khung này
            </Button>
          </>
        }
      >
        <p className="t-body flex items-start gap-2">
          <CircleAlert size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          {slotLabel(conflict.taken)} vừa có sự kiện khác. Mình đề xuất đổi sang {slotLabel(conflict.replacement)}.
        </p>
      </Dialog>
    )
  }

  return <ActionConfirm summary={summary} onConfirm={confirm} onCancel={cancel} />
}
