import { Request, Response } from 'express'
import httpContext from 'express-http-context'

import {
  InitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { getAccountById, getCognitoErrorMessage } from './accounts.service'
import Account from './accounts.model'
import env from 'config/config'

export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!
})

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: env.cognitoClientId,
      AuthParameters: { USERNAME: email, PASSWORD: password }
    }

    const command = new InitiateAuthCommand(params)
    const authResponse = await cognitoClient.send(command)

    res.json({
      accessToken: authResponse.AuthenticationResult?.AccessToken,
      idToken: authResponse.AuthenticationResult?.IdToken,
      refreshToken: authResponse.AuthenticationResult?.RefreshToken
    })
  } catch (error: any) {
    res.status(401).json({ message: getCognitoErrorMessage(error) })
  }
}

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const client = new CognitoIdentityProviderClient({ region: 'us-east-2' })

  const command = new SignUpCommand({
    ClientId: env.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      }
    ]
  })

  const { UserSub: accountID } = await client.send(command)

  await client.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: env.cognitoUserPoolId,
      Username: email
    })
  )
  await Account.create({
    accountID: accountID as string,
    email,
    role: 'ADMIN',
    firstName: 'TBD',
    lastName: 'TBD',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log('✅ User information saved to database:', {
    accountID,
    email
  })
  res.json({ message: '✅ User registered successfully', accountID, email })
}

export const getUserInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const account = res.locals.currentAccount

    res.json(account)
  } catch (error) {
    console.error('❌ Error fetching user info:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}
