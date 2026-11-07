import type { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => { console.error('[error]', error); res.status(error.statusCode || 500).json({ success: false, error: { message: error.message || 'Internal server error' } }) }
