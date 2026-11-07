import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

export type HealthResponse = { success: boolean; data: { status: string; service: string; timestamp: string } }

export const getHealth = () => apiClient.get<HealthResponse>('/health')
