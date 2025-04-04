import { Router } from 'express'

import healthCheck from 'routes/healthcheck/healthCheck.router'
import accountRoutes from 'routes/accounts/accounts.router'

const router: Router = Router()
router.use(healthCheck)
router.use(accountRoutes)

export default router
