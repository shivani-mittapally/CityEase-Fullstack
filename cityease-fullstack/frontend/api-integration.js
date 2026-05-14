
// Simple API integration for CityEase frontend
const API_BASE = (window.CITYEASE_API_BASE || 'http://localhost:3000');

function setError(el, msg) {
  if (!el) return alert(msg);
  el.style.display = 'block';
  el.textContent = msg;
}

async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
  return res.json();
}

async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

async function createBooking(token, payload) {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Booking failed');
  return res.json();
}

function saveAuth({ user, token }) {
  localStorage.setItem('ce_token', token);
  localStorage.setItem('ce_user', JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem('ce_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('ce_user') || '{}'); } catch { return {}; }
}

// Hook into existing buttons:
window.submitRegistration = async function() {
  const name = document.getElementById('registerName')?.value?.trim();
  const email = document.getElementById('registerEmail')?.value?.trim();
  const password = document.getElementById('registerPassword')?.value;
  const phone = '';
  const errEl = document.getElementById('registerError');
  try {
    const data = await registerUser({ name, email, password, phone });
    saveAuth(data);
    if (errEl) errEl.style.display = 'none';
    // Close modal and go home if navigate exists
    if (typeof hideRegister === 'function') hideRegister();
    if (typeof navigate === 'function') navigate('homePage');
    alert('Registered successfully.');
  } catch (e) {
    setError(errEl, e.message);
  }
};

window.submitLogin = async function() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;
  const errEl = document.getElementById('loginError');
  try {
    const data = await loginUser({ email, password });
    saveAuth(data);
    if (errEl) errEl.style.display = 'none';
    if (typeof navigate === 'function') navigate('homePage');
  } catch (e) {
    setError(errEl, e.message);
  }
};

window.submitBooking = async function() {
  const service = document.getElementById('bookingService')?.value;
  const subService = document.getElementById('bookingSubService')?.value;
  const professional = document.getElementById('bookingProfessional')?.value;
  const address = document.getElementById('bookingAddress')?.value;
  const datetime = document.getElementById('bookingDateTime')?.value;
  const notes = document.getElementById('bookingNotes')?.value;
  const errEl = document.getElementById('bookingError');
  const token = getToken();
  if (!token) {
    setError(errEl, 'Please login first.');
    return;
  }
  try {
    const booking = await createBooking(token, { service, subService, professional, address, datetime, notes });
    if (errEl) errEl.style.display = 'none';
    // Fill summary if present
    const sum = document.getElementById('bookingSummary');
    if (sum) {
      sum.textContent = [
        `Service: ${booking.service}`,
        `Task: ${booking.sub_service || ''}`,
        `Professional: ${booking.professional || ''}`,
        `Address: ${booking.address}`,
        `When: ${booking.datetime}`,
        `Notes: ${booking.notes || ''}`,
        `Status: ${booking.status}`
      ].join('\n');
    }
    if (typeof navigate === 'function') navigate('paymentConfirmation');
  } catch (e) {
    setError(errEl, e.message);
  }
};

// Optional: expose a function to fetch services & pros to wire into your UI
window.fetchServicesFromApi = async function() {
  const res = await fetch(`${API_BASE}/api/services`);
  return res.json();
};

window.fetchProfessionalsFromApi = async function(serviceName) {
  const url = new URL(`${API_BASE}/api/professionals`);
  if (serviceName) url.searchParams.set('service', serviceName);
  const res = await fetch(url);
  return res.json();
};
