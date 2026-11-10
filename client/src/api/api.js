// Centralized API client for Sweety
// Handles attaching JWT auth headers and error handling

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('sweety_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Attach error message returned from backend or fallback
    const error = new Error(data.error || 'An unexpected error occurred.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Convenience helpers
export const authApi = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const readingsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/readings${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/readings/${id}`),
  create: (data) => api.post('/readings', data),
  update: (id, data) => api.put(`/readings/${id}`, data),
  delete: (id) => api.delete(`/readings/${id}`),
};

export const reportsApi = {
  getDaily: (date) =>
    api.get(`/reports/daily${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  getMonthToDate: (date) =>
    api.get(
      `/reports/month-to-date${date ? `?date=${encodeURIComponent(date)}` : ''}`
    ),
  getMonthly: (date) =>
    api.get(
      `/reports/monthly${date ? `?date=${encodeURIComponent(date)}` : ''}`
    ),
};
