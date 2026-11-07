import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { HttpError } from '../utils/http-error.js'

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return next(new HttpError(400, 'Invalid request body', 'VALIDATION_ERROR'))
    req.body = result.data
    next()
  }
}
