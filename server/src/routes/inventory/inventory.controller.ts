import { Request, Response, NextFunction } from 'express'
import { getInventoriesByCartId } from './inventory.service'

export const getInventoriesByCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cartID = res.locals.cartID

    const result = await getInventoriesByCartId(cartID)

    res.status(200).json({
      inventories: result.inventories
    })
  } catch (error) {
    next(error)
  }
}
