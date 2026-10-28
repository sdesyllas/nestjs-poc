const TOKEN_KEY = 'accessToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // The backend's exception filter always returns { statusCode, message, path, timestamp }.
    const message = Array.isArray(data?.message) ? data.message.join(' · ') : data?.message;
    const error = new Error(message ?? res.statusText);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  listTasks: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    return request(`/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (task) => request('/tasks', { method: 'POST', body: task }),
  updateTask: (id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: changes }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
