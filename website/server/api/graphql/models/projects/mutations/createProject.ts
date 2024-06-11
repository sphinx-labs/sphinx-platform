import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'
import { PrismaClient, SafeDeploymentMethod } from '@prisma/client'
import { getGnosisSafeProxyAddress } from '@sphinx-labs/contracts/dist/addresses'
import cuid from 'cuid'
import { ZeroAddress } from 'ethers'
import { isAddress } from 'viem'

export class ExistingSafeError extends Error {
  constructor() {
    super('Safe with that address already exists')
  }
}

export class InvalidAddressError extends Error {
  constructor(address: string) {
    super(`Invalid Safe owners address: ${address}`)
  }
}

export class DuplicateOwnersError extends Error {
  constructor(address: string) {
    super(`Duplicate Safe owners address: ${address}`)
  }
}

export class DisallowedOwnersError extends Error {
  constructor(address: string) {
    super(`Disallowed Safe owner address: ${address}`)
  }
}

export class ZeroOwnersError extends Error {
  constructor() {
    super(`You must have at least one Safe owner`)
  }
}

export class InvalidThresholdError extends Error {
  constructor() {
    super(
      'Threshold must be a valid integer greater than 0 and less than the number of owners you have defined.'
    )
  }
}

export class InvalidSaltError extends Error {
  constructor() {
    super('Salt nonce must be a valid integer.')
  }
}

export class ForbiddenCharsNameError extends Error {
  constructor() {
    super('Project name contains forbidden characters: \\/:*?"<>|')
  }
}

export class NameLengthError extends Error {
  constructor() {
    super('Project name length must be between 1 and 255 characters.')
  }
}

export class ReservedNameError extends Error {
  constructor() {
    super('Project name uses a reserved name in Windows.')
  }
}

export class DuplicateNameError extends Error {
  constructor() {
    super('You already have a project with that name.')
  }
}

export class WhitespaceNameError extends Error {
  constructor() {
    super('Project names cannot contain whitespace.')
  }
}

const CreateProjectInput = builder.inputType('CreateProjectInput', {
  fields: (t) => ({
    owners: t.stringList({ required: true }),
    threshold: t.string({ required: true }),
    saltNonce: t.string({ required: true }),
    projectName: t.string({ required: true }),
  }),
})

export const assertSafeDoesNotAlreadyExist = async (
  prisma: PrismaClient,
  safeAddress: string
) => {
  const existingSafe = await prisma.safeDeploymentStrategy.findFirst({
    where: {
      address: safeAddress,
    },
  })

  if (existingSafe) {
    throw new ExistingSafeError()
  }
}

export const assertValidOwner = (address: string) => {
  // All owners must be valid addresses
  if (!isAddress(address)) {
    throw new InvalidAddressError(address)
  }

  // No owners can be address(0) or address(1)
  // address(1) is the SENTINEL_ADDRESS which is a special address used by Safe to handle their owner implementation
  if (
    address === ZeroAddress ||
    address === '0x0000000000000000000000000000000000000001'
  ) {
    throw new DisallowedOwnersError(address)
  }
}

export const assertNoInvalidOwners = (owners: string[]) => {
  if (owners.length === 0) {
    throw new ZeroOwnersError()
  }

  const uniqueOwners = new Set()

  for (const address of owners) {
    assertValidOwner(address)

    // No duplicate owners are allowed
    if (uniqueOwners.has(address)) {
      throw new DuplicateOwnersError(address)
    } else {
      uniqueOwners.add(address)
    }
  }
}

const isNumeric = (str: string) => {
  if (typeof str !== 'string') return false
  return !isNaN(Number(str)) && !isNaN(parseFloat(str))
}

export const assertValidThreshold = (threshold: string, owners: string[]) => {
  // Threshold must be a string
  if (typeof threshold !== 'string') {
    throw new InvalidThresholdError()
  }

  // Must be numeric
  if (!isNumeric(threshold)) {
    throw new InvalidThresholdError()
  }

  // Must be greater than or equal to 1
  if (Number(threshold) < 1) {
    throw new InvalidThresholdError()
  }

  // Must be less than or equal to the number of owners
  if (Number(threshold) > owners.length) {
    throw new InvalidThresholdError()
  }
}

export const assertValidSaltNonce = (saltNonce: string) => {
  // Can be empty since we default to 0 in this case
  if (saltNonce === '') {
    return
  }

  // Must be a string
  if (typeof saltNonce !== 'string') {
    throw new InvalidSaltError()
  }

  // Must be numeric
  if (!isNumeric(saltNonce)) {
    throw new InvalidSaltError()
  }

  // Must be greater than or equal to 0
  if (Number(saltNonce) < 0) {
    throw new InvalidSaltError()
  }
}

export const assertValidProjectName = (
  projectName: string,
  projects: string[]
): void => {
  const forbiddenChars = /[\/:*?"<>|]/

  // Check for forbidden characters
  if (forbiddenChars.test(projectName)) {
    throw new ForbiddenCharsNameError()
  }

  // Check for length restrictions (common maximum length is 255)
  if (projectName.length === 0 || projectName.length > 255) {
    throw new NameLengthError()
  }

  // Reserved names (commonly reserved in Windows)
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
  if (reservedNames.test(projectName)) {
    throw new ReservedNameError()
  }

  // Check for any other projects with this name
  if (projects.includes(projectName)) {
    throw new DuplicateNameError()
  }

  // Check for names that contain whitespace
  if (/\s/.test(projectName)) {
    throw new WhitespaceNameError()
  }
}

export const createProject = async (
  owners: string[],
  threshold: string,
  saltNonce: string,
  projectName: string,
  orgId: string,
  prisma: PrismaClient
) => {
  const projects = await prisma.projects.findMany({
    where: {
      orgId,
    },
  })

  assertNoInvalidOwners(owners)
  assertValidThreshold(threshold, owners)
  assertValidSaltNonce(saltNonce)
  assertValidProjectName(
    projectName,
    projects.map((project) => project.name)
  )

  if (saltNonce === '') {
    saltNonce = '0'
  }

  const safeAddress = getGnosisSafeProxyAddress(
    owners,
    Number(threshold),
    Number(saltNonce)
  )

  await assertSafeDoesNotAlreadyExist(prisma, safeAddress)

  const projectId = cuid()
  return prisma.projects.create({
    include: {
      safeDeploymentStrategy: true,
    },
    data: {
      id: projectId,
      salt: saltNonce,
      threshold: Number(threshold),
      name: projectName,
      orgId,
      safeDeploymentStrategy: {
        create: {
          address: safeAddress,
          deploymentMethod: SafeDeploymentMethod.first_party_consistent,
          safeName: projectName,
          threshold: Number(threshold),
          salt: saltNonce,
          safeOwners: {
            createMany: {
              data: owners.map((owner) => {
                return {
                  projectId,
                  ownerAddress: owner,
                }
              }),
            },
          },
        },
      },
    },
  })
}

builder.mutationField('CreateProject', (t) =>
  t.field({
    type: 'Projects',
    args: {
      input: t.arg({
        type: CreateProjectInput,
        required: true,
      }),
    },
    resolve: async (_, { input }, context) => {
      authorize(context)

      const { owners, threshold, saltNonce, projectName } = input

      if (!context.token?.orgId) {
        throw new Error('no org id found, should never happen')
      }

      return await createProject(
        owners,
        threshold,
        saltNonce,
        projectName,
        context.token.orgId,
        context.prisma
      )
    },
  })
)
