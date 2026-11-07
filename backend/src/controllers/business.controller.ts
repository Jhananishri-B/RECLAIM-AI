import type { Request, Response } from 'express'

export function ownerCheck(_req: Request, res: Response) { res.json({ success: true, data: { ownerOnly: true } }) }
