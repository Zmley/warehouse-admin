import { Request, Response, NextFunction } from 'express'
import { verify, decode, JwtPayload } from 'jsonwebtoken'
import axios from 'axios'
import jwkToPem from 'jwk-to-pem'
import { awsConfig, getCognitoPublicKeysUrl } from 'utils/aws'

const getJwks = async () => {
  let cachedJwks
  let lastFetchTime = 0
  const JWKS_CACHE_TTL = 5 * 60 * 1000

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
  req: Request,
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
    const decoded = decode(token, { complete: true })
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

    res.locals.payload = payload

    next()
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    return res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}

export default authenticateToken
