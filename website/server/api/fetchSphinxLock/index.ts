import { NextApiRequest, NextApiResponse } from 'next'

import { authorizeAPIKey } from '@/server/api/graphql/utils'
import { prisma } from '@/server/utils/prisma'
import { SphinxLock } from '@sphinx-labs/core'

export interface FetchLockApiRequest extends NextApiRequest {
  body: {
    apiKey: string
    orgId: string
    format: string
  }
}

const handler = async (req: FetchLockApiRequest, res: NextApiResponse) => {
  const { apiKey, orgId, format } = req.body

  try {
    await authorizeAPIKey(apiKey, orgId)
  } catch (e) {
    return res.status(401).send('Unauthorized')
  }

  const projects = await prisma.projects.findMany({
    where: {
      orgId,
    },
    include: {
      safeDeploymentStrategy: true,
      projectOwners: true,
    },
  })

  const sphinxLock: SphinxLock = {
    warning: 'THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.',
    format,
    orgId,
    projects: {},
  }
  for (const project of projects) {
    if (!project.safeDeploymentStrategy?.safeName) {
      throw new Error('no safe identifier found, this should never happen')
    }

    if (!project.safeDeploymentStrategy?.threshold) {
      throw new Error('no threshold found, this should never happen')
    }

    if (!project.safeDeploymentStrategy?.salt) {
      throw new Error('no salt found, this should never happen')
    }

    sphinxLock.projects[project.name] = {
      projectId: project.id,
      projectName: project.name,
      defaultSafe: {
        safeName: project.safeDeploymentStrategy.safeName,
        owners: project.projectOwners.map((owner) => owner.ownerAddress),
        threshold: project.safeDeploymentStrategy.threshold.toString(),
        saltNonce: project.safeDeploymentStrategy.salt,
      },
    }
  }

  return res.status(200).send(sphinxLock)
}

export default handler