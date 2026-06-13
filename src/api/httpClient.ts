import axios from 'axios';

const ACCESS_TOKEN_KEY = 'merchant_access_token';
const REFRESH_TOKEN_KEY = 'merchant_refresh_token';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/auth/token/refresh`,
            { refresh: refreshToken }
          );

          // Backend uses EnvelopeJSONRenderer, so tokens are in response.data.data
          const tokenData = response.data?.data ?? response.data;
          const { access, refresh } = tokenData;

          if (access) {
            localStorage.setItem(ACCESS_TOKEN_KEY, access);
          }
          if (refresh) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
          }

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return httpClient(originalRequest);
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;

