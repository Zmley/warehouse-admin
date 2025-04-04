import express from 'express'
import { authenticateToken } from 'middlewares/auth.middleware'
import currentAccount from 'middlewares/currentAccount.middleware'
import { registerUser, loginUser, getUserInfo } from './accounts.controller'

const router = express.Router()
//public
router.post('/register', registerUser)
router.post('/login', loginUser)

router.get('/me', authenticateToken, currentAccount, getUserInfo)

export default router
