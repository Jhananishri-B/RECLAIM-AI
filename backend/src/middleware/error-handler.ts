import type { ErrorRequestHandler } from 'express'
import { HttpError } from '../utils/http-error.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } })
  console.error('[error]', error instanceof Error ? error.message : error)
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
}
