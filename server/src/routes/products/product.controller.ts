import { Request, Response, NextFunction } from 'express'
import { getProductCodes } from './product.service'

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productCodes = await getProductCodes()
    res.status(200).json({ productCodes })
  } catch (error) {
    next(error)
  }
}
