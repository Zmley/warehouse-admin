import express from 'express'
import { getInventoriesByCart } from './inventory.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'

const router = express.Router()

router.get('/inventoriesInCart', transportWorkerOnly, getInventoriesByCart)

export default router
