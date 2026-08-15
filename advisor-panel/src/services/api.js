export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + '/api';

/**
 * Standardized fetch helper for advisor-panel
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    const isAuthError = !data.success && (
      response.status === 401 ||
      (typeof data.message === 'string' && (
        data.message.includes('Not Authorized') ||
        data.message.includes('Password changed') ||
        data.message.includes('jwt expired') ||
        data.message.includes('invalid token')
      ))
    );

    if (isAuthError) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
};
