import { uid } from '../../lib/utils'
import type { Attachment } from '../../store/types'

export const MAX_ATTACHMENTS = 5
const MAX_SIZE = 10 * 1024 * 1024
const THUMB_SIZE = 160

export const ACCEPT_FILES = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx'
export const ACCEPT_IMAGES = 'image/png,image/jpeg,image/webp,image/gif'

const ALLOWED = new RegExp(`(${ACCEPT_FILES.split(',').join('|').replaceAll('.', '\\.')})$`, 'i')

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

// Chỉ lưu ảnh thu nhỏ vì dữ liệu demo nằm trong localStorage, không đủ chỗ cho tệp gốc.
async function makeThumbnail(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, THUMB_SIZE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.7)
}

// Tệp lỗi được báo riêng từng tệp, các tệp hợp lệ vẫn được thêm vào.
export async function prepareFiles(files: File[], existing: number) {
  const items: Attachment[] = []
  const errors: string[] = []
  for (const file of files) {
    if (existing + items.length >= MAX_ATTACHMENTS) {
      errors.push(`Mỗi tin nhắn gửi được tối đa ${MAX_ATTACHMENTS} tệp, nên mình bỏ qua “${file.name}”.`)
      continue
    }
    if (file.size > MAX_SIZE) {
      errors.push(`“${file.name}” lớn hơn 10 MB. Bạn thử tệp nhỏ hơn nhé.`)
      continue
    }
    const isImage = file.type.startsWith('image/')
    if (!isImage && !ALLOWED.test(file.name)) {
      errors.push(`Mình chưa đọc được định dạng của “${file.name}”. Bạn thử ảnh, PDF, Word, Excel hoặc PowerPoint nhé.`)
      continue
    }
    const base = { id: uid(), name: file.name, size: file.size }
    if (!isImage) {
      items.push({ ...base, kind: 'file' })
      continue
    }
    try {
      items.push({ ...base, kind: 'image', thumbnail: await makeThumbnail(file) })
    } catch {
      errors.push(`Mình không mở được ảnh “${file.name}”. Bạn thử ảnh khác nhé.`)
    }
  }
  return { items, errors }
}
