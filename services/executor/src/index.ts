import {
  BaseServiceV2,
  LogLevel,
  StandardOptions,
  validators,
} from '@eth-optimism/common-ts'
import { InfisicalClient } from '@infisical/sdk'
import {
  Blockexplorer,
  ExplorerVerificationStatus,
  PrismaClient,
  ProjectVerificationStatus,
  RelayRequestStatus,
  RelayRequestType,
  RelayRequests,
  TreeStatus,
} from '@prisma/client'
import { SphinxModuleABI } from '@sphinx-labs/contracts'
import {
  COMPILER_CONFIG_VERSION,
  Deployment,
  DeploymentConfig,
  DeploymentContext,
  ExecuteTransaction,
  HandleAlreadyExecutedDeployment,
  HandleError,
  HandleExecutionFailure,
  HandleSuccess,
  HumanReadableAction,
  MinimumTransaction,
  NetworkConfig,
  SphinxJsonRpcProvider,
  ThrowError,
  TreeSigner,
  attemptDeployment,
  callWithTimeout,
  isContractDeployed,
} from '@sphinx-labs/core'
import {
  fetchRPCProvider,
  fetchServiceClients,
  sleep,
} from '@sphinx-managed/utilities'
import AWS from 'aws-sdk'
import cuid from 'cuid'
import * as dotenv from 'dotenv'
import { AbiCoder, ethers, keccak256 } from 'ethers'
import { serializeError } from 'serialize-error-cjs'
dotenv.config()

const BUCKET_NAME = 'sphinx-compiler-configs'

/**
 * @notice Sorts an array of hex strings in ascending order. This function mutates the array.
 */
export const sortSigners = (arr: Array<TreeSigner>): void => {
  arr.sort((a, b) => {
    const aBigInt = BigInt(a.signer)
    const bBigInt = BigInt(b.signer)

    if (aBigInt < bBigInt) {
      return -1
    } else if (aBigInt > bBigInt) {
      return 1
    } else {
      return 0
    }
  })
}

export type ExecutorOptions = {
  logLevel: LogLevel
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type ExecutorMetrics = {}
export type ExecutorState = {
  mockRelayer?: any
  waitingForRequestToExecute: Record<string, boolean>
  infisicalClient: InfisicalClient
  prismaClient: PrismaClient
  s3: AWS.S3 | undefined
}

export class SphinxExecutor extends BaseServiceV2<
  ExecutorOptions,
  ExecutorMetrics,
  ExecutorState
> {
  constructor(options?: Partial<ExecutorOptions & StandardOptions>) {
    super({
      name: 'sphinx-executor-latest',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
      version: '0.1.0',
      loop: true,
      options: {
        ...options,
      },
      optionsSpec: {
        logLevel: {
          desc: 'Executor log level',
          validator: validators.str,
          default: 'error',
        },
      },
      metricsSpec: {},
    })
  }

  async clearMetrics() {
    await this.metricsRegistry.clear()
  }

  async init() {
    this.state.waitingForRequestToExecute = {}

    const { infisicalClient, prismaClient, s3, logger } =
      await fetchServiceClients('executor')

    this.state.infisicalClient = infisicalClient
    this.state.prismaClient = prismaClient
    this.state.s3 = s3
    this.logger = logger

    process.on('uncaughtException', (e) => {
      this.logger.error(`[Executor]: uncaughtException in executor`, {
        error: serializeError(e),
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      })
    })

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error(`[Executor]: unhandledRejection in executor`, {
        reason,
        promise,
        compilerConfigVersion: COMPILER_CONFIG_VERSION,
      })
    })
  }

  fetchCompilerConfig = async (
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

  throwError: ThrowError = async (
    message: string,
    deploymentId: string,
    networkName: string
  ) => {
    await this.incrementTries(deploymentId)
    this.logger.error(message, {
      deploymentId,
      networkName,
      compilerConfigVersion: COMPILER_CONFIG_VERSION,
    })
  }

  handleError: HandleError = async (e: any, deployment: Deployment) => {
    const { networkName } = deployment
    const deploymentId = deployment.id
    this.logger.error(`[Executor]: execution error`, {
      error: serializeError(e),
      deploymentId,
      networkName,
      compilerConfigVersion: COMPILER_CONFIG_VERSION,
    })

    await this.incrementTries(deployment.id)
  }

  handleAlreadyExecutedDeployment: HandleAlreadyExecutedDeployment = async (
    deploymentContext: DeploymentContext,
    targetNetworkConfig: NetworkConfig
  ) => {
    const { deployment } = deploymentContext
    const { networkName } = deployment
    const deploymentId = deployment.id
    const moduleAddress = deployment.moduleAddress
    const module = new ethers.Contract(
      moduleAddress,
      SphinxModuleABI,
      deploymentContext.provider as any
    )

    const rpcProvider = deploymentContext.provider as SphinxJsonRpcProvider

    this.logger?.info(
      `[Executor ${networkName}]: deployment already completed`,
      {
        deploymentId,
      }
    )

    // If status is executed and the active deployment id is 0, then we try verification
    if (deployment.status === 'executed') {
      return
    } else if (deployment.status === 'approved') {
      // Update the status, write contracts, write deployment receipts
      await this.writeContracts(
        targetNetworkConfig,
        deployment,
        undefined,
        rpcProvider
      )
    }
  }

  handleExecutionFailure: HandleExecutionFailure = async (
    deploymentContext: DeploymentContext,
    targetNetworkConfig: NetworkConfig,
    failureAction: HumanReadableAction | undefined
  ) => {
    const { deployment } = deploymentContext
    const { networkName } = deployment
    const deploymentId = deployment.id
    const moduleAddress = deployment.moduleAddress
    const rpcProvider = deploymentContext.provider as SphinxJsonRpcProvider
    const module = new ethers.Contract(
      moduleAddress,
      SphinxModuleABI,
      rpcProvider as any
    )

    this.logger.error(`[Executor ${networkName}]: failed during deployment`, {
      deploymentId,
      failureAction,
      networkName,
      compilerConfigVersion: COMPILER_CONFIG_VERSION,
    })

    // Update the status, write contracts, write deployment receipts
    await this.writeContracts(
      targetNetworkConfig,
      deployment,
      failureAction,
      rpcProvider
    )

    return
  }

  handleSuccess: HandleSuccess = async (
    deploymentContext: DeploymentContext,
    networkConfig: NetworkConfig
  ) => {
    const { deployment } = deploymentContext
    const rpcProvider = deploymentContext.provider as SphinxJsonRpcProvider

    // Update the status, write contracts, write deployment receipts
    await this.writeContracts(networkConfig, deployment, undefined, rpcProvider)

    const projectDeployment =
      await this.state.prismaClient.projectDeployments.findUniqueOrThrow({
        where: {
          id: deployment.id,
        },
      })
  }

  writeContracts = async (
    networkConfig: NetworkConfig,
    deployment: Deployment,
    failureAction: HumanReadableAction | undefined,
    rpcProvider: SphinxJsonRpcProvider
  ) => {
    if (failureAction) {
      await this.state.prismaClient.projectDeployments.update({
        where: {
          id: deployment.id,
        },
        data: {
          failed: true,
          failureReason: failureAction?.reason,
          failureIndex: Number(failureAction?.actionIndex),
        },
      })
    }

    const deployedContracts: [
      string,
      {
        fullyQualifiedName: string
        initCodeWithArgs: string
      }
    ][] = []

    for (const action of networkConfig.actionInputs) {
      const contracts = action.contracts
      for (const contract of Object.values(contracts)) {
        if (await isContractDeployed(contract.address, rpcProvider)) {
          deployedContracts.push([contract.address, contract])
        }
      }
    }

    const projectDeployment =
      await this.state.prismaClient.projectDeployments.findUnique({
        where: {
          id: deployment.id,
        },
        include: {
          projectVerification: true,
        },
      })

    if (!projectDeployment) {
      this.logger.error(
        '[Executor]: Failed to find deployment with id in writeContracts',
        { deploymentId: deployment.id }
      )
      return
    }

    const projectVerificationId = projectDeployment.projectVerification?.id
      ? projectDeployment.projectVerification.id
      : cuid()

    await this.state.prismaClient.$transaction([
      this.state.prismaClient.projectDeployments.update({
        where: {
          id: deployment.id,
        },
        data: {
          status: 'executed',
          treeChainStatus: {
            update: {
              status: TreeStatus.completed,
            },
          },
          // Create a project verification entry if it doesn't already exist
          // If one does exist, then just update it's status to verifying
          projectVerification: {
            upsert: {
              create: {
                id: projectVerificationId,
                status: ProjectVerificationStatus.verifying,
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
              update: {
                status: ProjectVerificationStatus.verifying,
              },
            },
          },
        },
      }),
      ...deployedContracts.map(([address, contract]) => {
        return this.state.prismaClient.contracts.upsert({
          where: {
            address_chainId: {
              address,
              chainId: Number(deployment.chainId),
            },
          },
          update: {},
          create: {
            projectVerificationId,
            referenceName: '',
            contractName: contract.fullyQualifiedName,
            address,
            projectId: deployment.projectId,
            chainId: Number(deployment.chainId),
            deploymentId: projectDeployment.deploymentId,
          },
        })
      }),
    ])
  }

  incrementTries = async (deploymentId: string) => {
    const deployment =
      await this.state.prismaClient.projectDeployments.findUnique({
        where: {
          id: deploymentId,
        },
      })

    if (!deployment) {
      this.logger.error(
        '[Executor]: Failed to find deployment with id in incrementTries',
        { deploymentId }
      )
      return
    }

    let newWaitPeriod = deployment.lastWaitPeriodMs * 2
    if (newWaitPeriod > 5000) {
      newWaitPeriod = 5000
    }
    const now = Date.now()
    const nextTryMs = now + newWaitPeriod
    const nextTryDate = new Date(nextTryMs)

    // Queue for retry
    await this.state.prismaClient.projectDeployments.update({
      where: {
        id: deployment.id,
      },
      data: {
        tries: {
          increment: 1,
        },
        nextTry: nextTryDate,
        lastWaitPeriodMs: newWaitPeriod,
      },
    })
  }

  executeTransaction: ExecuteTransaction = async (
    deploymentContext: DeploymentContext,
    transaction: MinimumTransaction,
    _exectionMode,
    minimumActionsGasLimit
  ) => {
    const sphinxTxHash = keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ['string', 'string', 'string', 'string', 'string', 'string'],
        [
          deploymentContext.deployment.id,
          transaction.chainId,
          transaction.data,
          transaction.to,
          transaction.gasLimit ?? '',
          transaction.value ?? '',
        ]
      )
    )

    let relayRequestWithHash =
      await this.state.prismaClient.relayRequests.findFirst({
        where: {
          sphinxTxHash,
        },
      })

    // If the request was previously canceled, then resurrect it
    if (
      relayRequestWithHash &&
      relayRequestWithHash.status !== RelayRequestStatus.completed
    ) {
      relayRequestWithHash = await this.state.prismaClient.relayRequests.update(
        {
          where: {
            id: relayRequestWithHash.id,
          },
          data: {
            status: RelayRequestStatus.queued,
          },
        }
      )
    }

    let relayRequest: RelayRequests = relayRequestWithHash
      ? relayRequestWithHash
      : await this.state.prismaClient.relayRequests.create({
          data: {
            to: transaction.to,
            chainId: Number(transaction.chainId),
            multichainDeploymentId:
              deploymentContext.deployment.multichainDeploymentId,
            executable: true,
            data: transaction.data,
            type: RelayRequestType.deploymentTransaction,
            minimumActionsGasLimit: minimumActionsGasLimit?.toString(),
            value: transaction.value,
            sphinxTxHash,
          },
        })

    this.state.waitingForRequestToExecute[deploymentContext.deployment.id] =
      true

    while (
      relayRequest.status !== RelayRequestStatus.completed &&
      this.state.waitingForRequestToExecute[deploymentContext.deployment.id]
    ) {
      await this.state.mockRelayer?.main()

      await sleep(2000)
      relayRequest = (await this.state.prismaClient.relayRequests.findUnique({
        where: {
          id: relayRequest.id,
        },
      })) as RelayRequests
    }

    if (relayRequest.status === RelayRequestStatus.completed) {
      const receipt = await deploymentContext.provider.getTransactionReceipt(
        relayRequest.txhash!
      )

      if (receipt === null) {
        throw new Error(
          `[Executor ${deploymentContext.deployment.networkName}]: Relay request completed, but transaction not found. This should never happen`
        )
      }
      return receipt
    } else {
      throw new Error(
        `[Executor ${deploymentContext.deployment.networkName}]: Relay request failed to be completed due to execution timing out.`
      )
    }
  }

  handleTimeout = async (deploymentContext: DeploymentContext) => {
    delete this.state.waitingForRequestToExecute[
      deploymentContext.deployment.id
    ]

    await this.state.prismaClient.relayRequests.updateMany({
      where: {
        multichainDeploymentId:
          deploymentContext.deployment.multichainDeploymentId,
        chainId: Number(deploymentContext.deployment.chainId),
        status: RelayRequestStatus.queued,
      },
      data: {
        status: RelayRequestStatus.queuedForCancelation,
      },
    })
  }

  async main(mockRelayer?: any) {
    // get the project deployments
    const projectDeployments =
      await this.state.prismaClient.projectDeployments.findMany({
        where: {
          treeChainStatus: {
            status: TreeStatus.executingDeployment,
          },
          nextTry: {
            lt: new Date(),
          },
          compilerConfig: {
            version: COMPILER_CONFIG_VERSION,
          },
        },
        include: {
          compilerConfig: true,
          projectNetwork: true,
          treeChainStatus: true,
          network: true,
          multichainDeployment: {
            include: {
              treeSigners: true,
            },
          },
        },
      })

    this.state.mockRelayer = mockRelayer

    if (projectDeployments.length === 0) {
      this.logger.info(`[Executor]: No projects to execute`)
      return
    }

    // call async function for all requests with keys to submit requests
    this.logger.info(
      `[Executor]: executing ${projectDeployments.length} deployments`
    )

    const deploymentPromises = projectDeployments.map(async (deployment) => {
      const signers: Array<TreeSigner> =
        deployment.multichainDeployment.treeSigners.filter(
          (signer) => signer.signature !== null
        ) as Array<TreeSigner>

      if (!deployment.compilerConfig) {
        this.logger.error(
          '[Executor]: Compiler config not found in database, this should never happen',
          { deploymentId: deployment.id }
        )
        return
      }

      let compilerConfig = deployment.compilerConfig?.compilerConfig as any as
        | DeploymentConfig
        | undefined
      if (!compilerConfig) {
        compilerConfig = await this.fetchCompilerConfig(
          deployment.compilerConfig.id
        )

        if (!compilerConfig) {
          this.logger.error(
            '[Executor]: Compiler config not found in s3, this should never happen',
            { deploymentId: deployment.id }
          )
          return
        }
      }

      const standardizedDeployment: Deployment = {
        id: deployment.id,
        multichainDeploymentId: deployment.multichainDeploymentId,
        projectId: deployment.projectId,
        chainId: deployment.chainId.toString(),
        status: deployment.status,
        moduleAddress: deployment.projectNetwork.moduleAddress,
        safeAddress: deployment.projectNetwork.safeAddress,
        deploymentConfig: compilerConfig,
        networkName: deployment.network.name,
        treeSigners: signers,
      }

      const deploymentContext: DeploymentContext = {
        throwError: this.throwError,
        handleError: this.handleError,
        handleAlreadyExecutedDeployment: this.handleAlreadyExecutedDeployment,
        handleExecutionFailure: this.handleExecutionFailure,
        handleSuccess: this.handleSuccess,
        executeTransaction: this.executeTransaction,
        deployment: standardizedDeployment,
        provider: await fetchRPCProvider(BigInt(deployment.chainId)),
        injectRoles: async () => {
          return
        },
        removeRoles: async () => {
          return
        },
        logger: this.logger,
      }

      try {
        return await callWithTimeout(
          attemptDeployment(deploymentContext),
          90000,
          'timed out executing deployments'
        )
      } catch (e) {
        if (e.message.includes('timed out executing deployments')) {
          await this.handleTimeout(deploymentContext)
        }
        await this.handleError(e, deploymentContext.deployment)
      }
    })

    // await promise.all
    await Promise.all(deploymentPromises)
  }
}

if (require.main === module) {
  const service = new SphinxExecutor()
  service.run()
}
