import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button } from '../../components/ui/Button'
import { Field, FieldError, PasswordField } from '../../components/ui/Field'
import { DemoButton } from '../../demo/DemoPanel'
import { cn, isEmail, sleep } from '../../lib/utils'
import { DEMO_EMAIL, DEMO_OTP, DEMO_PASSWORD } from '../../store/seed'
import { accountExists, checkLogin, useApp } from '../../store/useApp'

function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · MIRA`
  }, [title])

  return (
    <main className="flex min-h-dvh items-start justify-center overflow-y-auto px-4 pb-8 pt-14 md:items-center md:py-8">
      <div className="fixed right-2 top-2 flex items-center gap-1">
        <DemoButton />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <Logo size={40} />
        </div>
        <div className="rounded-card bg-bg-surface p-6">
          <h1 className="t-h1">{title}</h1>
          {subtitle && <p className="t-small mt-1 text-text-secondary">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  )
}

export function LoginPage() {
  const login = useApp((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(email)) next.email = 'Email chưa đúng dạng. Ví dụ: ten@email.com'
    if (!password) next.password = 'Bạn nhập mật khẩu giúp mình nhé.'
    setErrors(next)
    if (next.email || next.password) return
    setLoading(true)
    await sleep(600)
    setLoading(false)
    if (!accountExists(email)) return setErrors({ email: 'Email này chưa có tài khoản. Bạn kiểm tra lại hoặc đăng ký mới nhé.' })
    if (!checkLogin(email, password)) return setErrors({ password: 'Mật khẩu chưa đúng. Bạn thử nhập lại nhé.' })
    login(email)
  }

  return (
    <AuthLayout title="Đăng nhập" subtitle="Rất vui được gặp lại bạn.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ten@email.com"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <PasswordField
          label="Mật khẩu"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Đăng nhập
        </Button>
      </form>
      <p className="t-small mt-4 text-center">
        <Link to="/register" className="inline-block py-2 font-semibold text-accent hover:underline">
          Chưa có tài khoản? Đăng ký
        </Link>
      </p>
      <p className="t-caption text-center text-text-secondary">
        Bản demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
        <button
          type="button"
          className="ml-1 inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
          onClick={() => {
            setEmail(DEMO_EMAIL)
            setPassword(DEMO_PASSWORD)
            setErrors({})
          }}
        >
          Điền sẵn
        </button>
      </p>
    </AuthLayout>
  )
}

interface RegisterForm {
  name: string
  email: string
  password: string
  interests: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '', interests: '' })
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [loading, setLoading] = useState(false)

  const change = (key: keyof RegisterForm) => (event: { target: { value: string } }) =>
    setForm({ ...form, [key]: event.target.value })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Partial<RegisterForm> = {}
    if (!form.name.trim()) next.name = 'Bạn cho mình biết tên để tiện xưng hô nhé.'
    if (!isEmail(form.email)) next.email = 'Email chưa đúng dạng. Ví dụ: ten@email.com'
    else if (accountExists(form.email)) next.email = 'Email này đã có tài khoản. Bạn đăng nhập hoặc dùng email khác nhé.'
    if (form.password.length < 8) next.password = 'Mật khẩu cần ít nhất 8 ký tự.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    await sleep(600)
    setLoading(false)
    navigate('/otp', { state: form })
  }

  return (
    <AuthLayout title="Đăng ký" subtitle="Tạo tài khoản để MIRA đồng hành cùng bạn.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Họ tên" autoComplete="name" value={form.name} error={errors.name} onChange={change('name')} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ten@email.com"
          value={form.email}
          error={errors.email}
          onChange={change('email')}
        />
        <PasswordField
          label="Mật khẩu"
          autoComplete="new-password"
          value={form.password}
          error={errors.password}
          hint="Bản demo: dữ liệu lưu ngay trên trình duyệt, đừng dùng mật khẩu thật."
          onChange={change('password')}
        />
        <Field
          label="Sở thích (không bắt buộc)"
          placeholder="Ví dụ: đọc sách"
          value={form.interests}
          hint="Sở thích chỉ lưu trong hồ sơ, không tự thành trí nhớ của MIRA."
          onChange={change('interests')}
        />
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Tiếp tục
        </Button>
      </form>
      <p className="t-small mt-4 text-center">
        <Link to="/login" className="inline-block py-2 font-semibold text-accent hover:underline">
          Đã có tài khoản? Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}

const OTP_LENGTH = 6
const OTP_SECONDS = 60

export function OtpPage() {
  const navigate = useNavigate()
  const form = useLocation().state as RegisterForm | null
  const createAccount = useApp((state) => state.createAccount)
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [seconds, setSeconds] = useState(OTP_SECONDS)
  const [error, setError] = useState('')
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (seconds <= 0) return setCanResend(true)
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  if (!form) return <Navigate to="/register" replace />

  const fill = (start: number, value: string) => {
    const incoming = value.replace(/\D/g, '').slice(0, OTP_LENGTH - start).split('')
    if (!incoming.length) return
    const next = [...digits]
    incoming.forEach((digit, offset) => (next[start + offset] = digit))
    setDigits(next)
    setError('')
    inputs.current[Math.min(start + incoming.length, OTP_LENGTH - 1)]?.focus()
  }

  const clear = (index: number) => {
    const next = [...digits]
    if (next[index]) {
      next[index] = ''
    } else if (index > 0) {
      next[index - 1] = ''
      inputs.current[index - 1]?.focus()
    }
    setDigits(next)
  }

  const resend = () => {
    setDigits(Array(OTP_LENGTH).fill(''))
    setSeconds(OTP_SECONDS)
    setCanResend(false)
    setError('')
    inputs.current[0]?.focus()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const code = digits.join('')
    if (code.length < OTP_LENGTH) return setError('Bạn nhập đủ 6 số giúp mình nhé.')
    if (seconds <= 0) return setError('Mã đã hết hạn. Bạn bấm “Gửi lại mã” để nhận mã mới nhé.')
    setLoading(true)
    await sleep(600)
    setLoading(false)
    if (code !== DEMO_OTP) {
      setCanResend(true)
      return setError('Mã chưa đúng. Bạn nhập lại hoặc bấm “Gửi lại mã” nhé.')
    }
    createAccount(form)
  }

  return (
    <AuthLayout
      title="Xác thực email"
      subtitle={
        <>
          Mình đã gửi mã 6 số tới <strong className="font-semibold text-text-primary">{form.email}</strong>.
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="flex justify-between gap-2" role="group" aria-label="Mã xác thực 6 số">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Số thứ ${index + 1}`}
              aria-invalid={Boolean(error) || undefined}
              className={cn(
                't-h3 h-14 w-full min-w-0 rounded-ctl border bg-bg-surface text-center transition-colors duration-150 ease-out focus:border-2 focus:border-accent',
                error ? 'border-danger' : 'border-border-default hover:border-text-secondary',
              )}
              onChange={(event) => fill(index, event.target.value)}
              onFocus={(event) => event.target.select()}
              onPaste={(event) => {
                event.preventDefault()
                fill(index, event.clipboardData.getData('text'))
              }}
              onKeyDown={(event) => {
                if (event.key === 'Backspace') {
                  event.preventDefault()
                  clear(index)
                }
                if (event.key === 'ArrowLeft') inputs.current[index - 1]?.focus()
                if (event.key === 'ArrowRight') inputs.current[index + 1]?.focus()
              }}
            />
          ))}
        </div>
        {error && <FieldError>{error}</FieldError>}
        <div className="mt-3 flex min-h-11 items-center justify-between gap-2">
          <span className="t-small text-text-secondary" aria-live="off">
            {seconds > 0 ? `Mã còn hiệu lực ${seconds} giây` : 'Mã đã hết hạn'}
          </span>
          <Button variant="text" small disabled={!canResend} onClick={resend} className="-mr-2">
            Gửi lại mã
          </Button>
        </div>
        <Button type="submit" loading={loading} className="mt-3 w-full">
          Xác nhận
        </Button>
        <Button variant="secondary" className="mt-2 w-full" onClick={() => navigate('/register')}>
          <ChevronLeft size={20} />
          Quay lại
        </Button>
      </form>
      <p className="t-caption mt-4 text-center text-text-secondary">Bản demo, mã xác thực là {DEMO_OTP}</p>
    </AuthLayout>
  )
}
