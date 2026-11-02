import { addDays, uid } from '../lib/utils'
import type { Account, Conversation, Message, Settings, UserData, Workflow } from './types'

export const DEMO_EMAIL = 'minh@mira.demo'
export const DEMO_PASSWORD = 'mira1234'
export const DEMO_OTP = '123456'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

// Bản tin sáng và Nhìn lại cuối ngày bật sẵn, Tổng kết cuối tuần tắt (FR-05, mục 8.5).
export const defaultWorkflows = (): Workflow[] => [
  {
    id: 'morning',
    title: 'Bản tin buổi sáng',
    description: 'Tổng hợp lịch, việc ưu tiên và nhắc nhở trong ngày.',
    enabled: true,
    time: '07:30',
    days: EVERY_DAY,
    contents: ['Lịch', 'Việc', 'Nhắc nhở'],
    runs: [],
  },
  {
    id: 'evening',
    title: 'Nhìn lại cuối ngày',
    description: 'Liệt kê việc đã xong, việc còn lại và gợi ý cho ngày mai.',
    enabled: true,
    time: '21:00',
    days: EVERY_DAY,
    contents: ['Lịch', 'Việc', 'Nhắc nhở'],
    runs: [],
  },
  {
    id: 'weekly',
    title: 'Tổng kết cuối tuần',
    description: 'Tổng hợp tiến độ mục tiêu và hỗ trợ điều chỉnh kế hoạch tuần sau.',
    enabled: false,
    time: '20:00',
    days: [0],
    contents: ['Lịch', 'Việc', 'Nhắc nhở'],
    runs: [],
  },
]

export const defaultSettings = (): Settings => ({
  personality: 'Điềm tĩnh',
  notifications: true,
  language: 'Tiếng Việt',
  timezone: '(GMT+7) Hà Nội',
})

export const emptyData = (): UserData => ({
  memories: [],
  tasks: [],
  events: [],
  notes: [],
  goals: [],
  habits: [],
  conversations: [],
  activeConversationId: null,
  connections: { google: false, calendar: false, gmail: false },
  memoryEnabled: true,
  slowMode: false,
  checkin: null,
  activity: [],
  workflows: defaultWorkflows(),
  notifications: [],
  settings: defaultSettings(),
})

// Hội thoại mẫu đã kết thúc, để lịch sử trông như người dùng thật.
const pastChat = (title: string, daysAgo: number, lines: Array<[Message['role'], string]>): Conversation => ({
  id: uid(),
  title,
  updatedAt: addDays(-daysAgo),
  temporary: false,
  ctx: {},
  usedMemoryIds: [],
  messages: lines.map(([role, text]) => ({ id: uid(), role, text, status: 'done' })),
})

// Dữ liệu của nhân vật Minh trong User Flow: đã kết nối Google nhưng chưa cấp quyền Gmail (điểm bắt đầu F5).
// Hôm nay giữ đúng 3 việc chưa xong và các khung sáng còn trống, vì F4 và F6 dựa vào đó.
export const minhData = (): UserData => {
  const today = addDays(0)
  const earlier = addDays(-6)
  const at = (daysAgo: number, hour: number, minute = 0) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
  }
  const memory = (content: string, daysAgo: number, source = 'Từ trò chuyện') => ({
    id: uid(),
    content,
    source,
    createdAt: addDays(-daysAgo),
    updatedAt: addDays(-daysAgo),
    status: 'active' as const,
  })
  const workflows = defaultWorkflows()
  workflows[0].runs.push(
    {
      id: uid(),
      at: at(0, 7, 30),
      trigger: 'Theo lịch',
      status: 'Thành công',
      summary: 'Lịch: Họp nhóm 09:00, Gặp thầy hướng dẫn 16:00.\nViệc: 3 việc hôm nay, ưu tiên “Nộp báo cáo thực tập”.\nNhắc nhở: 2 việc có hạn vào ngày mai.',
    },
    {
      id: uid(),
      at: at(1, 7, 30),
      trigger: 'Theo lịch',
      status: 'Thành công',
      summary: 'Lịch: không có sự kiện buổi sáng.\nViệc: 2 việc hôm qua, đã xong “Gửi dàn ý cho thầy”.\nNhắc nhở: báo cáo thực tập còn 1 ngày.',
    },
  )
  workflows[1].runs.push({
    id: uid(),
    at: at(1, 21),
    trigger: 'Theo lịch',
    status: 'Thành công',
    summary: 'Đã xong: Gửi dàn ý cho thầy, Làm slide nhóm.\nCòn lại: Ôn từ vựng tuần 3.\nGợi ý ngày mai: làm báo cáo thực tập trước buổi họp.',
  })
  return {
    ...emptyData(),
    workflows,
    notifications: [
      { id: uid(), at: at(0, 7, 30), kind: 'workflow', title: 'Bản tin buổi sáng đã sẵn sàng', body: 'Hôm nay có 2 sự kiện và 3 việc cần làm.', to: '/today', read: false },
      { id: uid(), at: at(1, 21), kind: 'workflow', title: 'Nhìn lại cuối ngày đã sẵn sàng', body: 'Hôm qua bạn xong 2 việc, còn lại 1 việc.', to: '/automation/evening', read: true },
    ],
    connections: { google: true, calendar: true, gmail: false },
    memories: [
      memory('Chia nhỏ việc giúp bạn đỡ áp lực hơn', 6),
      memory('Hay lo trước buổi thuyết trình', 6),
      memory('Thích học từ vựng vào buổi sáng', 9),
      memory('Đang thực tập ở vị trí phân tích dữ liệu', 12),
      memory('Muốn đạt IELTS 6.5 để nộp hồ sơ học bổng', 14),
      memory('Tối Chủ nhật thường gọi điện về nhà', 20),
    ],
    tasks: [
      { id: uid(), title: 'Nộp báo cáo thực tập', due: today, priority: 'Cao', status: 'Cần làm' },
      { id: uid(), title: 'Đọc tài liệu môn học', due: today, priority: 'Vừa', status: 'Cần làm' },
      { id: uid(), title: 'Dọn lại ghi chú tuần trước', due: today, priority: 'Thấp', status: 'Cần làm' },
      { id: uid(), title: 'Trả lời mail của nhóm đồ án', due: today, priority: 'Vừa', status: 'Đã xong' },
      { id: uid(), title: 'Ôn từ vựng tuần 3', due: addDays(-1), priority: 'Thấp', status: 'Cần làm' },
      { id: uid(), title: 'Gửi dàn ý cho thầy', due: addDays(-1), priority: 'Cao', status: 'Đã xong' },
      { id: uid(), title: 'Làm slide nhóm', due: addDays(-1), priority: 'Vừa', status: 'Đã xong' },
      { id: uid(), title: 'Chuẩn bị bài thuyết trình đồ án', due: addDays(1), priority: 'Cao', status: 'Đang làm' },
      { id: uid(), title: 'Mua quà sinh nhật cho mẹ', due: addDays(1), priority: 'Vừa', status: 'Cần làm' },
      { id: uid(), title: 'Viết thư xin học bổng', due: addDays(4), priority: 'Cao', status: 'Cần làm' },
      { id: uid(), title: 'Đặt vé xe về quê', due: addDays(6), priority: 'Thấp', status: 'Cần làm' },
      { id: uid(), title: 'Đăng ký câu lạc bộ tiếng Anh', due: addDays(-3), priority: 'Thấp', status: 'Đã huỷ' },
    ],
    events: [
      { id: uid(), title: 'Họp nhóm', weekday: new Date().getDay(), date: today, start: '09:00', end: '10:00', source: 'google', recurring: false },
      { id: uid(), title: 'Gặp thầy hướng dẫn', weekday: new Date().getDay(), date: today, start: '16:00', end: '17:00', source: 'google', recurring: false },
      { id: uid(), title: 'Thực tập', weekday: 2, start: '13:30', end: '17:30', source: 'google', recurring: true },
      { id: uid(), title: 'Thực tập', weekday: 4, start: '13:30', end: '17:30', source: 'google', recurring: true },
      { id: uid(), title: 'Tương tác người–máy', weekday: 3, start: '10:00', end: '11:30', source: 'google', recurring: true },
      { id: uid(), title: 'Công nghệ phần mềm', weekday: 5, start: '10:00', end: '11:30', source: 'google', recurring: true },
      { id: uid(), title: 'Ôn từ vựng', weekday: 1, start: '18:00', end: '19:00', source: 'mira', recurring: true },
      { id: uid(), title: 'Ôn từ vựng', weekday: 3, start: '18:00', end: '19:00', source: 'mira', recurring: true },
      { id: uid(), title: 'Chạy bộ', weekday: 6, start: '16:00', end: '17:00', source: 'user', recurring: true },
      { id: uid(), title: 'Gọi điện về nhà', weekday: 0, start: '21:00', end: '21:30', source: 'user', recurring: true },
    ],
    notes: [
      {
        id: uid(),
        title: 'Dàn ý báo cáo thực tập',
        body: 'Mở đầu: giới thiệu công ty và vị trí.\nNội dung: các việc đã làm mỗi tuần.\nKết luận: điều học được và đề xuất.',
        createdAt: earlier,
        source: 'user',
      },
      {
        id: uid(),
        title: 'Ý tưởng đề tài tốt nghiệp',
        body: 'Ứng dụng nhắc ôn tập theo lịch học, ưu tiên môn sắp thi.',
        createdAt: earlier,
        source: 'user',
      },
      { id: uid(), title: 'Tóm tắt cuộc họp nhóm đồ án', body: 'An làm giao diện, Bình viết báo cáo, Minh chuẩn bị slide. Hạn nộp bản nháp vào thứ Sáu.', createdAt: addDays(-2), source: 'mira' },
      { id: uid(), title: 'Từ vựng IELTS chủ đề giáo dục', body: 'curriculum, tuition, scholarship, undergraduate, assignment, plagiarism.', createdAt: addDays(-4), source: 'user' },
      { id: uid(), title: 'Hồ sơ học bổng cần chuẩn bị', body: 'Bảng điểm, thư giới thiệu của thầy, chứng chỉ IELTS và bài luận cá nhân.', createdAt: addDays(-8), source: 'mira' },
    ],
    goals: [
      { id: uid(), title: 'Hoàn thành thực tập học kỳ', progress: 75, status: 'Đang thực hiện' },
      { id: uid(), title: 'Đọc 12 cuốn sách trong năm', progress: 40, status: 'Đang thực hiện' },
      { id: uid(), title: 'Chạy được 5 km liên tục', progress: 15, status: 'Tạm dừng' },
    ],
    habits: [
      { id: uid(), title: 'Đọc sách 20 phút', doneDates: [addDays(-2), addDays(-1)] },
      { id: uid(), title: 'Ôn từ vựng', doneDates: [addDays(-3), addDays(-1)] },
      { id: uid(), title: 'Ngủ trước 23:30', doneDates: [addDays(-2)] },
    ],
    activity: [
      { id: uid(), at: at(2, 20, 15), text: 'Tạo 2 sự kiện “Ôn từ vựng” lặp hằng tuần', permission: 'Google Calendar: tạo sự kiện' },
      { id: uid(), at: at(5, 9, 40), text: 'Thêm “Gặp thầy hướng dẫn” vào lịch', permission: 'Google Calendar: tạo sự kiện' },
    ],
    conversations: [
      pastChat('Tóm tắt họp nhóm đồ án', 2, [
        ['user', 'Tóm tắt giúp mình buổi họp nhóm hôm nay: An làm giao diện, Bình viết báo cáo, mình làm slide, thứ Sáu nộp nháp.'],
        ['mira', '### Phân công\n- **An:** làm giao diện\n- **Bình:** viết báo cáo\n- **Bạn:** chuẩn bị slide\n\n### Hạn\nNộp **bản nháp vào thứ Sáu**.\n\nMình đã lưu phần này vào Ghi chú để cả nhóm tiện xem lại.'],
      ]),
      pastChat('Cách học từ vựng IELTS', 4, [
        ['user', 'Mình hay quên từ vựng IELTS, có cách nào nhớ lâu hơn không?'],
        ['mira', 'Có ba cách đơn giản mà hiệu quả, bạn thử từng cách nhé:\n\n1. **Ôn cách quãng:** xem lại sau 1 ngày, 3 ngày rồi 7 ngày.\n2. **Học theo chủ đề:** mỗi tuần một chủ đề thay vì từ rời rạc.\n3. **Tự đặt câu:** mỗi từ một câu gắn với chuyện của bạn.\n\nBạn thích học buổi sáng, nên mình gợi ý dành **15 phút sau khi thức dậy**.'],
        ['user', 'Ok, sáng mai mình bắt đầu.'],
        ['mira', 'Tuyệt. Bắt đầu nhỏ thôi, khoảng **10 từ** cho ngày đầu là đủ rồi.'],
      ]),
      pastChat('Chuẩn bị báo cáo thực tập', 6, [
        ['user', 'Báo cáo thực tập nhiều phần quá, mình không biết bắt đầu từ đâu.'],
        ['mira', 'Mình hiểu. Thử chia thành ba phần nhỏ nhé:\n\n- **Mở đầu:** công ty và vị trí của bạn\n- **Nội dung chính:** việc đã làm mỗi tuần\n- **Kết luận:** điều học được và đề xuất\n\nBạn làm phần dễ nhất trước để lấy đà.'],
      ]),
      pastChat('Lo lắng trước buổi thuyết trình', 10, [
        ['user', 'Tuần sau thuyết trình mà mình lo quá.'],
        ['mira', 'Lo trước một buổi quan trọng là chuyện rất bình thường. Mình gợi ý hai việc nhỏ:\n\n- **Tập nói to** phần mở đầu ba lần, vì trôi chảy đoạn đầu sẽ giúp bạn bình tĩnh hơn.\n- **Chuẩn bị sẵn** ba câu hỏi khó và cách trả lời.\n\nBạn muốn mình đặt lịch tập vào tối nào không?'],
      ]),
      pastChat('Hồ sơ xin học bổng', 16, [
        ['user', 'Xin học bổng cần chuẩn bị những gì?'],
        ['mira', 'Thường cần các giấy tờ sau, bạn kiểm tra lại yêu cầu của từng trường nhé:\n\n- Bảng điểm\n- Thư giới thiệu\n- Chứng chỉ ngoại ngữ\n- Bài luận cá nhân\n\nMình đã ghi danh sách này vào Ghi chú.'],
      ]),
    ],
  }
}

export const demoAccount = (): Account => ({
  name: 'Minh',
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  interests: 'đọc sách',
  data: minhData(),
})
