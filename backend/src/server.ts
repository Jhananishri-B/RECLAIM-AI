import { app } from './app.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './services/database.service.js'

const server = app.listen(env.port, () => console.log(`RECLAIM AI API listening on http://localhost:${env.port}`))

connectDatabase().then(() => console.log('Database connection established')).catch((error) => console.error('[database] connection failed', error instanceof Error ? error.message : error))

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`)
  server.close(async () => { await disconnectDatabase(); process.exit(0) })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
