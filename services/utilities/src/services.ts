import { Logger } from '@eth-optimism/common-ts'
import { InfisicalClient } from '@infisical/sdk'
import { PrismaClient } from '@prisma/client'
import AWS from 'aws-sdk'
import { fetchInfisicalClient, fetchSecret } from './secrets'

const VERCEL_PATH = '/Vercel'

export const fetchPrismaClient = async () => {
  if (!process.env.POSTGRES_PRISMA_URL) {
    throw new Error('No POSTGRES_PRISMA_URL found')
  }

  return new PrismaClient({
    datasourceUrl: process.env.POSTGRES_PRISMA_URL,
  })
}

export const fetchAWSS3Client = async () => {
  if (process.env.LOCAL_S3 === 'true') {
    console.log('using localstack for S3')
    const s3 = new AWS.S3({
      endpoint: `http://${process.env.LOCALSTACK_URL}:4566`,
      s3ForcePathStyle: true,
      accessKeyId: 'test',
      secretAccessKey: 'test',
      region: 'us-east-1',
    }) as any

    console.log(s3.endpoint.hostname)
    console.log(s3.api.globalEndpoint)

    s3.endpoint.hostname = process.env.LOCALSTACK_URL
    s3.api.globalEndpoint = process.env.LOCALSTACK_URL
    return s3
  } else {
    console.log('using aws for S3')
    const infisicalClient = fetchInfisicalClient()
    const accessKeyId = await fetchSecret(
      infisicalClient,
      'AWS_ACCESS_KEY_ID',
      VERCEL_PATH
    )
    const secretAccessKey = await fetchSecret(
      infisicalClient,
      'AWS_SECRET_ACCESS_KEY',
      VERCEL_PATH
    )
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    })
    return new AWS.S3()
  }
}

export const fetchLogger = async (serviceName: string) => {
  if (process.env.LOCAL_ANVIL === 'true') {
    return new Logger({
      level: 'info',
      name: serviceName,
    })
  }

  const infisicalClient = fetchInfisicalClient()
  const sentryDSN = await fetchSecret(
    infisicalClient,
    'SENTRY_DSN',
    VERCEL_PATH
  )
  const sentryENV = await fetchSecret(
    infisicalClient,
    'SENTRY_ENVIRONMENT',
    VERCEL_PATH
  )

  return new Logger({
    level: 'info',
    sentryOptions: {
      dsn: sentryDSN,
      environment: sentryENV,
    },
    name: serviceName,
  })
}

export const fetchServiceClients = async (
  serviceName: string
): Promise<{
  infisicalClient: InfisicalClient
  prismaClient: PrismaClient
  s3: AWS.S3 | undefined
  logger: Logger
}> => {
  const infisicalClient = fetchInfisicalClient()
  const prismaClient = await fetchPrismaClient()
  const s3 = await fetchAWSS3Client()
  const logger = await fetchLogger(serviceName)

  return {
    infisicalClient,
    prismaClient,
    s3,
    logger,
  }
}
