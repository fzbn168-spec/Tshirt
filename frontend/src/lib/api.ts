import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001',
  withCredentials: false,
});

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    const headers = config.headers;
    if (
      headers &&
      typeof headers === 'object' &&
      'set' in headers &&
      typeof (headers as { set?: unknown }).set === 'function'
    ) {
      (headers as { set: (name: string, value: string) => void }).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as InternalAxiosRequestConfig['headers'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error as { config: RetriableConfig; response?: { status: number } };
    // Auto logout on 401
    if (response?.status === 401) {
      try {
        useAuthStore.getState().logout();
      } finally {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
    // Simple retry once for network/5xx errors
    const shouldRetry =
      (!response || (response.status >= 500 && response.status < 600)) &&
      !config._retry;
    if (shouldRetry) {
      config._retry = true;
      await new Promise((r) => setTimeout(r, 300));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export default api;
