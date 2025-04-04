import { Request, Response, NextFunction } from 'express'
import { verify, decode, JwtPayload } from 'jsonwebtoken'
import axios from 'axios'
import jwkToPem from 'jwk-to-pem'
import { getCognitoPublicKeysUrl } from 'utils/aws'
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

export const awsConfig = {
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!
}

export const cognitoClient = new CognitoIdentityProviderClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
  }
})

console.log('✅ AWS Cognito Client Initialized Successfully!')

export interface AuthRequest extends Request {
  user?: { sub: string }
}

let cachedJwks: any[] | null = null
let lastFetchTime = 0
const JWKS_CACHE_TTL = 5 * 60 * 1000 // 5分钟

async function getJwks() {
  const now = Date.now()
  if (!cachedJwks || now - lastFetchTime > JWKS_CACHE_TTL) {
    const url = getCognitoPublicKeysUrl(awsConfig.userPoolId, awsConfig.region)
    const { data } = await axios.get(url)
    cachedJwks = data.keys
    lastFetchTime = now
  }
  return cachedJwks
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  if (!authHeader)
    return res.status(401).json({ message: '❌ Unauthorized: No Token' })

  const token = authHeader.split(' ')[1]
  if (!token)
    return res
      .status(401)
      .json({ message: '❌ Unauthorized: Invalid Token Format' })

  try {
    const decoded: any = decode(token, { complete: true })
    if (!decoded?.header?.kid)
      return res.status(401).json({ message: '❌ Invalid token format' })

    const keys = await getJwks()
    const jwk = keys.find(key => key.kid === decoded.header.kid)
    if (!jwk)
      return res
        .status(401)
        .json({ message: '❌ Invalid token: Key not found' })

    const pem = jwkToPem(jwk)
    const payload = verify(token, pem, { algorithms: ['RS256'] }) as JwtPayload

    if (!payload.sub)
      return res
        .status(401)
        .json({ message: '❌ Invalid token: Missing user ID' })

    res.locals.accountID = payload.sub

    next()
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    return res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}
