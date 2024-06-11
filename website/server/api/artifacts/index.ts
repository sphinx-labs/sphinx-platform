import { MultichainDeploymentStatus } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

import { authorizeAPIKey } from '@/server/api/graphql/utils'
import { prisma } from '@/server/utils/prisma'
import { fetchAWSS3Client } from '@sphinx-managed/utilities'
import { S3 } from 'aws-sdk'

const BUCKET_NAME = 'sphinx-artifacts'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: '25mb',
  },
  maxDuration: 60,
}

export interface RelayApiRequest extends NextApiRequest {
  body: {
    apiKey: string
    orgId: string
    projectName: string
    viaPresignedUrl?: boolean
  }
}

const fetchArtifact = async (
  id: string,
  s3: S3
): Promise<string | undefined> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: id,
  }

  const data = await s3.getObject(params).promise()
  return data.Body!.toString()
}

const generatePresignedUrl = (key: string, s3: S3, expires = 60) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expires, // default expiration time in seconds
  }

  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        reject(err)
      } else {
        resolve(url)
      }
    })
  })
}

const handler = async (req: RelayApiRequest, res: NextApiResponse) => {
  if (!req.body.projectName || typeof req.body.projectName !== 'string') {
    return res
      .status(400)
      .send(
        'Malformed request, you may need to update your @sphinx-labs/plugins package to the latest version'
      )
  }

  const { projectName, apiKey, orgId, viaPresignedUrl } = req.body

  try {
    await authorizeAPIKey(apiKey, orgId)
  } catch (e) {
    return res.status(401).send('Unauthorized')
  }

  const deploymentArtifact = await prisma.deploymentArtifacts.findFirst({
    where: {
      multiChainDeployments: {
        orgId,
        status: MultichainDeploymentStatus.completed,
      },
      project: {
        name: projectName,
      },
    },
    orderBy: {
      created: 'desc',
    },
  })

  const s3 = await fetchAWSS3Client()

  if (!deploymentArtifact) {
    return res.status(404).send('No artifacts found for this project')
  } else {
    if (viaPresignedUrl) {
      const url = await generatePresignedUrl(deploymentArtifact.id, s3)
      return res.status(200).send(url)
    } else {
      const artifact = await fetchArtifact(deploymentArtifact.id, s3)
      return res.status(200).send(artifact)
    }
  }
}

export default handler
