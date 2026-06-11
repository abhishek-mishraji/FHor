const environment = {
  // apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  apiVersion: '/api/v1',
  requestTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 20000),
  defaultPageSize: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10),
  debounceMs: Number(import.meta.env.VITE_DEBOUNCE_MS || 300),
  toastDuration: Number(import.meta.env.VITE_TOAST_DURATION || 5000),
}

export default environment
