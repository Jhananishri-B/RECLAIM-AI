import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'

export function useApiHealth() {
  const [status, setStatus] = useState<'checking' | 'operational' | 'unavailable'>('checking')
  useEffect(() => { getHealth().then(() => setStatus('operational')).catch(() => setStatus('unavailable')) }, [])
  return status
}
