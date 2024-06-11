/**
 * @jest-environment node
 */

import { existsSync, readFileSync, rmSync } from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'
import {
  MultiChainDeployments,
  MultichainDeploymentStatus,
  Organizations,
  PrismaClient,
  ProjectDeploymentStatus,
  ProjectDeployments,
  ProjectNetworks,
  Projects,
  SafeDeploymentStrategy,
  User,
} from '@prisma/client'
import { MerkleRootStatus, SphinxLock } from '@sphinx-labs/core'
import {
  COMPILER_CONFIG_VERSION,
  fetchURLForNetwork,
} from '@sphinx-labs/core/dist/networks'
import { makeSphinxContext } from '@sphinx-labs/plugins/dist/cli/context'
import { propose } from '@sphinx-labs/plugins/dist/cli/propose'
import { ZeroAddress, keccak256, toUtf8Bytes } from 'ethers'
import {
  PrivateKeyAccount,
  WalletClient,
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  parseEther,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { foundry, optimismGoerli } from 'viem/chains'

import { SphinxArtifact } from '../../artifact-generator/src'
import { SphinxExecutor } from '../../executor/src'
import { SphinxRelayer } from '../../relayer/src'
import { handleAddSignature } from '../server/api/graphql/models/multichainDeployments/mutations/addSignature'
import { cancelDeployment } from '../server/api/graphql/models/multichainDeployments/mutations/cancel'
import {
  DisallowedOwnersError,
  DuplicateNameError,
  DuplicateOwnersError,
  ExistingSafeError,
  ForbiddenCharsNameError,
  InvalidAddressError,
  InvalidSaltError,
  InvalidThresholdError,
  NameLengthError,
  WhitespaceNameError,
  ZeroOwnersError,
  createProject,
} from '../server/api/graphql/models/projects/mutations/createProject'
import {
  ProposeApiRequest,
  assertNoProjectWithSameNameAndDifferentSafe,
  assertNoProjectWithSameSafeAndDifferentName,
  assertProjectNotCurrentlyExecuting,
  assertProjectOwnedByThisOrg,
  validateInput,
  writeProposalToDB,
} from '../server/api/propose'
import { prisma } from '../server/utils/prisma'
import { sphinxModuleAbi } from '../types/wagmi/generated'

export const ownerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
export const ownerTwoAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
export const ownerThreeAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'

const contractReferenceNames = [
  '__sphinx__/contracts/HelloSphinx.sol:HelloSphinx',
]
const multiSigOwners = [ownerAddress, ownerTwoAddress, ownerThreeAddress]
const multiSigThreshold = 2

const baseScriptPath = './__sphinx__/script/TestConfigs.s.sol'
const CancelConfigOne = 'CancelConfigOne'
const CancelConfigTwo = 'CancelConfigTwo'
const ContractDeploymentFailureConfigOne = 'ContractDeploymentFailureConfigOne'
const ContractDeploymentFailureConfigTwo = 'ContractDeploymentFailureConfigTwo'
const AssertProjectNotCurrentylExecutingConfig =
  'AssertProjectNotCurrentylExecutingConfig'
const EOAOwnerConfig = 'EOAOwnerConfig'
const AirdropConfig = 'AirdropConfig'
const MultiSigOwnerConfig = 'MultiSigOwnerConfig'
const PostDeploymentConfig = 'PostDeploymentConfig'
const PostDeploymentFailureConfig = 'PostDeploymentFailureConfig'
const ReproposeConfigOne = 'ReproposeConfigOne'
const ReproposeConfigTwo = 'ReproposeConfigTwo'
const ReproposeConfigZero = 'ReproposeConfigZero'
const SimultaneousProposalConfig = 'SimultaneousProposalConfig'
const OwnerChangeRejectionInitial = 'OwnerChangeRejectionInitial'
const OwnerChangeRejectionAddOwner = 'OwnerChangeRejectionAddOwner'
const OwnerChangeRejectionRemoveOwner = 'OwnerChangeRejectionRemoveOwner'
const OwnerChangeRejectionChangeThreshold =
  'OwnerChangeRejectionChangeThreshold'
const OwnerChangeRejectionChangeSalt = 'OwnerChangeRejectionChangeSalt'
const OwnerChangeRejectionDifferentName = 'OwnerChangeRejectionDifferentName'

type TestDeployment = MultiChainDeployments & {
  organization: Organizations & {
    teammates: User[]
  }
  projectDeployments: (ProjectDeployments & {
    projectNetwork: ProjectNetworks
  })[]
  project: Projects
}

const ownerKeys: Record<string, string> = {
  [ownerAddress]: process.env.PROJECT_OWNER_PRIVATE_KEY!,
  [ownerTwoAddress]: process.env.PROJECT_OWNER_TWO_PRIVATE_KEY!,
  [ownerThreeAddress]: process.env.PROJECT_OWNER_THREE_PRIVATE_KEY!,
}

const fetchDeployment = async (id: string, prismaClient: PrismaClient) => {
  const deployment = await prismaClient.multiChainDeployments.findUnique({
    where: {
      id,
    },
  })

  expect(deployment).toBeTruthy()

  return deployment
}

const handleSign = async (
  walletClient: WalletClient,
  root: string,
  account: PrivateKeyAccount
) => {
  const domain = {
    name: 'Sphinx',
    version: '1.0.0',
  }

  const types = { MerkleRoot: [{ name: 'root', type: 'bytes32' }] }
  const message = { root }

  return walletClient.signTypedData({
    account,
    domain,
    message,
    primaryType: 'MerkleRoot',
    types,
  })
}

export const handleStoreConfigInDB = async (
  orgId: string,
  version: string,
  hash: string,
  deploymentConfigData: string
) => {
  const compilerConfig = await prisma.deploymentConfigs.upsert({
    where: {
      hash,
      orgId,
    },
    create: {
      hash,
      orgId,
      version,
      compilerConfig: JSON.parse(deploymentConfigData),
    },
    update: {},
  })

  return compilerConfig.id
}

const makeWebsiteTestSphinxContext = () => {
  const context = makeSphinxContext()
  context.isLiveNetwork = async () => {
    return true
  }
  return context
}

const proposeWithoutCLI = async (
  isTestnet: boolean,
  scriptPath: string,
  targetContract: string
) => {
  const orgId = process.env.SPHINX_ORG_ID!

  // Generate proposal request using dryrun
  const { proposalRequest, deploymentConfigData } = await propose({
    confirm: true,
    networks: isTestnet ? ['testnets'] : ['mainnets'],
    isDryRun: true,
    silent: false,
    scriptPath,
    sphinxContext: makeWebsiteTestSphinxContext(),
    targetContract,
  })

  expect(proposalRequest).toBeTruthy()

  const compilerConfigId = await handleStoreConfigInDB(
    orgId,
    COMPILER_CONFIG_VERSION,
    keccak256(toUtf8Bytes(deploymentConfigData!)),
    deploymentConfigData!
  )
  proposalRequest!.compilerConfigId = compilerConfigId

  // Validate proposal request
  validateInput(proposalRequest!)

  // Write proposal to DB
  const responseMessage = await writeProposalToDB(proposalRequest!)

  if (
    typeof responseMessage === 'string' &&
    responseMessage !== 'success' &&
    responseMessage !== 'Already Proposed'
  ) {
    throw new Error(responseMessage)
  }

  const deployment = await prisma.multiChainDeployments.findFirst({
    where: {
      treeRoot: proposalRequest?.tree.root!,
    },
    include: {
      organization: {
        include: {
          teammates: true,
        },
      },
      projectDeployments: {
        include: {
          projectNetwork: true,
        },
      },
      project: true,
    },
    orderBy: {
      created: 'desc',
    },
  })

  return { deployment, responseMessage }
}

const ProposeRegisterDeposit = async (
  scriptPath: string,
  targetContract: string,
  isTestnet: boolean = true
) => {
  const opGoerliRPCUrl = fetchURLForNetwork(BigInt(11155420))
  const account = privateKeyToAccount(
    process.env.PROJECT_OWNER_PRIVATE_KEY! as `0x${string}`
  )

  const { deployment } = await proposeWithoutCLI(
    isTestnet,
    scriptPath,
    targetContract
  )

  // register balance contract
  const walletClient = createWalletClient({
    chain: optimismGoerli,
    transport: http(opGoerliRPCUrl),
  })

  const publicClient = createPublicClient({
    chain: optimismGoerli,
    transport: http(opGoerliRPCUrl),
  })

  const relayer = new SphinxRelayer()
  await relayer.init()
  await relayer.clearMetrics()

  return {
    deployment,
    account,
    walletClient,
    publicClient,
    relayer,
  }
}

const ExecuteAndCheckDeployment = async (
  deployment: TestDeployment,
  relayer: SphinxRelayer,
  referenceNames: string[],
  projectShouldFail: {
    [chainId: string]: {
      failureReason: string | null
      contracts: string[]
    }
  } = {}
) => {
  // Execute Deployment
  const executor = new SphinxExecutor()
  await executor.init()
  while (
    (await fetchDeployment(deployment?.id!, prisma))?.status !==
    MultichainDeploymentStatus.executed
  ) {
    await executor.main(relayer)
    await relayer.main()
  }

  await relayer.clearMetrics()
  await relayer.stop()
  await executor.clearMetrics()
  await executor.stop()

  // check that the multichain deploy and project status' are correct
  const finalDeployment = await prisma.multiChainDeployments.findUnique({
    where: {
      id: deployment?.id!,
    },
    include: {
      artifact: true,
      projectDeployments: {
        include: {
          projectNetwork: {
            include: {
              contracts: true,
            },
          },
        },
      },
    },
  })
  expect(finalDeployment).toBeTruthy()
  expect(finalDeployment?.status).toEqual(MultichainDeploymentStatus.executed)
  expect(finalDeployment?.projectDeployments.length).toBeGreaterThan(0)
  expect(existsSync(`./deployments/${finalDeployment?.artifact?.id}`))

  for (const projectDeployment of finalDeployment?.projectDeployments || []) {
    const shouldFail = projectShouldFail[projectDeployment.chainId.toString()]
    if (shouldFail) {
      expect(projectDeployment.failed).toEqual(true)
    }
    expect(projectDeployment.status).toEqual(ProjectDeploymentStatus.executed)

    const expectedContracts = shouldFail?.contracts ?? referenceNames

    // Check expected contracts were deployed
    expect(
      projectDeployment.projectNetwork.contracts
        .map((contract) => contract.contractName)
        .sort()
    ).toEqual(expectedContracts.sort())

    if (shouldFail) {
      expect(projectDeployment.failureReason).toEqual(shouldFail.failureReason)
    }
  }

  // check that the deployment has been completed on all chains
  for (const projectDeployment of finalDeployment?.projectDeployments || []) {
    const moduleAddress = projectDeployment.projectNetwork.moduleAddress

    const chainClient = createPublicClient({
      transport: http(fetchURLForNetwork(BigInt(projectDeployment.chainId))),
    })

    const onChainDeployment = await chainClient.readContract({
      address: moduleAddress as `0x${string}`,
      abi: sphinxModuleAbi,
      functionName: 'merkleRootStates',
      args: [deployment.treeRoot as `0x${string}`],
    })

    if (onChainDeployment === undefined) {
      throw new Error('Could not find deployment status on chain')
    }

    const shouldFail = projectShouldFail[projectDeployment.chainId.toString()]
    expect(onChainDeployment[4]?.toString()).toEqual(
      shouldFail
        ? MerkleRootStatus.FAILED.toString()
        : MerkleRootStatus.COMPLETED.toString()
    )
  }

  // Wait for the deployment to be marked as completed
  const artifactGenerator = new SphinxArtifact()
  await artifactGenerator.init()
  while (
    (await fetchDeployment(deployment?.id!, prisma))?.status !== 'completed'
  ) {
    await artifactGenerator.main()
  }
  await artifactGenerator.stop()
  await artifactGenerator.clearMetrics()

  // Check we recorded exactly one cost for each transaction
  const transactionCosts = await prisma.transactionCosts.groupBy({
    by: ['txHash'],
    where: {
      multichainDeploymentId: finalDeployment!.id,
    },
    _count: true,
  })
  expect(transactionCosts.find((cost) => cost._count !== 1)).toBeUndefined()

  return finalDeployment?.projectDeployments
}

// TODO - test doing a testnet deployment then follow up with a mainnet deployment
// TODO - test doing a deployment that deploys a contract, then do another deployment that deploy a second contract, both contracts should be recorded properly
// TODO - test if you propose a deployment, then approve the deployment, then attempt to propose another deployment, an error will be thrown
// TODO - test more error cases when proposing

beforeAll(async () => {
  const lock: SphinxLock = JSON.parse(readFileSync('./sphinx.lock').toString())

  for (const project of Object.values(lock.projects)) {
    const existingProject = await prisma.projects.findFirst({
      where: {
        name: project.projectName,
      },
    })

    if (!existingProject) {
      await createProject(
        project.defaultSafe.owners,
        project.defaultSafe.threshold,
        project.defaultSafe.saltNonce,
        project.projectName,
        process.env.SPHINX_ORG_ID!,
        prisma
      )
    }
  }
})

describe('Integration Tests', () => {
  describe('Multichain Deployments', () => {
    beforeAll(() => {
      rmSync('./deployments', { recursive: true, force: true })
    })

    test('does execute with eoa', async () => {
      console.log('does execute with eoa')

      const config = EOAOwnerConfig
      const { deployment, account, walletClient, relayer } =
        await ProposeRegisterDeposit(baseScriptPath, config)

      console.log(deployment?.treeRoot)

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment?.treeRoot!, account)
      )

      await ExecuteAndCheckDeployment(
        deployment!,
        relayer,
        contractReferenceNames
      )
    }, 300000)

    test('does execute with multisig', async () => {
      console.log('does execute with multisig')

      const config = MultiSigOwnerConfig
      const { deployment, relayer } = await ProposeRegisterDeposit(
        baseScriptPath,
        config
      )

      let signed = 0
      for (const owner of multiSigOwners) {
        const key = ownerKeys[owner]
        const ownerAccount = privateKeyToAccount(key! as `0x${string}`)
        const ownerClient = createWalletClient({
          account: ownerAccount,
          transport: http(fetchURLForNetwork(BigInt(11155420))),
        })

        // add owner signature
        await handleAddSignature(
          prisma,
          deployment?.id!,
          ownerAccount.address,
          await handleSign(ownerClient, deployment?.treeRoot!, ownerAccount)
        )

        signed += 1

        // Break if we've signed enough signatures
        if (signed >= multiSigThreshold) {
          break
        }
      }

      await ExecuteAndCheckDeployment(
        deployment!,
        relayer,
        contractReferenceNames
      )
    }, 300000)

    test('does execute with post deployment actions', async () => {
      console.log('does execute with post deployment actions')

      const config = PostDeploymentConfig
      const { account, walletClient, deployment, relayer } =
        await ProposeRegisterDeposit(baseScriptPath, config)
      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment?.treeRoot!, account)
      )
      const referenceName = '__sphinx__/contracts/HelloSphinx.sol:HelloSphinx'
      const projectDeployments = await ExecuteAndCheckDeployment(
        deployment!,
        relayer,
        [referenceName]
      )

      expect(projectDeployments).toBeDefined()

      for (const projectDeployment of projectDeployments!) {
        const chainClient = createPublicClient({
          transport: http(
            fetchURLForNetwork(BigInt(projectDeployment.chainId))
          ),
        })

        // check that the post deployment actions have been executed
        const address =
          projectDeployment.projectNetwork.contracts.at(0)?.address
        const abi = [
          {
            inputs: [],
            name: 'myAddress',
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'myNumber',
            outputs: [{ name: '', type: 'uint8' }],
            stateMutability: 'view',
            type: 'function',
          },
        ] as const

        const myAddress = await chainClient.readContract({
          address: address as `0x${string}`,
          abi,
          functionName: 'myAddress',
        })

        const myNumber = await chainClient.readContract({
          address: address as `0x${string}`,
          abi,
          functionName: 'myNumber',
        })

        expect(myNumber).toEqual(4)
        expect(myAddress).toEqual('0x0000000000000000000000000000000000000022')
      }
    }, 300000)

    test('does execute deployment with airdrop', async () => {
      console.log('does execute deployment with airdrop')

      const config = AirdropConfig
      const { deployment, account, walletClient, relayer } =
        await ProposeRegisterDeposit(baseScriptPath, config)

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment?.treeRoot!, account)
      )

      const projectDeployments = await ExecuteAndCheckDeployment(
        deployment!,
        relayer,
        contractReferenceNames
      )

      expect(projectDeployments).toBeDefined()

      for (const projectDeployment of projectDeployments!) {
        const chainClient = createPublicClient({
          transport: http(
            fetchURLForNetwork(BigInt(projectDeployment.chainId))
          ),
        })

        // check that the post deployment actions have been executed
        const contractAddress =
          projectDeployment.projectNetwork.contracts.at(0)?.address

        const contractBalance = await chainClient.getBalance({
          address: contractAddress as `0x${string}`,
        })
        const safeBalance = await chainClient.getBalance({
          address: projectDeployment.projectNetwork
            .safeAddress as `0x${string}`,
        })
        const twoAddressBalance = await chainClient.getBalance({
          address:
            '0x0000000000000000000000000000000000000002' as `0x${string}`,
        })

        expect(safeBalance.toString()).toEqual(
          parseEther('0.03', 'wei').toString()
        )
        expect(contractBalance.toString()).toEqual(
          parseEther('0.01', 'wei').toString()
        )
        expect(twoAddressBalance.toString()).toEqual(
          parseEther('0.02', 'wei').toString()
        )
      }
    }, 300000)
  })

  describe('Mid Deployment Failures', () => {
    beforeAll(() => {
      rmSync('./deployments', { recursive: true, force: true })
    })

    test('does handle failure in post depoyment actions', async () => {
      console.log('does handle failure in post depoyment actions')

      const config = PostDeploymentFailureConfig
      const { deployment, account, walletClient, relayer } =
        await ProposeRegisterDeposit(baseScriptPath, config)

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment?.treeRoot!, account)
      )

      // mine linea goerli so the block number > 50
      const testClient = createTestClient({
        chain: foundry,
        mode: 'anvil',
        transport: http(fetchURLForNetwork(BigInt(59141))),
      })
      await testClient.mine({
        blocks: 50,
      })

      await ExecuteAndCheckDeployment(
        deployment!,
        relayer,
        ['__sphinx__/contracts/HelloSphinx.sol:HelloSphinx'],
        {
          59141: {
            failureReason:
              'HelloSphinx<0xeb0dA746411Aae1921CF4a79903d03af77E3E4Ff>.doRevert()',
            contracts: ['__sphinx__/contracts/HelloSphinx.sol:HelloSphinx'],
          },
        }
      )

      const publicClient = createPublicClient({
        chain: foundry,
        transport: http(fetchURLForNetwork(BigInt(59141))),
      })
    }, 300000)

    test('does handle contract deployment failure', async () => {
      console.log('does handle contract deployment failure')

      const config = ContractDeploymentFailureConfigOne
      const { deployment, account, walletClient, relayer } =
        await ProposeRegisterDeposit(baseScriptPath, config)

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment?.treeRoot!, account)
      )
      // mine linea goerli so the block number > 500
      const testClient = createTestClient({
        chain: foundry,
        mode: 'anvil',
        transport: http(fetchURLForNetwork(BigInt(59141))),
      })
      await testClient.mine({
        blocks: 500,
      })

      await ExecuteAndCheckDeployment(
        deployment!,
        relayer,
        ['__sphinx__/contracts/FailsDeployment.sol:FailsDeployment'],
        {
          59141: {
            failureReason:
              'FailsDeployment<0x67995bF382C5C2d82Cb948870cDFd12B89b6AdFd>.deploy(\n     "_shouldRevert": true\n   )',
            contracts: [],
          },
        }
      )
    }, 300000)

    test('does execute deployment canceling previous failed deployment', async () => {
      console.log(
        'does execute deployment canceling previous failed deployment'
      )

      const config = ContractDeploymentFailureConfigTwo

      const { deployment, account, walletClient, relayer } =
        await ProposeRegisterDeposit(baseScriptPath, config)

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment!.treeRoot!, account)
      )

      await ExecuteAndCheckDeployment(deployment!, relayer, [
        '__sphinx__/contracts/FailsDeployment.sol:FailsDeployment',
      ])
    }, 300000)
  })

  describe('Create Project Checks', () => {
    const projectName = 'create_project_check'

    beforeAll(async () => {
      const existingProject = await prisma.projects.findFirst({
        where: {
          name: projectName,
        },
      })

      if (!existingProject) {
        await createProject(
          ['0x0000000000000000000000000000000000000003'],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      }
    })

    test('assertSafeDoesNotAlreadyExist', async () => {
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000003'],
          '1',
          '0',
          'different_project_name',
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(ExistingSafeError)
    })

    test('assertNoInvalidOwners', async () => {
      // Expect to throw if owner is address(0)
      await expect(
        createProject(
          [ZeroAddress],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(DisallowedOwnersError)

      // Expect to throw if owner is address(1)
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000001'],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(DisallowedOwnersError)

      // Expect to throw if duplicate owners
      await expect(
        createProject(
          [
            '0x0000000000000000000000000000000000000002',
            '0x0000000000000000000000000000000000000002',
          ],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(DuplicateOwnersError)

      // Expect to throw if not an address
      await expect(
        createProject(
          ['0xabcd'],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(new InvalidAddressError('0xabcd'))

      // Expect to throw if zero owners
      await expect(
        createProject(
          [],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(ZeroOwnersError)
    })

    test('assertValidThreshold', async () => {
      // Expect to throw if threshold is not a string
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          1 as unknown as string,
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidThresholdError)

      // Expect to throw if threshold is numeric
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          'abcd',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidThresholdError)

      // Expect to throw if threshold is less than 1
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '0',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidThresholdError)

      // Expect to throw if threshold is greater than the number of owners
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '2',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidThresholdError)
    })

    test('assertValidSaltNonce', async () => {
      // Expect to throw if saltNonce is not a string
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          0 as unknown as string,
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidSaltError)

      // Expect to throw if salt nonce is numeric
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          'abcd',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidSaltError)

      // Expect to throw if saltNonce is less than 0
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          '-1',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(InvalidSaltError)
    })

    test('assertValidProjectName', async () => {
      // Expect to throw if project name contains any invalid char
      const forbidden = ['/', ':', '*', '?', '"', '<', '>', '|']
      for (const char of forbidden) {
        await expect(
          createProject(
            ['0x0000000000000000000000000000000000000002'],
            '1',
            '0',
            char,
            process.env.SPHINX_ORG_ID!,
            prisma
          )
        ).rejects.toThrow(ForbiddenCharsNameError)
      }

      // Expect to throw if name is length 0
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          '0',
          '',
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(NameLengthError)

      // Expect to throw if name is length 255
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          '0',
          '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(NameLengthError)

      // Expect to throw if project name has already been used
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          '0',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(DuplicateNameError)

      // Expect to throw if project name has already been used
      await expect(
        createProject(
          ['0x0000000000000000000000000000000000000002'],
          '1',
          '0',
          'Project with whitespace',
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      ).rejects.toThrow(WhitespaceNameError)
    })
  })

  describe('Proposal Checks', () => {
    const projectName = 'proposal_check_project'
    let project:
      | (Projects & {
          safeDeploymentStrategy: SafeDeploymentStrategy | null
        })
      | undefined

    beforeAll(async () => {
      const existingProject = await prisma.projects.findFirst({
        where: {
          name: projectName,
        },
      })

      if (!existingProject) {
        project = await createProject(
          ['0x0000000000000000000000000000000000000003'],
          '1',
          '1',
          projectName,
          process.env.SPHINX_ORG_ID!,
          prisma
        )
      }
    })

    test('assertNoProjectWithSameSafeAndDifferentName', async () => {
      const assertSuccess = await assertNoProjectWithSameSafeAndDifferentName({
        safeAddress: project?.safeDeploymentStrategy?.address!,
        uniqueProjectIdentifier: projectName,
      })

      expect(assertSuccess).toEqual(false)

      const assertFail = await assertNoProjectWithSameSafeAndDifferentName({
        safeAddress: project?.safeDeploymentStrategy?.address!,
        uniqueProjectIdentifier: 'wrong_project_name',
      })

      expect(assertFail).toContain(
        'Detected another project with the same owners, salt, and threshold but a different name.'
      )
    })

    test('assertNoProjectWithSameNameAndDifferentSafe', async () => {
      const assertSuccess = await assertNoProjectWithSameNameAndDifferentSafe({
        safeAddress: project?.safeDeploymentStrategy?.address!,
        uniqueProjectIdentifier: project?.name!,
        orgId: project?.orgId!,
      })

      expect(assertSuccess).toEqual(false)

      const assertFail = await assertNoProjectWithSameNameAndDifferentSafe({
        safeAddress: ZeroAddress,
        uniqueProjectIdentifier: project?.name!,
        orgId: project?.orgId!,
      })

      expect(assertFail).toContain(
        `Detected another project with the name ${project?.name!} and different owners, threshold, or salt.`
      )
    })

    test('assertProjectOwnedByThisOrg', async () => {
      const assertSuccess = await assertProjectOwnedByThisOrg({
        safeAddress: project?.safeDeploymentStrategy?.address!,
        orgId: project?.orgId!,
      })

      expect(assertSuccess).toEqual(false)

      const assertFail = await assertProjectOwnedByThisOrg({
        safeAddress: project?.safeDeploymentStrategy?.address!,
        orgId: 'fake-org-id',
      })

      expect(assertFail).toContain(
        'Project with same owner(s) and salt is already registered to a different organization'
      )
    })

    test('assertProjectNotCurrentlyExecuting', async () => {
      console.log('assertProjectNotCurrentlyExecuting')

      const config = AssertProjectNotCurrentylExecutingConfig

      const project = await prisma.projects.findFirst({
        where: {
          name: 'Sphinx-Website-Test-AssertProjectNotCurrentylExecutingConfig',
        },
      })

      const { deployment, account, walletClient } =
        await ProposeRegisterDeposit(baseScriptPath, config, false)

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment!.treeRoot!, account)
      )

      const assertFail = await assertProjectNotCurrentlyExecuting({
        isTestnet: false,
        orgId: project?.orgId!,
        projectId: project?.id!,
        tree: {
          root: 'fake-root',
        } as ProposeApiRequest['body']['tree'],
      })

      expect(assertFail).toEqual(
        'Deployment for this project is currently executing, please wait for it to complete before proposing a new deployment'
      )

      await cancelDeployment(deployment?.id!, prisma, deployment?.orgId!)

      const assertSuccess = await assertProjectNotCurrentlyExecuting({
        isTestnet: false,
        orgId: project?.orgId!,
        projectId: project?.id!,
        tree: {
          root: 'fake-root',
        } as ProposeApiRequest['body']['tree'],
      })

      expect(assertSuccess).toEqual(false)
    }, 300000)
  })

  describe('Proposals', () => {
    beforeAll(() => {
      rmSync('./deployments', { recursive: true, force: true })
    })

    test('does cancel outdated deployment', async () => {
      console.log('does cancel outdated deployment')

      const { deployment } = await proposeWithoutCLI(
        true,
        baseScriptPath,
        CancelConfigOne
      )
      expect(deployment?.status).toEqual(MultichainDeploymentStatus.proposed)

      const { deployment: secondDeployment } = await proposeWithoutCLI(
        true,
        baseScriptPath,
        CancelConfigTwo
      )
      const oldDeployment = await prisma.multiChainDeployments.findUnique({
        where: {
          id: deployment!.id,
        },
        include: {
          projectDeployments: true,
        },
      })

      expect(secondDeployment?.status).toEqual(
        MultichainDeploymentStatus.proposed
      )
      expect(oldDeployment?.status).toEqual(
        MultichainDeploymentStatus.cancelled
      )
      expect(
        oldDeployment?.projectDeployments.map(
          (projectDeployment) => projectDeployment.status
        )
      ).toEqual(
        oldDeployment?.projectDeployments.map(
          () => ProjectDeploymentStatus.cancelled
        )
      )
    }, 300000)

    test('does propose testnet and mainnet deployment at once', async () => {
      console.log('does propose testnet and mainnet deployment at once')

      const config = SimultaneousProposalConfig
      const { deployment: firstDeployment } = await proposeWithoutCLI(
        true,
        baseScriptPath,
        config
      )
      expect(firstDeployment?.status).toEqual(
        MultichainDeploymentStatus.proposed
      )

      const { deployment: secondDeployment } = await proposeWithoutCLI(
        false,
        baseScriptPath,
        config
      )

      const firstAfterSecond = await prisma.multiChainDeployments.findUnique({
        where: {
          id: firstDeployment!.id,
        },
        include: {
          projectDeployments: true,
        },
      })

      expect(firstAfterSecond?.status).toEqual(
        MultichainDeploymentStatus.proposed
      )
      expect(
        firstAfterSecond?.projectDeployments.map(
          (projectDeployment) => projectDeployment.status
        )
      ).toEqual(
        firstAfterSecond?.projectDeployments.map(
          () => ProjectDeploymentStatus.approved
        )
      )

      expect(secondDeployment?.status).toEqual(
        MultichainDeploymentStatus.proposed
      )
    }, 300000)

    test('does cancel, repropose, and execute deployment', async () => {
      console.log('does cancel and then repropose deployment')

      // propose zero deployment (used for the next test)
      await proposeWithoutCLI(true, baseScriptPath, ReproposeConfigZero)

      // propose first deployment
      const { deployment } = await proposeWithoutCLI(
        true,
        baseScriptPath,
        ReproposeConfigOne
      )
      expect(deployment?.status).toEqual(MultichainDeploymentStatus.proposed)

      // propose second deployment
      const { deployment: secondDeployment } = await proposeWithoutCLI(
        true,
        baseScriptPath,
        ReproposeConfigTwo
      )

      const firstDeployment = await prisma.multiChainDeployments.findUnique({
        where: {
          id: deployment!.id,
        },
      })

      // Check that the original deployment has been cancelled and the new (second) deployment is proposed
      expect(secondDeployment?.status).toEqual(
        MultichainDeploymentStatus.proposed
      )
      expect(firstDeployment?.status).toEqual(
        MultichainDeploymentStatus.cancelled
      )

      // propose the original (third) deployment
      const {
        deployment: thirdDeployment,
        relayer,
        account,
        walletClient,
      } = await ProposeRegisterDeposit(baseScriptPath, ReproposeConfigOne)

      // Fetch the first and second deployments again after the third has been proposed
      const firstDeploymentAfterThird =
        await prisma.multiChainDeployments.findUnique({
          where: {
            id: deployment!.id,
          },
          include: {
            projectDeployments: true,
          },
        })
      const secondDeploymentAfterThird =
        await prisma.multiChainDeployments.findUnique({
          where: {
            id: secondDeployment!.id,
          },
          include: {
            projectDeployments: true,
          },
        })

      // Check that the original deployment has been resurrected
      expect(firstDeploymentAfterThird?.status).toEqual(
        MultichainDeploymentStatus.proposed
      )
      expect(
        firstDeploymentAfterThird?.projectDeployments.map(
          (projectDeployment) => projectDeployment.status
        )
      ).toEqual(
        firstDeploymentAfterThird?.projectDeployments.map(
          () => ProjectDeploymentStatus.approved
        )
      )

      // Check that second deployment and all of it's project deployments are cancelled
      expect(secondDeploymentAfterThird?.status).toEqual(
        MultichainDeploymentStatus.cancelled
      )
      expect(
        secondDeploymentAfterThird?.projectDeployments.map(
          (projectDeployment) => projectDeployment.status
        )
      ).toEqual(
        secondDeploymentAfterThird?.projectDeployments.map(
          () => ProjectDeploymentStatus.cancelled
        )
      )

      // add owner signature
      await handleAddSignature(
        prisma,
        deployment?.id!,
        account.address,
        await handleSign(walletClient, deployment?.treeRoot!, account)
      )

      await ExecuteAndCheckDeployment(
        thirdDeployment!,
        relayer,
        contractReferenceNames
      )
    }, 500000)
  })
})
