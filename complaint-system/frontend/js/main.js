const API = window.location.origin + '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  clearAuth();
  window.location.href = '/index.html';
}

// ── apiFetch: attach errorType from server response to thrown Error ──
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${endpoint}`, { ...options, headers });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { message: 'No response received from the server.' };
  }

  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    // Attach errorType so frontend popups can detect error category
    if (data.errorType) err.errorType = data.errorType;
    throw err;
  }

  return data;
}

async function apiFormData(endpoint, formData, method = 'POST') {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${endpoint}`, { method, headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function showAlert(containerId, message, type = 'info') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => el.innerHTML = '', 4000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function priorityBadge(priority) {
  return `<span class="badge badge-${priority}">${priority}</span>`;
}

function statusBadge(status) {
  const map = {
    'pending': 'pending',
    'assigned': 'assigned',
    'in-progress': 'in-progress',
    'resolved': 'resolved',
    'rejected': 'rejected'
  };
  return `<span class="badge badge-${map[status] || 'pending'}">${status}</span>`;
}

function redirectIfNotLoggedIn(requiredRole = null) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/index.html';
    return;
  }
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') window.location.href = '/admin-dashboard.html';
    else if (user.role === 'worker') window.location.href = '/worker-dashboard.html';
    else window.location.href = '/user-dashboard.html';
  }
}

function setupNavUser() {
  const user = getUser();
  const el = document.getElementById('nav-user');
  if (el && user) el.textContent = `${user.name} (${user.role})`;
}