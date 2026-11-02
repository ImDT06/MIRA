import { Fragment, type ReactNode } from 'react'

// Định dạng tối thiểu cho câu trả lời: **đậm**, ### tiêu đề nhỏ, danh sách "- " và "1. ".
function inline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold">
        {part}
      </strong>
    ) : (
      // Dấu ** chưa đóng khi đang chạy chữ thì ẩn đi cho khỏi nháy.
      <Fragment key={index}>{part.replace(/\*\*/g, '')}</Fragment>
    ),
  )
}

type Block = { kind: 'p'; text: string } | { kind: 'h'; text: string } | { kind: 'ul' | 'ol'; items: string[] }

function parse(source: string) {
  const blocks: Block[] = []
  for (const line of source.split('\n')) {
    const text = line.trim()
    if (!text) continue
    const bullet = /^-\s+(.*)/.exec(text)
    const numbered = /^\d+\.\s+(.*)/.exec(text)
    const last = blocks[blocks.length - 1]
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol'
      const item = (bullet ?? numbered)![1]
      if (last?.kind === kind) last.items.push(item)
      else blocks.push({ kind, items: [item] })
    } else if (text.startsWith('### ')) {
      blocks.push({ kind: 'h', text: text.slice(4) })
    } else {
      blocks.push({ kind: 'p', text })
    }
  }
  return blocks
}

export const plainText = (source: string) => source.replace(/\*\*/g, '').replace(/^###\s+/gm, '')

export function RichText({ text, live }: { text: string; live?: boolean }) {
  return (
    <div className="t-body flex w-full min-w-0 flex-col gap-2.5 break-words pt-0.5" aria-live={live ? 'polite' : undefined}>
      {parse(text).map((block, index) => {
        if (block.kind === 'h') {
          return (
            <h3 key={index} className="t-h5 mt-1.5">
              {inline(block.text)}
            </h3>
          )
        }
        if (block.kind === 'p') return <p key={index}>{inline(block.text)}</p>
        const List = block.kind
        return (
          <List key={index} className={`flex flex-col gap-1 pl-5 marker:text-text-secondary ${block.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {block.items.map((item) => (
              <li key={item} className="pl-0.5">
                {inline(item)}
              </li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
