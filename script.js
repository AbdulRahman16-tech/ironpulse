/* ═══════════════════════════════════════════════════════
   IRONPULSE – GYM BOOKING APP  |  script.js
   Full LocalStorage Logic | No external dependencies
═══════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────── */
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

const PRELOADED_SESSIONS = [
  { id: 'p1', name: '🏃 Morning Cardio',  trainer: 'John',  time: '6:00 AM – 7:00 AM' },
  { id: 'p2', name: '🏋 Weight Training', trainer: 'David', time: '8:00 AM – 9:00 AM' },
  { id: 'p3', name: '🧘 Yoga Session',    trainer: 'Priya', time: '5:00 PM – 6:00 PM' },
];

/* ──────────────────────────────────────────────────────
   LOCALSTORAGE HELPERS
────────────────────────────────────────────────────── */
const LS = {
  get:    (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set:    (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem(key),
};

/* ──────────────────────────────────────────────────────
   STATE
────────────────────────────────────────────────────── */
let currentUser = null;

/* ──────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSessions();
  bindEvents();

  // Wait for splash to animate out, then show auth
  setTimeout(() => {
    document.getElementById('splash-screen').style.display = 'none';
    showPage('auth-page');
  }, 2700);
});

/* Seed sessions if none exist */
function initSessions() {
  if (!LS.get('ip_sessions')) {
    LS.set('ip_sessions', PRELOADED_SESSIONS);
  }
  if (!LS.get('ip_users')) {
    LS.set('ip_users', []);
  }
  if (!LS.get('ip_bookings')) {
    LS.set('ip_bookings', []);
  }
}

/* ──────────────────────────────────────────────────────
   PAGE NAVIGATION
────────────────────────────────────────────────────── */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(pageId);
  if (page) page.classList.remove('hidden');
}

/* ──────────────────────────────────────────────────────
   EVENT BINDINGS
────────────────────────────────────────────────────── */
function bindEvents() {

  /* ── AUTH TABS ── */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
  });

  /* ── LOGIN ── */
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('login-username').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  /* ── REGISTER ── */
  document.getElementById('register-btn').addEventListener('click', handleRegister);

  /* ── FORGOT PASSWORD ── */
  document.getElementById('forgot-btn').addEventListener('click', () => {
    document.getElementById('forgot-username').value = '';
    clearMsg('forgot-result');
    clearMsg('forgot-error');
    document.getElementById('forgot-overlay').classList.remove('hidden');
  });
  document.getElementById('forgot-submit-btn').addEventListener('click', handleForgotPassword);
  document.getElementById('forgot-close-btn').addEventListener('click', () => {
    document.getElementById('forgot-overlay').classList.add('hidden');
  });

  /* ── ADMIN PORTAL NAV ── */
  document.getElementById('goto-admin-btn').addEventListener('click', () => showPage('admin-login-page'));
  document.getElementById('admin-back-btn').addEventListener('click', () => showPage('auth-page'));

  /* ── ADMIN LOGIN ── */
  document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
  document.getElementById('admin-username').addEventListener('keydown', e => { if (e.key === 'Enter') handleAdminLogin(); });
  document.getElementById('admin-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleAdminLogin(); });

  /* ── USER LOGOUT ── */
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  /* ── ADMIN LOGOUT ── */
  document.getElementById('admin-logout-btn').addEventListener('click', () => {
    showToast('Admin logged out', 'success');
    showPage('auth-page');
  });

  /* ── DASH TABS ── */
  document.querySelectorAll('.dash-tab').forEach(btn => {
    btn.addEventListener('click', () => switchDashTab(btn.dataset.section));
  });

  /* ── ADD SESSION (ADMIN) ── */
  document.getElementById('add-session-btn').addEventListener('click', handleAddSession);

  /* ── BOOKING POPUP CLOSE ── */
  document.getElementById('popup-close-btn').addEventListener('click', () => {
    document.getElementById('booking-overlay').classList.add('hidden');
  });

  /* Close overlays when clicking backdrop */
  document.getElementById('booking-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('booking-overlay')) {
      document.getElementById('booking-overlay').classList.add('hidden');
    }
  });
  document.getElementById('forgot-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('forgot-overlay')) {
      document.getElementById('forgot-overlay').classList.add('hidden');
    }
  });
}

/* ──────────────────────────────────────────────────────
   AUTH TAB SWITCH
────────────────────────────────────────────────────── */
function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('login-tab').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-tab').classList.toggle('hidden', tab !== 'register');
}

/* ──────────────────────────────────────────────────────
   USER LOGIN
────────────────────────────────────────────────────── */
function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    return showError('login-error', 'Please fill in all fields.');
  }

  const users = LS.get('ip_users') || [];
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

  if (!user) {
    return showError('login-error', '❌ Invalid username or password.');
  }

  clearMsg('login-error');
  currentUser = user.username;
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  loadUserDashboard();
}

/* ──────────────────────────────────────────────────────
   USER REGISTER
────────────────────────────────────────────────────── */
function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  clearMsg('register-error');
  clearMsg('register-success');

  if (!username || !password || !confirm) {
    return showError('register-error', 'Please fill in all fields.');
  }
  if (username.length < 3) {
    return showError('register-error', 'Username must be at least 3 characters.');
  }
  if (password.length < 4) {
    return showError('register-error', 'Password must be at least 4 characters.');
  }
  if (password !== confirm) {
    return showError('register-error', '❌ Passwords do not match.');
  }

  const users = LS.get('ip_users') || [];
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return showError('register-error', '❌ Username already taken.');
  }

  users.push({ username, password });
  LS.set('ip_users', users);

  document.getElementById('reg-username').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('reg-confirm').value  = '';

  showSuccess('register-success', '✅ Account created! You can now login.');
  setTimeout(() => switchAuthTab('login'), 1500);
}

/* ──────────────────────────────────────────────────────
   FORGOT PASSWORD
────────────────────────────────────────────────────── */
function handleForgotPassword() {
  const username = document.getElementById('forgot-username').value.trim();
  clearMsg('forgot-result');
  clearMsg('forgot-error');

  if (!username) {
    return showError('forgot-error', 'Please enter your username.');
  }

  const users = LS.get('ip_users') || [];
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return showError('forgot-error', '❌ No account found with that username.');
  }

  showSuccess('forgot-result', `🔑 Your password is: ${user.password}`);
}

/* ──────────────────────────────────────────────────────
   ADMIN LOGIN
────────────────────────────────────────────────────── */
function handleAdminLogin() {
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;

  if (!username || !password) {
    return showError('admin-error', 'Please fill in all fields.');
  }

  if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
    return showError('admin-error', '❌ Invalid admin credentials.');
  }

  clearMsg('admin-error');
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
  loadAdminDashboard();
}

/* ──────────────────────────────────────────────────────
   USER DASHBOARD
────────────────────────────────────────────────────── */
function loadUserDashboard() {
  showPage('user-dashboard');
  document.getElementById('nav-username').textContent = currentUser.toUpperCase();
  document.getElementById('hero-username').textContent = currentUser.toUpperCase();
  renderSessionCards();
  renderBookingHistory();
  switchDashTab('sessions');
}

function renderSessionCards() {
  const sessions = LS.get('ip_sessions') || [];
  const container = document.getElementById('sessions-container');

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🏟️</span>
        <p>No sessions available yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = sessions.map((session, i) => `
    <div class="session-card" style="animation-delay:${i * 0.08}s">
      <div class="card-name">${escHtml(session.name)}</div>
      <div class="card-meta">
        <p>👨‍🏫 Trainer: <span>${escHtml(session.trainer)}</span></p>
        <p>⏰ Time: <span>${escHtml(session.time)}</span></p>
      </div>
      <button class="card-book-btn" onclick="bookSession('${session.id}')">BOOK SESSION 💪</button>
    </div>
  `).join('');
}

function renderBookingHistory() {
  const bookings = LS.get('ip_bookings') || [];
  const userBookings = bookings.filter(b => b.user === currentUser).reverse();
  const container = document.getElementById('history-container');

  if (userBookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No bookings yet. Go book a session!</p>
      </div>`;
    return;
  }

  container.innerHTML = userBookings.map(b => `
    <div class="history-item">
      <div class="history-icon">${getSessionEmoji(b.sessionName)}</div>
      <div class="history-info">
        <div class="history-name">${escHtml(b.sessionName)}</div>
        <div class="history-time">⏰ ${escHtml(b.sessionTime)} &nbsp;|&nbsp; 👨‍🏫 ${escHtml(b.trainer)}</div>
        <div class="history-time" style="margin-top:2px;">📅 ${b.bookedAt}</div>
      </div>
      <div class="history-badge">✅ Booked</div>
    </div>
  `).join('');
}

/* ──────────────────────────────────────────────────────
   SESSION BOOKING
────────────────────────────────────────────────────── */
function bookSession(sessionId) {
  const sessions = LS.get('ip_sessions') || [];
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return;

  // Save booking
  const bookings = LS.get('ip_bookings') || [];
  bookings.push({
    id:          Date.now(),
    user:        currentUser,
    sessionId:   session.id,
    sessionName: session.name,
    sessionTime: session.time,
    trainer:     session.trainer,
    bookedAt:    new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
  });
  LS.set('ip_bookings', bookings);

  // Show popup
  document.getElementById('popup-session-name').textContent = session.name;
  document.getElementById('popup-session-time').textContent = '⏰ ' + session.time;
  document.getElementById('popup-trainer').textContent      = '👨‍🏫 Trainer: ' + session.trainer;
  document.getElementById('booking-overlay').classList.remove('hidden');

  // Refresh history if visible
  if (!document.getElementById('history-section').classList.contains('hidden')) {
    renderBookingHistory();
  }

  // Update admin stats if needed
  updateAdminStats();
}

/* ──────────────────────────────────────────────────────
   DASH TAB SWITCH
────────────────────────────────────────────────────── */
function switchDashTab(section) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t.dataset.section === section));
  document.getElementById('sessions-section').classList.toggle('hidden', section !== 'sessions');
  document.getElementById('history-section').classList.toggle('hidden', section !== 'history');
  if (section === 'history') renderBookingHistory();
}

/* ──────────────────────────────────────────────────────
   USER LOGOUT
────────────────────────────────────────────────────── */
function handleLogout() {
  currentUser = null;
  showToast('See you at the gym! 💪', 'success');
  showPage('auth-page');
}

/* ──────────────────────────────────────────────────────
   ADMIN DASHBOARD
────────────────────────────────────────────────────── */
function loadAdminDashboard() {
  showPage('admin-dashboard');
  updateAdminStats();
  renderAdminSessions();
}

function updateAdminStats() {
  const sessions = LS.get('ip_sessions') || [];
  const bookings = LS.get('ip_bookings') || [];
  const users    = LS.get('ip_users')    || [];

  const statSessions = document.getElementById('stat-sessions');
  const statBookings = document.getElementById('stat-bookings');
  const statUsers    = document.getElementById('stat-users');

  if (statSessions) statSessions.textContent = sessions.length;
  if (statBookings) statBookings.textContent = bookings.length;
  if (statUsers)    statUsers.textContent    = users.length;
}

function renderAdminSessions() {
  const sessions  = LS.get('ip_sessions') || [];
  const container = document.getElementById('admin-sessions-list');

  if (sessions.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><p>No sessions yet.</p></div>`;
    return;
  }

  container.innerHTML = sessions.map((session, i) => `
    <div class="admin-session-item" style="animation-delay:${i * 0.06}s">
      <div class="admin-session-info">
        <div class="admin-session-name">${escHtml(session.name)}</div>
        <div class="admin-session-meta">👨‍🏫 ${escHtml(session.trainer)} &nbsp;|&nbsp; ⏰ ${escHtml(session.time)}</div>
      </div>
      <button class="delete-btn" onclick="deleteSession('${session.id}')">🗑️ Delete</button>
    </div>
  `).join('');
}

function handleAddSession() {
  const name    = document.getElementById('new-session-name').value.trim();
  const trainer = document.getElementById('new-trainer-name').value.trim();
  const time    = document.getElementById('new-session-time').value.trim();

  clearMsg('add-session-msg');

  if (!name || !trainer || !time) {
    showToast('❌ Please fill in all session fields.', 'error');
    return;
  }

  const sessions = LS.get('ip_sessions') || [];
  sessions.push({
    id:      'a' + Date.now(),
    name,
    trainer,
    time,
  });
  LS.set('ip_sessions', sessions);

  document.getElementById('new-session-name').value = '';
  document.getElementById('new-trainer-name').value = '';
  document.getElementById('new-session-time').value = '';

  showSuccess('add-session-msg', '✅ Session added successfully!');
  setTimeout(() => clearMsg('add-session-msg'), 3000);

  renderAdminSessions();
  updateAdminStats();
  showToast('✅ Session added!', 'success');
}

function deleteSession(sessionId) {
  let sessions = LS.get('ip_sessions') || [];
  sessions = sessions.filter(s => s.id !== sessionId);
  LS.set('ip_sessions', sessions);
  renderAdminSessions();
  updateAdminStats();
  showToast('🗑️ Session deleted', 'error');
}

/* ──────────────────────────────────────────────────────
   UI HELPERS
────────────────────────────────────────────────────── */
function showError(elementId, msg) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('form-error');
  el.classList.remove('form-success');
}

function showSuccess(elementId, msg) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('form-success');
  el.classList.remove('form-error');
}

function clearMsg(elementId) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

let toastTimer = null;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = 'toast' + (type ? ' ' + type : '');
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSessionEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('cardio') || n.includes('run'))   return '🏃';
  if (n.includes('weight') || n.includes('gym'))   return '🏋';
  if (n.includes('yoga'))                           return '🧘';
  if (n.includes('swim'))                           return '🏊';
  if (n.includes('box'))                            return '🥊';
  if (n.includes('cycle') || n.includes('spin'))   return '🚴';
  return '💪';
}
