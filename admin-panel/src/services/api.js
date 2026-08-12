const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const cleanUrl = rawUrl.replace(/\/+$/, '');
export const BACKEND_URL = cleanUrl;
export const API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
