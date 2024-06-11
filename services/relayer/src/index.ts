import {
  BaseServiceV2,
  LogLevel,
  StandardOptions,
  validators,
} from '@eth-optimism/common-ts'
import { InfisicalClient } from '@infisical/sdk'
import {
  Currency,
  MultiChainDeployments,
  MultichainDeploymentStatus,
  Networks,
  PrismaClient,
  RelayRequestStatus,
  RelayRequests,
  RelayTries,
  TreeStatus,
} from '@prisma/client'
import {
  DrippieArtifact,
  SPHINX_NETWORKS,
  getPermissionlessRelayAddress,
} from '@sphinx-labs/contracts'
import {
  ExecutionMode,
  SphinxJsonRpcProvider,
  callWithTimeout,
  fetchCurrencyForNetwork,
  fetchDripSizeForNetwork,
  fetchDripVersionForNetwork,
  getGasPriceOverrides,
  getMaxGasLimit,
  shouldBufferExecuteActionsGasLimit,
} from '@sphinx-labs/core'
import {
  fetchRPCProvider,
  fetchServiceClients,
} from '@sphinx-managed/utilities'
import * as dotenv from 'dotenv'
import { ethers } from 'ethers'
import { serializeError } from 'serialize-error-cjs'

dotenv.config()

type Key = {
  id: number
  networkName: string
  privateKey: string
  locked: boolean
  chainId: number
}

export type RelayerOptions = {
  logLevel: LogLevel
  managedApiUrl: string
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type RelayerMetrics = {}
export type RelayerState = {
  keys: {
    [network: string]: Key[]
  }
  prismaClient: PrismaClient
  infisicalClient: InfisicalClient
}

type RequestWithKey = {
  request: RelayRequests & {
    network: Networks
    multichainDeployment: MultiChainDeployments | null
    relayTries: RelayTries[]
  }
  key: Key
}

export class SphinxRelayer extends BaseServiceV2<
  RelayerOptions,
  RelayerMetrics,
  RelayerState
> {
  constructor(options?: Partial<RelayerOptions & StandardOptions>) {
    super({
      name: 'sphinx-relayer',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
      version: '0.1.0',
      loop: true,
      options: {
        ...options,
      },
      optionsSpec: {
        logLevel: {
          desc: 'Relayer log level',
          validator: validators.str,
          default: 'error',
        },
        managedApiUrl: {
          desc: 'Sphinx Managed GraphQL API',
          validator: validators.str,
          default: '',
        },
      },
      metricsSpec: {},
    })
  }

  async clearMetrics() {
    await this.metricsRegistry.clear()
  }

  async init() {
    const { infisicalClient, prismaClient, logger } = await fetchServiceClients(
      'relayer'
    )

    this.state.prismaClient = prismaClient
    this.state.infisicalClient = infisicalClient
    this.logger = logger

    if (!process.env.SPHINX_RELAYER__PRIVATE_KEYS) {
      throw new Error('SPHINX_RELAYER__PRIVATE_KEYS is undefined')
    }

    // Setup keys assuming all are valid on all supported networks
    const keyStrings = process.env.SPHINX_RELAYER__PRIVATE_KEYS.split(',')
    this.state.keys = {}
    SPHINX_NETWORKS.forEach((network) => {
      this.state.keys[network.name] = keyStrings.map((privateKey, index) => {
        return {
          networkName: network.name,
          id: index,
          privateKey,
          locked: false,
          chainId: Number(network.chainId),
        }
      })
    })

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

  findAndLockKey = (network: string): Key | undefined => {
    const networkKeys = this.state.keys[network]

    for (const key of networkKeys) {
      if (key.locked === false) {
        key.locked = true
        return key
      }
    }

    return undefined
  }

  unlockKey = (network: string, id: number) => {
    this.state.keys[network][id].locked = false
  }

  unlockAllKeys = () => {
    for (const networkKeys of Object.values(this.state.keys)) {
      for (const key of networkKeys) {
        key.locked = false
      }
    }
  }

  handleSuccess = async (
    requestWithKey: Pick<RequestWithKey, 'request'>,
    requestAttempt: RelayTries,
    receipt: ethers.TransactionReceipt | null,
    response: ethers.TransactionResponse | null
  ) => {
    if (receipt && response) {
      await this.state.prismaClient.$transaction(
        async (prisma) => {
          const mined = response.isMined()
          const confirmations = await response.confirmations()
          let reverted = receipt.status === 0

          await prisma.relayTries.update({
            where: {
              id: requestAttempt.id,
            },
            data: {
              mined,
              confirmations,
              status: receipt?.status ?? undefined,
              fee: receipt?.fee.toString() ?? undefined,
              gasUsed: receipt?.gasUsed.toString() ?? undefined,
              to: receipt?.to?.toString() ?? undefined,
              value: response?.value?.toString() ?? undefined,
              blockHash: receipt?.blockHash ?? undefined,
              blockNumber: receipt?.blockNumber ?? undefined,
              data: response.data,
              gasLimit: response.gasLimit?.toString() ?? undefined,
              gasPrice: response.gasPrice?.toString() ?? undefined,
              maxFeePerGas: response.maxFeePerGas?.toString(),
              maxPriorityFeePerGas: response.maxPriorityFeePerGas?.toString(),
              nonce: response.nonce,
              from: response.from,
              relayRequest: {
                update: {
                  data: {
                    locked: false,
                    completed: true,
                    txhash: requestAttempt.hash,
                    status: RelayRequestStatus.completed,
                    reverted,
                    transactionCost: {
                      connectOrCreate: {
                        where: {
                          relayRequestId_txHash: {
                            relayRequestId: requestAttempt.relayRequestId,
                            txHash: receipt.hash,
                          },
                        },
                        create: {
                          chainId: requestWithKey.request.chainId,
                          txHash: requestAttempt.hash,
                          cost: (receipt.gasUsed * receipt.gasPrice).toString(
                            10
                          ),
                          currency: fetchCurrencyForNetwork(
                            BigInt(requestWithKey.request.chainId)
                          ) as Currency,
                          multichainDeploymentId:
                            requestWithKey.request.multichainDeploymentId ??
                            undefined,
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        },
        {
          maxWait: 5000, // default: 2000
          timeout: 30000, // default: 5000
        }
      )

      this.logger.info(
        `[Relayer ${requestWithKey.request.network.displayName}]: Finished sending request ${requestWithKey.request.id}, hash: ${receipt.hash}`
      )
    } else {
      this.logger.error(
        '[Relay Request]: Relay request completed, but no transction hash found. This should never happen.'
      )
    }
  }

  incrementTries = async (requestWithKey: RequestWithKey) => {
    this.unlockKey(requestWithKey.key.networkName, requestWithKey.key.id)

    let newWaitPeriod = requestWithKey.request.lastWaitPeriodMs * 2
    if (newWaitPeriod > 30000) {
      newWaitPeriod = 30000
    }
    const now = Date.now()
    const nextTryMs = now + newWaitPeriod
    const nextTryDate = new Date(nextTryMs)

    // Queue for retry
    await this.state.prismaClient.relayRequests.update({
      where: {
        id: requestWithKey.request.id,
      },
      data: {
        tries: {
          increment: 1,
        },
        nextTry: nextTryDate,
        lastWaitPeriodMs: newWaitPeriod,
        locked: false,
      },
    })
  }

  getDrippieAddress = () => {
    const addr = process.env.DRIPPIE_ADDRESS
    if (!addr) {
      this.logger.error('[Relayer]: Drippie address is not defined')
    } else {
      return addr
    }
  }

  dripFunds = async (
    networkName: string,
    chainId: bigint,
    rpcProvider: SphinxJsonRpcProvider,
    wallet: ethers.Wallet,
    requestId: string
  ) => {
    this.logger.error(`[Relayer]: insufficient funds`, {
      requestId,
      chainId,
      networkName,
    })
    const dripSize = ethers.parseUnits(
      fetchDripSizeForNetwork(chainId),
      'ether'
    )

    this.logger.info(`[Relayer ${networkName}]: Wallet balance low`)
    const drippieAddress = this.getDrippieAddress()

    if (!drippieAddress) {
      return
    }

    // Log an error if the Drippie contract does not have sufficient funds
    if ((await rpcProvider.getBalance(drippieAddress)) < dripSize) {
      throw new Error(
        `[Relayer: ${networkName}]: Failed to withdraw new funds from Drippie contract, insufficent balance`
      )
    } else {
      const Drippie = new ethers.Contract(
        drippieAddress,
        DrippieArtifact.abi,
        wallet
      )
      const currentDripVersion = fetchDripVersionForNetwork(chainId)
      const baseDripName = `sphinx_fund_${await wallet.getAddress()}`
      const dripName =
        baseDripName + (currentDripVersion > 0 ? `_${currentDripVersion}` : '')

      const executable: boolean = await callWithTimeout(
        await Drippie.executable(
          dripName,
          getGasPriceOverrides(rpcProvider, wallet, ExecutionMode.Platform)
        ),
        30000,
        `Failed to read executable value from Drippie contract`
      )

      // If drip is executable, then drip funds
      if (executable) {
        await callWithTimeout(
          (await await Drippie.drip(dripName)).wait(1),
          60000,
          `Failed to withdraw from Drippie contract`
        )
      } else {
        this.logger.error(
          `[Relayer: ${networkName}]: Failed to withdraw new funds from Drippie contract, drip is not executable`,
          { RelayerAddress: wallet.address, networkName }
        )
      }
    }
  }

  checkPreviousTries = async (
    requestWithKey: Pick<RequestWithKey, 'request'>,
    provider: SphinxJsonRpcProvider
  ) => {
    if (requestWithKey.request.relayTries.length > 0) {
      this.logger.info(
        `[Relayer ${requestWithKey.request.network.displayName}]: Checking ${requestWithKey.request.relayTries.length} previous tries for this relay request`,
        {
          relayRequestId: requestWithKey.request.id,
        }
      )
    }

    let foundCompletedPreviousTry: boolean = false
    for (const requestAttempt of requestWithKey.request.relayTries) {
      // If we don't have a hash, the skip fetching the receipt
      if (requestAttempt.hash === null) {
        this.logger.info('[Relayer]: Skipping fetching receipt for relay try', {
          relayTryId: requestAttempt.id,
        })
        continue
      }

      const response = await provider.getTransaction(requestAttempt.hash)
      const receipt = await provider.getTransactionReceipt(requestAttempt.hash)

      if (response && receipt) {
        this.logger.info(
          `[Relayer ${requestWithKey.request.network.displayName}]: Detected previous try which completed`,
          {
            relayRequestId: requestWithKey.request.id,
            relayTryId: requestAttempt.id,
          }
        )

        await this.handleSuccess(
          requestWithKey,
          requestAttempt,
          receipt,
          response
        )
      }
    }

    return foundCompletedPreviousTry
  }

  /**
   * Checks if estimateGas resulted in a `SphinxModule: insufficient gas` error
   *
   * This occurs if the fee required for the transaction exceeds the amount of funds in the wallet. For some reason,
   * estimateGas does not return an insufficient funds error in this case. Instead, it just assumes we have to use a
   * lower gas limit and then errors with `SphinxModule: insufficient gas`.
   */
  isEstimateGasInsufficientGas = (e: any) => {
    if (
      e.message.includes('SphinxModule: insufficient gas') &&
      e.message.includes('estimateGas')
    ) {
      return true
    } else {
      return false
    }
  }

  sendTransaction = async (requestWithKey: RequestWithKey) => {
    const lockedRelayRequest =
      await this.state.prismaClient.relayRequests.updateMany({
        where: {
          id: requestWithKey.request.id,
          locked: false,
        },
        data: {
          locked: true,
        },
      })

    if (lockedRelayRequest.count === 0) {
      return
    }

    const provider = await fetchRPCProvider(BigInt(requestWithKey.key.chainId))
    const wallet = new ethers.Wallet(
      requestWithKey.key.privateKey,
      provider as any
    )

    // Send a transaction
    try {
      this.logger.info(
        `[Relayer ${requestWithKey.request.network.displayName}]: Sending transaction request ${requestWithKey.request.id}`
      )

      // check status of any previous tries
      const completedPreviousTry = await this.checkPreviousTries(
        requestWithKey,
        provider
      )

      if (completedPreviousTry) {
        return
      }

      const dripSize = ethers.parseUnits(
        fetchDripSizeForNetwork(BigInt(requestWithKey.key.chainId)),
        'ether'
      )
      if ((await provider.getBalance(wallet.address)) <= dripSize) {
        await this.dripFunds(
          requestWithKey.request.network.name,
          BigInt(requestWithKey.request.network.id),
          provider,
          wallet,
          requestWithKey.request.id
        )
      }

      let txGasLimit = requestWithKey.request.gasLimit
        ? BigInt(requestWithKey.request.gasLimit)
        : undefined
      if (
        requestWithKey.request.minimumActionsGasLimit &&
        shouldBufferExecuteActionsGasLimit(
          BigInt(requestWithKey.request.chainId)
        )
      ) {
        const gasEstimate = await wallet.estimateGas({
          to: getPermissionlessRelayAddress(),
          data: requestWithKey.request.data,
        })

        const block = await provider.getBlock('latest')
        if (!block?.gasLimit) {
          this.logger.error(
            '[Relayer]: Failed to fetch gas limit for network when overriding actions gas limit',
            {
              requestId: requestWithKey.request.id,
              network: requestWithKey.request.network.displayName,
            }
          )
          return
        }

        let limit =
          BigInt(gasEstimate) +
          BigInt(requestWithKey.request.minimumActionsGasLimit)
        const maxGasLimit = getMaxGasLimit(block.gasLimit)
        if (limit > maxGasLimit) {
          limit = maxGasLimit
        }

        txGasLimit = limit
      }

      if (
        requestWithKey.request.chainId === 100 ||
        requestWithKey.request.chainId === 10200
      ) {
        const block = await provider.getBlock('latest')
        if (!block) {
          throw new Error('Could not fetch block on Gnosis')
        }
        txGasLimit = (block.gasLimit / BigInt(4)) * BigInt(3)
      }

      // Create the request
      const txRequest = await getGasPriceOverrides(
        provider,
        wallet as any,
        ExecutionMode.Platform,
        {
          to: requestWithKey.request.to,
          from: wallet.address,
          value: BigInt(requestWithKey.request.value),
          data: requestWithKey.request.data as string,
          gasLimit: txGasLimit,
        }
      )

      // Populate, sign, and calculate the hash
      txRequest.gasLimit = txRequest.gasLimit
        ? txRequest.gasLimit
        : await wallet.estimateGas(txRequest)
      const populatedTx = await wallet.populateTransaction(txRequest)
      const signature = await wallet.signTransaction(populatedTx)
      const predictedHash = ethers.keccak256(signature)

      // Record transaction in db before sending
      // We have to do this because transactions may fail during the initial sendTransaction call
      const attempt = await this.state.prismaClient.relayTries.upsert({
        where: {
          hash: predictedHash,
        },
        create: {
          to: txRequest.to?.toString(),
          hash: predictedHash,
          value: populatedTx.value?.toString() ?? undefined,
          data: populatedTx.data,
          gasLimit: populatedTx.gasLimit?.toString() ?? undefined,
          gasPrice: populatedTx.gasPrice?.toString() ?? undefined,
          mined: false,
          maxFeePerGas: populatedTx.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: populatedTx.maxPriorityFeePerGas?.toString(),
          nonce: populatedTx.nonce,
          from: populatedTx.from,
          confirmations: 0,
          relayRequestId: requestWithKey.request.id,
        },
        update: {
          to: txRequest.to?.toString(),
          hash: predictedHash,
          value: populatedTx.value?.toString() ?? undefined,
          data: populatedTx.data,
          gasLimit: populatedTx.gasLimit?.toString() ?? undefined,
          gasPrice: populatedTx.gasPrice?.toString() ?? undefined,
          mined: false,
          maxFeePerGas: populatedTx.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: populatedTx.maxPriorityFeePerGas?.toString(),
          nonce: populatedTx.nonce,
          from: populatedTx.from,
          confirmations: 0,
          relayRequestId: requestWithKey.request.id,
        },
      })

      // Send the request
      const txResponse = await wallet.sendTransaction(populatedTx)

      if (predictedHash !== txResponse.hash) {
        throw Error('Predicted hash does not match actual hash')
      }

      // record transaction in db
      const requestAttempt = await this.state.prismaClient.relayTries.upsert({
        where: {
          hash: attempt.hash,
        },
        create: {
          to: txRequest.to?.toString(),
          hash: txResponse.hash,
          value: txResponse.value?.toString() ?? undefined,
          blockHash: txResponse.blockHash ?? undefined,
          blockNumber: txResponse.blockNumber ?? undefined,
          data: txResponse.data,
          gasLimit: txResponse.gasLimit?.toString() ?? undefined,
          gasPrice: txResponse.gasPrice?.toString() ?? undefined,
          mined: txResponse.isMined(),
          maxFeePerGas: txResponse.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txResponse.maxPriorityFeePerGas?.toString(),
          nonce: txResponse.nonce,
          from: txResponse.from,
          confirmations: await txResponse.confirmations(),
          relayRequestId: requestWithKey.request.id,
        },
        update: {
          to: txRequest.to?.toString(),
          hash: txResponse.hash,
          value: txResponse.value?.toString() ?? undefined,
          blockHash: txResponse.blockHash ?? undefined,
          blockNumber: txResponse.blockNumber ?? undefined,
          data: txResponse.data,
          gasLimit: txResponse.gasLimit?.toString() ?? undefined,
          gasPrice: txResponse.gasPrice?.toString() ?? undefined,
          mined: txResponse.isMined(),
          maxFeePerGas: txResponse.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txResponse.maxPriorityFeePerGas?.toString(),
          nonce: txResponse.nonce,
          from: txResponse.from,
          confirmations: await txResponse.confirmations(),
          relayRequestId: requestWithKey.request.id,
        },
      })

      // wait for tx to be confirmed
      await callWithTimeout(
        txResponse.wait(1),
        60000,
        'Timed out waiting for transaction to be mined'
      )

      await this.state.prismaClient.$transaction(
        async () => {
          const response = await provider.getTransaction(requestAttempt.hash)
          const receipt = await provider.getTransactionReceipt(
            requestAttempt.hash
          )
          await this.handleSuccess(
            requestWithKey,
            requestAttempt,
            receipt,
            response
          )
        },
        {
          maxWait: 5000, // default: 2000
          timeout: 30000, // default: 5000
        }
      )
    } catch (e: any) {
      // Handle errors due to the transaction timing out
      if (e.message.includes('Timed out waiting for transaction to be mined')) {
        this.logger.info('[Relayer]: Transaction timed out, retrying')
      } else if (e.message.includes('Create2 call failed')) {
        this.logger.error(
          '[Relayer]: Failed deploying safe, already deployed',
          { requestId: requestWithKey.request.id }
        )
      } else if (
        e.message.includes(
          'insufficient funds for intrinsic transaction cost'
        ) ||
        e.message.includes('InsufficientFunds') ||
        this.isEstimateGasInsufficientGas(e)
      ) {
        await this.dripFunds(
          requestWithKey.request.network.name,
          BigInt(requestWithKey.request.network.id),
          provider,
          wallet,
          requestWithKey.request.id
        )
      } else {
        this.logger.error(`[Relayer]: relay request error`, {
          error: serializeError(e),
          requestId: requestWithKey.request.id,
          network: requestWithKey.request.network.displayName,
        })
      }

      await this.incrementTries(requestWithKey)
    }
    // Unlock key
    this.unlockKey(requestWithKey.key.networkName, requestWithKey.key.id)
  }

  updateStatus = async () => {
    await this.state.prismaClient.$transaction(
      async (prisma) => {
        // Find any org where all the entire deployment is complete on all chains
        const completed = await prisma.multiChainDeployments.findMany({
          where: {
            status: MultichainDeploymentStatus.funded,
            treeChainStatus: {
              every: {
                status: TreeStatus.completed,
              },
            },
          },
        })

        if (completed.length > 0) {
          // TODO: It's counter intuitive that the deployment status would be updated here
          // We should move this to the executor or to a dedicated service
          // Update the status for fully executed projects
          for (const complete of completed) {
            await prisma.multiChainDeployments.update({
              where: {
                id: complete.id,
              },
              data: {
                status: MultichainDeploymentStatus.executed,
              },
            })
          }
        }
      },
      {
        maxWait: 90000, // default: 2000
        timeout: 120000, // default: 5000
      }
    )
  }

  async main() {
    // Cancel any requests that were queued for cancelation
    const cancelRequests = await this.state.prismaClient.relayRequests.findMany(
      {
        where: {
          status: RelayRequestStatus.queuedForCancelation,
        },
        include: {
          network: true,
          multichainDeployment: true,
          relayTries: true,
        },
      }
    )
    await Promise.all(
      cancelRequests.map(async (request) => {
        const provider = await fetchRPCProvider(BigInt(request.chainId))
        await this.checkPreviousTries({ request }, provider)
        return this.state.prismaClient.relayRequests.update({
          where: {
            id: request.id,
          },
          data: {
            status: RelayRequestStatus.canceled,
          },
        })
      })
    )

    // Get the first 10 relay requests which:
    // Have not been completed yet
    // Have been retried less than 5 times
    // Have a retry time in the past
    // Ordered by oldest first
    const requests = await this.state.prismaClient.relayRequests.findMany({
      where: {
        completed: false,
        executable: true,
        nextTry: {
          lt: new Date(),
        },
        status: RelayRequestStatus.queued,
        locked: false,
      },
      orderBy: [
        {
          modified: 'asc',
        },
      ],
      take: 10,
      include: {
        network: true,
        multichainDeployment: true,
        relayTries: true,
      },
    })

    if (requests.length === 0) {
      this.logger.info(`[Relayer]: No requests`)
    }

    const requestsWithKey: RequestWithKey[] = []
    // Attempt all relay requests
    for (const request of requests) {
      // Find and lock a key
      const key = this.findAndLockKey(request.network.name)

      // If no key found, then continue and don't count as try
      if (key === undefined) {
        continue
      } else {
        requestsWithKey.push({
          request,
          key,
        })
      }
    }

    // call async function for all requests with keys to submit requests
    this.logger.info(`[Relayer]: sending ${requestsWithKey.length} requests`)
    const transactionPromises = requestsWithKey.map((request) =>
      this.sendTransaction(request)
    )

    // await promise.all
    await Promise.all(transactionPromises)

    await this.updateStatus()

    this.unlockAllKeys()
  }
}

if (require.main === module) {
  const service = new SphinxRelayer()
  service.run()
}
