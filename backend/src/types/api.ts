import type { NextFunction, Request, Response } from 'express'

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>
