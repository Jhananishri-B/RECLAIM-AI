import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export function requireAllowedOrigin(req: Request, _res: Response, next: NextFunction) {
  const origin = req.header('origin')
  if (origin && origin !== env.frontendOrigin) return next(new HttpError(403, 'Origin is not allowed', 'ORIGIN_NOT_ALLOWED'))
  next()
}
