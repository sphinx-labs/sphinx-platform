import {
  BaseServiceV2,
  LogLevel,
  StandardOptions,
  validators,
} from '@eth-optimism/common-ts'
import { InfisicalClient } from '@infisical/sdk'
import {
  DeploymentConfigs,
  ExplorerVerificationStatus,
  ExplorerVerifications,
  PrismaClient,
  ProjectDeployments,
  ProjectVerificationStatus,
  ProjectVerifications,
} from '@prisma/client'
import { ExplorerName } from '@sphinx-labs/contracts'
import {
  COMPILER_CONFIG_VERSION,
  DeploymentConfig,
  callWithTimeout,
  fetchNameForNetwork,
  isBlockscoutSupportedForNetwork,
  isEtherscanSupportedForNetwork,
  verifySphinxConfig,
} from '@sphinx-labs/core'
import {
  fetchRPCProvider,
  fetchServiceClients,
  selectAPIKey,
} from '@sphinx-managed/utilities'
import AWS from 'aws-sdk'
import * as dotenv from 'dotenv'
import { serializeError } from 'serialize-error-cjs'

dotenv.config()

const BUCKET_NAME = 'sphinx-compiler-configs'

type ProjectVerificationsWithDeployment = ProjectVerifications & {
  projectDeployment: ProjectDeployments & {
    compilerConfig: DeploymentConfigs | null
  }
  explorerVerifications: Array<ExplorerVerifications>
}

export type Options = {
  logLevel: LogLevel
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type Metrics = {}
export type State = {
  s3: AWS.S3 | undefined
  prismaClient: PrismaClient
  infisicalClient: InfisicalClient
}

export class SphinxContractVerifier extends BaseServiceV2<
  Options,
  Metrics,
  State
> {
  constructor(options?: Partial<Options & StandardOptions>) {
    super({
      name: 'sphinx-contract-verifier-latest',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
      version: '0.1.0',
      loop: true,
      options: {
        ...options,
      },
      optionsSpec: {
        logLevel: {
          desc: 'Contract verifier log level',
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
      await fetchServiceClients('contract-verifier')

    this.logger = logger
    this.state.prismaClient = prismaClient
    this.state.s3 = s3
    this.state.infisicalClient = infisicalClient

    process.on('uncaughtException', (e) => {
      this.logger.error(`[Contract Verifier]: uncaughtException in executor`, {
        error: serializeError(e),
      })
    })

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error(`[Contract Verifier]: unhandledRejection in executor`, {
        reason,
        promise,
      })
    })
  }

  incrementTries = async (explorerVerification: ExplorerVerifications) => {
    let newWaitPeriod = explorerVerification.lastWaitPeriodMs * 2
    if (newWaitPeriod > 3600000) {
      newWaitPeriod = 3600000
    }
    const now = Date.now()
    const nextTryMs = now + newWaitPeriod
    const nextTryDate = new Date(nextTryMs)

    // Queue for retry
    const result = await this.state.prismaClient.explorerVerifications.update({
      where: {
        id: explorerVerification.id,
      },
      data: {
        tries: {
          increment: 1,
        },
        nextTry: nextTryDate,
        lastWaitPeriodMs: newWaitPeriod,
      },
    })

    // If more than 200 retries, then mark as failed
    // 200 is probably massive overkill to be honest, but it basically
    // means we'll keep trying every hour for about a week-ish
    if (result.tries > 200) {
      await this.state.prismaClient.explorerVerifications.update({
        where: {
          id: explorerVerification.id,
        },
        data: {
          status: ExplorerVerificationStatus.failing,
        },
      })
    }
  }

  handleEtherscanOrBlockscoutVerification = async (
    projectVerification: ProjectVerificationsWithDeployment,
    explorerVerification: ExplorerVerifications,
    explorer: ExplorerName,
    deploymentConfig: DeploymentConfig
  ) => {
    const deploymentId = projectVerification.projectDeployment.id

    const networkName = fetchNameForNetwork(
      BigInt(projectVerification.projectDeployment.chainId)
    )

    // If etherscan is not supported for this network, then mark the explorer verification as unsupported
    if (
      (explorer === 'Blockscout' &&
        !isBlockscoutSupportedForNetwork(
          BigInt(projectVerification.projectDeployment.chainId)
        )) ||
      (explorer === 'Etherscan' &&
        !isEtherscanSupportedForNetwork(
          BigInt(projectVerification.projectDeployment.chainId)
        ))
    ) {
      this.logger.info(
        `[Contract Verifier ${networkName}]: skipped verifying sphinx contracts: unsupported network`,
        {
          projectVerificiationId: projectVerification.id,
          explorerVerficationId: explorerVerification.id,
        }
      )

      await this.state.prismaClient.explorerVerifications.update({
        where: {
          id: explorerVerification.id,
        },
        data: {
          status: ExplorerVerificationStatus.verification_unsupported,
        },
      })
      return
    }

    const provider = await fetchRPCProvider(
      BigInt(projectVerification.projectDeployment.chainId)
    )

    // try verification
    // verify on etherscan
    try {
      const apiKey = await selectAPIKey(
        BigInt(projectVerification.projectDeployment.chainId),
        explorer,
        this.state.infisicalClient
      )

      if (apiKey) {
        this.logger.info(
          `[Contract Verifier ${networkName}]: attempting to verify source code on ${explorer} for project deploymentId: ${projectVerification.projectDeployment.id}`,
          { projectDeploymentId: projectVerification.projectDeployment.id }
        )

        await callWithTimeout(
          verifySphinxConfig(deploymentConfig, provider, apiKey, explorer),
          300000,
          `Etherscan verification timed out`
        )
        this.logger.info(
          `[Executor ${networkName}]: finished attempting etherscan verification for deployment with id: ${deploymentId}`,
          { deploymentId }
        )

        // update status if completed successfully
        await this.state.prismaClient.explorerVerifications.update({
          where: {
            id: explorerVerification.id,
          },
          data: {
            status: ExplorerVerificationStatus.verified,
          },
        })
      } else {
        this.logger.error(
          `[Executor ${networkName}]: skipped verifying sphinx contracts: no api key found`,
          { deploymentId }
        )
      }
    } catch (e: any) {
      // Update status if failed with 'already verified'
      if ((e.message as string).toLowerCase().includes('already verified')) {
        // update status if completed successfully
        await this.state.prismaClient.explorerVerifications.update({
          where: {
            id: explorerVerification.id,
          },
          data: {
            status: ExplorerVerificationStatus.verified,
          },
        })
      }

      // log error if necessary and increment tries
      this.logger.error(`[Executor ${networkName}]: verification error`, {
        error: serializeError(e),
        deploymentId,
        networkName,
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      })

      this.incrementTries(explorerVerification)
    }
  }

  // TODO - share this with other services
  fetchConfigFromS3 = async (
    id: string
  ): Promise<DeploymentConfig | undefined> => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: id,
    }

    try {
      if (this.state.s3 === undefined) {
        throw new Error(
          'S3 client undefined when fetching config, this should never happen'
        )
      }

      const data = await this.state.s3.getObject(params).promise()
      return JSON.parse(data.Body!.toString())
    } catch (e) {
      this.logger.error(`[Executor]: compiler config download error`, {
        error: serializeError(e),
        configId: id,
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      })
    }
  }

  // TODO - share this with other services
  fetchCompilerConfig = async (dbConfig: DeploymentConfigs) => {
    let compilerConfig = dbConfig?.compilerConfig as any as
      | DeploymentConfig
      | undefined

    if (!compilerConfig) {
      compilerConfig = await this.fetchConfigFromS3(dbConfig.id)

      return compilerConfig
    }
  }

  verifyDeployment = async (
    projectVerification: ProjectVerificationsWithDeployment
  ) => {
    if (projectVerification.explorerVerifications.length === 0) {
      this.logger.info(
        `[Contract Verifier]: Skipping verification attempt for ${projectVerification.id}, no explorers are ready to be retried`
      )
    }

    if (projectVerification.projectDeployment.compilerConfig === null) {
      this.logger.error(
        '[Contract Verifier]: No compiler config in DB for, this should never happen',
        { deploymentId: projectVerification.projectDeployment.id }
      )
      return
    }

    const config = await this.fetchCompilerConfig(
      projectVerification.projectDeployment.compilerConfig
    )
    if (!config) {
      this.logger.error(
        '[Contract Verifier]: Compiler config not found in s3, this should never happen',
        { deploymentId: projectVerification.projectDeployment.id }
      )
      return
    }

    const verificationPromises = projectVerification.explorerVerifications.map(
      (explorerVerification) => {
        return this.handleEtherscanOrBlockscoutVerification(
          projectVerification,
          explorerVerification,
          explorerVerification.explorer,
          config
        )
      }
    )

    await Promise.all(verificationPromises)

    // If verification finished on all block explorers, then update project verification status
    await this.state.prismaClient.projectVerifications.updateMany({
      where: {
        id: projectVerification.id,
        explorerVerifications: {
          every: {
            status: {
              in: [
                ExplorerVerificationStatus.verified,
                ExplorerVerificationStatus.verification_unsupported,
                ExplorerVerificationStatus.failing,
              ],
            },
          },
        },
      },
      data: {
        status: ProjectVerificationStatus.completed,
      },
    })
  }

  async main() {
    // Get projects that are currently being verified
    // Only include explorer verifications that are ready to be tried
    const projectVerifications =
      await this.state.prismaClient.projectVerifications.findMany({
        where: {
          status: ProjectVerificationStatus.verifying,
          explorerVerifications: {
            some: {
              nextTry: {
                lt: new Date(),
              },
              status: ExplorerVerificationStatus.queued,
            },
          },
        },
        include: {
          projectDeployment: {
            include: {
              compilerConfig: true,
              contracts: true,
            },
          },
          explorerVerifications: {
            where: {
              nextTry: {
                lt: new Date(),
              },
              status: ExplorerVerificationStatus.queued,
            },
          },
        },
      })

    if (projectVerifications.length === 0) {
      this.logger.info(`[Contract Verifier]: No projects to verify`)
      return
    }

    // call async function for all requests with keys to submit requests
    this.logger.info(
      `[Contract Verifier]: verifying contracts for ${projectVerifications.length} deployments`
    )
    const verificationPromises = projectVerifications.map(
      (projectVerification) => this.verifyDeployment(projectVerification)
    )

    // await promise.all
    await Promise.all(verificationPromises)
  }
}

if (require.main === module) {
  const service = new SphinxContractVerifier()
  service.run()
}
