import type { Request, Response } from 'express'
import { checkDatabaseHealth } from '../services/database.service.js'

export function getHealth(_req: Request, res: Response) { res.status(200).json({ success: true, data: { status: 'operational', service: 'reclaim-ai-api', timestamp: new Date().toISOString() } }) }

export async function getDatabaseHealth(_req: Request, res: Response) {
  const database = await checkDatabaseHealth()
  const statusCode = database.status === 'operational' ? 200 : 503
  res.status(statusCode).json({ success: database.status === 'operational', data: { service: 'reclaim-ai-database', ...database, timestamp: new Date().toISOString() } })
}
