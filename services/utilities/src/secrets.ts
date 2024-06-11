import { InfisicalClient } from '@infisical/sdk'
import * as dotenv from 'dotenv'
dotenv.config()

export const fetchInfisicalClient = () => {
  if (!process.env.INFISICAL_ENVIRONMENT) {
    throw new Error('INFISICAL_ENVIRONMENT not defined')
  }

  if (!process.env.INFISICAL_CLIENT_ID) {
    throw new Error('INFISICAL_CLIENT_ID not defined')
  }

  if (!process.env.INFISICAL_CLIENT_SECRET) {
    throw new Error('INFISICAL_CLIENT_SECRET not defined')
  }

  return new InfisicalClient({
    clientId: process.env.INFISICAL_CLIENT_ID,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET,
  })
}

export const fetchSecret = async (
  client: InfisicalClient,
  secretName: string,
  path: string
): Promise<string> => {
  const secret = await client.getSecret({
    environment: process.env.INFISICAL_ENVIRONMENT!,
    projectId: process.env.INFISICAL_PROJECT_ID!,
    secretName,
    path,
  })

  if (!secret) {
    throw new Error(
      `Failed to fetch secret with name ${secretName} from Infisical`
    )
  }

  return secret.secretValue
}
