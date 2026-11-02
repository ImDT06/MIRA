import { addDays } from '../../lib/utils'
import { Chip } from '../../components/ui/Controls'
import { useApp, useData } from '../../store/useApp'
import type { Mood } from '../../store/types'

const MOODS: Mood[] = ['Vui', 'Bình thường', 'Căng thẳng', 'Mệt']

const MOOD_REPLIES: Record<Mood, string> = {
  Vui: 'Nghe thích quá. Mình giữ nhịp này cho hôm nay nhé.',
  'Bình thường': 'Cảm ơn bạn đã chia sẻ. Một ngày bình thường cũng là một ngày ổn.',
  'Căng thẳng': 'Mình hiểu. Khi nào cần sắp xếp lại việc, cứ nói với mình nhé.',
  Mệt: 'Mình hiểu rồi. Hôm nay mình sẽ nhắc ít hơn và chỉ giữ việc thật cần thiết.',
}

// compact dùng trên màn chat mới: đã trả lời thì thu lại còn một câu để nhường chỗ cho ô nhập.
export function Checkin({ compact }: { compact?: boolean }) {
  const checkin = useData((data) => data.checkin)
  const update = useApp((state) => state.update)
  const today = addDays(0)
  const mood = checkin?.date === today ? checkin.mood : null

  const choose = (next: Mood) =>
    update((data) => {
      data.checkin = { date: today, mood: next }
      data.slowMode = next === 'Mệt'
    })

  if (compact && mood) {
    return (
      <p className="t-small text-center text-text-secondary" role="status">
        {MOOD_REPLIES[mood]}
      </p>
    )
  }

  // Trên màn chat, phần này là lời hỏi thăm phụ nên dùng nút chữ, không tranh chú ý với gợi ý chính.
  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-1">
        <p className="t-small mr-1 text-text-secondary">Hôm nay bạn thấy thế nào?</p>
        {MOODS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            className="t-small press inline-flex h-10 items-center rounded-ctl px-2 font-medium text-accent hover:bg-accent-soft"
          >
            {option}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="t-h5">Hôm nay bạn thấy thế nào?</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((option) => (
            <Chip key={option} selected={mood === option} onClick={() => choose(option)}>
              {option}
            </Chip>
          ))}
        </div>
      </div>
      {mood && (
        <p className="t-small mt-2 text-text-secondary" role="status">
          {MOOD_REPLIES[mood]}
        </p>
      )}
    </div>
  )
}
