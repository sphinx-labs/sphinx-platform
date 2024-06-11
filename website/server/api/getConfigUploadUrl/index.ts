import { COMPILER_CONFIG_VERSION } from '@sphinx-labs/core/dist/networks'
import { NextApiRequest, NextApiResponse } from 'next'

import { authorizeAPIKey } from '@/server/api/graphql/utils'
import { prisma } from '@/server/utils/prisma'
import { fetchAWSS3Client } from '@sphinx-managed/utilities'

const BUCKET_NAME = 'sphinx-compiler-configs'

export const getPresignedUploadURL = async (key: string) => {
  const s3 = await fetchAWSS3Client()
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60,
    ContentType: 'application/json',
  }

  try {
    const presignedURL = await s3.getSignedUrlPromise('putObject', params)
    return presignedURL
  } catch (err) {
    console.error(err)
    throw err
  }
}

const validConfigVersions = [COMPILER_CONFIG_VERSION]

// 👇 Define new request body
export interface RelayApiRequest extends NextApiRequest {
  // let's say our request accepts name and age property
  body: {
    apiKey: string
    orgId: string
    hash: string
    version: string
  }
}

export const handleStore = async (
  orgId: string,
  version: string,
  hash: string
) => {
  const compilerConfig = await prisma.deploymentConfigs.upsert({
    where: {
      hash,
    },
    create: {
      hash,
      orgId,
      version,
    },
    update: {},
  })

  const uploadUrl = await getPresignedUploadURL(compilerConfig.id)

  return { configId: compilerConfig.id, uploadUrl }
}

const handler = async (req: RelayApiRequest, res: NextApiResponse) => {
  const { apiKey, orgId, version, hash } = req.body

  if (version !== undefined && !validConfigVersions.includes(version)) {
    return res
      .status(400)
      .send(
        'Malformed request, deprecated compiler config version. You need to update your @sphinx-labs/plugins package to the latest version'
      )
  }

  try {
    await authorizeAPIKey(apiKey, orgId)
  } catch (e) {
    return res.status(401).send('Unauthorized')
  }

  const url = await handleStore(orgId, version, hash)
  return res.status(200).send(url)
}

export default handler
