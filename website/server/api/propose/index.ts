import {
  Blockexplorer,
  ExplorerVerificationStatus,
  MultichainDeploymentStatus,
  ProjectDeploymentStatus,
  ProjectVerificationStatus,
  TreeStatus,
} from '@prisma/client'
import { ProposalRequest } from '@sphinx-labs/core'
import cuid from 'cuid'
import { NextApiRequest, NextApiResponse } from 'next'

import { authorizeAPIKey } from '@/server/api/graphql/utils'
import { prisma as prismaClient } from '@/server/utils/prisma'

type ProposalRequestBody = ProposalRequest & {
  deploymentName?: string
}

// 👇 Define new request body
export interface ProposeApiRequest extends NextApiRequest {
  // let's say our request accepts name and age property
  body: ProposalRequestBody
}

export const validateInput = (
  body: ProposalRequestBody
): string | undefined => {
  const {
    apiKey,
    compilerConfigId,
    orgId,
    isTestnet,
    chainIds,
    projectDeployments,
    tree,
  } = body

  // O______________o
  if (!Array.isArray(projectDeployments)) {
    return 'projectDeployments must be an object array'
  } else if (typeof compilerConfigId !== 'string') {
    return 'compilerConfigId must be a string'
  } else if (
    projectDeployments.filter((el) => typeof el !== 'object').length !== 0
  ) {
    return 'projectDeployments must be an object array'
  } else if (
    projectDeployments.filter((el) => typeof el.chainId !== 'number').length !==
    0
  ) {
    return 'projectDeployments.chainId must be a number'
  } else if (
    projectDeployments.filter((el) => typeof el.name !== 'string').length !== 0
  ) {
    return 'projectDeployments.name must be a number'
  } else if (
    projectDeployments.filter((el) => typeof el.deploymentId !== 'string')
      .length !== 0
  ) {
    return 'projectDeployments.deploymentId must be a number'
  } else if (!Array.isArray(chainIds)) {
    return 'networks must be a number array'
  } else if (chainIds.length === 0) {
    return 'must define at least one network'
  } else if (chainIds.filter((e) => typeof e !== 'number').length !== 0) {
    return 'networks must be a number array'
  } else if (typeof apiKey !== 'string') {
    return 'apikey must be a string'
  } else if (typeof orgId !== 'string') {
    return 'orgId be an string'
  } else if (typeof tree !== 'object') {
    return 'orgTree must be an object'
  } else if (typeof tree.root !== 'string') {
    return 'orgTree.root must be a string'
  } else if (!Array.isArray(tree.chainStatus)) {
    return 'orgTree.chainStatus must be an object array'
  } else if (tree.chainStatus.length === 0) {
    return 'orgTree.chainStatus must have at least one element'
  } else if (
    tree.chainStatus.filter((e) => typeof e.chainId !== 'number').length !== 0
  ) {
    return 'orgTree.chainStatus.chainId must be a number'
  } else if (
    tree.chainStatus.filter((e) => typeof e.numLeaves !== 'number').length !== 0
  ) {
    return 'orgTree.chainStatus.numLeaves must be a number'
  } else if (typeof isTestnet !== 'boolean') {
    return 'isTestnet must be a boolean'
  }

  const deprecatedChainIds = [5, 420, 421613, 84531]
  for (const deprecatedChainId of deprecatedChainIds) {
    if (chainIds.includes(deprecatedChainId)) {
      return `Chain ID: ${deprecatedChainId} is deprecated, we no longer support this network.`
    }
  }

  return undefined
}

const respondWithMessage = (
  message: string,
  status: number,
  res?: NextApiResponse
) => {
  res?.status(status).send(message)
  return message
}

export const assertNoProjectWithSameSafeAndDifferentName = async ({
  safeAddress,
  uniqueProjectIdentifier,
  res,
}: {
  safeAddress: string
  uniqueProjectIdentifier: string
  res?: NextApiResponse
}) => {
  // Find any deployment strategy with this safe address and a different name
  const sameAddressDifferentName =
    await prismaClient.safeDeploymentStrategy.findFirst({
      where: {
        address: safeAddress,
        project: {
          name: {
            not: uniqueProjectIdentifier,
          },
        },
      },
      include: {
        project: {
          include: {
            projectOwners: true,
          },
        },
      },
    })

  // If there is any project with the same safe address but a different project name, then throw an error
  if (sameAddressDifferentName) {
    const message = `Detected another project with the same owners, salt, and threshold but a different name. We currently do not support changing the name of an existing project. Please update your script to use the correct name: ${sameAddressDifferentName.project.name}`
    return respondWithMessage(message, 400, res)
  } else {
    return false
  }
}

export const assertNoProjectWithSameNameAndDifferentSafe = async ({
  orgId,
  safeAddress,
  uniqueProjectIdentifier,
  res,
}: {
  orgId: string
  safeAddress: string
  uniqueProjectIdentifier: string
  res?: NextApiResponse
}) => {
  // Find any project with this name for this org and a different safeAddress
  const sameNameDifferentAddress = await prismaClient.projects.findUnique({
    where: {
      name_orgId: {
        orgId,
        name: uniqueProjectIdentifier,
      },
      safeDeploymentStrategy: {
        address: {
          not: safeAddress,
        },
      },
    },
    include: {
      projectOwners: true,
    },
  })

  // If there is any project with the same name but a different deployment strategy, then throw an error
  if (sameNameDifferentAddress) {
    const message = `Detected another project with the name ${uniqueProjectIdentifier} and different owners, threshold, or salt. We currently don't support changing the owners, threshold, or salt of an existing project. Please change them back to their original values:\nOwners: [${sameNameDifferentAddress.projectOwners
      .map((owner) => owner.ownerAddress)
      .join(', ')}]\nThreshold: ${sameNameDifferentAddress.threshold}\nSalt: ${
      sameNameDifferentAddress.salt
    }`
    return respondWithMessage(message, 400, res)
  } else {
    return false
  }
}

export const assertProjectOwnedByThisOrg = async ({
  orgId,
  safeAddress,
  res,
}: {
  orgId: string
  safeAddress: string
  res?: NextApiResponse
}) => {
  // Check if there is a preexisting project that is owned by a different account
  const safeStrategies = await prismaClient.safeDeploymentStrategy.findMany({
    where: {
      address: safeAddress,
    },
    include: {
      project: true,
    },
  })

  const unownedProjects = safeStrategies.filter(
    (safe) => safe.project.orgId !== orgId
  )

  // If there is a preexisting project that is owned by a different account then throw an error
  if (unownedProjects.length > 0) {
    const message =
      'Project with same owner(s) and salt is already registered to a different organization'
    return respondWithMessage(message, 400, res)
  } else {
    return false
  }
}

export const assertProjectNotCurrentlyExecuting = async ({
  orgId,
  isTestnet,
  projectId,
  tree,
  res,
}: {
  orgId: string
  isTestnet: boolean
  projectId: string
  tree: ProposeApiRequest['body']['tree']
  res?: NextApiResponse
}) => {
  // If there was a prior deployment that is currently executing then throw an error
  const currentlyExecutingDeployment =
    await prismaClient.multiChainDeployments.findFirst({
      where: {
        orgId,
        projectId,
        status: {
          notIn: [
            MultichainDeploymentStatus.proposed,
            MultichainDeploymentStatus.completed,
            MultichainDeploymentStatus.cancelled,
          ],
        },
        isTestnet,
        treeRoot: {
          not: tree.root,
        },
      },
    })

  if (currentlyExecutingDeployment) {
    const message =
      'Deployment for this project is currently executing, please wait for it to complete before proposing a new deployment'
    return respondWithMessage(message, 400, res)
  } else {
    return false
  }
}

export const cancelPendingDeployment = async ({
  orgId,
  projectId,
  isTestnet,
  tree,
}: {
  orgId: string
  projectId: string
  isTestnet: boolean
  tree: ProposeApiRequest['body']['tree']
}) => {
  // Find any prior deployments for this project that are proposed and have a different tree root
  const incompletePriorDeployment =
    await prismaClient.multiChainDeployments.findFirst({
      where: {
        orgId,
        projectId,
        status: MultichainDeploymentStatus.proposed,
        isTestnet,
        treeRoot: {
          not: tree.root,
        },
      },
    })

  // Mark any prior deployment as cancelled
  if (incompletePriorDeployment) {
    await prismaClient.multiChainDeployments.update({
      where: {
        id: incompletePriorDeployment.id,
      },
      data: {
        status: MultichainDeploymentStatus.cancelled,
        projectDeployments: {
          updateMany: {
            where: {},
            data: {
              status: ProjectDeploymentStatus.cancelled,
            },
          },
        },
      },
    })
  }
}

export const resurrectOutdatedDeployment = async ({
  orgId,
  projectId,
  isTestnet,
  tree,
  compilerConfigId,
  chainIds,
  res,
  sphinxPluginVersion,
}: {
  orgId: string
  projectId: string
  isTestnet: boolean
  tree: ProposeApiRequest['body']['tree']
  compilerConfigId: string | undefined
  chainIds: Array<number>
  res?: NextApiResponse
  sphinxPluginVersion: string | undefined
}) => {
  // Find if there was a prior deployment that was proposed with the same tree root
  const duplicateDeployment =
    await prismaClient.multiChainDeployments.findUnique({
      where: {
        treeRoot: tree.root,
        orgId,
        isTestnet,
      },
      include: {
        project: {
          include: {
            projectNetworks: true,
          },
        },
      },
    })

  if (duplicateDeployment) {
    // Find any deployments that were deployed after this one and throw an error
    const deploymentAfterDuplicate =
      await prismaClient.multiChainDeployments.findFirst({
        where: {
          orgId,
          projectId,
          status: MultichainDeploymentStatus.proposed,
          isTestnet,
          modified: {
            gt: duplicateDeployment.modified,
          },
        },
      })
    if (deploymentAfterDuplicate) {
      return respondWithMessage(
        'Attempted to propose outdated deployment',
        400,
        res
      )
    }

    // If the duplicate deployment was cancelled then resurrect it
    if (duplicateDeployment?.status === 'cancelled') {
      await prismaClient.$transaction(
        async (prisma) => {
          // update the deployment
          await prisma.multiChainDeployments.update({
            where: {
              id: duplicateDeployment.id,
            },
            data: {
              status: MultichainDeploymentStatus.proposed,
              projectDeployments: {
                updateMany: {
                  where: {},
                  data: {
                    status: ProjectDeploymentStatus.approved,
                    deploymentConfigId: compilerConfigId,
                  },
                },
              },
            },
          })
        },
        {
          maxWait: 5000, // default: 2000
          timeout: 90000, // default: 5000
        }
      )
      return respondWithMessage('success', 200, res)
    } else {
      return respondWithMessage('Already Proposed', 200, res)
    }
  }
}

export const writeProposalToDB = async (
  body: ProposalRequestBody,
  res?: NextApiResponse
) => {
  const {
    compilerConfigId,
    orgId,
    isTestnet,
    chainIds,
    projectName,
    projectDeployments,
    tree,
    safeAddress,
    moduleAddress,
    sphinxPluginVersion,

    // deprecated
    deploymentName,
  } = body

  if ((body as any).managerVersion !== undefined) {
    const message = `You are using the pre-audit version of the Sphinx plugin, please upgrade to the latest version using your preferred package manager to continue.`
    return res ? res.status(400).send(message) : message
  }

  // Resolve the project name (we fallback to `deploymentName` if `projectName` is not defined for backwards compatibility)
  const uniqueProjectIdentifier = projectName ? projectName : deploymentName
  if (!uniqueProjectIdentifier) {
    const message = `No project name supplied, this should never happen.`
    return res ? res.status(400).send(message) : message
  }

  const project = await prismaClient.projects.findUnique({
    where: {
      name_orgId: {
        name: uniqueProjectIdentifier,
        orgId,
      },
    },
    include: {
      projectOwners: true,
    },
  })
  if (!project) {
    const message = `Failed to find project with name: ${uniqueProjectIdentifier}`
    res?.status(400).send(message)
    return message
  }

  const projectId = project.id

  const assert1 = await assertNoProjectWithSameSafeAndDifferentName({
    safeAddress,
    uniqueProjectIdentifier,
    res,
  })
  if (assert1) {
    return assert1
  }

  const assert2 = await assertNoProjectWithSameNameAndDifferentSafe({
    orgId,
    safeAddress,
    uniqueProjectIdentifier,
    res,
  })
  if (assert2) {
    return assert2
  }

  const assert3 = await assertProjectOwnedByThisOrg({ orgId, safeAddress, res })
  if (assert3) {
    return assert3
  }

  const assert4 = await assertProjectNotCurrentlyExecuting({
    orgId,
    projectId,
    isTestnet,
    tree,
    res,
  })
  if (assert4) {
    return assert4
  }

  await cancelPendingDeployment({
    orgId,
    projectId,
    isTestnet,
    tree,
  })

  const assert5 = await resurrectOutdatedDeployment({
    orgId,
    projectId,
    isTestnet,
    tree,
    compilerConfigId,
    chainIds,
    res,
    sphinxPluginVersion,
  })
  if (assert5) {
    return assert5
  }

  const multichainDeploymentId = cuid()
  await prismaClient.$transaction(
    async (tx) => {
      // Create project networks if necessary
      for (const chainId of chainIds) {
        await tx.projects.update({
          where: {
            id: project.id,
          },
          data: {
            // We only update the project networks here
            // We expect all other configuration options to be updated
            // via other interfaces
            projectNetworks: {
              connectOrCreate: {
                where: {
                  projectId_chainId: {
                    projectId: project.id,
                    chainId,
                  },
                },
                create: {
                  chainId,
                  registered: false,
                  safeAddress,
                  moduleAddress,
                },
              },
            },
          },
        })
      }

      const totalNewTransactions = tree.chainStatus.reduce(
        (value, status) => (value += status.numLeaves - 1),
        0
      )

      const lastCompletedDeployment = await tx.multiChainDeployments.findFirst({
        where: {
          projectId: project.id,
          status: MultichainDeploymentStatus.completed,
          isTestnet,
        },
        orderBy: {
          created: 'desc',
        },
      })

      // create the multichain deployment
      await tx.multiChainDeployments.create({
        data: {
          id: multichainDeploymentId,
          treeRoot: tree.root,
          totalTxs: totalNewTransactions,
          previousCompletedDeploymentId: lastCompletedDeployment?.id,
          projectId: project.id,
          isTestnet,
          orgId,
          treeSigners: {
            create: project.projectOwners.map((owner) => {
              return {
                signer: owner.ownerAddress,
                signed: false,
              }
            }),
          },
          treeChainStatus: {
            createMany: {
              data: tree.chainStatus.map((status) => {
                return {
                  chainId: status.chainId,
                  numLeaves: status.numLeaves,
                  leavesExecuted: 0,
                  status: TreeStatus.proposed,
                }
              }),
            },
          },
        },
      })

      await Promise.all(
        projectDeployments.map((projectDeployment) => {
          const numLeaves = tree.chainStatus.find(
            (status) => status.chainId === projectDeployment.chainId
          )?.numLeaves
          if (!numLeaves) {
            throw new Error(
              'project deployment does not have corresponding chain status, please report this to the developers'
            )
          }

          return tx.projectDeployments.create({
            data: {
              project: {
                connect: {
                  id: project.id,
                },
              },
              projectVerification: {
                create: {
                  status: ProjectVerificationStatus.pending,
                  explorerVerifications: {
                    createMany: {
                      data: [
                        {
                          status: ExplorerVerificationStatus.queued,
                          explorer: Blockexplorer.Blockscout,
                          tries: 0,
                        },
                        {
                          status: ExplorerVerificationStatus.queued,
                          explorer: Blockexplorer.Etherscan,
                          tries: 0,
                        },
                      ],
                    },
                  },
                },
              },
              projectNetwork: {
                connect: {
                  projectId_chainId: {
                    projectId: project.id,
                    chainId: projectDeployment.chainId,
                  },
                },
              },
              network: {
                connect: {
                  id: projectDeployment.chainId,
                },
              },
              multichainDeployment: {
                connect: {
                  id: multichainDeploymentId,
                },
              },
              compilerConfig: {
                connect: {
                  id: compilerConfigId,
                },
              },
              deploymentId: projectDeployment.deploymentId,
              organizations: {
                connect: {
                  id: orgId,
                },
              },
              totalTxs: numLeaves - 1,
            },
          })
        })
      )
    },
    {
      maxWait: 5000, // default: 2000
      timeout: 90000, // default: 5000
    }
  )

  return res ? res.status(200).send('success') : 'success'
}

const handler = async (req: ProposeApiRequest, res: NextApiResponse) => {
  const { apiKey, orgId, chainIds } = req.body

  const validation = validateInput(req.body)
  if (validation !== undefined) {
    return res.status(400).send(validation)
  }

  try {
    await authorizeAPIKey(apiKey, orgId)
  } catch (e) {
    return res.status(401).send('Unauthorized')
  }

  const supportedNetworks = await prismaClient.networks.findMany({
    where: {
      id: {
        in: chainIds,
      },
      deprecated: false,
    },
  })

  if (chainIds.length !== supportedNetworks.length) {
    return res.status(409).send('Unsupported network')
  }

  return writeProposalToDB(req.body, res)
}

export default handler
