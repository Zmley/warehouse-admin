import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const { role } = res.locals

  if (role !== 'ADMIN') {
    return next(new AppError(403, '❌ Only admin can use this feature!'))
  }

  next()
}

export default adminOnly
