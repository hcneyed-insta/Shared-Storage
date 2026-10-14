import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function errorMiddleware(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(error)
  if (error instanceof ZodError) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Request validation failed.' })
  }
  console.error('[api] request failed', error)
  return res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' })
}
