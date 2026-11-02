import { CalendarDays, ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, Checkbox, Chip, Segmented, Tag, Toggle } from '../components/ui/Controls'
import { Dialog } from '../components/ui/Dialog'
import { Field, PasswordField, TextareaField } from '../components/ui/Field'
import { toast } from '../store/useToast'

// Trang đối chiếu các thành phần ở Phụ lục B, mở từ bảng điều khiển demo.
export function ComponentsPage() {
  const [toggle, setToggle] = useState(true)
  const [check, setCheck] = useState(true)
  const [chip, setChip] = useState('Tất cả')
  const [tab, setTab] = useState('tasks')
  const [dialog, setDialog] = useState(false)

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 pb-8 pt-2 md:px-8">
      <h1 className="t-h1">Thành phần giao diện</h1>
      <Card>
        <h2 className="t-h3">Nút</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button>
            <Plus size={20} />
            Primary
          </Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="text">Text</Button>
          <Button variant="danger">Danger</Button>
          <Button small>Nút nhỏ</Button>
          <Button disabled>Vô hiệu</Button>
          <Button loading>Đang tải</Button>
        </div>
      </Card>
      <Card className="grid gap-4 md:grid-cols-2">
        <h2 className="t-h3 md:col-span-2">Ô nhập</h2>
        <Field label="Bình thường" placeholder="Chữ gợi ý" />
        <Field label="Lỗi" defaultValue="abc" error="Email chưa đúng dạng. Ví dụ: ten@email.com" />
        <Field label="Vô hiệu" defaultValue="Không sửa được" disabled />
        <PasswordField label="Mật khẩu" defaultValue="mira1234" />
        <TextareaField label="Nhiều dòng" className="md:col-span-2" placeholder="Chữ gợi ý" />
      </Card>
      <Card>
        <h2 className="t-h3">Chip, nhãn, công tắc, ô tích</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {['Tất cả', 'Cần làm', 'Đã xong'].map((option) => (
            <Chip key={option} selected={chip === option} onClick={() => setChip(option)}>
              {option}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tag tone="success">Đã lưu</Tag>
          <Tag tone="warning">Đang chờ xác nhận</Tag>
          <Tag tone="danger">Cao</Tag>
          <Tag tone="accent">MIRA soạn</Tag>
          <Tag>Thấp</Tag>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <Toggle label="Công tắc" checked={toggle} onChange={setToggle} />
          <Toggle label="Vô hiệu" checked={false} onChange={() => undefined} disabled />
          <Checkbox label="Ô tích" checked={check} onChange={setCheck} />
        </div>
      </Card>
      <Card>
        <h2 className="t-h3">Thanh tab, hộp thoại, thông báo nhanh</h2>
        <div className="mt-3">
          <Segmented
            label="Ví dụ thanh tab"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'tasks', label: 'Việc', icon: <ListChecks size={20} /> },
              { value: 'calendar', label: 'Lịch', icon: <CalendarDays size={20} /> },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDialog(true)}>
            Mở hộp thoại
          </Button>
          <Button variant="secondary" onClick={() => toast('Đã lưu thay đổi')}>
            Toast
          </Button>
          <Button variant="secondary" onClick={() => toast('Đã tạo 3 sự kiện', () => undefined)}>
            Toast có Hoàn tác
          </Button>
        </div>
      </Card>
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Tiêu đề hộp thoại"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(false)}>
              Huỷ
            </Button>
            <Button onClick={() => setDialog(false)}>Xác nhận</Button>
          </>
        }
      >
        <p className="t-body">Đóng bằng nút Huỷ, phím Esc hoặc bấm ra ngoài.</p>
      </Dialog>
    </div>
  )
}
