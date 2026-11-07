import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null
export const setAccessToken = (token: string | null) => { accessToken = token }
export const getAccessToken = () => accessToken

apiClient.interceptors.request.use(config => { if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`; return config })
apiClient.interceptors.response.use(response => response, async error => {
  const config = error.config
  const requestUrl = String(config?.url || '')
  if (error.response?.status !== 401 || config?._retry || /\/auth\/(login|register|refresh|logout)/.test(requestUrl)) return Promise.reject(error)
  config._retry = true
  refreshPromise ??= axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true }).then(response => { const token = response.data.data.accessToken as string; setAccessToken(token); return token }).catch(() => { setAccessToken(null); return null }).finally(() => { refreshPromise = null })
  const token = await refreshPromise
  if (!token) return Promise.reject(error)
  config.headers.Authorization = `Bearer ${token}`
  return apiClient(config)
})

export type HealthResponse = { success: boolean; data: { status: string; service: string; timestamp: string } }

export const getHealth = () => apiClient.get<HealthResponse>('/health')
