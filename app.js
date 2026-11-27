/* SW교육센터 — 랜딩 + 강사 포털 (데모: 데이터는 이 브라우저의 localStorage에만 저장됩니다) */
(() => {
'use strict';

/* =====================================================================
   CONFIG — 기관 정보는 여기서만 바꾸면 화면 전체에 반영됩니다.
   operator(운영기관/사업자 정보)는 비워두면 화면에 표시되지 않습니다.
   ===================================================================== */
const CONFIG = {
  brand: 'SW교육센터',
  sub: '강사 포털',
  eyebrow: 'AI·SW 교육 · 강사 양성',
  heroLine1: '우리 지역의 미래,',
  lead: '초·중등생을 위한 맞춤형 SW 교육과 역량 있는 전문 강사 양성의 장입니다.',
  address: '○○시 ○○구 ○○로 00, 0층',
  phone: '000-0000-0000',
  hours: '평일 09:00 – 18:00 (점심 12:00 – 13:00)',
  portalUrl: '',            // 예: 'https://example.or.kr'
  mapQuery: '',             // 지도 검색어. 비우면 지도 버튼을 숨깁니다.
  operator: null,           // 예: { name: '(주)○○', ceo: '○○○', bizNo: '000-00-00000', addr: '...' }
  rates: { main: 30000, assist: 20000 },   // 차시당 강사료 (주강사 / 보조강사)
  carryFee: 20000,          // 교구운반비 정책 금액
  radius: 300,              // 입실 허용 반경(m)
};

/* ================= Utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const hm = (t) => { if (!t) return '—'; const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const dLabel = (s) => { const d = new Date(s.slice(0, 10) + 'T00:00'); return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DOW[d.getDay()]})`; };
const dot = (s) => (s || '').slice(0, 10).replace(/-/g, '.');
const ymLabel = (s) => { const [y, m] = s.split('-'); return `${y}년 ${+m}월`; };
const addMonths = (s, n) => { const [y, m] = s.split('-').map(Number); return ym(new Date(y, m - 1 + n, 1)); };
const addDays = (n, base = new Date()) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
const dt = (t) => new Date(t).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();

const store = {
  get(k, d) { try { const v = localStorage.getItem('swedu:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('swedu:' + k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem('swedu:' + k); } catch { /* noop */ } },
};

/* ================= Icons ================= */
const P = {
  spark: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 9M22 21v-1a6 6 0 0 0-4-5.6"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
  grad: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v3M16 18v3"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  tent: '<path d="M3 20L12 4l9 16H3zM8.5 20L12 13l3.5 7"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2M7 6V4h10v2"/>',
  pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 16 0v1"/>',
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="7" y="14" width="10" height="7"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 8a5 5 0 0 1 0 8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.5"/>',
  rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 11a12 12 0 0 1 11-8 12 12 0 0 1-8 11l-3 1-1-1z"/><circle cx="15" cy="9" r="1.5"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
const hydrateIcons = (root = document) => $$('[data-icon]', root).forEach((el) => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); });

/* ================= Toast / Modal ================= */
function toast(msg, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function modal({ title, body, foot = '', wide = false, onMount }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-h"><h3>${esc(title)}</h3><button class="btn ghost icon-btn" data-close aria-label="닫기">${icon('x')}</button></div>
    <div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  document.body.appendChild(bg);
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  document.addEventListener('keydown', onKey);
  bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  if (onMount) onMount(bg, close);
  const f = $('.modal-b input:not([type=hidden]):not([type=radio]), .modal-b select, .modal-b textarea', bg);
  if (f) f.focus();
  return { el: bg, close };
}
function formModal({ title, fields, submit = '저장', wide, onSubmit, onMount }) {
  return modal({
    title, wide,
    body: `<form id="mf" novalidate>${fields}</form>`,
    foot: `<button class="btn" data-close type="button">취소</button><button class="btn primary" form="mf" type="submit">${esc(submit)}</button>`,
    onMount(bg, close) {
      const form = $('#mf', bg);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bad = requiredMissing(form);
        if (bad) { bad.focus(); toast('필수 항목을 입력해 주세요.', true); return; }
        const r = await onSubmit(Object.fromEntries(new FormData(form)), form, close);
        if (r !== false) close();
      });
      if (onMount) onMount(bg, close);
    },
  });
}
const requiredMissing = (form) => $$('[required]', form).find((el) => !el.disabled && (el.type === 'checkbox' ? !el.checked : !String(el.value).trim()));
function askReason(title, message, cb, { submit = '확인' } = {}) {
  formModal({ title, submit,
    fields: `<p class="muted" style="margin-top:0">${message}</p><label class="f"><span>사유</span><textarea id="reasonInput" name="reason" required placeholder="사유를 입력하세요"></textarea></label>`,
    onSubmit: (d) => cb(d.reason.trim()) });
}
const confirmDo = (title, msg, fn, label = '확인') => modal({ title, body: `<p style="margin:0">${msg}</p>`,
  foot: `<button class="btn" data-close>취소</button><button class="btn primary" id="cfm">${esc(label)}</button>`,
  onMount(bg, close) { $('#cfm', bg).onclick = () => { close(); fn(); }; } });
async function copyText(text, okMsg = '복사했습니다.') {
  try { await navigator.clipboard.writeText(text); toast(okMsg); }
  catch {
    modal({ title: '아래 내용을 복사하세요', body: `<textarea id="copyArea" style="min-height:200px">${esc(text)}</textarea>`, foot: '<button class="btn" data-close>닫기</button>',
      onMount(bg) { const t = $('#copyArea', bg); setTimeout(() => { t.focus(); t.select(); }, 30); } });
  }
}

/* ================= Seed data (모두 예시 데이터) ================= */
const SITES = [
  { id: 's1', name: '○○초등학교', lat: 37.5665, lng: 126.9780 },
  { id: 's2', name: '△△중학교', lat: 37.5700, lng: 126.9920 },
  { id: 's3', name: '□□지역아동센터', lat: 37.5610, lng: 126.9700 },
  { id: 's4', name: '거점센터 (상설 체험관)', lat: 37.5550, lng: 126.9900 },
];
const MANAGERS = ['운영팀 담당자 A', '운영팀 담당자 B'];
const COLLEAGUES = ['동료 강사 A', '동료 강사 B', '동료 강사 C'];
const ASSETS = [
  { id: 'robot', name: '코딩로봇', total: 30 },
  { id: 'drone', name: '코딩 드론', total: 20 },
  { id: 'tablet', name: '태블릿', total: 25 },
  { id: 'laptop', name: '노트북', total: 25 },
  { id: 'vr', name: 'VR 헤드셋', total: 10 },
  { id: 'kit', name: '교구재 세트', total: 12 },
];
const PROGRAMS = ['엔트리 코딩 기초', 'AI 이미지 분류 체험', '드론 코딩', '피지컬 컴퓨팅', '3D 프린팅 메이커'];
const siteName = (id) => (SITES.find((s) => s.id === id) || {}).name || id;
const assetName = (id) => (ASSETS.find((a) => a.id === id) || {}).name || id;

function seed() {
  const now = new Date();
  const today = ymd(now);
  const schedule = [];
  const attendance = [];
  let k = 0;
  for (let mo = -2; mo <= 1; mo++) {
    const first = new Date(now.getFullYear(), now.getMonth() + mo, 1);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const day = new Date(first.getFullYear(), first.getMonth(), d);
      const w = day.getDay();
      if (![1, 3, 5].includes(w)) continue;
      k++;
      const date = ymd(day);
      const siteId = w === 3 ? 's2' : w === 5 ? (k % 2 ? 's3' : 's4') : 's1';
      const start = w === 3 ? '14:00' : '09:00';
      const end = w === 3 ? '16:00' : '11:00';
      schedule.push({ id: uid(), date, siteId, start, end, periods: 2, program: PROGRAMS[k % PROGRAMS.length] });
      if (date < today) {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const tin = new Date(day); tin.setHours(sh, sm - 10 + (k % 7), 0, 0);
        const tout = new Date(day); tout.setHours(eh, em + (k % 6), 0, 0);
        const daysAgo = Math.round((now - day) / 86400000);
        attendance.push({ id: uid(), date, siteId, role: k % 5 === 0 ? 'assist' : 'main', periods: 2, reason: '',
          in: { t: +tin, dist: 30 + (k % 6) * 12, device: 'Chrome · Android' }, out: { t: +tout, dist: 40 + (k % 4) * 15, device: 'Chrome · Android' },
          status: daysAgo <= 3 ? 'pending' : 'approved', memo: '' });
      }
    }
  }
  const pickup = (n, h = '09:00') => `${ymd(addDays(n))}T${h}`;
  const rentals = [
    { id: uid(), manager: MANAGERS[0], assetId: 'kit', qty: 1, pickupAt: pickup(4), returnDate: ymd(addDays(6)), site: SITES[0].name, picker: '본인', returner: '본인', note: '', status: 'pending', createdAt: Date.now() - 3600e3 },
    { id: uid(), manager: MANAGERS[0], assetId: 'robot', qty: 5, pickupAt: pickup(2), returnDate: ymd(addDays(7)), site: `${SITES[0].name} 외 2곳`, picker: '본인', returner: '본인', note: '코딩 수업용', status: 'approved', createdAt: Date.now() - 86400e3 * 2 },
    { id: uid(), manager: MANAGERS[1], assetId: 'tablet', qty: 3, pickupAt: pickup(-2), returnDate: ymd(addDays(3)), site: SITES[1].name, picker: '본인', returner: COLLEAGUES[0], note: '', status: 'approved', createdAt: Date.now() - 86400e3 * 5 },
    { id: uid(), manager: MANAGERS[0], assetId: 'laptop', qty: 2, pickupAt: pickup(-6), returnDate: ymd(addDays(-1)), site: SITES[2].name, picker: '본인', returner: '본인', note: '', status: 'approved', createdAt: Date.now() - 86400e3 * 8 },
    { id: uid(), manager: MANAGERS[1], assetId: 'drone', qty: 6, pickupAt: pickup(-30), returnDate: ymd(addDays(-27)), site: SITES[3].name, picker: '본인', returner: '본인', note: '', status: 'returned', createdAt: Date.now() - 86400e3 * 33 },
  ];
  const lastMonth = addMonths(ym(now), -1);
  return {
    v: 2,
    profile: { name: '홍길동', phone: '010-0000-0000', pw: '1234', mustChangePw: true, notify: false, notifyAskedAt: 0 },
    schedule, attendance, rentals,
    claims: [
      { id: uid(), type: '실비', category: '여비', title: `${SITES[1].name} 출강 여비`, amount: 15000, date: `${lastMonth}-14`, reason: '왕복 교통비', receipt: null, receiptName: null, rentalId: null, manager: MANAGERS[0], status: 'approved', memo: '', createdAt: Date.now() - 86400e3 * 30 },
      { id: uid(), type: '실비', category: '교구운반비', title: '교구운반비', amount: CONFIG.carryFee, date: ymd(addDays(-30)), reason: '', receipt: null, receiptName: null, rentalId: rentals[4].id, manager: MANAGERS[1], status: 'approved', memo: '', createdAt: Date.now() - 86400e3 * 29 },
      { id: uid(), type: '수당', category: '여비', title: `${SITES[2].name} 출강 여비`, amount: 12000, date: ymd(addDays(-2)), reason: '거점센터 기준 원거리 교육장', receipt: null, receiptName: null, rentalId: null, manager: MANAGERS[0], status: 'rejected', memo: '발생일의 근무기록이 승인된 뒤 다시 신청해 주세요.', createdAt: Date.now() - 86400e3 * 2 },
    ],
    inquiries: [
      { id: uid(), manager: MANAGERS[0], category: '대여 관련', title: '교구운반비 청구 문의', status: 'open', unread: true, createdAt: Date.now() - 86400e3,
        messages: [
          { by: 'me', t: Date.now() - 86400e3, text: '교구 운반비는 어디서 청구하나요?' },
          { by: 'admin', name: MANAGERS[0], t: Date.now() - 86400e3 + 20 * 60e3, text: '비용청구 메뉴에서 카테고리를 "교구운반비"로 선택하시고\n관련건에 본인 대여건을 골라 주세요.' },
        ] },
    ],
    notifications: [
      { id: uid(), t: Date.now() - 86400e3 + 20 * 60e3, text: '문의 "교구운반비 청구 문의"에 답변이 등록되었습니다.', link: 'app-inquiry', read: false },
      { id: uid(), t: Date.now() - 86400e3 * 2, text: '비용청구 "여비 12,000원"이 거절되었습니다. 사유를 확인해 주세요.', link: 'app-claims', read: false },
    ],
    contracts: [
      { id: uid(), title: '강사 위촉(용역) 계약서', type: '용역계약', period: `${now.getFullYear()}.03.01 ~ ${now.getFullYear()}.12.31`, status: 'signed', signedAt: Date.now() - 86400e3 * 200, signature: null },
      { id: uid(), title: '개인정보 수집·이용 동의서', type: '동의서', period: '계약기간 동안', status: 'unsigned' },
      { id: uid(), title: '겨울방학 특화캠프 추가 출강 계약서', type: '용역계약', period: `${now.getFullYear() + 1}.01.05 ~ ${now.getFullYear() + 1}.02.13`, status: 'unsigned' },
    ],
    docs: [
      { id: uid(), type: '강의결과보고서', title: `${ymLabel(lastMonth)} 강의결과보고서`, amount: 0, content: '찾아가는 SW교실 12회 운영, 참여 학생 284명.', status: 'approved', createdAt: Date.now() - 86400e3 * 20, history: [{ t: Date.now() - 86400e3 * 18, by: '센터장', act: '승인' }] },
    ],
    notices: [
      { id: uid(), title: '강사 포털 오픈 안내', body: '로그인 후 입퇴실, 근무기록, 스케줄, 대여신청, 비용청구, 관리자에게 문의를 이용할 수 있습니다.\n첫 로그인 시 반드시 비밀번호를 변경해 주세요.', date: ymd(addDays(-10)), pinned: true },
      { id: uid(), title: '대여 신청 마감 규칙 안내', body: '대여 신청은 대여일 기준 이틀 전 17시까지 마감됩니다.\n대여 당일 교구 변경 및 추가 대여는 어렵습니다.', date: ymd(addDays(-6)), pinned: false },
      { id: uid(), title: '강사료 정산 일정 안내', body: '운영팀이 수업 차시를 승인하면 해당 월 정산에 반영되며, 익월 10일에 지급됩니다.', date: ymd(addDays(-3)), pinned: false },
    ],
    jobs: [
      { id: uid(), title: '겨울방학 AI 특화캠프 강사', region: '센터 거점', type: '단기 (1~2월)', pay: `차시당 ${won(CONFIG.rates.main)}`, deadline: ymd(addDays(18)), status: 'open', desc: '방학 집중 AI 프로젝트 캠프 주강사를 모집합니다.\n\n· 자격: SW교육 강의 경력 또는 강사 양성 과정 수료자\n· 근무: 주 3회, 09:00–11:00 (2차시)\n· 우대: 드론·로봇 교구 운영 경험', createdAt: Date.now() - 86400e3 * 5 },
      { id: uid(), title: '찾아가는 SW교실 보조강사', region: '관내 학교', type: '시간제', pay: `차시당 ${won(CONFIG.rates.assist)}`, deadline: ymd(addDays(-40)), status: 'closed', desc: '학교·지역아동센터 방문 수업 보조강사 모집 (마감).', createdAt: Date.now() - 86400e3 * 70 },
    ],
    applications: [],
    subscribers: [],
  };
}

let db = store.get('db');
if (!db || db.v !== 2) { db = seed(); store.set('db', db); }
const save = () => { if (!store.set('db', db)) toast('브라우저 저장공간이 부족해 저장하지 못했습니다.', true); };
let session = store.get('session', null);
const isAdmin = () => session?.role === 'admin';
const me = () => db.profile.name;
function notify(text, link) {
  db.notifications.unshift({ id: uid(), t: Date.now(), text, link, read: false });
  try { if (db.profile.notify && 'Notification' in window && Notification.permission === 'granted') new Notification(CONFIG.brand, { body: text }); } catch { /* 알림 불가 환경 */ }
}

/* ================= Domain helpers ================= */
const roleLabel = (r) => (r === 'assist' ? '보조강사' : '주강사');
const rateOf = (r) => (r === 'assist' ? CONFIG.rates.assist : CONFIG.rates.main);
const minutesOf = (r) => (r.in && r.out ? Math.max(0, Math.round((r.out.t - r.in.t) / 60000)) : 0);
const hhmm = (mins) => `${Math.floor(mins / 60)}시간 ${pad(mins % 60)}분`;
const openRecord = () => db.attendance.find((r) => r.in && !r.out);
const todaySchedule = () => db.schedule.filter((s) => s.date === ymd());
const ATT_STATUS = { working: ['근무중', 'ok'], missing: ['퇴실 미처리', 'danger'], pending: ['승인대기', 'warn'], approved: ['승인완료', 'brand'], rejected: ['승인거부', ''] };
const attStatus = (r) => (!r.out ? (r.date < ymd() ? 'missing' : 'working') : r.status);
const STATUS = {
  pending: ['승인대기', 'warn'], approved: ['승인완료', 'ok'], rejected: ['거절', 'danger'],
  signed: ['서명완료', 'ok'], unsigned: ['서명필요', 'danger'], open: ['모집중', 'ok'], closed: ['마감', ''],
  new: ['신규', 'info'], reviewed: ['검토완료', 'ok'],
};
const badge = (s, map = STATUS) => { const [l, c] = map[s] || [s, '']; return `<span class="badge ${c}">${esc(l)}</span>`; };

/** 대여 상태: 승인대기 → 대여예정 → 대여중 → (연체) → 반납확인중 → 반납완료 */
function rentalState(r) {
  const now = Date.now();
  const today = ymd();
  if (r.status === 'pending') return { key: 'pending', label: '승인대기', cls: 'warn', sub: '신청 중' };
  if (r.status === 'rejected') return { key: 'rejected', label: '거부', cls: '', sub: r.memo || '' };
  if (r.status === 'returned') return { key: 'returned', label: '반납완료', cls: 'ok', sub: `${dot(r.returnDate)} 반납` };
  if (r.status === 'returning') return { key: 'returning', label: '반납확인중', cls: 'warn', sub: '운영팀 확인 대기' };
  const pick = new Date(r.pickupAt).getTime();
  if (now < pick) return { key: 'reserved', label: '대여예정', cls: 'info', sub: `D-${Math.ceil((pick - now) / 86400e3)} 불출` };
  if (today > r.returnDate) return { key: 'overdue', label: '연체', cls: 'danger', sub: `+${Math.round((new Date(today) - new Date(r.returnDate)) / 86400e3)}일` };
  const left = Math.round((new Date(r.returnDate) - new Date(today)) / 86400e3);
  return { key: 'out', label: '대여중', cls: 'ok', sub: left === 0 ? '오늘 반납' : `D-${left} 반납` };
}
const inUse = (assetId) => db.rentals.filter((r) => r.assetId === assetId && ['approved', 'returning'].includes(r.status)).reduce((a, r) => a + Number(r.qty), 0);
const available = (assetId) => (ASSETS.find((a) => a.id === assetId)?.total || 0) - inUse(assetId);
/** 대여 신청 마감: 대여일 기준 이틀 전 17:00 */
const rentalDeadline = (pickupAt) => { const d = new Date(pickupAt.slice(0, 10) + 'T17:00'); d.setDate(d.getDate() - 2); return d; };

function haversine(a, b, c, d) {
  const R = 6371000, toR = (x) => (x * Math.PI) / 180;
  const h = Math.sin(toR(c - a) / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(toR(d - b) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
function getPos() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('unsupported'));
    try { navigator.geolocation.getCurrentPosition((p) => res(p.coords), rej, { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }); } catch (e) { rej(e); }
  });
}
function deviceInfo() {
  const ua = navigator.userAgent;
  const br = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '브라우저';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return [br, os].filter(Boolean).join(' · ');
}
function payroll(month) {
  const recs = db.attendance.filter((r) => r.date.startsWith(month) && r.out && r.status === 'approved');
  const periods = recs.reduce((a, r) => a + Number(r.periods || 0), 0);
  const fee = recs.reduce((a, r) => a + Number(r.periods || 0) * rateOf(r.role), 0);
  const allow = db.claims.filter((c) => c.date.startsWith(month) && c.status === 'approved' && c.type === '수당').reduce((a, c) => a + Number(c.amount), 0);
  const taxBase = fee + allow;
  const incomeTax = Math.floor((taxBase * 0.03) / 10) * 10;
  const localTax = Math.floor((incomeTax * 0.1) / 10) * 10;
  const exps = db.claims.filter((c) => c.date.startsWith(month) && c.status === 'approved' && c.type === '실비');
  const exp = exps.reduce((a, c) => a + Number(c.amount), 0);
  const pending = db.attendance.filter((r) => r.date.startsWith(month) && r.out && r.status === 'pending').reduce((a, r) => a + Number(r.periods || 0), 0);
  return { recs, periods, fee, allow, incomeTax, localTax, exps, exp, pending, net: taxBase - incomeTax - localTax + exp, days: new Set(recs.map((r) => r.date)).size };
}
function readImage(file, max = 1000) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      if (!file.type.startsWith('image/')) return res(file.size < 400000 ? fr.result : null);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
const adminPending = () =>
  db.attendance.filter((r) => r.out && r.status === 'pending').length +
  db.claims.filter((c) => c.status === 'pending').length +
  db.rentals.filter((r) => r.status === 'pending' || r.status === 'returning').length +
  db.docs.filter((d) => d.status === 'pending').length +
  db.inquiries.filter((q) => q.status === 'open' && q.messages[q.messages.length - 1].by === 'me').length +
  db.applications.filter((a) => a.status === 'new').length;

/* ================= Theme ================= */
const applyTheme = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
applyTheme(store.get('theme', null));
function toggleTheme() {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next); store.set('theme', next);
}

/* ================= Header ================= */
function renderHeader(inPortal) {
  $('#nav').hidden = !!inPortal;
  const unread = db.notifications.filter((n) => !n.read).length;
  $('#hdrActions').innerHTML = `
    <button class="btn ghost icon-btn" data-action="theme" aria-label="화면 테마 전환">${icon('moon')}</button>
    ${session && inPortal ? `<button class="btn ghost icon-btn bell" data-action="notifs" aria-label="알림 ${unread}건">${icon('bell')}${unread ? `<span class="dot">${unread}</span>` : ''}</button>` : ''}
    ${session
      ? `${inPortal ? `<a class="btn ghost" href="#top">홈</a>` : `<a class="btn primary" href="#app">${icon('home')}<span class="login-txt">강사 포털</span></a>`}
         <button class="btn" data-action="logout" aria-label="로그아웃">${icon('logout')}<span class="login-txt">로그아웃</span></button>`
      : `<a class="btn primary" href="#login">${icon('login')}<span class="login-txt">로그인</span></a>`}
    ${inPortal ? '' : `<button class="btn ghost icon-btn menu-btn" data-action="menu" aria-label="메뉴 열기">${icon('menu')}</button>`}`;
}

/* ================= Landing ================= */
const FEATURES = [
  ['clock', '입퇴실', '교육장·역할을 고르고 버튼 한 번으로 입실·퇴실. GPS 위치와 시각이 자동 기록됩니다.', 'checkin'],
  ['list', '근무기록', '날짜별 입퇴실·차시·승인 상태 확인, 기간·상태·교육장 필터와 엑셀 받기.', 'records'],
  ['calendar', '스케줄', '예정·실시 일정을 월간·주간 달력으로. 이번 달 총 차시 자동 합산.', 'schedule'],
  ['box', '대여신청', '교구·기자재 대여 신청부터 대여예정·대여중·연체·반납까지 상태 추적.', 'rental'],
  ['receipt', '비용청구', '여비와 교구운반비 청구, 영수증 첨부, 청구이력과 거절 사유 확인.', 'claims'],
  ['chat', '관리자에게 문의', '운영팀에 1:1 문의를 남기고 답변이 오면 알림으로 받습니다.', 'inquiry'],
];
let jobFilter = 'open';
let jobQuery = '';

function applyConfig() {
  $$('[data-cfg]').forEach((el) => { const v = CONFIG[el.dataset.cfg]; if (v) el.textContent = v; });
  document.title = `${CONFIG.brand} 강사 포털`;
  const mapBtns = CONFIG.mapQuery ? `<a class="btn sm" target="_blank" rel="noopener" href="https://map.kakao.com/?q=${encodeURIComponent(CONFIG.mapQuery)}">카카오맵</a>
      <a class="btn sm" target="_blank" rel="noopener" href="https://map.naver.com/p/search/${encodeURIComponent(CONFIG.mapQuery)}">네이버지도</a>` : '';
  $('#contactBox').innerHTML = `
    <div class="card">
      <div class="contact-item"><div class="ic">${icon('pin')}</div><div><b>센터 위치</b><div class="v">${esc(CONFIG.address)}</div>
        <div class="acts"><button class="btn sm" data-action="copy" data-copy="${esc(CONFIG.address)}">${icon('copy')} 주소 복사</button>${mapBtns}</div></div></div>
      <div class="contact-item"><div class="ic">${icon('phone')}</div><div><b>대표 문의</b><div class="v">${esc(CONFIG.phone)}</div>
        <div class="small muted">${esc(CONFIG.hours)}</div>
        <div class="acts"><button class="btn sm" data-action="copy" data-copy="${esc(CONFIG.phone)}">${icon('copy')} 번호 복사</button></div></div></div>
      ${CONFIG.portalUrl ? `<div class="contact-item"><div class="ic">${icon('globe')}</div><div><b>공식 포털</b><a class="v" href="${esc(CONFIG.portalUrl)}" target="_blank" rel="noopener">${esc(CONFIG.portalUrl.replace(/^https?:\/\//, ''))} ↗</a></div></div>` : ''}
    </div>
    <div class="map-box"><div>
      <div class="map-pin">${icon('pin')}</div>
      <b>${esc(CONFIG.brand)}</b>
      <div class="small muted">${esc(CONFIG.address)}</div>
    </div></div>`;
  const op = CONFIG.operator;
  $('#footerCols').innerHTML = `
    <div><h4>${esc(CONFIG.brand)}</h4>${esc(CONFIG.address)}<br>대표 문의 ${esc(CONFIG.phone)}
      ${op && op.name ? `<br><br><span class="small">${esc(op.name)}${op.ceo ? ` · 대표 ${esc(op.ceo)}` : ''}${op.bizNo ? ` · 사업자등록번호 ${esc(op.bizNo)}` : ''}${op.addr ? `<br>${esc(op.addr)}` : ''}</span>` : ''}</div>
    <div><h4>바로가기</h4><a href="#jobs">채용공고</a> · <a href="#notices">공지사항</a> · <a href="#login">강사 로그인</a><br>
      <button class="btn sm ghost" style="padding-left:0;margin-top:6px" data-action="theme">${icon('moon')} 화면 테마 전환</button></div>`;
  $('#faqList').innerHTML = [
    ['강사 양성 과정은 누가 지원할 수 있나요?', '미취업 청년, 경력단절 여성, 퇴직 전문가 등 SW 교육 강사로 활동하고자 하는 성인이라면 지원할 수 있습니다.'],
    ['찾아가는 SW 교실은 어떻게 신청하나요?', `학교·지역아동센터 담당자께서 대표번호(${CONFIG.phone})로 문의해 주세요.`],
    ['채용공고가 없을 때는 어떻게 하나요?', '채용공고 영역의 "알림 받기"에 이메일을 등록하시면 새 공고가 올라올 때 안내해 드립니다.'],
    ['강사 포털 계정은 어떻게 받나요?', '채용이 확정된 강사에게 운영팀이 휴대폰 번호로 계정과 초기 비밀번호를 발급합니다. 첫 로그인 후 반드시 비밀번호를 변경해 주세요.'],
  ].map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
}

function renderLanding() {
  $('#featureGrid').innerHTML = FEATURES.map(([ic, t, d, tab]) => `
    <a class="card feat" href="${session ? '#app-' + tab : '#login'}" style="color:inherit;text-decoration:none">
      <div class="ic">${icon(ic)}</div><div><h3>${t}</h3><p>${d}</p></div></a>`).join('');
  const notices = [...db.notices].sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)).slice(0, 6);
  $('#noticeList').innerHTML = notices.length
    ? notices.map((n) => `<li data-action="notice" data-id="${n.id}" tabindex="0">${n.pinned ? '<span class="badge brand">중요</span>' : '<span class="badge">공지</span>'}<span class="t">${esc(n.title)}</span><time>${dot(n.date)}</time></li>`).join('')
    : '<li class="muted" style="cursor:default">등록된 공지사항이 없습니다.</li>';
  renderJobs();
}
function renderJobs() {
  const today = ymd();
  const q = jobQuery.trim().toLowerCase();
  const isOpen = (j) => j.status === 'open' && j.deadline >= today;
  let list = db.jobs.filter((j) => (jobFilter === 'all' ? true : jobFilter === 'open' ? isOpen(j) : !isOpen(j)));
  if (q) list = list.filter((j) => [j.title, j.region, j.type, j.desc].join(' ').toLowerCase().includes(q));
  list.sort((a, b) => isOpen(b) - isOpen(a) || a.deadline.localeCompare(b.deadline));
  $$('#jobFilter .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === jobFilter));
  if (!list.length) {
    $('#jobList').innerHTML = `<div class="empty">
      <div class="ic">${icon('bell')}</div>
      <b>${q ? '검색 결과가 없습니다' : jobFilter === 'open' ? '현재 진행 중인 채용공고가 없습니다' : '해당하는 공고가 없습니다'}</b>
      <p class="muted small" style="margin:6px 0 0">새 공고가 올라오면 이메일로 알려드릴게요.</p>
      <form data-form="subscribe"><input id="subEmail" type="email" name="email" required placeholder="이메일 주소" aria-label="알림 받을 이메일"><button class="btn primary">알림 받기</button></form>
    </div>`;
    return;
  }
  $('#jobList').innerHTML = `<div class="grid g2">${list.map((j) => {
    const open = isOpen(j);
    const dday = Math.ceil((new Date(j.deadline + 'T23:59') - new Date()) / 86400000);
    return `<article class="card job" data-action="job" data-id="${j.id}" tabindex="0">
      <div class="row" style="align-items:center;gap:8px;flex-wrap:nowrap">${badge(open ? 'open' : 'closed')}${open && dday <= 7 ? `<span class="badge danger">D-${dday}</span>` : ''}<span style="flex:1"></span></div>
      <h3 style="margin:0">${esc(j.title)}</h3>
      <div class="meta"><span>${icon('pin')}${esc(j.region)}</span><span>${icon('briefcase')}${esc(j.type)}</span><span>${icon('wallet')}${esc(j.pay)}</span><span>${icon('calendar')}~${dot(j.deadline)}</span></div>
    </article>`;
  }).join('')}</div>`;
}
function openJob(id) {
  const j = db.jobs.find((x) => x.id === id); if (!j) return;
  const open = j.status === 'open' && j.deadline >= ymd();
  const m = modal({ title: j.title, wide: true,
    body: `<div class="row" style="gap:8px;margin-bottom:14px">${badge(open ? 'open' : 'closed')}<span class="badge">${esc(j.region)}</span><span class="badge">${esc(j.type)}</span><span class="badge">${esc(j.pay)}</span><span class="badge">마감 ${dot(j.deadline)}</span></div>
      <div style="white-space:pre-wrap">${esc(j.desc)}</div>`,
    foot: `<button class="btn" data-close>닫기</button>${open ? `<button class="btn primary" id="applyBtn">${icon('arrow')} 지원하기</button>` : ''}`,
    onMount(bg) { const b = $('#applyBtn', bg); if (b) b.onclick = () => { m.close(); applyJob(j); }; } });
}
function applyJob(j) {
  formModal({ title: `지원서 작성 — ${j.title}`, submit: '지원서 제출',
    fields: `<div class="row"><label class="f"><span>이름 *</span><input id="apName" name="name" required autocomplete="name"></label>
      <label class="f"><span>연락처 *</span><input id="apPhone" name="phone" required inputmode="tel" placeholder="010-0000-0000" autocomplete="tel"></label></div>
      <label class="f"><span>이메일</span><input id="apEmail" name="email" type="email" autocomplete="email"></label>
      <label class="f"><span>경력·자격 요약 *</span><textarea id="apCareer" name="career" required placeholder="SW교육 강의 경력, 보유 자격 등"></textarea></label>
      <label class="check"><input id="apAgree" type="checkbox" name="agree" required> 채용 진행을 위한 개인정보 수집·이용에 동의합니다. (보유기간: 채용 종료 후 6개월)</label>`,
    onSubmit(d) {
      if (!/^[0-9\-\s+]{9,}$/.test(d.phone)) { toast('연락처 형식을 확인해 주세요.', true); return false; }
      db.applications.unshift({ id: uid(), jobId: j.id, jobTitle: j.title, name: d.name, phone: d.phone, email: d.email, career: d.career, status: 'new', createdAt: Date.now() });
      save(); toast('지원서가 접수되었습니다. 검토 후 연락드릴게요.');
    } });
}
function openNotice(id) {
  const n = db.notices.find((x) => x.id === id); if (!n) return;
  modal({ title: n.title, body: `<div class="muted small" style="margin-bottom:12px">${dot(n.date)}</div><div style="white-space:pre-wrap">${esc(n.body)}</div>`, foot: '<button class="btn" data-close>닫기</button>' });
}

/* ================= Login ================= */
let loginRole = 'instructor';
function renderLogin() {
  const v = $('#view');
  v.innerHTML = `<div class="login-page"><div class="card login-card">
    <h2 style="margin-bottom:6px;text-align:center">${esc(CONFIG.brand)} 강사 로그인</h2>
    <p class="muted small" style="margin:0 0 18px;text-align:center">데모: 휴대폰 번호 형식과 4자 이상 비밀번호면 로그인됩니다.</p>
    <div class="seg" role="tablist">
      <button type="button" data-role="instructor" class="${loginRole === 'instructor' ? 'on' : ''}">강사</button>
      <button type="button" data-role="admin" class="${loginRole === 'admin' ? 'on' : ''}">운영팀(관리자)</button>
    </div>
    <form data-form="login">
      <label class="f"><span>휴대폰 번호</span><input id="loginPhone" name="phone" required inputmode="tel" placeholder="010-XXXX-XXXX" autocomplete="username" value="${esc(store.get('lastPhone', ''))}"></label>
      <label class="f"><span>비밀번호</span><input id="loginPw" name="pw" type="password" required autocomplete="current-password"></label>
      <button class="btn primary lg" style="width:100%">로그인</button>
    </form>
    <p class="small" style="margin:12px 0 0;text-align:center"><a href="#" data-action="findPw">비밀번호 찾기</a></p>
    <div class="note" style="margin-top:16px"><b>첫 로그인 시</b><br>초기 비밀번호로 로그인한 뒤 반드시 본인이 사용할 비밀번호로 변경해 주세요.</div>
    <p class="small muted" style="margin:16px 0 0;text-align:center"><a href="#top">← 센터 홈으로</a></p>
  </div></div>`;
  $$('.seg button', v).forEach((b) => b.onclick = () => { loginRole = b.dataset.role; renderLogin(); });
}

/* ================= Portal ================= */
const TABS = [
  ['checkin', '입퇴실', 'clock'], ['records', '근무기록', 'list'], ['schedule', '스케줄', 'calendar'],
  ['rental', '대여신청', 'box'], ['claims', '비용청구', 'receipt'], ['inquiry', '관리자에게 문의', 'chat'],
];
const EXTRA_TABS = [['pay', '정산 명세', 'wallet'], ['contracts', '전자계약', 'pen'], ['docs', '서류 작성', 'doc'], ['profile', '내 정보', 'user']];
const ADMIN_TABS = [['admin', '승인함', 'shield'], ['cms', '채용·공지 관리', 'megaphone']];
const TAB_TITLES = Object.fromEntries([...TABS, ...EXTRA_TABS, ...ADMIN_TABS].map(([id, t]) => [id, t]));
let timer = null;
const ui = { calMonth: ym(), calView: 'month', calWeek: ymd(), payMonth: ym(), role: 'main', site: null,
  recFrom: `${ym()}-01`, recTo: ymd(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)), recStatus: 'all', recSite: 'all', recOpen: null,
  rentalTab: 'list', claimTab: 'form', inqTab: 'form', inqOpen: null, editClaim: null, rentalPrefill: null };

function renderPortal(tab) {
  clearInterval(timer);
  const all = [...TABS, ...EXTRA_TABS, ...(isAdmin() ? ADMIN_TABS : [])];
  if (!all.find((t) => t[0] === tab)) tab = 'checkin';
  const unsigned = db.contracts.filter((c) => c.status === 'unsigned').length;
  const unreadInq = db.inquiries.filter((q) => q.unread).length;
  const pc = adminPending();
  const counts = { contracts: unsigned, inquiry: isAdmin() ? 0 : unreadInq, admin: pc };
  const link = ([id, label, ic]) => `<a class="item ${id === tab ? 'on' : ''}" href="#app-${id}">${icon(ic)}${label}${counts[id] ? `<span class="cnt">${counts[id]}</span>` : ''}</a>`;
  $('#view').innerHTML = `<div class="demo-banner">데모 모드 · 모든 데이터는 예시이며 이 브라우저에만 저장됩니다. <a href="#" data-action="reset" style="color:inherit;text-decoration:underline">처음 상태로 되돌리기</a></div>
  <div class="portal">
    <aside class="side">
      <div class="me"><div class="avatar">${esc((isAdmin() ? '운' : me()).slice(0, 1))}</div><div><b>${esc(isAdmin() ? '운영팀' : me())}</b><div class="small muted">${isAdmin() ? '관리자' : 'SW교육 강사'}</div></div></div>
      ${TABS.map(link).join('')}
      <div class="side-label">더 보기</div>${EXTRA_TABS.map(link).join('')}
      ${isAdmin() ? `<div class="side-label">운영팀</div>${ADMIN_TABS.map(link).join('')}` : ''}
    </aside>
    <section class="main" id="pmain"></section>
  </div>`;
  const views = { checkin: vCheckin, records: vRecords, schedule: vSchedule, rental: vRental, claims: vClaims, inquiry: vInquiry,
    pay: vPay, contracts: vContracts, docs: vDocs, profile: vProfile, admin: vAdmin, cms: vCms };
  views[tab]($('#pmain'));
  window.scrollTo(0, 0);
  maybeAskNotify();
}
const rerender = () => route(true);
const pageHead = (title, desc, actions = '', helpKey) => `<div class="page-h"><div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>
  <div class="row no-print" style="flex:none;gap:8px">${actions}${helpKey ? `<button class="btn help-btn" data-action="help" data-key="${helpKey}">${icon('help')} 도움말</button>` : ''}</div></div>`;

/* ----- 도움말 (사용자 가이드 요약) ----- */
const HELP = {
  checkin: { steps: ['좌측 메뉴에서 "입퇴실"을 엽니다.', '"교육장 선택"에서 오늘 진행할 교육장을 고릅니다.', '"역할"에서 주강사 또는 보조강사를 선택합니다.', '"입실하기"를 누르면 입실 시각, 위치(GPS), 기기 정보가 기록됩니다.', '수업이 끝나면 같은 화면에서 "퇴실하기" → 수업차시 승인신청에 실제 진행한 차시를 입력하고 "신청"합니다.'],
    tips: ['위치가 잡히지 않으면 ① 주소창의 위치 아이콘을 "허용"으로 변경 ② 실외나 창가에서 다시 시도 ③ 그래도 안 되면 사유를 입력해 예외로 기록합니다.', '운영팀이 차시를 승인하면 정산에 반영됩니다. 적용 단가가 평소와 다르면 신청 전에 운영팀에 확인하세요.', '퇴실을 깜빡했다면 화면 상단 "퇴실 미처리" 경고에서 퇴실 시각과 차시를 입력합니다.'] },
  records: { steps: ['기간, 상태, 교육장을 골라 원하는 기록만 볼 수 있습니다.', '카드를 누르면 위치, 기기, 역할, 시간차 등 자세한 내용이 펼쳐집니다.', '"엑셀 다운로드"로 한 달치 기록을 파일로 받거나 "표 복사"로 엑셀에 붙여넣을 수 있습니다.'],
    tips: ['정산 의문이 있으면 기록을 받아 "관리자에게 문의"로 함께 보내 주세요.', '승인대기 건의 차시를 고쳐야 하면 카드의 "수정 요청"을 눌러 운영팀에 요청합니다.'] },
  schedule: { steps: ['한 달치 강의 일정이 달력에 "2차시" 같은 블록으로 표시됩니다.', '진한 색은 실시 완료, 연한 색은 예정 일정입니다.', '좌우 화살표로 이전·다음 달로 이동하고, "주간"으로 전환할 수 있습니다.', '날짜를 누르면 그날의 교육장·시간·차시가 열립니다.'], tips: ['화면 상단에 "이번 달 총 N차시"가 자동 합산됩니다.'] },
  rental: { steps: ['"+ 대여 신청"에서 관리자, 자산, 수량, 희망 불출 시간, 반납 예정일, 활용 현장을 입력합니다.', '대여자(픽업)와 반납자는 기본이 본인이며, 동료가 대신하면 동료 이름으로 바꿉니다.', '신청 직후 "승인대기" → 승인 후 불출 전 "대여예정" → 불출 시점부터 "대여중"으로 바뀝니다.', '반납할 때는 대여중 건에서 "반납 신청"을 누릅니다.'],
    tips: ['대여 신청은 대여일 기준 이틀 전 17시까지 마감됩니다.', '대여 당일 교구 변경 및 추가 대여는 어렵습니다.', '교구는 수업 하루 전 대여, 수업일 또는 익일 반납이 원칙입니다.', '반납 전 구성품과 수량을 확인하고, 파손·분실은 즉시 공유해 주세요.', '반납자를 동료로 지정해도 교구운반비는 대여자(신청자) 본인만 청구할 수 있습니다.'] },
  claims: { steps: ['청구 유형(수당/실비)은 운영팀 안내에 따라 선택합니다.', '카테고리에서 "여비" 또는 "교구운반비"를 고릅니다.', '여비: 항목명·금액·발생일·사유를 입력하고, 실비라면 영수증 사진을 첨부합니다.', '교구운반비: 실비를 선택하고 관련건에 본인이 신청한 대여건을 고른 뒤, 운영팀 정책 금액을 입력합니다.', '"청구이력" 탭에서 진행 상태와 거절 사유를 확인합니다.'],
    tips: ['여비 지급요청서는 시스템 외부 절차입니다. 시스템에서는 신청만 하고, 지급요청서는 기존대로 종이로 전달해 주세요.', '거절된 청구는 사유를 확인하고 수정해서 다시 신청합니다. 수정·취소는 승인대기 상태에서만 가능합니다.'] },
  inquiry: { steps: ['"관리자에게 문의" 탭에서 관리자, 카테고리, 제목, 내용을 입력하고 "보내기"를 누릅니다.', '답변이 오면 우측 상단 종 모양 아이콘에 알림이 뜹니다.', '"문의이력" 탭에서 문의를 펼쳐 답변을 확인하고, 하단 입력창으로 추가 질문을 보냅니다.'],
    tips: ['운영팀이 문의를 "종료" 처리하면 더 이상 답글을 달 수 없습니다. 새 문의를 작성해 주세요.', '카테고리: 대여 관련(대여·반납·운반비), 정산 관련(차시·여비), 증명서(출강·경력), 일반(그 외).'] },
  profile: { steps: ['이름과 전화번호를 확인합니다.', '비밀번호 변경: 현재 비밀번호와 새 비밀번호(8자 이상, 영문+숫자)를 입력하고 "변경"을 누릅니다.', '알림 설정 스위치로 수업 알림을 켜고 끕니다.'], tips: ['비밀번호를 잊었다면 로그인 화면의 "비밀번호 찾기"로 운영팀에 초기화를 요청하세요.', '아이폰은 Safari 공유 버튼 → "홈 화면에 추가" 후 추가된 아이콘으로 열어야 알림을 받을 수 있습니다(iOS 16.4 이상).'] },
};
function openHelp(key) {
  const h = HELP[key]; if (!h) return;
  modal({ title: `도움말 · ${TAB_TITLES[key] || ''}`, wide: true,
    body: `<b>사용 순서</b><ol class="help-list" style="margin-top:8px">${h.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      ${h.tips?.length ? `<div class="note" style="margin-top:16px"><b>알아두세요</b><ul>${h.tips.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
      <p class="small muted" style="margin:14px 0 0">그래도 해결되지 않으면 <a href="#app-inquiry">관리자에게 문의</a>를 이용해 주세요.</p>`,
    foot: '<button class="btn" data-close>닫기</button>' });
}

/* ----- 알림 ----- */
function openNotifs() {
  const list = db.notifications.slice(0, 30);
  modal({ title: '알림',
    body: list.length ? list.map((n) => `<div class="notif-item ${n.read ? '' : 'unread'}" data-nid="${n.id}">${n.read ? '' : '<span class="unread-dot" style="margin-top:7px"></span>'}<div><b>${esc(n.text)}</b><div class="small muted">${dt(n.t)}</div></div></div>`).join('') : '<p class="muted">새 알림이 없습니다.</p>',
    foot: `<button class="btn" id="readAll">모두 읽음</button><button class="btn" data-close>닫기</button>`,
    onMount(bg, close) {
      $('#readAll', bg).onclick = () => { db.notifications.forEach((n) => (n.read = true)); save(); close(); rerender(); };
      $$('.notif-item', bg).forEach((el) => el.onclick = () => {
        const n = db.notifications.find((x) => x.id === el.dataset.nid); n.read = true; save(); close();
        if (n.link && location.hash !== '#' + n.link) location.hash = n.link; else rerender();
      });
    } });
}
function maybeAskNotify() {
  if (isAdmin() || db.profile.notify || Date.now() - (db.profile.notifyAskedAt || 0) < 86400e3) return;
  if ($('.modal-bg')) return;
  db.profile.notifyAskedAt = Date.now(); save();
  modal({ title: '수업 알림 받기',
    body: `<p style="margin-top:0">수업 시작 5분 전과, 수업 종료 후 퇴실하지 않았을 때 알림을 보내드립니다.</p><p class="muted small">한 번만 허용해두시면 다음 로그인부터 자동으로 받으실 수 있습니다. "나중에"를 눌러도 24시간 후 다시 안내합니다.</p>`,
    foot: `<button class="btn" data-close>나중에</button><button class="btn primary" id="notifyOn">${icon('bell')} 알림 켜기</button>`,
    onMount(bg, close) { $('#notifyOn', bg).onclick = async () => { close(); await enableNotify(true); }; } });
}
async function enableNotify(on) {
  if (on) {
    let perm = 'denied';
    try { if ('Notification' in window) perm = await Notification.requestPermission(); } catch { /* 차단된 환경 */ }
    db.profile.notify = true; save();
    toast(perm === 'granted' ? '알림을 켰습니다.' : '알림을 켰습니다. 브라우저에서 알림이 차단되어 있으면 화면 안 알림(종 아이콘)으로만 받습니다.');
  } else { db.profile.notify = false; save(); toast('알림을 껐습니다.'); }
  rerender();
}

/* ----- 입퇴실 ----- */
function vCheckin(el) {
  const open = openRecord();
  const todayS = todaySchedule();
  const missing = open && open.date < ymd() ? open : null;
  const working = open && !missing ? open : null;
  if (!ui.site) ui.site = todayS[0]?.siteId || SITES[0].id;
  el.innerHTML = `${pageHead('입퇴실', '교육장 입실·퇴실을 기록합니다. 위치와 시각은 자동으로 남습니다.', '', 'checkin')}
    ${db.profile.mustChangePw && !isAdmin() ? `<div class="note danger" style="margin-bottom:14px">${icon('alert')} 초기 비밀번호를 사용 중입니다. <a href="#app-profile"><b>내 정보 → 비밀번호 변경</b></a>에서 본인이 사용할 비밀번호로 바꿔 주세요.</div>` : ''}
    ${missing ? `<div class="note danger" style="margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px">${icon('alert')} <b>${dLabel(missing.date)} 퇴실 미처리</b> — ${esc(siteName(missing.siteId))}, 입실 ${hm(missing.in.t)}</span><button class="btn sm primary" data-action="checkout" data-id="${missing.id}">퇴실 처리하기</button></div>` : ''}
    <div class="checkin-grid">
      <div class="panel" style="margin:0"><div class="panel-b">
        ${working ? `
          <div class="working-bar"><span class="live-dot"></span> 근무중 · 입실 ${hm(working.in.t)} · ${esc(siteName(working.siteId))} · ${roleLabel(working.role)}</div>
          <div class="timer"><b id="elapsed">00:00:00</b><span>입실 후 경과 시간</span></div>
          <button class="btn dark huge" data-action="checkout" data-id="${working.id}" style="margin-top:14px">${icon('logout')} 퇴실하기</button>
          <p class="small muted" style="margin:12px 0 0;text-align:center">퇴실하면 수업차시 승인신청 화면이 열립니다.</p>`
        : `
          <div class="step-label" style="margin-top:0"><span class="num">1</span> 교육장 선택</div>
          <select id="siteSel" aria-label="교육장 선택">${SITES.map((s) => `<option value="${s.id}" ${s.id === ui.site ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
          <div class="step-label"><span class="num">2</span> 역할 선택</div>
          <div class="seg big" role="radiogroup" aria-label="역할">
            <button type="button" role="radio" aria-checked="${ui.role === 'main'}" class="${ui.role === 'main' ? 'on' : ''}" data-action="role" data-role="main">주강사</button>
            <button type="button" role="radio" aria-checked="${ui.role === 'assist'}" class="${ui.role === 'assist' ? 'on' : ''}" data-action="role" data-role="assist">보조강사</button>
          </div>
          <div class="step-label"><span class="num">3</span> 입실하기</div>
          <button class="btn primary huge" data-action="checkin" ${missing ? 'disabled title="이전 퇴실 미처리 건을 먼저 처리해 주세요"' : ''}>${icon('rocket')} 입실하기</button>
          <div class="timer"><b>00:00:00</b><span>대기중</span></div>`}
      </div></div>
      <div>
        <div class="panel"><div class="panel-h"><h2>오늘 일정</h2><a class="small" href="#app-schedule">스케줄 →</a></div><div class="panel-b flush">
          ${todayS.length ? todayS.map((s) => `<div class="list-item"><span class="badge brand">${s.periods}차시</span><div class="grow"><b>${esc(siteName(s.siteId))}</b><span class="small muted">${s.start} ~ ${s.end} · ${esc(s.program)}</span></div></div>`).join('') : '<div class="panel-b muted small">오늘 예정된 수업이 없습니다.</div>'}
        </div></div>
        <div class="note"><b>자동으로 기록되는 것</b><ul><li>입실·퇴실 시각 (현재 시간)</li><li>위치 정보 (GPS, 교육장 반경 ${CONFIG.radius}m 확인)</li><li>사용 중인 기기 정보</li></ul></div>
      </div>
    </div>`;
  if (working) {
    const tick = () => { const e = $('#elapsed'); if (!e) return clearInterval(timer); const s = Math.max(0, Math.floor((Date.now() - working.in.t) / 1000)); e.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
    tick(); timer = setInterval(tick, 1000);
  } else {
    $('#siteSel').onchange = (e) => { ui.site = e.target.value; };
  }
}
async function locate(siteId) {
  const site = SITES.find((s) => s.id === siteId);
  let coords = null;
  try { coords = await getPos(); } catch { /* 위치 실패 */ }
  const entry = { t: Date.now(), lat: coords?.latitude ?? null, lng: coords?.longitude ?? null, dist: null, flag: null, device: deviceInfo() };
  if (coords) entry.dist = haversine(coords.latitude, coords.longitude, site.lat, site.lng);
  if (!coords) entry.flag = 'nogps';
  else if (entry.dist > CONFIG.radius) entry.flag = 'out';
  return { entry, site };
}
function flagMessage(entry, site) {
  return entry.flag === 'out'
    ? `현재 위치가 <b>${esc(site.name)}</b>에서 약 <b>${entry.dist.toLocaleString()}m</b> 떨어져 있습니다 (허용 반경 ${CONFIG.radius}m).`
    : '위치 정보를 가져오지 못했습니다. 주소창 왼쪽 위치 아이콘을 "허용"으로 바꾸거나, 실외·창가에서 다시 시도해 주세요.';
}
async function doCheckin(btn) {
  const siteId = ui.site;
  btn.disabled = true; btn.innerHTML = '위치 확인 중…';
  const { entry, site } = await locate(siteId);
  const commit = (reason) => {
    if (reason) entry.reason = reason;
    db.attendance.push({ id: uid(), date: ymd(), siteId, role: ui.role, in: entry, out: null, periods: null, reason: '', status: 'working', memo: '' });
    save(); toast(`입실 완료 ${hm(entry.t)} · ${site.name}`); rerender();
  };
  if (entry.flag) { rerender(); askReason('예외 입실 기록', `${flagMessage(entry, site)}<br>사유를 입력하면 예외로 기록되고 운영팀이 확인합니다.`, commit, { submit: '예외로 기록' }); }
  else commit();
}
async function doCheckout(id, btn) {
  const rec = db.attendance.find((r) => r.id === id);
  const past = rec.date < ymd();
  if (btn) { btn.disabled = true; btn.innerHTML = '위치 확인 중…'; }
  const { entry, site } = past ? { entry: { t: null, device: deviceInfo(), flag: null, dist: null }, site: SITES.find((s) => s.id === rec.siteId) } : await locate(rec.siteId);
  if (btn) rerender();
  const planned = db.schedule.find((s) => s.date === rec.date && s.siteId === rec.siteId)?.periods || 2;
  formModal({ title: '수업차시 승인신청', submit: '신청',
    fields: `<div class="rate-banner">${icon('wallet')} 적용 단가: ${roleLabel(rec.role)} ${won(rateOf(rec.role))}/차시</div>
      ${entry.flag ? `<div class="note" style="margin-bottom:12px">${flagMessage(entry, site)} 사유에 이유를 적어 주세요.</div>` : ''}
      <div class="row">
        ${past ? `<label class="f"><span>퇴실 시각 * (${dLabel(rec.date)})</span><input id="outTime" name="outTime" type="time" required value="${db.schedule.find((s) => s.date === rec.date && s.siteId === rec.siteId)?.end || '12:00'}"></label>` : `<label class="f"><span>퇴실 시각</span><input value="${hm(entry.t)}" disabled></label>`}
        <label class="f"><span>수업차시 *</span><input id="periods" name="periods" type="number" min="1" max="12" required value="${planned}"></label>
      </div>
      <label class="f"><span>사유 ${entry.flag || past ? '*' : '(선택)'}</span><textarea id="coReason" name="reason" ${entry.flag || past ? 'required' : ''} placeholder="${past ? '퇴실 미처리 사유' : '예정과 다른 차시를 진행했다면 이유를 적어 주세요'}"></textarea></label>
      <p class="small muted" style="margin:0">운영팀이 차시를 승인하면 정산에 반영됩니다.</p>`,
    onSubmit(d) {
      const n = Number(d.periods);
      if (!(n >= 1 && n <= 12)) { toast('수업차시는 1~12 사이로 입력해 주세요.', true); return false; }
      if (past) {
        const t = new Date(rec.date + 'T' + d.outTime).getTime();
        if (t <= rec.in.t) { toast('퇴실 시각이 입실 시각보다 빠릅니다.', true); return false; }
        entry.t = t; entry.flag = 'late'; entry.reason = d.reason.trim();
      } else if (entry.flag) entry.reason = d.reason.trim();
      rec.out = entry; rec.periods = n; rec.reason = d.reason.trim(); rec.status = 'pending';
      save(); toast(`퇴실 완료 · ${n}차시 승인신청을 보냈습니다.`); rerender();
    } });
}

/* ----- 근무기록 ----- */
function filteredRecords() {
  return db.attendance.filter((r) => r.date >= ui.recFrom && r.date <= ui.recTo
    && (ui.recSite === 'all' || r.siteId === ui.recSite)
    && (ui.recStatus === 'all' || attStatus(r) === ui.recStatus)).sort((a, b) => b.date.localeCompare(a.date));
}
const flagText = (p) => !p ? '—' : p.flag === 'out' ? `반경 밖 ${p.dist}m` : p.flag === 'nogps' ? '위치 미확인' : p.flag === 'late' ? '사후 입력' : p.dist != null ? `교육장 ${p.dist}m 이내` : '—';
function vRecords(el) {
  const list = filteredRecords();
  const days = new Set(list.map((r) => r.date)).size;
  const periods = list.reduce((a, r) => a + Number(r.periods || 0), 0);
  const waiting = list.filter((r) => attStatus(r) === 'pending').length;
  el.innerHTML = `${pageHead('근무기록', '입퇴실 결과와 차시, 승인 상태를 확인합니다.',
      `${inFrame ? '' : `<button class="btn" data-action="excel">${icon('download')} 엑셀 다운로드</button>`}<button class="btn" data-action="copyTable">${icon('copy')} 표 복사</button>`, 'records')}
    <div class="filters">
      <input id="recFrom" type="date" value="${ui.recFrom}" aria-label="시작일"> <span class="muted">~</span> <input id="recTo" type="date" value="${ui.recTo}" aria-label="종료일">
      <select id="recStatus" aria-label="상태"><option value="all">상태: 전체</option>${Object.entries(ATT_STATUS).map(([k, [l]]) => `<option value="${k}" ${ui.recStatus === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select id="recSite" aria-label="교육장"><option value="all">교육장: 전체</option>${SITES.map((s) => `<option value="${s.id}" ${ui.recSite === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
    </div>
    <div class="sum-chips"><span>총 ${days}일</span><span>총 ${periods}차시</span><span class="w">대기 ${waiting}건</span></div>
    ${list.map((r) => { const st = attStatus(r); const open = ui.recOpen === r.id; return `<div class="rec">
      <div class="rec-h" data-action="recToggle" data-id="${r.id}" tabindex="0" aria-expanded="${open}"><b>${dLabel(r.date)} · ${esc(siteName(r.siteId))}</b>${r.periods ? `<span class="badge">${r.periods}차시</span>` : ''}${badge(st, ATT_STATUS)}</div>
      <div class="rec-times"><div class="in">입실시간<b>${hm(r.in?.t)}</b></div><div class="out">퇴실시간<b>${hm(r.out?.t)}</b></div></div>
      ${open ? `<dl class="rec-more">
        <div><dt>역할 · 적용 단가</dt><dd>${roleLabel(r.role)} · ${won(rateOf(r.role))}/차시</dd></div>
        <div><dt>입퇴실 시간차</dt><dd>${r.out ? hhmm(minutesOf(r)) : '근무중'}</dd></div>
        <div><dt>예상 강사료</dt><dd>${r.periods ? won(r.periods * rateOf(r.role)) : '—'}</dd></div>
        <div><dt>입실 위치</dt><dd>${flagText(r.in)}${r.in?.reason ? ` · ${esc(r.in.reason)}` : ''}</dd></div>
        <div><dt>퇴실 위치</dt><dd>${flagText(r.out)}${r.out?.reason && r.out.reason !== r.reason ? ` · ${esc(r.out.reason)}` : ''}</dd></div>
        <div><dt>기기</dt><dd>${esc(r.in?.device || '—')}</dd></div>
        ${r.reason ? `<div><dt>신청 사유</dt><dd>${esc(r.reason)}</dd></div>` : ''}
        ${r.memo ? `<div><dt>운영팀 메모</dt><dd style="color:var(--danger)">${esc(r.memo)}</dd></div>` : ''}
        ${r.in?.lat != null ? `<div><dt>지도</dt><dd><a target="_blank" rel="noopener" href="https://map.kakao.com/link/map/입실위치,${r.in.lat},${r.in.lng}">입실 위치 지도 보기 ↗</a></dd></div>` : ''}
        ${st === 'pending' ? `<div><dt>&nbsp;</dt><dd><button class="btn sm" data-action="askFix" data-id="${r.id}">수정 요청</button></dd></div>` : ''}
        ${st === 'missing' ? `<div><dt>&nbsp;</dt><dd><button class="btn sm primary" data-action="checkout" data-id="${r.id}">퇴실 처리하기</button></dd></div>` : ''}
      </dl>` : ''}
    </div>`; }).join('') || '<div class="empty"><b>조건에 맞는 기록이 없습니다</b><p class="muted small" style="margin:6px 0 0">기간이나 상태 필터를 바꿔 보세요.</p></div>'}`;
  const bind = (id, key) => { $('#' + id).onchange = (e) => { ui[key] = e.target.value; rerender(); }; };
  bind('recFrom', 'recFrom'); bind('recTo', 'recTo'); bind('recStatus', 'recStatus'); bind('recSite', 'recSite');
}
function recordRows() {
  const head = ['일자', '관리자', '교육장명', '역할', '입실시간', '퇴실시간', '입퇴실시간차', '수업차시', '상태'];
  const rows = filteredRecords().slice().reverse().map((r) => [r.date, MANAGERS[0], siteName(r.siteId), roleLabel(r.role), hm(r.in?.t), hm(r.out?.t), r.out ? hhmm(minutesOf(r)) : '', r.periods || '', ATT_STATUS[attStatus(r)][0]]);
  return [head, ...rows];
}
function downloadExcel() {
  const rows = recordRows();
  const name = `근무기록_${me()}_${ui.recFrom.slice(0, 7).replace('-', '')}.xlsx`;
  try {
    if (!window.XLSX) throw new Error('no xlsx');
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [12, 16, 20, 10, 10, 10, 14, 10, 10].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, '근무기록');
    XLSX.writeFile(wb, name);
  } catch {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name.replace('.xlsx', '.csv'); a.click();
  }
  toast(`${name} 파일을 내려받았습니다.`);
}

/* ----- 스케줄 ----- */
function doneOn(date, siteId) { return db.attendance.some((r) => r.date === date && r.siteId === siteId && r.out); }
function vSchedule(el) {
  const [y, m] = ui.calMonth.split('-').map(Number);
  const monthList = db.schedule.filter((s) => s.date.startsWith(ui.calMonth));
  const total = monthList.reduce((a, s) => a + s.periods, 0);
  const done = monthList.filter((s) => doneOn(s.date, s.siteId)).reduce((a, s) => a + s.periods, 0);
  const byDate = {};
  db.schedule.forEach((s) => (byDate[s.date] = byDate[s.date] || []).push(s));
  const evHtml = (s) => `<span class="ev ${doneOn(s.date, s.siteId) ? 'done' : ''}" title="${esc(siteName(s.siteId))} ${s.start}~${s.end}">${s.periods}차시</span>`;
  let body;
  if (ui.calView === 'month') {
    const first = new Date(y, m - 1, 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const cells = Array.from({ length: 42 }, (_, i) => addDays(i, start));
    body = `<div class="cal">${DOW.map((d, i) => `<div class="dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${d}</div>`).join('')}
      ${cells.map((d) => { const k = ymd(d); return `<div class="d ${d.getMonth() !== m - 1 ? 'out' : ''} ${k === ymd() ? 'today' : ''}" data-action="day" data-d="${k}"><span class="n ${d.getDay() === 0 ? 'sun' : d.getDay() === 6 ? 'sat' : ''}">${d.getDate()}</span>${(byDate[k] || []).map(evHtml).join('')}</div>`; }).join('')}</div>`;
  } else {
    const base = new Date(ui.calWeek + 'T00:00'); const ws = addDays(-base.getDay(), base);
    body = `<div class="week">${Array.from({ length: 7 }, (_, i) => addDays(i, ws)).map((d) => { const k = ymd(d); return `<div data-action="day" data-d="${k}" style="${k === ymd() ? 'border-color:var(--brand)' : ''}"><b class="${d.getDay() === 0 ? 'sun' : ''}">${dLabel(k)}</b>${(byDate[k] || []).map((s) => `<div style="margin-top:6px">${evHtml(s)}<div class="small">${esc(siteName(s.siteId))}<br>${s.start}~${s.end}</div></div>`).join('') || '<div class="small muted" style="margin-top:6px">일정 없음</div>'}</div>`; }).join('')}</div>`;
  }
  const title = ui.calView === 'month' ? ymLabel(ui.calMonth) : (() => { const b = new Date(ui.calWeek + 'T00:00'); const s = addDays(-b.getDay(), b); return `${dot(ymd(s))} ~ ${dot(ymd(addDays(6, s))).slice(5)}`; })();
  el.innerHTML = `${pageHead(`스케줄 · ${title}`, '예정·실시 일정을 확인합니다.',
      `<div class="tabs" style="margin:0"><button data-action="calView" data-v="week" class="${ui.calView === 'week' ? 'on' : ''}">주간</button><button data-action="calView" data-v="month" class="${ui.calView === 'month' ? 'on' : ''}">월간</button></div>
       <button class="btn icon-btn" data-action="cal" data-n="-1" aria-label="이전">${icon('left')}</button><button class="btn" data-action="cal" data-n="0">오늘</button><button class="btn icon-btn" data-action="cal" data-n="1" aria-label="다음">${icon('right')}</button>`, 'schedule')}
    <div class="panel"><div class="cal-sum"><span>이번 달 총 ${total}차시</span><span class="small">실시 ${done}차시 · 예정 ${total - done}차시</span></div>${body}</div>
    <div class="row small muted" style="gap:12px"><span style="flex:none"><span class="badge" style="background:var(--brand);color:#fff">실시 완료</span> <span class="badge brand">예정</span></span></div>`;
}
function openDay(date) {
  const evs = db.schedule.filter((s) => s.date === date);
  const recs = db.attendance.filter((r) => r.date === date);
  modal({ title: `${dLabel(date)} 일정`,
    body: (evs.length ? evs.map((s) => `<div class="card" style="box-shadow:none;margin-bottom:10px"><div class="row" style="align-items:center"><b style="flex:1">${esc(siteName(s.siteId))}</b><span class="badge brand" style="flex:none">${s.periods}차시</span></div><div class="small muted">${s.start} ~ ${s.end} · ${esc(s.program)}</div></div>`).join('') : '<p class="muted">예정된 일정이 없습니다.</p>')
      + recs.map((r) => `<p class="small" style="margin:6px 0 0">출결: ${esc(siteName(r.siteId))} ${hm(r.in?.t)} ~ ${hm(r.out?.t)} ${badge(attStatus(r), ATT_STATUS)}</p>`).join(''),
    foot: `${date === ymd() ? '<a class="btn primary" href="#app-checkin">입퇴실로 이동</a>' : ''}<button class="btn" data-close>닫기</button>` });
}

/* ----- 대여신청 ----- */
function vRental(el) {
  const list = db.rentals.slice().sort((a, b) => b.createdAt - a.createdAt);
  const active = list.filter((r) => !['returned', 'rejected'].includes(r.status));
  const past = list.filter((r) => ['returned', 'rejected'].includes(r.status));
  const item = (r) => { const s = rentalState(r); return `<div class="list-item">
      <div class="grow"><b>${esc(assetName(r.assetId))} ${r.qty}${r.assetId === 'kit' ? '세트' : '개'}</b><span class="small muted">${s.sub ? esc(s.sub) + ' · ' : ''}불출 ${dot(r.pickupAt)} ${r.pickupAt.slice(11)} · 반납 ${dot(r.returnDate)} · ${esc(r.site)}${r.returner !== '본인' ? ` · 반납자 ${esc(r.returner)}` : ''}</span></div>
      <span class="badge ${s.cls}">${s.label}</span>
      ${s.key === 'pending' ? `<button class="btn sm danger" data-action="cancelRental" data-id="${r.id}">신청 취소</button>` : ''}
      ${['out', 'overdue'].includes(s.key) ? `<button class="btn sm" data-action="returnRental" data-id="${r.id}">반납 신청</button>` : ''}
      ${['returned', 'rejected'].includes(s.key) ? `<button class="btn sm" data-action="reRental" data-id="${r.id}">재신청</button>` : ''}
    </div>`; };
  el.innerHTML = `${pageHead('대여신청', '교구·기자재 대여를 신청하고 진행 상태를 확인합니다.', '', 'rental')}
    <div class="tabs"><button data-action="rentalTab" data-t="list" class="${ui.rentalTab === 'list' ? 'on' : ''}">대여 목록</button><button data-action="rentalTab" data-t="form" class="${ui.rentalTab === 'form' ? 'on' : ''}">+ 대여 신청</button></div>
    ${ui.rentalTab === 'list' ? `
      <div class="panel"><div class="panel-h"><h2>활성 대여</h2></div><div class="panel-b flush">${active.map(item).join('') || '<div class="panel-b muted small">진행 중인 대여가 없습니다.</div>'}</div></div>
      <div class="panel"><div class="panel-h"><h2>지난 대여</h2></div><div class="panel-b flush">${past.map(item).join('') || '<div class="panel-b muted small">지난 대여가 없습니다.</div>'}</div></div>
      <div class="panel"><div class="panel-h"><h2>대여 가능 현황</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>자산</th><th class="num">보유</th><th class="num">대여 중</th><th class="num">대여 가능</th></tr></thead><tbody>
        ${ASSETS.map((a) => { const av = available(a.id); return `<tr><td><b>${esc(a.name)}</b></td><td class="num">${a.total}</td><td class="num">${inUse(a.id)}</td><td class="num"><span class="badge ${av === 0 ? 'danger' : av < a.total / 3 ? 'warn' : 'ok'}">${av}</span></td></tr>`; }).join('')}
      </tbody></table></div></div>`
    : rentalForm()}`;
  if (ui.rentalTab === 'form') bindRentalForm();
}
function rentalForm() {
  const p = ui.rentalPrefill || {};
  const minPick = (() => { const d = addDays(3); return `${ymd(d)}T09:00`; })();
  const people = ['본인', ...COLLEAGUES];
  return `<div class="checkin-grid">
    <div class="panel" style="margin:0"><div class="panel-h"><h2>대여 신청 폼</h2></div><div class="panel-b">
      <form id="rentalForm" class="form-grid" novalidate>
        <label for="rfManager">관리자</label><select id="rfManager" name="manager">${MANAGERS.map((m) => `<option ${p.manager === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
        <label for="rfAsset">자산</label><select id="rfAsset" name="assetId">${ASSETS.map((a) => `<option value="${a.id}" ${p.assetId === a.id ? 'selected' : ''} ${available(a.id) ? '' : 'disabled'}>${esc(a.name)} (대여 가능 ${available(a.id)})</option>`).join('')}</select>
        <label for="rfQty">수량</label><input id="rfQty" name="qty" type="number" min="1" required value="${p.qty || 1}">
        <label for="rfPick">희망 불출 시간</label><input id="rfPick" name="pickupAt" type="datetime-local" required value="${minPick}">
        <label for="rfReturn">반납 예정일</label><input id="rfReturn" name="returnDate" type="date" required value="${ymd(addDays(5))}">
        <label for="rfSite">활용 현장</label><input id="rfSite" name="site" required placeholder="예: ○○초등학교 외 2곳" value="${esc(p.site || '')}">
        <label for="rfPicker">대여자 (픽업)</label><select id="rfPicker" name="picker">${people.map((x) => `<option value="${esc(x)}">${esc(x === '본인' ? `${me()} (본인)` : x)}</option>`).join('')}</select>
        <label for="rfReturner">반납자</label><select id="rfReturner" name="returner">${people.map((x) => `<option value="${esc(x)}">${esc(x === '본인' ? `${me()} (본인)` : x)}</option>`).join('')}</select>
        <label for="rfNote">비고</label><input id="rfNote" name="note" placeholder="예: 코딩 수업용" value="${esc(p.note || '')}">
        <div class="full small" id="rfDeadline"></div>
        <div class="full" style="display:flex;justify-content:flex-end"><button class="btn primary">신청</button></div>
      </form>
    </div></div>
    <div class="note danger"><b>필수 참고 사항</b><ul>
      <li>대여 당일 교구 변경 및 추가 대여는 어렵습니다.</li>
      <li>교구는 수업 하루 전 대여, 수업일 또는 익일 반납을 원칙으로 합니다.</li>
      <li>대여 신청은 대여일 기준 이틀 전 17시까지 마감됩니다.</li>
      <li>신청 후 변경 및 취소가 필요한 경우 마감 전까지 요청 부탁드립니다.</li>
      <li>반납 전 구성품 및 수량 확인 부탁드리며, 파손·분실 발생 시 즉시 공유 부탁드립니다.</li>
      <li>동료가 대신 픽업·반납하면 대여자·반납자를 동료 이름으로 바꿀 수 있습니다. 단, 교구운반비는 대여자(신청자) 본인만 청구할 수 있습니다.</li>
    </ul></div></div>`;
}
function bindRentalForm() {
  const f = $('#rentalForm');
  const showDl = () => {
    const v = f.pickupAt.value; const box = $('#rfDeadline');
    if (!v) { box.innerHTML = ''; return; }
    const dl = rentalDeadline(v); const ok = Date.now() < dl.getTime();
    box.innerHTML = `<span class="badge ${ok ? 'ok' : 'danger'}">${ok ? '신청 가능' : '마감됨'}</span> <span class="small muted">이 날짜의 신청 마감: ${dot(ymd(dl))} 17:00</span>`;
  };
  f.pickupAt.addEventListener('input', showDl); showDl();
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = requiredMissing(f); if (bad) { bad.focus(); return toast('필수 항목을 입력해 주세요.', true); }
    const d = Object.fromEntries(new FormData(f));
    const q = Number(d.qty), av = available(d.assetId);
    if (Date.now() >= rentalDeadline(d.pickupAt).getTime()) return toast('대여일 기준 이틀 전 17시가 지나 신청할 수 없습니다. 운영팀에 문의해 주세요.', true);
    if (q < 1 || q > av) return toast(`대여 가능 수량은 ${av}개입니다.`, true);
    if (d.returnDate < d.pickupAt.slice(0, 10)) return toast('반납 예정일이 불출일보다 빠릅니다.', true);
    db.rentals.push({ id: uid(), manager: d.manager, assetId: d.assetId, qty: q, pickupAt: d.pickupAt, returnDate: d.returnDate, site: d.site.trim(), picker: d.picker, returner: d.returner, note: d.note.trim(), status: 'pending', createdAt: Date.now() });
    ui.rentalPrefill = null; ui.rentalTab = 'list';
    save(); toast('대여 신청이 접수되었습니다. (승인대기)'); rerender();
  });
}

/* ----- 비용청구 ----- */
const CLAIM_STATUS = { pending: ['승인대기', 'warn'], approved: ['승인완료', 'ok'], rejected: ['거절', 'danger'] };
function vClaims(el) {
  const list = db.claims.slice().sort((a, b) => b.createdAt - a.createdAt);
  el.innerHTML = `${pageHead('비용청구', '여비와 교구운반비를 청구합니다. 승인된 금액은 정산 명세에 반영됩니다.', '', 'claims')}
    <div class="tabs"><button data-action="claimTab" data-t="form" class="${ui.claimTab === 'form' ? 'on' : ''}">비용청구</button><button data-action="claimTab" data-t="history" class="${ui.claimTab === 'history' ? 'on' : ''}">청구이력${list.filter((c) => c.status === 'rejected').length ? ` <span class="badge danger">거절 ${list.filter((c) => c.status === 'rejected').length}</span>` : ''}</button></div>
    ${ui.claimTab === 'form' ? claimForm() : `<div class="panel"><div class="panel-b flush">${list.map((c) => `<div class="list-item">
        ${c.receipt?.startsWith('data:image') ? `<img class="receipt-thumb" src="${c.receipt}" alt="영수증" data-action="zoom" data-id="${c.id}">` : ''}
        <div class="grow"><b>${esc(c.category)} · ${esc(c.title)} · ${won(c.amount)}</b><span class="small muted">${esc(c.type)} · 발생일 ${dot(c.date)} · ${esc(c.manager)}${c.rentalId ? ` · 관련건 ${esc(rentalLabel(c.rentalId))}` : ''}${c.receiptName && !c.receipt?.startsWith('data:image') ? ` · ${esc(c.receiptName)}` : ''}</span>
          ${c.status === 'rejected' && c.memo ? `<div class="small" style="color:var(--danger);margin-top:4px">거절 사유: ${esc(c.memo)}</div>` : ''}</div>
        ${badge(c.status, CLAIM_STATUS)}
        ${c.status === 'pending' ? `<button class="btn sm" data-action="editClaim" data-id="${c.id}">수정</button><button class="btn sm danger" data-action="delClaim" data-id="${c.id}">취소</button>` : ''}
        ${c.status === 'rejected' ? `<button class="btn sm" data-action="reClaim" data-id="${c.id}">수정 후 재신청</button>` : ''}
      </div>`).join('') || '<div class="panel-b muted">청구 내역이 없습니다.</div>'}</div></div>`}`;
  if (ui.claimTab === 'form') bindClaimForm();
}
const myRentals = () => db.rentals.filter((r) => r.picker === '본인' && ['approved', 'returning', 'returned'].includes(r.status));
const rentalLabel = (id) => { const r = db.rentals.find((x) => x.id === id); return r ? `${assetName(r.assetId)} ${r.qty}개 (${dot(r.pickupAt)})` : '삭제된 대여건'; };
function claimForm() {
  const c = ui.editClaim ? db.claims.find((x) => x.id === ui.editClaim) || {} : {};
  const cat = c.category || '여비';
  const type = c.type || '실비';
  return `<div class="checkin-grid">
    <div class="panel" style="margin:0"><div class="panel-h"><h2>${ui.editClaim ? '청구 수정' : '새 청구'}</h2>${ui.editClaim ? '<button class="btn sm" data-action="cancelEdit">새로 작성</button>' : ''}</div><div class="panel-b">
      <form id="claimForm" class="form-grid" novalidate>
        <label for="cfManager">관리자</label><select id="cfManager" name="manager">${MANAGERS.map((m) => `<option ${c.manager === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
        <label>청구 유형</label><div class="radio-row" role="radiogroup" aria-label="청구 유형"><label><input type="radio" name="type" value="수당" ${type === '수당' ? 'checked' : ''}> 수당</label><label><input type="radio" name="type" value="실비" ${type === '실비' ? 'checked' : ''}> 실비</label></div>
        <label for="cfCat">카테고리</label><select id="cfCat" name="category"><option ${cat === '여비' ? 'selected' : ''}>여비</option><option ${cat === '교구운반비' ? 'selected' : ''}>교구운반비</option></select>
        <label for="cfTitle" data-only="여비">항목명</label><input id="cfTitle" name="title" data-only="여비" placeholder="예: ○○교육장 출강 여비" value="${esc(c.category === '여비' ? c.title : '')}">
        <label for="cfRental" class="req" data-only="교구운반비">관련건 *</label><select id="cfRental" name="rentalId" data-only="교구운반비"><option value="">본인 대여건 선택</option>${myRentals().map((r) => `<option value="${r.id}" ${c.rentalId === r.id ? 'selected' : ''}>${esc(rentalLabel(r.id))}</option>`).join('')}</select>
        <label for="cfAmount">금액 (원)</label><input id="cfAmount" name="amount" type="number" min="10" step="10" required value="${c.amount || ''}" placeholder="원">
        <label for="cfDate">발생일</label><input id="cfDate" name="date" type="date" required max="${ymd()}" value="${c.date || ymd()}">
        <label for="cfReason" data-only="여비">사유</label><input id="cfReason" name="reason" data-only="여비" placeholder="예: 왕복 교통비" value="${esc(c.reason || '')}">
        <label for="cfFile" data-only="여비">영수증</label><div data-only="여비"><input id="cfFile" name="file" type="file" accept="image/*,application/pdf"><div class="small muted" style="margin-top:4px">실비 청구 시 사진을 첨부해 주세요.${c.receiptName ? ` 현재 첨부: ${esc(c.receiptName)}` : ''}</div></div>
        <div class="full rate-banner" data-only="교구운반비" style="margin:0">${icon('wallet')} 운영팀 정책에 따른 일괄 금액 (${won(CONFIG.carryFee)}) — 영수증 첨부는 의무가 아닙니다</div>
        <div class="full note" data-only="교구운반비">${icon('alert')} 본인이 신청한 대여건만 청구할 수 있습니다. ${myRentals().length ? '' : '<b>청구 가능한 본인 대여건이 없습니다.</b>'}</div>
        <div class="full" style="display:flex;justify-content:flex-end"><button class="btn primary">${ui.editClaim ? '수정 저장' : '청구하기'}</button></div>
      </form>
    </div></div>
    <div>
      <div class="panel"><div class="panel-h"><h2>두 가지 청구 항목</h2></div><div class="tbl-wrap"><table class="tbl"><tbody>
        <tr><td><b>여비</b></td><td class="wrap-cell">거점센터 기준으로 교육장까지의 거리에 따른 추가 비용</td></tr>
        <tr><td><b>교구운반비</b></td><td class="wrap-cell">대여 자산 운반에 든 비용 (본인 대여건만)</td></tr>
      </tbody></table></div></div>
      <div class="note">여비 지급요청서는 시스템 외부 절차입니다. 시스템에서는 신청만 하고, 실제 지급요청서는 기존대로 조장에게 종이로 전달해 주세요.</div>
    </div></div>`;
}
function bindClaimForm() {
  const f = $('#claimForm');
  const sync = () => {
    const cat = f.category.value;
    $$('[data-only]', f).forEach((el) => { el.hidden = el.dataset.only !== cat; });
    f.title.required = cat === '여비';
    f.rentalId.required = cat === '교구운반비';
    if (cat === '교구운반비') { f.querySelector('[value="실비"]').checked = true; f.querySelector('[value="수당"]').disabled = true; if (!f.amount.value) f.amount.value = CONFIG.carryFee; }
    else f.querySelector('[value="수당"]').disabled = false;
  };
  f.category.onchange = () => { if (f.category.value === '교구운반비') f.amount.value = CONFIG.carryFee; else f.amount.value = ''; sync(); };
  sync();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = requiredMissing(f); if (bad) { bad.focus(); return toast('필수 항목을 입력해 주세요.', true); }
    const d = Object.fromEntries(new FormData(f));
    const isCarry = d.category === '교구운반비';
    if (isCarry && db.claims.some((c) => c.rentalId === d.rentalId && c.id !== ui.editClaim && c.status !== 'rejected')) return toast('이 대여건의 교구운반비는 이미 청구되었습니다.', true);
    const file = f.file.files[0];
    let receipt, receiptName;
    if (file) { try { receipt = await readImage(file); receiptName = file.name; } catch { return toast('파일을 읽지 못했습니다.', true); } }
    const data = { manager: d.manager, type: isCarry ? '실비' : d.type, category: d.category, title: isCarry ? '교구운반비' : d.title.trim(), amount: Number(d.amount), date: d.date,
      reason: isCarry ? '' : d.reason.trim(), rentalId: isCarry ? d.rentalId : null };
    if (ui.editClaim) {
      const c = db.claims.find((x) => x.id === ui.editClaim);
      Object.assign(c, data, file ? { receipt, receiptName } : {}, { status: 'pending', memo: '' });
      toast('청구를 수정했습니다.');
    } else {
      db.claims.push({ id: uid(), ...data, receipt: receipt || null, receiptName: receiptName || null, status: 'pending', memo: '', createdAt: Date.now() });
      toast('청구가 접수되었습니다. 청구이력에서 진행 상태를 확인할 수 있어요.');
    }
    ui.editClaim = null; ui.claimTab = 'history'; save(); rerender();
  });
}

/* ----- 관리자에게 문의 ----- */
const INQ_CATS = ['대여 관련', '정산 관련', '증명서', '일반'];
function vInquiry(el) {
  const admin = isAdmin();
  const list = db.inquiries.slice().sort((a, b) => b.messages[b.messages.length - 1].t - a.messages[a.messages.length - 1].t);
  const tab = admin ? 'history' : ui.inqTab;
  el.innerHTML = `${pageHead(admin ? '문의 답변' : '관리자에게 문의', admin ? '강사 문의에 답변하고 종료 처리합니다.' : '운영팀에 1:1로 문의합니다.', '', admin ? null : 'inquiry')}
    ${admin ? '' : `<div class="tabs"><button data-action="inqTab" data-t="form" class="${tab === 'form' ? 'on' : ''}">관리자에게 문의</button><button data-action="inqTab" data-t="history" class="${tab === 'history' ? 'on' : ''}">문의이력${list.some((q) => q.unread) ? ' <span class="unread-dot" style="display:inline-block"></span>' : ''}</button></div>`}
    ${tab === 'form' ? `<div class="checkin-grid"><div class="panel" style="margin:0"><div class="panel-h"><h2>새 문의</h2></div><div class="panel-b">
        <form id="inqForm" class="form-grid" novalidate>
          <label for="iqManager">관리자</label><select id="iqManager" name="manager">${MANAGERS.map((m) => `<option>${esc(m)}</option>`).join('')}</select>
          <label for="iqCat">카테고리</label><select id="iqCat" name="category">${INQ_CATS.map((c) => `<option ${ui.inqPrefill?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          <label for="iqTitle">제목</label><input id="iqTitle" name="title" required value="${esc(ui.inqPrefill?.title || '')}">
          <label for="iqBody">내용</label><textarea id="iqBody" name="body" required placeholder="문의 내용을 입력해 주세요…" style="min-height:140px">${esc(ui.inqPrefill?.body || '')}</textarea>
          <div class="full" style="display:flex;justify-content:flex-end"><button class="btn primary">보내기</button></div>
        </form></div></div>
        <div class="panel" style="margin:0"><div class="panel-h"><h2>카테고리</h2></div><div class="tbl-wrap"><table class="tbl"><tbody>
          <tr><td><b>대여 관련</b></td><td>대여·반납·운반비</td></tr><tr><td><b>정산 관련</b></td><td>차시·여비</td></tr><tr><td><b>증명서</b></td><td>출강·경력</td></tr><tr><td><b>일반</b></td><td>그 외</td></tr>
        </tbody></table></div></div></div>`
    : list.map((q) => { const open = ui.inqOpen === q.id; const waiting = q.status === 'open' && q.messages[q.messages.length - 1].by === 'me'; return `<div class="thread">
        <div class="thread-h" data-action="inqToggle" data-id="${q.id}" tabindex="0" aria-expanded="${open}">${q.unread && !admin ? '<span class="unread-dot"></span>' : ''}<b>${esc(q.title)}</b><span class="small muted">${esc(q.category)}${admin ? ` · ${esc(me())}` : ''} · ${dt(q.messages[q.messages.length - 1].t)}</span>
          ${q.status === 'open' ? `<span class="badge info">진행중</span>` : '<span class="badge">종료</span>'}${admin && waiting ? '<span class="badge warn">답변 필요</span>' : ''}</div>
        ${open ? `<div class="thread-b">
          ${q.messages.map((m) => `<div class="msg ${m.by}"><small>${esc(m.by === 'me' ? me() : (m.name || '관리자'))} · ${dt(m.t)}</small>${esc(m.text)}</div>`).join('')}
          ${q.status === 'open' ? `<form class="reply" data-id="${q.id}"><textarea id="reply-${q.id}" name="text" required placeholder="${admin ? '답변 입력…' : '답글 입력…'}" style="min-height:80px"></textarea>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">${admin ? `<button type="button" class="btn" data-action="closeInq" data-id="${q.id}">종료 처리</button>` : ''}<button class="btn primary">보내기</button></div></form>`
          : '<p class="small muted" style="margin:0">운영팀이 종료한 문의입니다. 추가로 물어볼 내용은 새 문의로 작성해 주세요.</p>'}
        </div>` : ''}</div>`; }).join('') || '<div class="empty"><b>문의 내역이 없습니다</b></div>'}`;
  const f = $('#inqForm');
  if (f) f.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = requiredMissing(f); if (bad) { bad.focus(); return toast('제목과 내용을 입력해 주세요.', true); }
    const d = Object.fromEntries(new FormData(f));
    const q = { id: uid(), manager: d.manager, category: d.category, title: d.title.trim(), status: 'open', unread: false, createdAt: Date.now(), messages: [{ by: 'me', t: Date.now(), text: d.body.trim() }] };
    db.inquiries.push(q); ui.inqPrefill = null; ui.inqTab = 'history'; ui.inqOpen = q.id;
    save(); toast('문의를 보냈습니다. 답변이 오면 알림으로 알려드려요.'); rerender();
  });
  $$('form.reply', el).forEach((rf) => rf.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = rf.text.value.trim(); if (!text) return toast('내용을 입력해 주세요.', true);
    const q = db.inquiries.find((x) => x.id === rf.dataset.id);
    if (admin) { q.messages.push({ by: 'admin', name: '운영팀', t: Date.now(), text }); q.unread = true; notify(`문의 "${q.title}"에 답변이 등록되었습니다.`, 'app-inquiry'); }
    else q.messages.push({ by: 'me', t: Date.now(), text });
    save(); toast('보냈습니다.'); rerender();
  }));
}

/* ----- 내 정보 ----- */
function vProfile(el) {
  const p = db.profile;
  el.innerHTML = `${pageHead('내 정보', '연락처 확인, 비밀번호 변경, 알림 설정', '', 'profile')}
    <div class="checkin-grid">
      <div class="panel" style="margin:0">
        <div class="panel-h"><h2>내 정보</h2></div>
        <div class="panel-b form-grid"><label>이름</label><b>${esc(p.name)}</b><label>전화번호</label><b>${esc(p.phone)}</b></div>
        <div class="panel-h" style="border-top:1px solid var(--line)"><h2>비밀번호 변경</h2>${p.mustChangePw ? '<span class="badge danger">초기 비밀번호 사용 중</span>' : ''}</div>
        <div class="panel-b"><form id="pwForm" class="form-grid" novalidate>
          <label for="pwCur">현재 비밀번호</label><input id="pwCur" name="cur" type="password" required autocomplete="current-password">
          <label for="pwNew">새 비밀번호</label><input id="pwNew" name="next" type="password" required placeholder="8자 이상, 영문+숫자" autocomplete="new-password">
          <label for="pwNew2">확인</label><input id="pwNew2" name="next2" type="password" required placeholder="새 비밀번호 재입력" autocomplete="new-password">
          <div class="full" style="display:flex;justify-content:flex-end"><button class="btn primary">변경</button></div>
        </form><p class="small muted" style="margin:8px 0 0">데모의 초기 비밀번호는 <b>1234</b>입니다.</p></div>
      </div>
      <div>
        <div class="panel"><div class="panel-h"><h2>알림 설정</h2></div><div class="panel-b">
          <div class="row" style="align-items:center;flex-wrap:nowrap"><div style="flex:1"><b>수업 알림 받기</b><div class="small muted">수업 시작 5분 전, 종료 후 퇴실 미체크 시 알림</div></div>
          <label class="switch"><input id="notifySwitch" type="checkbox" ${p.notify ? 'checked' : ''} aria-label="수업 알림"><span></span></label></div>
        </div></div>
        <div class="note">비밀번호를 잊으셨다면 로그인 화면의 "비밀번호 찾기" 또는 운영팀에 초기화를 요청해 주세요.</div>
      </div>
    </div>`;
  $('#notifySwitch').onchange = (e) => enableNotify(e.target.checked);
  $('#pwForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target; const d = Object.fromEntries(new FormData(f));
    if (requiredMissing(f)) return toast('모든 칸을 입력해 주세요.', true);
    if (d.cur !== p.pw) return toast('현재 비밀번호가 맞지 않습니다.', true);
    if (!(d.next.length >= 8 && /[a-zA-Z]/.test(d.next) && /\d/.test(d.next))) return toast('새 비밀번호는 8자 이상, 영문과 숫자를 함께 써 주세요.', true);
    if (d.next !== d.next2) return toast('새 비밀번호와 확인이 다릅니다.', true);
    p.pw = d.next; p.mustChangePw = false; save(); toast('비밀번호를 변경했습니다.'); rerender();
  });
}

/* ----- 정산 명세 ----- */
function vPay(el) {
  const months = [...new Set([ym(), ...db.attendance.map((r) => r.date.slice(0, 7))])].filter((m) => m <= ym()).sort().reverse();
  const p = payroll(ui.payMonth);
  const payDate = `${addMonths(ui.payMonth, 1)}-10`;
  const paid = payDate <= ymd();
  const text = [`${ymLabel(ui.payMonth)} 강사료 명세 (${me()})`, `승인 차시 ${p.periods}차시 / ${p.days}일`, `강사료 ${won(p.fee)}`, `수당 ${won(p.allow)}`, `사업소득세 -${won(p.incomeTax)}`, `지방소득세 -${won(p.localTax)}`, `실비 +${won(p.exp)}`, `실지급액 ${won(p.net)}`, `지급(예정)일 ${dot(payDate)}`].join('\n');
  el.innerHTML = `${pageHead('정산 명세', '운영팀이 승인한 차시와 비용청구로 자동 계산됩니다.',
      `<select id="payMonth" style="width:auto" aria-label="정산 월">${months.map((m) => `<option value="${m}" ${m === ui.payMonth ? 'selected' : ''}>${ymLabel(m)}</option>`).join('')}</select>
       <button class="btn" data-action="copy" data-copy="${esc(text)}">${icon('copy')} 명세 복사</button>${inFrame ? '' : `<button class="btn" data-action="print">${icon('printer')} 인쇄</button>`}`)}
    <div class="grid g2" style="align-items:start">
      <div class="panel slip" style="margin:0"><div class="panel-h"><h2>${ymLabel(ui.payMonth)} 강사료 명세서</h2>${paid ? '<span class="badge ok">지급완료</span>' : '<span class="badge warn">정산중</span>'}</div>
        <div class="panel-b">
          <div class="small muted" style="margin-bottom:8px">성명 ${esc(me())} · 지급(예정)일 ${dot(payDate)}</div>
          <div class="line"><span>승인 차시 / 출강 일수</span><span>${p.periods}차시 / ${p.days}일</span></div>
          <div class="line"><span>강사료 (차시 × 단가)</span><span>${won(p.fee)}</span></div>
          <div class="line"><span>수당 (승인)</span><span>${won(p.allow)}</span></div>
          <div class="line minus"><span>사업소득세 (3%)</span><span>−${won(p.incomeTax)}</span></div>
          <div class="line minus"><span>지방소득세 (0.3%)</span><span>−${won(p.localTax)}</span></div>
          <div class="line"><span>실비 (승인 ${p.exps.length}건, 비과세)</span><span>+${won(p.exp)}</span></div>
          <div class="line total"><span>실지급액</span><span>${won(p.net)}</span></div>
          ${p.pending ? `<p class="small" style="margin:10px 0 0;color:var(--warn)">승인대기 ${p.pending}차시는 승인 후 반영됩니다.</p>` : ''}
        </div></div>
      <div class="panel" style="margin:0"><div class="panel-h"><h2>최근 정산 이력</h2></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>월</th><th class="num">차시</th><th class="num">세전</th><th class="num">실지급</th></tr></thead><tbody>
        ${months.slice(0, 6).map((m) => { const q = payroll(m); return `<tr style="cursor:pointer" data-action="paymonth" data-m="${m}"><td>${ymLabel(m)}</td><td class="num">${q.periods}</td><td class="num">${won(q.fee + q.allow)}</td><td class="num"><b>${won(q.net)}</b></td></tr>`; }).join('')}
        </tbody></table></div>
        <div class="panel-b small muted">단가: 주강사 ${won(CONFIG.rates.main)} · 보조강사 ${won(CONFIG.rates.assist)} (차시당)</div></div>
    </div>`;
  $('#payMonth').onchange = (e) => { ui.payMonth = e.target.value; rerender(); };
}

/* ----- 전자계약 ----- */
const contractText = (c) => `${c.title}

갑: ${CONFIG.operator?.name || '운영기관'} (${CONFIG.brand})
을: ${me()}

제1조 (목적) 본 계약은 갑이 운영하는 SW 교육 사업의 교육 업무를 을에게 위탁함에 있어 필요한 사항을 정한다.
제2조 (기간) ${c.period}
${c.type === '용역계약' ? `제3조 (보수) 주강사 차시당 ${won(CONFIG.rates.main)}, 보조강사 차시당 ${won(CONFIG.rates.assist)}으로 하며, 사업소득세(3.3%)를 원천징수한 후 익월 10일에 지급한다.\n` : ''}제4조 (의무) 을은 배정된 교육을 성실히 수행하고, 교육 중 취득한 학생의 개인정보를 보호한다.
제5조 (기타) 본 계약에 정하지 않은 사항은 관계 법령과 일반 관례에 따른다.`;
function vContracts(el) {
  el.innerHTML = `${pageHead('전자계약', '계약서를 확인하고 전자서명으로 체결합니다.')}
    <div class="panel"><div class="panel-b flush">${db.contracts.map((c) => `<div class="list-item">
      <div class="ic" style="margin:0">${icon('pen')}</div>
      <div class="grow"><b>${esc(c.title)}</b><span class="small muted">${esc(c.type)} · ${esc(c.period)}${c.signedAt ? ` · ${dot(ymd(new Date(c.signedAt)))} 서명` : ''}</span></div>
      ${c.signature ? `<img class="sig-img" src="${c.signature}" alt="서명">` : ''}
      ${badge(c.status)}
      ${c.status === 'unsigned' ? `<button class="btn primary sm" data-action="sign" data-id="${c.id}">서명하기</button>` : `<button class="btn sm" data-action="viewContract" data-id="${c.id}">보기</button>`}
    </div>`).join('')}</div></div>`;
}
function signContract(id) {
  const c = db.contracts.find((x) => x.id === id);
  let drawn = false;
  const m = modal({ title: '전자서명', wide: true,
    body: `<div class="contract-doc">${esc(contractText(c))}</div>
      <label class="check" style="margin-bottom:12px"><input type="checkbox" id="agreeC"> 위 계약 내용을 모두 확인했으며 이에 동의합니다.</label>
      <div class="row" style="align-items:center;margin-bottom:6px"><b class="small">아래 칸에 서명해 주세요</b><button type="button" class="btn sm ghost" id="clr" style="flex:none">지우기</button></div>
      <canvas class="sigpad" id="pad"></canvas>`,
    foot: `<button class="btn" data-close>취소</button><button class="btn primary" id="doSign">${icon('check')} 서명 완료</button>`,
    onMount(bg) {
      const cv = $('#pad', bg); const ctx = cv.getContext('2d');
      const fit = () => { const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.scale(dpr, dpr); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; };
      requestAnimationFrame(fit);
      let down = false;
      const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pt(e)); });
      cv.addEventListener('pointermove', (e) => { if (!down) return; ctx.lineTo(...pt(e)); ctx.stroke(); drawn = true; });
      cv.addEventListener('pointerup', () => { down = false; });
      $('#clr', bg).onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); drawn = false; };
      $('#doSign', bg).onclick = () => {
        if (!$('#agreeC', bg).checked) return toast('계약 내용 동의에 체크해 주세요.', true);
        if (!drawn) return toast('서명을 입력해 주세요.', true);
        c.signature = cv.toDataURL('image/png'); c.status = 'signed'; c.signedAt = Date.now();
        save(); m.close(); toast('계약서 서명이 완료되었습니다.'); rerender();
      };
    } });
}
function viewContract(id) {
  const c = db.contracts.find((x) => x.id === id);
  modal({ title: c.title, wide: true,
    body: `<div class="contract-doc" style="max-height:none">${esc(contractText(c))}</div>
      <div class="row" style="align-items:center"><div><b>을 서명</b><div class="small muted">${c.signedAt ? new Date(c.signedAt).toLocaleString('ko-KR') : ''}</div></div>
      ${c.signature ? `<img class="sig-img" style="height:90px;flex:none" src="${c.signature}" alt="서명">` : '<span class="muted small">서면 계약으로 체결됨</span>'}</div>`,
    foot: '<button class="btn" data-close>닫기</button>' });
}

/* ----- 서류 작성 ----- */
const DOC_TYPES = ['지출결의서', '출장신청서', '강의결과보고서', '캠프 참여 신청서', '기타'];
const steps = (s) => `<div class="steps"><span class="s done">작성</span><span class="bar"></span><span class="s ${s !== 'pending' ? 'done' : ''}">검토</span><span class="bar"></span><span class="s ${s === 'approved' ? 'done' : s === 'rejected' ? 'rej' : ''}">${s === 'rejected' ? '반려' : '승인'}</span></div>`;
function vDocs(el) {
  const list = db.docs.slice().sort((a, b) => b.createdAt - a.createdAt);
  el.innerHTML = `${pageHead('서류 작성', '회계·행정 서류를 작성하고 전자결재로 제출합니다.', `<button class="btn primary" data-action="newDoc">${icon('plus')} 새 서류</button>`)}
    <div class="panel"><div class="panel-b flush">${list.map((d) => `<div class="list-item" data-action="viewDoc" data-id="${d.id}" style="cursor:pointer">
      <div class="grow"><b>${esc(d.title)}</b><span class="small muted">${esc(d.type)} · ${dot(ymd(new Date(d.createdAt)))}${d.amount ? ` · ${won(d.amount)}` : ''}</span></div>
      ${steps(d.status)}</div>`).join('') || '<div class="panel-b muted">작성한 서류가 없습니다.</div>'}</div></div>`;
}
function newDoc() {
  formModal({ title: '새 서류 작성', submit: '결재 상신', wide: true,
    fields: `<div class="row"><label class="f"><span>서류 종류 *</span><select id="dType" name="type">${DOC_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></label>
      <label class="f"><span>금액 (해당 시)</span><input id="dAmount" name="amount" type="number" min="0" step="10" placeholder="0"></label></div>
      <label class="f"><span>제목 *</span><input id="dTitle" name="title" required></label>
      <label class="f"><span>내용 *</span><textarea id="dContent" name="content" required style="min-height:160px" placeholder="목적, 일시, 세부 내역 등을 작성하세요"></textarea></label>`,
    onSubmit(d) { db.docs.push({ id: uid(), type: d.type, title: d.title.trim(), amount: Number(d.amount) || 0, content: d.content.trim(), status: 'pending', createdAt: Date.now(), history: [] }); save(); toast('결재가 상신되었습니다.'); rerender(); } });
}
function viewDoc(id) {
  const d = db.docs.find((x) => x.id === id);
  modal({ title: d.title, wide: true,
    body: `<div style="margin-bottom:14px">${steps(d.status)}</div>
      <div class="row small muted" style="margin-bottom:10px"><span>${esc(d.type)}</span><span>작성 ${new Date(d.createdAt).toLocaleString('ko-KR')}</span>${d.amount ? `<span>금액 ${won(d.amount)}</span>` : ''}</div>
      <div class="contract-doc">${esc(d.content)}</div>
      ${d.history.length ? `<b class="small">결재 이력</b><ul class="small">${d.history.map((h) => `<li>${new Date(h.t).toLocaleString('ko-KR')} · ${esc(h.by)} ${esc(h.act)}${h.memo ? ` — ${esc(h.memo)}` : ''}</li>`).join('')}</ul>` : ''}`,
    foot: `${d.status === 'pending' && !isAdmin() ? '<button class="btn danger" id="wd">상신 취소</button>' : ''}<button class="btn" data-close>닫기</button>`,
    onMount(bg, close) { const w = $('#wd', bg); if (w) w.onclick = () => { db.docs = db.docs.filter((x) => x.id !== id); save(); close(); toast('상신을 취소했습니다.'); rerender(); }; } });
}

/* ----- 운영팀: 승인함 ----- */
function vAdmin(el) {
  const pa = db.attendance.filter((r) => r.out && r.status === 'pending').sort((a, b) => a.date.localeCompare(b.date));
  const pc = db.claims.filter((c) => c.status === 'pending');
  const pr = db.rentals.filter((r) => r.status === 'pending' || r.status === 'returning');
  const pd = db.docs.filter((d) => d.status === 'pending');
  const pq = db.inquiries.filter((q) => q.status === 'open' && q.messages[q.messages.length - 1].by === 'me');
  const apps = db.applications;
  const ex = db.attendance.filter((r) => ['out', 'nogps', 'late'].includes(r.in?.flag) || ['out', 'nogps', 'late'].includes(r.out?.flag)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const btns = (kind, id, ok = '승인') => `<button class="btn sm" data-action="approve" data-kind="${kind}" data-id="${id}">${icon('check')} ${ok}</button><button class="btn sm danger" data-action="reject" data-kind="${kind}" data-id="${id}">거절</button>`;
  const empty = (t) => `<div class="panel-b muted small">${t}</div>`;
  el.innerHTML = `${pageHead('승인함', '강사가 올린 차시·청구·대여·서류와 문의, 채용 지원서를 처리합니다.')}
    <div class="kpis"><div class="kpi"><span>차시 승인</span><b>${pa.length}</b></div><div class="kpi"><span>비용청구</span><b>${pc.length}</b></div><div class="kpi"><span>대여·반납</span><b>${pr.length}</b></div><div class="kpi"><span>답변 필요 문의</span><b>${pq.length}</b></div></div>
    ${pa.length > 1 ? `<div style="margin-bottom:12px"><button class="btn primary" data-action="approveAllAtt">${icon('check')} 예외 없는 차시 일괄 승인</button></div>` : ''}
    <div class="panel"><div class="panel-h"><h2>수업차시 승인</h2></div><div class="panel-b flush">${pa.map((r) => `<div class="list-item"><div class="grow"><b>${dLabel(r.date)} · ${esc(siteName(r.siteId))} · ${r.periods}차시</b><span class="small muted">${esc(me())} · ${roleLabel(r.role)} · ${hm(r.in.t)}~${hm(r.out.t)} · ${won(r.periods * rateOf(r.role))}${r.reason ? ` · 사유: ${esc(r.reason)}` : ''}</span></div>${r.in.flag || r.out.flag ? '<span class="badge warn">예외 포함</span>' : ''}${btns('att', r.id)}</div>`).join('') || empty('대기 중인 차시 신청이 없습니다.')}</div></div>
    <div class="panel"><div class="panel-h"><h2>비용청구</h2></div><div class="panel-b flush">${pc.map((c) => `<div class="list-item">${c.receipt?.startsWith('data:image') ? `<img class="receipt-thumb" src="${c.receipt}" data-action="zoom" data-id="${c.id}" alt="영수증">` : ''}<div class="grow"><b>${esc(c.category)} ${won(c.amount)} (${esc(c.type)})</b><span class="small muted">${dot(c.date)} · ${esc(c.title)}${c.rentalId ? ` · 관련건 ${esc(rentalLabel(c.rentalId))}` : ''}${c.category === '여비' && c.type === '실비' && !c.receipt ? ' · 영수증 없음' : ''}</span></div>${btns('claim', c.id)}</div>`).join('') || empty('대기 중인 청구가 없습니다.')}</div></div>
    <div class="panel"><div class="panel-h"><h2>대여·반납</h2></div><div class="panel-b flush">${pr.map((r) => `<div class="list-item"><div class="grow"><b>${esc(assetName(r.assetId))} × ${r.qty} ${r.status === 'returning' ? '— 반납 확인 요청' : ''}</b><span class="small muted">불출 ${dot(r.pickupAt)} ${r.pickupAt.slice(11)} ~ 반납 ${dot(r.returnDate)} · ${esc(r.site)} · 대여 가능 ${available(r.assetId)}</span></div>
      ${r.status === 'returning' ? `<button class="btn sm" data-action="approve" data-kind="return" data-id="${r.id}">${icon('check')} 반납 확인</button>` : btns('rental', r.id)}</div>`).join('') || empty('대기 중인 요청이 없습니다.')}</div></div>
    <div class="panel"><div class="panel-h"><h2>답변이 필요한 문의</h2><a class="small" href="#app-inquiry">문의 답변 →</a></div><div class="panel-b flush">${pq.map((q) => `<div class="list-item"><div class="grow"><b>${esc(q.title)}</b><span class="small muted">${esc(q.category)} · ${esc(q.messages[q.messages.length - 1].text.slice(0, 60))}</span></div><a class="btn sm" href="#app-inquiry" data-action="openInq" data-id="${q.id}">답변하기</a></div>`).join('') || empty('답변할 문의가 없습니다.')}</div></div>
    <div class="panel"><div class="panel-h"><h2>서류 결재</h2></div><div class="panel-b flush">${pd.map((d) => `<div class="list-item"><div class="grow" data-action="viewDoc" data-id="${d.id}" style="cursor:pointer"><b>${esc(d.title)}</b><span class="small muted">${esc(d.type)}${d.amount ? ` · ${won(d.amount)}` : ''}</span></div>${btns('doc', d.id)}</div>`).join('') || empty('대기 중인 결재가 없습니다.')}</div></div>
    <div class="panel"><div class="panel-h"><h2>채용 지원서</h2></div><div class="panel-b flush">${apps.map((a) => `<div class="list-item"><div class="grow"><b>${esc(a.name)} · ${esc(a.phone)}</b><span class="small muted">${esc(a.jobTitle)} · ${new Date(a.createdAt).toLocaleDateString('ko-KR')}</span><div class="small" style="white-space:pre-wrap">${esc(a.career)}</div></div>${badge(a.status)}${a.status === 'new' ? `<button class="btn sm" data-action="reviewApp" data-id="${a.id}">검토 완료</button>` : ''}</div>`).join('') || empty('접수된 지원서가 없습니다.')}</div></div>
    <div class="panel"><div class="panel-h"><h2>입퇴실 예외 기록</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>날짜</th><th>교육장</th><th>구분</th><th>사유</th></tr></thead><tbody>
      ${ex.flatMap((r) => ['in', 'out'].filter((k) => r[k]?.flag).map((k) => `<tr><td>${dLabel(r.date)}</td><td>${esc(siteName(r.siteId))}</td><td>${k === 'in' ? '입실' : '퇴실'} · ${flagText(r[k])}</td><td class="wrap-cell">${esc(r[k].reason || '')}</td></tr>`)).join('') || '<tr><td colspan="4" class="muted">예외 기록이 없습니다.</td></tr>'}
    </tbody></table></div></div>`;
}
function decide(kind, id, ok, memo = '') {
  if (kind === 'att') { const r = db.attendance.find((x) => x.id === id); r.status = ok ? 'approved' : 'rejected'; r.memo = memo; notify(`${dLabel(r.date)} ${r.periods}차시 신청이 ${ok ? '승인' : '거부'}되었습니다.${memo ? ` (${memo})` : ''}`, 'app-records'); }
  if (kind === 'claim') { const c = db.claims.find((x) => x.id === id); c.status = ok ? 'approved' : 'rejected'; c.memo = memo; notify(`비용청구 "${c.category} ${won(c.amount)}"이 ${ok ? '승인' : '거절'}되었습니다.`, 'app-claims'); }
  if (kind === 'rental') {
    const r = db.rentals.find((x) => x.id === id);
    if (ok && Number(r.qty) > available(r.assetId)) return toast('재고가 부족해 승인할 수 없습니다.', true);
    r.status = ok ? 'approved' : 'rejected'; r.memo = memo; notify(`대여 신청 "${assetName(r.assetId)} ${r.qty}개"가 ${ok ? '승인되었습니다 (대여예정)' : '거부되었습니다'}.`, 'app-rental');
  }
  if (kind === 'return') { const r = db.rentals.find((x) => x.id === id); r.status = 'returned'; notify(`"${assetName(r.assetId)} ${r.qty}개" 반납이 확인되었습니다.`, 'app-rental'); }
  if (kind === 'doc') { const d = db.docs.find((x) => x.id === id); d.status = ok ? 'approved' : 'rejected'; d.history.push({ t: Date.now(), by: '운영팀', act: ok ? '승인' : '반려', memo }); }
  save(); toast(ok ? '처리했습니다.' : '거절했습니다.'); rerender();
}

/* ----- 운영팀: 채용·공지 ----- */
function vCms(el) {
  const jobs = db.jobs.slice().sort((a, b) => b.createdAt - a.createdAt);
  const notices = db.notices.slice().sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = `${pageHead('채용·공지 관리', '홈페이지의 채용공고와 공지사항을 직접 등록·수정합니다.')}
    <div class="panel"><div class="panel-h"><h2>채용공고</h2><button class="btn primary sm" data-action="newJob">${icon('plus')} 공고 등록</button></div><div class="panel-b flush">
      ${jobs.map((j) => `<div class="list-item"><div class="grow"><b>${esc(j.title)}</b><span class="small muted">${esc(j.region)} · ${esc(j.type)} · 마감 ${dot(j.deadline)} · 지원 ${db.applications.filter((a) => a.jobId === j.id).length}명</span></div>${badge(j.status === 'open' && j.deadline >= ymd() ? 'open' : 'closed')}
        <button class="btn sm" data-action="toggleJob" data-id="${j.id}">${j.status === 'open' ? '마감 처리' : '다시 열기'}</button><button class="btn sm danger" data-action="delJob" data-id="${j.id}">삭제</button></div>`).join('') || '<div class="panel-b muted">등록된 공고가 없습니다.</div>'}
    </div></div>
    <div class="panel"><div class="panel-h"><h2>공지사항</h2><button class="btn primary sm" data-action="newNotice">${icon('plus')} 공지 등록</button></div><div class="panel-b flush">
      ${notices.map((n) => `<div class="list-item"><div class="grow"><b>${n.pinned ? '[중요] ' : ''}${esc(n.title)}</b><span class="small muted">${dot(n.date)}</span></div><button class="btn sm" data-action="pinNotice" data-id="${n.id}">${n.pinned ? '고정 해제' : '상단 고정'}</button><button class="btn sm danger" data-action="delNotice" data-id="${n.id}">삭제</button></div>`).join('') || '<div class="panel-b muted">공지 없음</div>'}
    </div></div>
    <div class="panel"><div class="panel-h"><h2>채용 알림 신청자 (${db.subscribers.length})</h2>${db.subscribers.length ? `<button class="btn sm" data-action="copy" data-copy="${esc(db.subscribers.map((s) => s.email).join(', '))}">${icon('copy')} 이메일 복사</button>` : ''}</div>
      <div class="panel-b small">${db.subscribers.map((s) => esc(s.email)).join(', ') || '<span class="muted">아직 신청자가 없습니다.</span>'}</div></div>`;
}
function newJob() {
  formModal({ title: '채용공고 등록', submit: '게시', wide: true,
    fields: `<label class="f"><span>공고 제목 *</span><input id="jTitle" name="title" required></label>
      <div class="row"><label class="f"><span>근무 지역 *</span><input id="jRegion" name="region" required></label>
      <label class="f"><span>고용 형태 *</span><input id="jType" name="type" required placeholder="시간제 / 단기"></label></div>
      <div class="row"><label class="f"><span>급여 *</span><input id="jPay" name="pay" required value="차시당 ${won(CONFIG.rates.main)}"></label>
      <label class="f"><span>마감일 *</span><input id="jDeadline" name="deadline" type="date" required value="${ymd(addDays(14))}"></label></div>
      <label class="f"><span>상세 내용 *</span><textarea id="jDesc" name="desc" required style="min-height:160px" placeholder="자격, 근무 조건, 우대 사항 등"></textarea></label>`,
    onSubmit(d) {
      db.jobs.push({ id: uid(), title: d.title.trim(), region: d.region.trim(), type: d.type.trim(), pay: d.pay.trim(), deadline: d.deadline, desc: d.desc.trim(), status: 'open', createdAt: Date.now() });
      save(); toast(`공고를 게시했습니다.${db.subscribers.length ? ` 알림 신청자 ${db.subscribers.length}명의 이메일을 복사해 안내할 수 있어요.` : ''}`); rerender();
    } });
}
function newNotice() {
  formModal({ title: '공지 등록', submit: '게시', wide: true,
    fields: `<label class="f"><span>제목 *</span><input id="nTitle" name="title" required></label>
      <label class="f"><span>내용 *</span><textarea id="nBody" name="body" required style="min-height:160px"></textarea></label>
      <label class="check"><input id="nPinned" type="checkbox" name="pinned"> 상단 고정 (중요 공지)</label>`,
    onSubmit(d) { db.notices.push({ id: uid(), title: d.title.trim(), body: d.body.trim(), date: ymd(), pinned: !!d.pinned }); save(); toast('공지를 게시했습니다.'); rerender(); } });
}

/* ================= Actions ================= */
const actions = {
  theme: toggleTheme,
  menu: () => $('#nav').classList.toggle('open'),
  logout: () => { session = null; store.del('session'); toast('로그아웃되었습니다.'); location.hash = 'top'; },
  reset: () => confirmDo('처음 상태로 되돌리기', '입력한 모든 데이터를 지우고 예시 데이터로 되돌립니다.', () => { db = seed(); save(); toast('초기화했습니다.'); rerender(); }, '되돌리기'),
  copy: (el) => copyText(el.dataset.copy),
  print: () => window.print(),
  help: (el) => openHelp(el.dataset.key),
  notifs: openNotifs,
  findPw: () => modal({ title: '비밀번호 찾기', body: `<p style="margin-top:0">비밀번호 초기화는 운영팀에서 처리합니다.</p><p>대표 문의 <b>${esc(CONFIG.phone)}</b>로 연락하시거나, 동료 강사를 통해 운영팀에 초기화를 요청해 주세요. 초기화 후 받은 비밀번호로 로그인하고 바로 변경해 주세요.</p>`, foot: '<button class="btn" data-close>확인</button>' }),
  notice: (el) => openNotice(el.dataset.id),
  job: (el) => openJob(el.dataset.id),
  role: (el) => { ui.role = el.dataset.role; rerender(); },
  checkin: (el) => doCheckin(el),
  checkout: (el) => doCheckout(el.dataset.id, el),
  recToggle: (el) => { ui.recOpen = ui.recOpen === el.dataset.id ? null : el.dataset.id; rerender(); },
  askFix: (el) => { const r = db.attendance.find((x) => x.id === el.dataset.id); ui.inqPrefill = { category: '정산 관련', title: `${dLabel(r.date)} 차시 수정 요청`, body: `${dLabel(r.date)} ${siteName(r.siteId)} 근무기록의 수업차시를 ${r.periods}차시 → ○차시로 수정 요청드립니다.\n사유: ` }; ui.inqTab = 'form'; location.hash = 'app-inquiry'; },
  excel: downloadExcel,
  copyTable: () => copyText(recordRows().map((r) => r.join('\t')).join('\n'), '표를 복사했습니다. 엑셀에 붙여넣으세요.'),
  calView: (el) => { ui.calView = el.dataset.v; if (ui.calView === 'week') ui.calWeek = ui.calMonth === ym() ? ymd() : `${ui.calMonth}-01`; rerender(); },
  cal: (el) => {
    const n = +el.dataset.n;
    if (ui.calView === 'month') ui.calMonth = n === 0 ? ym() : addMonths(ui.calMonth, n);
    else { ui.calWeek = n === 0 ? ymd() : ymd(addDays(7 * n, new Date(ui.calWeek + 'T00:00'))); ui.calMonth = ui.calWeek.slice(0, 7); }
    rerender();
  },
  day: (el) => openDay(el.dataset.d),
  rentalTab: (el) => { ui.rentalTab = el.dataset.t; if (el.dataset.t === 'list') ui.rentalPrefill = null; rerender(); },
  cancelRental: (el) => confirmDo('신청 취소', '이 대여 신청을 취소할까요?', () => { db.rentals = db.rentals.filter((r) => r.id !== el.dataset.id); save(); toast('신청을 취소했습니다.'); rerender(); }),
  returnRental: (el) => { db.rentals.find((r) => r.id === el.dataset.id).status = 'returning'; save(); toast('반납 신청했습니다. 운영팀 확인 후 반납완료로 바뀝니다.'); rerender(); },
  reRental: (el) => { const r = db.rentals.find((x) => x.id === el.dataset.id); ui.rentalPrefill = { manager: r.manager, assetId: r.assetId, qty: r.qty, site: r.site, note: r.note }; ui.rentalTab = 'form'; rerender(); },
  claimTab: (el) => { ui.claimTab = el.dataset.t; rerender(); },
  editClaim: (el) => { ui.editClaim = el.dataset.id; ui.claimTab = 'form'; rerender(); },
  reClaim: (el) => { ui.editClaim = el.dataset.id; ui.claimTab = 'form'; rerender(); },
  cancelEdit: () => { ui.editClaim = null; rerender(); },
  delClaim: (el) => confirmDo('청구 취소', '이 비용청구를 취소할까요?', () => { db.claims = db.claims.filter((c) => c.id !== el.dataset.id); save(); rerender(); }),
  zoom: (el) => { const c = db.claims.find((x) => x.id === el.dataset.id); modal({ title: `영수증 — ${c.title}`, body: `<img src="${c.receipt}" alt="영수증" style="width:100%;border-radius:10px">` }); },
  inqTab: (el) => { ui.inqTab = el.dataset.t; rerender(); },
  inqToggle: (el) => { const q = db.inquiries.find((x) => x.id === el.dataset.id); ui.inqOpen = ui.inqOpen === q.id ? null : q.id; if (!isAdmin() && q.unread) { q.unread = false; save(); } rerender(); },
  openInq: (el) => { ui.inqOpen = el.dataset.id; },
  closeInq: (el) => { const q = db.inquiries.find((x) => x.id === el.dataset.id); q.status = 'closed'; notify(`문의 "${q.title}"이 종료되었습니다.`, 'app-inquiry'); save(); toast('문의를 종료했습니다.'); rerender(); },
  paymonth: (el) => { ui.payMonth = el.dataset.m; rerender(); },
  sign: (el) => signContract(el.dataset.id),
  viewContract: (el) => viewContract(el.dataset.id),
  newDoc, viewDoc: (el) => viewDoc(el.dataset.id),
  approve: (el) => decide(el.dataset.kind, el.dataset.id, true),
  reject: (el) => askReason('거절', '거절 사유를 입력해 주세요. 신청자에게 표시됩니다.', (memo) => decide(el.dataset.kind, el.dataset.id, false, memo), { submit: '거절' }),
  approveAllAtt: () => { const list = db.attendance.filter((r) => r.out && r.status === 'pending' && !r.in.flag && !r.out.flag); list.forEach((r) => { r.status = 'approved'; }); if (list.length) notify(`수업차시 ${list.length}건이 승인되었습니다.`, 'app-records'); save(); toast(`${list.length}건을 승인했습니다.`); rerender(); },
  reviewApp: (el) => { db.applications.find((a) => a.id === el.dataset.id).status = 'reviewed'; save(); rerender(); },
  newJob, newNotice,
  toggleJob: (el) => { const j = db.jobs.find((x) => x.id === el.dataset.id); j.status = j.status === 'open' ? 'closed' : 'open'; if (j.status === 'open' && j.deadline < ymd()) j.deadline = ymd(addDays(14)); save(); rerender(); },
  delJob: (el) => confirmDo('공고 삭제', '이 채용공고를 삭제할까요?', () => { db.jobs = db.jobs.filter((j) => j.id !== el.dataset.id); save(); rerender(); }, '삭제'),
  pinNotice: (el) => { const n = db.notices.find((x) => x.id === el.dataset.id); n.pinned = !n.pinned; save(); rerender(); },
  delNotice: (el) => confirmDo('공지 삭제', '이 공지를 삭제할까요?', () => { db.notices = db.notices.filter((n) => n.id !== el.dataset.id); save(); rerender(); }, '삭제'),
};

document.addEventListener('click', (e) => {
  const navLink = e.target.closest('#nav a');
  if (navLink) $('#nav').classList.remove('open');
  const a = e.target.closest('[data-action]');
  if (a && actions[a.dataset.action]) {
    if (a.tagName === 'A' && a.dataset.action !== 'openInq') e.preventDefault();
    actions[a.dataset.action](a, e);
  }
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[tabindex][data-action]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  if (f.dataset.form === 'subscribe') {
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return toast('이메일 형식을 확인해 주세요.', true);
    if (!db.subscribers.find((s) => s.email === d.email)) db.subscribers.push({ email: d.email, at: Date.now() });
    save(); f.reset(); toast('새 채용공고 알림을 신청했습니다.');
  }
  if (f.dataset.form === 'login') {
    const phone = d.phone.replace(/\s/g, '');
    if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone)) return toast('휴대폰 번호를 010-XXXX-XXXX 형식으로 입력해 주세요.', true);
    if (d.pw.length < 4) return toast('비밀번호를 4자 이상 입력해 주세요.', true);
    session = { phone, role: loginRole };
    if (loginRole === 'instructor') { db.profile.phone = phone; save(); }
    store.set('session', session); store.set('lastPhone', phone);
    toast(loginRole === 'admin' ? '운영팀으로 로그인했습니다.' : `${me()}님, 환영합니다.`);
    location.hash = loginRole === 'admin' ? 'app-admin' : 'app-checkin';
  }
});
$('#jobFilter').addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (!c) return; jobFilter = c.dataset.f; renderJobs(); });
$('#jobSearch').addEventListener('input', (e) => { jobQuery = e.target.value; renderJobs(); });

const spy = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (en.isIntersecting) $$('#nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['about', 'programs', 'notices', 'jobs', 'contact', 'faq'].forEach((id) => spy.observe($('#' + id)));

/* ================= Router (plain #name hashes) ================= */
let lastHash = null;
function route(keepScroll) {
  const h = location.hash.replace(/^#/, '');
  if (h !== lastHash) $$('.modal-bg').forEach((m) => m.remove());
  const changed = h !== lastHash;
  lastHash = h;
  const landing = $('#landing'), view = $('#view'), footer = $('#footer');
  if (h === 'app' || h.startsWith('app-')) {
    if (!session) { location.hash = 'login'; return; }
    landing.hidden = true; view.hidden = false; footer.hidden = true;
    renderHeader(true);
    const y = window.scrollY;
    renderPortal(h === 'app' ? (isAdmin() ? 'admin' : 'checkin') : h.slice(4));
    if (keepScroll === true && !changed) window.scrollTo(0, y);
  } else if (h === 'login') {
    if (session) { location.hash = 'app'; return; }
    clearInterval(timer);
    landing.hidden = true; view.hidden = false; footer.hidden = true;
    renderHeader(false); renderLogin(); window.scrollTo(0, 0);
  } else {
    clearInterval(timer);
    const wasPortal = !view.hidden;
    view.hidden = true; view.innerHTML = ''; landing.hidden = false; footer.hidden = false;
    renderHeader(false); renderLanding();
    const target = h && document.getElementById(h);
    if (target && (changed || wasPortal)) setTimeout(() => target.scrollIntoView(), 20);
  }
}
window.addEventListener('hashchange', () => route(false));
applyConfig();
hydrateIcons();
route(false);
})();
