import { Request, Response, NextFunction } from 'express'

import httpStatus from 'http-status'
import Account from 'routes/accounts/accounts.model'
import AppError from 'utils/appError'

const currentAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accountID = res.locals.accountID

    if (!accountID) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        '❌ Unauthorized: Missing user ID'
      )
    }

    const account = await Account.findOne({ where: { accountID } })

    if (!account) {
      res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: '❌ Unauthorized: Account not found' })
    }

    res.locals.currentAccount = account.dataValues
    next()
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({ error: error.message })
  }
}

export default currentAccount
