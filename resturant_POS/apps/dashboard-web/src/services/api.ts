import axios from 'axios';

// Use environment variable for flexibility – fallback to relative '/api/v1'
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: automatically attach token & restaurant ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('owner_token');
  const restaurantId = localStorage.getItem('owner_restaurant_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (restaurantId) {
    config.headers['X-Restaurant-ID'] = restaurantId;
  }
  return config;
});

// Response interceptor: handle 401 (unauthorized) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('owner_token');
      localStorage.removeItem('owner_refresh_token');
      localStorage.removeItem('owner_restaurant_id');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);