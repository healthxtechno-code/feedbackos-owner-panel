/**
 * FeedbackOS v2 — Google Apps Script Backend
 * Deployed as a Web App (Execute as: Me, Who has access: Anyone)
 * Acts as a REST-like API layer over Google Sheets as the database
 *
 * SHEET NAMES:
 *   Hospitals   — hospital records
 *   Admins      — admin credentials (hashed)
 *   Owners      — owner credentials (hashed)
 *   Logs        — activity log entries
 *   Sessions    — active JWT-like tokens
 */

// ── CONFIG ───────────────────────────────────────────────────────────────────
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const JWT_SECRET     = PropertiesService.getScriptProperties().getProperty('JWT_SECRET');
const TOKEN_TTL_MS   = 8 * 60 * 60 * 1000; // 8 hours

// ── CORS HEADERS ─────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...data, _ts: Date.now() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: message, code: code || 400 }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ENTRY POINTS ─────────────────────────────────────────────────────────────
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  try {
    const path   = (e.parameter.path || '').replace(/^\/+/, '');
    const token  = getTokenFromParams(e);
    const params = e.parameter;

    if (path === 'health') return jsonResponse({ status: 'ok' });

    const user = verifyToken(token);
    if (!user) return errorResponse('Unauthorized', 401);

    if (path === 'dashboard')    return handleDashboard(params);
    if (path === 'hospitals')    return handleGetHospitals(params);
    if (path.startsWith('hospitals/')) {
      const id = path.split('/')[1];
      if (path.endsWith('/status')) return handleGetHospitalStatus(id);
      return handleGetHospital(id);
    }
    if (path === 'logs')         return handleGetLogs(params);
    if (path === 'logs/export/pdf') return handleExportLogsPDF(params);
    if (path === 'settings/export') return handleExportData();

    return errorResponse('Not found', 404);
  } catch (err) {
    return errorResponse('Internal error: ' + err.message, 500);
  }
}

function doPost(e) {
  try {
    const path = (e.parameter.path || '').replace(/^\/+/, '');
    let body = {};
    try { body = JSON.parse(e.postData.contents); } catch (_) {}

    if (path === 'auth/login')  return handleLogin(body);
    if (path === 'auth/logout') return handleLogout(getTokenFromParams(e));

    const user = verifyToken(getTokenFromParams(e));
    if (!user) return errorResponse('Unauthorized', 401);

    if (path === 'hospitals') return handleCreateHospital(body, user);

    return errorResponse('Not found', 404);
  } catch (err) {
    return errorResponse('Internal error: ' + err.message, 500);
  }
}

function doPatch(e) {
  try {
    const path = (e.parameter.path || '').replace(/^\/+/, '');
    let body = {};
    try { body = JSON.parse(e.postData.contents); } catch (_) {}

    const user = verifyToken(getTokenFromParams(e));
    if (!user) return errorResponse('Unauthorized', 401);

    if (path === 'auth/profile') return handleUpdateProfile(body, user);

    if (path.startsWith('hospitals/')) {
      const parts = path.split('/');
      const id = parts[1];
      if (parts[2] === 'status') return handleUpdateHospitalStatus(id, body.status, user);
      return handleUpdateHospital(id, body, user);
    }

    return errorResponse('Not found', 404);
  } catch (err) {
    return errorResponse('Internal error: ' + err.message, 500);
  }
}

function doDelete(e) {
  try {
    const path = (e.parameter.path || '').replace(/^\/+/, '');
    const user = verifyToken(getTokenFromParams(e));
    if (!user) return errorResponse('Unauthorized', 401);

    if (path.startsWith('hospitals/')) {
      const id = path.split('/')[1];
      return handleDeleteHospital(id, user);
    }
    if (path === 'settings/data') return handleClearData(user);

    return errorResponse('Not found', 404);
  } catch (err) {
    return errorResponse('Internal error: ' + err.message, 500);
  }
}

// ── TOKEN HELPERS ─────────────────────────────────────────────────────────────
function getTokenFromParams(e) {
  const auth = (e.parameter.Authorization || e.parameter.authorization || '');
  return auth.replace(/^Bearer\s+/i, '') || e.parameter.token || '';
}

function generateToken(payload) {
  const header  = Utilities.base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp     = Date.now() + TOKEN_TTL_MS;
  const pl      = Utilities.base64Encode(JSON.stringify({ ...payload, exp }));
  const sig     = Utilities.base64Encode(
    Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, header + '.' + pl, JWT_SECRET)
  );
  return `${header}.${pl}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const parts  = token.split('.');
    if (parts.length !== 3) return null;
    const sig    = Utilities.base64Encode(
      Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, parts[0] + '.' + parts[1], JWT_SECRET)
    );
    if (sig !== parts[2]) return null;
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[1])).getDataAsString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

// ── HASHING ───────────────────────────────────────────────────────────────────
function hashPassword(password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + JWT_SECRET);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// ── SHEET HELPERS ─────────────────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function sheetData(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheet, headers, data) {
  // Ensure headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  sheet.appendRow(row);
}

function updateRowById(sheet, id, updates) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(id)) {
      headers.forEach((h, j) => {
        if (updates[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(updates[h]);
        }
      });
      return true;
    }
  }
  return false;
}

function deleteRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function generateId() {
  return 'H' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ── AUTH HANDLERS ─────────────────────────────────────────────────────────────
function handleLogin(body) {
  const { username, password } = body;
  if (!username || !password) return errorResponse('Missing credentials', 400);

  const sheet = getSheet('Owners');
  const owners = sheetData(sheet);
  const hashed = hashPassword(password);

  // Check current and previous password (requirement: authenticate with latest and second-last)
  const owner = owners.find(o =>
    o.username === username && (o.passwordHash === hashed || o.prevPasswordHash === hashed)
  );

  if (!owner) return errorResponse('Authentication failed', 401);

  const token = generateToken({ username: owner.username, role: 'owner' });
  addLog('owner_login', '', username, {});

  return jsonResponse({ token, username: owner.username });
}

function handleLogout(token) {
  // Token is stateless (HMAC-signed); client simply discards it
  return jsonResponse({ success: true });
}

function handleUpdateProfile(body, user) {
  const { username, password } = body;
  const sheet = getSheet('Owners');
  const owners = sheetData(sheet);
  const owner = owners.find(o => o.username === user.username);
  if (!owner) return errorResponse('Owner not found', 404);

  const updates = {};
  if (username) updates.username = username;
  if (password) {
    updates.prevPasswordHash = owner.passwordHash || '';
    updates.passwordHash = hashPassword(password);
  }
  updateRowById(sheet, owner.id, updates);

  addLog('profile_updated', '', user.username, {});
  return jsonResponse({ success: true, username: username || user.username });
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function handleDashboard(params) {
  const hospitals = sheetData(getSheet('Hospitals'));
  const logs = sheetData(getSheet('Logs'));
  const { timeRange, hospitalId } = params;

  const cutoff = getCutoff(timeRange);
  const filteredLogs = logs.filter(l => {
    const ts = new Date(l.timestamp).getTime();
    const matchTime = !cutoff || ts >= cutoff;
    const matchHospital = !hospitalId || hospitalId === 'all' || l.hospitalId === hospitalId;
    return matchTime && matchHospital;
  });

  const filteredHospitals = hospitalId && hospitalId !== 'all'
    ? hospitals.filter(h => h.id === hospitalId)
    : hospitals;

  return jsonResponse({
    totalHospitals:  filteredHospitals.length,
    activeHospitals: filteredHospitals.filter(h => h.status === 'active').length,
    totalUsers:      filteredHospitals.reduce((s, h) => s + (Number(h.userCount) || 0), 0),
    linksGenerated:  filteredLogs.filter(l => l.eventType === 'link_generated').length,
    googleReviews:   filteredLogs.filter(l => l.eventType === 'review_submitted').length,
  });
}

function getCutoff(range) {
  const now = Date.now();
  const map = { '24h': 86400000, '7d': 604800000, '1m': 2592000000, '3m': 7776000000, '6m': 15552000000, '1y': 31536000000 };
  return map[range] ? now - map[range] : null;
}

// ── HOSPITALS ─────────────────────────────────────────────────────────────────
const HOSPITAL_HEADERS = ['id','name','logoUrl','hospitalImageUrl','themeColor','googleReviewLink','notes','status','adminUsername','createdAt','updatedAt'];

function handleGetHospitals(params) {
  const hospitals = sheetData(getSheet('Hospitals'));
  return jsonResponse({ hospitals, total: hospitals.length });
}

function handleGetHospital(id) {
  const hospitals = sheetData(getSheet('Hospitals'));
  const h = hospitals.find(h => h.id === id);
  if (!h) return errorResponse('Hospital not found', 404);
  return jsonResponse(h);
}

function handleCreateHospital(body, user) {
  const { name, logoUrl, hospitalImageUrl, themeColor, googleReviewLink, notes, adminUsername, adminPassword } = body;
  if (!name) return errorResponse('Hospital name required', 400);
  if (!googleReviewLink) return errorResponse('Google review link required', 400);
  if (!adminUsername || !adminPassword) return errorResponse('Admin credentials required', 400);

  const id = generateId();
  const now = new Date().toISOString();

  // Save hospital
  const hospitalSheet = getSheet('Hospitals');
  if (hospitalSheet.getLastRow() === 0) hospitalSheet.appendRow(HOSPITAL_HEADERS);
  hospitalSheet.appendRow(HOSPITAL_HEADERS.map(h => ({
    id, name, logoUrl: logoUrl || '', hospitalImageUrl: hospitalImageUrl || '',
    themeColor: themeColor || '#3b82f6', googleReviewLink, notes: notes || '',
    status: 'active', adminUsername, createdAt: now, updatedAt: now,
  }[h])));

  // Save admin credentials (hashed)
  const adminSheet = getSheet('Admins');
  const ADMIN_HEADERS = ['id','hospitalId','username','passwordHash','createdAt'];
  if (adminSheet.getLastRow() === 0) adminSheet.appendRow(ADMIN_HEADERS);
  adminSheet.appendRow([id + '_admin', id, adminUsername, hashPassword(adminPassword), now]);

  addLog('hospital_created', id, user.username, { name });

  const adminUrl = ScriptApp.getService().getUrl() + '?path=admin/' + id;
  return jsonResponse({ hospitalId: id, adminUrl });
}

function handleUpdateHospital(id, body, user) {
  const allowed = ['name','logoUrl','hospitalImageUrl','themeColor','googleReviewLink','notes'];
  const updates = { updatedAt: new Date().toISOString() };
  allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
  const ok = updateRowById(getSheet('Hospitals'), id, updates);
  if (!ok) return errorResponse('Hospital not found', 404);
  addLog('hospital_updated', id, user.username, updates);
  return jsonResponse({ success: true });
}

function handleUpdateHospitalStatus(id, status, user) {
  if (!['active','inactive'].includes(status)) return errorResponse('Invalid status', 400);
  const ok = updateRowById(getSheet('Hospitals'), id, { status, updatedAt: new Date().toISOString() });
  if (!ok) return errorResponse('Hospital not found', 404);
  addLog('status_changed', id, user.username, { status });
  return jsonResponse({ success: true, status });
}

function handleGetHospitalStatus(id) {
  const hospitals = sheetData(getSheet('Hospitals'));
  const h = hospitals.find(h => h.id === id);
  if (!h) return errorResponse('Not found', 404);
  return jsonResponse({ status: h.status });
}

function handleDeleteHospital(id, user) {
  const ok = deleteRowById(getSheet('Hospitals'), id);
  if (!ok) return errorResponse('Hospital not found', 404);
  // Also clean up admins
  deleteRowById(getSheet('Admins'), id + '_admin');
  addLog('hospital_deleted', id, user.username, {});
  return jsonResponse({ success: true });
}

// ── LOGS ──────────────────────────────────────────────────────────────────────
function handleGetLogs(params) {
  let logs = sheetData(getSheet('Logs'));
  const { hospitalId, eventType, dateFrom, dateTo } = params;

  if (hospitalId && hospitalId !== 'all') logs = logs.filter(l => l.hospitalId === hospitalId);
  if (eventType && eventType !== 'all')   logs = logs.filter(l => l.eventType === eventType);
  if (dateFrom) logs = logs.filter(l => new Date(l.timestamp) >= new Date(dateFrom));
  if (dateTo)   logs = logs.filter(l => new Date(l.timestamp) <= new Date(dateTo + 'T23:59:59'));

  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return jsonResponse({ logs, total: logs.length });
}

function handleExportLogsPDF(params) {
  // Return logs as JSON — client-side PDF generation recommended
  return handleGetLogs(params);
}

function addLog(eventType, hospitalId, actor, metadata) {
  const sheet = getSheet('Logs');
  const HEADERS = ['id','eventType','hospitalId','actor','metadata','timestamp'];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  sheet.appendRow([
    Utilities.getUuid(), eventType, hospitalId || '', actor || '',
    JSON.stringify(metadata || {}), new Date().toISOString()
  ]);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function handleExportData() {
  const hospitals = sheetData(getSheet('Hospitals'));
  const logs = sheetData(getSheet('Logs'));
  return jsonResponse({ hospitals, logs, exportedAt: new Date().toISOString() });
}

function handleClearData(user) {
  ['Hospitals','Admins','Logs'].forEach(name => {
    const sheet = getSheet(name);
    const lr = sheet.getLastRow();
    if (lr > 1) sheet.deleteRows(2, lr - 1);
  });
  addLog('data_cleared', '', user.username, {});
  return jsonResponse({ success: true });
}

// ── INITIAL SETUP (run once manually) ─────────────────────────────────────────
function setupOwner() {
  // Run this function ONCE from the Apps Script editor to create the initial owner
  // Replace the values below before running:
  const OWNER_USERNAME = 'YOUR_USERNAME_HERE';
  const OWNER_PASSWORD = 'YOUR_SECURE_PASSWORD_HERE';

  const sheet = getSheet('Owners');
  const HEADERS = ['id','username','passwordHash','prevPasswordHash','createdAt'];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  const exists = sheetData(sheet).some(o => o.username === OWNER_USERNAME);
  if (!exists) {
    sheet.appendRow(['owner_1', OWNER_USERNAME, hashPassword(OWNER_PASSWORD), '', new Date().toISOString()]);
    Logger.log('Owner created: ' + OWNER_USERNAME);
  } else {
    Logger.log('Owner already exists.');
  }
}

function setupProperties() {
  // Run once: sets required script properties
  // Replace these values before running
  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
    JWT_SECRET: 'REPLACE_WITH_LONG_RANDOM_SECRET_STRING',
  });
  Logger.log('Properties set successfully');
}
