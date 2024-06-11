import { readFileSync } from 'fs'

import {
  BaseServiceV2,
  LogLevel,
  Logger,
  StandardOptions,
  validators,
} from '@eth-optimism/common-ts'
import { InfisicalClient } from '@infisical/sdk'
import {
  DeploymentConfigs,
  MultiChainDeployments,
  MultichainDeploymentStatus,
  PrismaClient,
  DeploymentArtifacts as PrismaDeploymentArtifacts,
  ProjectDeployments,
  Projects,
  TransactionCosts,
} from '@prisma/client'
import {
  COMPILER_CONFIG_VERSION,
  DeploymentArtifacts,
  DeploymentConfig,
  SphinxJsonRpcProvider,
  SphinxTransactionReceipt,
  convertEthersTransactionReceipt,
  makeDeploymentArtifacts,
} from '@sphinx-labs/core'
import {
  fetchRPCProvider,
  fetchServiceClients,
} from '@sphinx-managed/utilities'
import AWS from 'aws-sdk'
import cuid from 'cuid'
import * as dotenv from 'dotenv'
import { serializeError } from 'serialize-error-cjs'
dotenv.config()

const BUCKET_NAME = 'sphinx-artifacts'
const COMPILER_CONFIG_BUCKET_NAME = 'sphinx-compiler-configs'

export type Options = {
  logLevel: LogLevel
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type Metrics = {}
export type State = {
  prismaClient: PrismaClient
  infisicalClient: InfisicalClient
  s3: AWS.S3 | undefined
}

type Deployment = MultiChainDeployments & {
  transactionCosts: TransactionCosts[]
  project: Projects
  artifact: PrismaDeploymentArtifacts | null
  previousDeployment:
    | (MultiChainDeployments & {
        artifact: PrismaDeploymentArtifacts | null
      })
    | null
  projectDeployments: (ProjectDeployments & {
    compilerConfig: DeploymentConfigs | null
  })[]
}

export const uploadArtifact = async (
  artifact: DeploymentArtifacts,
  deploymentId: string,
  state: State,
  logger: Logger,
  backfillingArtifactId: string | undefined
): Promise<string | undefined> => {
  // If an id was passed in, then we upload with that. Otherwise we upload with a fresh id
  const id = backfillingArtifactId ? backfillingArtifactId : cuid()

  const params = {
    Bucket: BUCKET_NAME,
    Key: id,
    Body: JSON.stringify(artifact, undefined, 2),
  }

  try {
    if (state.s3 === undefined) {
      throw new Error(
        'S3 client undefined when uploading, this should never happen'
      )
    }

    await state.s3?.upload(params).promise()
    logger.info(`[Artifact Generator]: upload successful`, {
      deploymentId,
      url: id,
    })
    return id
  } catch (e) {
    logger.error(`[Artifact Generator]: upload error`, {
      error: serializeError(e),
      deploymentId,
      compilerConfigVersion: COMPILER_CONFIG_VERSION,
    })
  }
}

const fetchArtifact = async (
  id: string,
  state: State,
  logger: Logger
): Promise<DeploymentArtifacts | undefined> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: id,
  }

  if (process.env.LOCAL_ANVIL === 'true') {
    // read from file system
    return JSON.parse(readFileSync(`./deployments/${id}.json`).toString())
  } else {
    try {
      if (state.s3 === undefined) {
        throw new Error(
          'S3 client undefined when fetching artifact, this should never happen'
        )
      }

      const data = await state.s3.getObject(params).promise()
      return JSON.parse(data.Body!.toString())
    } catch (e) {
      logger.error(`[Artifact Generator]: download error`, {
        error: serializeError(e),
        artifactId: id,
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      })
    }
  }
}

const fetchDeploymentConfig = async (
  id: string,
  state: State,
  logger: Logger
): Promise<DeploymentConfig | undefined> => {
  const params = {
    Bucket: COMPILER_CONFIG_BUCKET_NAME,
    Key: id,
  }

  try {
    if (state.s3 === undefined) {
      throw new Error(
        'S3 client undefined when fetching config, this should never happen'
      )
    }

    const data = await state.s3.getObject(params).promise()
    return JSON.parse(data.Body!.toString())
  } catch (e) {
    logger.error(`[Executor]: compiler config download error`, {
      error: serializeError(e),
      artifactId: id,
      compilerConfigVersion: COMPILER_CONFIG_VERSION,
    })
  }
}

const fetchReceipts = async (
  costs: TransactionCosts[],
  deploymentId: string,
  logger: Logger
) => {
  const receipts: { [chainId: number]: SphinxTransactionReceipt[] } = []

  const fetchedReceiptsWithHash: Record<string, boolean> = {}

  for (const cost of costs) {
    if (fetchedReceiptsWithHash[cost.txHash] === true) {
      continue
    }

    if (cost.txHash) {
      const provider = await fetchRPCProvider(BigInt(cost.chainId))
      const receipt = await provider.getTransactionReceipt(cost.txHash)

      fetchedReceiptsWithHash[cost.txHash] = true

      if (receipt) {
        if (!receipts[cost.chainId]) {
          receipts[cost.chainId] = [
            convertEthersTransactionReceipt(receipt as any),
          ]
        } else {
          receipts[cost.chainId].push(
            convertEthersTransactionReceipt(receipt as any)
          )
        }
      } else {
        logger.error(`[Artifact Generator]: receipt not found`, {
          hash: cost.txHash,
          id: cost.id,
          multichainDeploymentId: deploymentId,
          compilerConfigVersion: COMPILER_CONFIG_VERSION,
        })
      }
    } else {
      logger.error(`[Artifact Generator]: cost has no tx hash`, {
        id: cost.id,
        multichainDeploymentId: deploymentId,
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      })
    }
  }

  return receipts
}

export const generateArtifacts = async (
  deployment: Deployment,
  logger: Logger,
  state: State
) => {
  let deploymentConfig = deployment.projectDeployments.at(0)?.compilerConfig
    ?.compilerConfig as any as DeploymentConfig | undefined
  if (!deploymentConfig) {
    deploymentConfig = await fetchDeploymentConfig(
      deployment.projectDeployments.at(0)?.compilerConfig?.id!,
      state,
      logger
    )

    if (!deploymentConfig) {
      logger.error(
        '[Executor]: Compiler config not found in s3, this should never happen',
        { deploymentId: deployment.id }
      )
      return
    }
  }

  if (!deploymentConfig) {
    logger.error(
      `[Artifact Generator]: No compiler config stored for this deployment, should never happen`,
      {
        multichainDeploymentId: deployment.id,
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      }
    )

    // TODO - retry?
    return
  }

  try {
    const receipts = await fetchReceipts(
      deployment.transactionCosts,
      deployment.id,
      logger
    )

    const deployments: {
      [chainId: string]: {
        deploymentConfig: DeploymentConfig
        receipts: Array<SphinxTransactionReceipt>
        provider: SphinxJsonRpcProvider
      }
    } = {}

    for (const networkConfig of deploymentConfig.networkConfigs) {
      // It's possible to construct a deployment config which contains network configs that have no action inputs
      // As a result, there may be no transaction receipts on those networks. So in this case, we default to an
      // empty list instead of undefined since the `makeDeploymentArtifacts` expects a list of receipts for each
      // network.
      const networkReceipts = receipts[networkConfig.chainId]
        ? receipts[networkConfig.chainId]
        : []

      deployments[networkConfig.chainId] = {
        deploymentConfig,
        receipts: networkReceipts,
        provider: await fetchRPCProvider(BigInt(networkConfig.chainId)),
      }
    }

    const previousArtifactPrisma = deployment.previousDeployment?.artifact

    const previousArtifact = previousArtifactPrisma
      ? await fetchArtifact(previousArtifactPrisma.id, state, logger)
      : undefined

    if (previousArtifactPrisma && !previousArtifact) {
      logger.error(
        '[Artifact Generator]: Could not find artifact that should exist for previous deployment in S3',
        {
          artifactId: previousArtifactPrisma.id,
          deploymentId: deployment.id,
        }
      )
    }

    const nextArtifact = previousArtifact
      ? previousArtifact
      : {
          networks: {},
          compilerInputs: {},
        }

    // This function modifies the passed in `artifact` object
    await makeDeploymentArtifacts(
      deployments,
      deploymentConfig.merkleTree.root,
      deploymentConfig.configArtifacts,
      nextArtifact
    )

    const artifactId = await uploadArtifact(
      nextArtifact,
      deployment.id,
      state,
      logger,
      // This will only be defined if an artifact has been created previously for this deployment
      // In this case, we must be backfilling the deployment artifact so we upload with the ID that is
      // already used which overrides the previous artifact in S3.
      deployment.artifact?.id
    )

    if (artifactId === undefined) {
      // TODO - retry?
      return
    } else if (!deployment.artifact?.id) {
      await state.prismaClient.multiChainDeployments.update({
        where: {
          id: deployment.id,
        },
        data: {
          status: MultichainDeploymentStatus.completed,
          artifact: {
            connectOrCreate: {
              where: {
                id: artifactId,
              },
              create: {
                id: artifactId,
                project: {
                  connect: {
                    id: deployment.project.id,
                  },
                },
              },
            },
          },
        },
      })
    }
  } catch (e) {
    logger.error(e.message, {
      error: serializeError(e),
      deploymentId: deployment.id,
    })
  }
}

export class SphinxArtifact extends BaseServiceV2<Options, Metrics, State> {
  constructor(options?: Partial<Options & StandardOptions>) {
    super({
      name: 'sphinx-artifact-generator-latest',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
      version: '0.1.0',
      loop: true,
      options: {
        ...options,
      },
      optionsSpec: {
        logLevel: {
          desc: 'Artifact generator log level',
          validator: validators.str,
          default: 'error',
        },
      },
      metricsSpec: {},
    })
  }

  async clearMetrics() {
    this.metricsRegistry.clear()
  }

  async init() {
    const { infisicalClient, prismaClient, logger, s3 } =
      await fetchServiceClients('artifact-generator')

    this.logger = logger
    this.state.prismaClient = prismaClient
    this.state.s3 = s3
    this.state.infisicalClient = infisicalClient

    process.on('uncaughtException', (e) => {
      this.logger.error(`[Executor]: uncaughtException in executor`, {
        error: serializeError(e),
      })
    })

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error(`[Executor]: unhandledRejection in executor`, {
        reason,
        promise,
      })
    })
  }

  async main() {
    // get the deployments
    const multichainDeployment =
      await this.state.prismaClient.multiChainDeployments.findMany({
        where: {
          status: MultichainDeploymentStatus.executed,
          projectDeployments: {
            every: {
              compilerConfig: {
                version: COMPILER_CONFIG_VERSION,
              },
            },
          },
        },
        include: {
          artifact: true,
          transactionCosts: true,
          project: true,
          projectDeployments: {
            include: {
              compilerConfig: true,
            },
          },
          previousDeployment: {
            include: {
              artifact: true,
            },
          },
        },
      })

    if (multichainDeployment.length === 0) {
      this.logger.info(`[Artifact Generator]: No artifacts to generate`)
      return
    }

    // call async function for all requests with keys to submit requests
    this.logger.info(
      `[Artifact Generator]: generating artifacts for ${multichainDeployment.length} deployments`
    )
    const deploymentPromises = multichainDeployment.map((deployment) =>
      generateArtifacts(deployment, this.logger, this.state)
    )

    // await promise.all
    await Promise.all(deploymentPromises)
  }
}

if (require.main === module) {
  const service = new SphinxArtifact()
  service.run()
}
