import axios from 'axios';

// Axios instance factory — base URL is read at call time from settings
function createAxiosInstance(baseURL, token) {
  const instance = axios.create({
    baseURL: baseURL || '/api',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Response interceptor for unified error handling
  instance.interceptors.response.use(
    (res) => res.data,
    (err) => {
      const message = err.response?.data?.message || err.message || 'Request failed';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
}

// Global reference — updated when settings change
let _baseURL = "https://script.google.com/macros/s/AKfycbx_GerFGuXeCpoN8ulmSGxlLgMciA-w4a1Fpb4Tkr1b4z_oQPi3bR0gSITuV1wpL7NPjg/exec";
let _getToken = () => null;

export function configureAPI(baseURL, getToken) {
  _baseURL = baseURL;
  _getToken = getToken;
}

function api() {
  return createAxiosInstance(_baseURL, _getToken());
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
login: async (username, password) => {
  const res = await axios.post(_baseURL, {
    action: "ownerLogin",
    username,
    password
  });

  if (res.data.status !== "ok") {
    throw new Error(res.data.message || "Login failed");
  }

  return res.data;
},

  logout: (token) =>
    createAxiosInstance(_baseURL, token).post('/auth/logout'),

  updateProfile: (payload, token) =>
    createAxiosInstance(_baseURL, token).patch('/auth/profile', payload),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: (params) => api().get('/dashboard', { params }),
};

// ─── Hospitals ───────────────────────────────────────────────────────────────
export const hospitalsAPI = {
  getAll: (params) => api().get('/hospitals', { params }),
  getOne: (id) => api().get(`/hospitals/${id}`),
  create: (data) => api().post('/hospitals', data),
  update: (id, data) => api().patch(`/hospitals/${id}`, data),
  updateStatus: (id, status) => api().patch(`/hospitals/${id}/status`, { status }),
  delete: (id) => api().delete(`/hospitals/${id}`),
};

// ─── Logs ────────────────────────────────────────────────────────────────────
export const logsAPI = {
  getAll: (params) => api().get('/logs', { params }),
  exportPDF: (params) => api().get('/logs/export/pdf', { params, responseType: 'blob' }),
};

// ─── Settings ────────────────────────────────────────────────────────────────
export const settingsAPI = {
  exportData: () => api().get('/settings/export', { responseType: 'blob' }),
  clearData: () => api().delete('/settings/data'),
};
