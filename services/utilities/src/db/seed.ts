import { PrismaClient } from '@prisma/client'

import { syncNetworks } from './backfill-networks'

const createUser = async (
  prisma: PrismaClient,
  email: string,
  apiKey: string,
  orgId: string
) => {
  const name = email?.split('@')[0]

  await prisma.inviteCodes.create({
    data: {
      usedByEmail: email,
      used: true,
    },
  })

  return prisma.user.create({
    include: {
      organization: {
        include: {
          apiKeys: true,
        },
      },
    },
    data: {
      name,
      email,
      emailVerified: new Date(),
      organization: {
        connectOrCreate: {
          where: {
            id: orgId,
          },
          create: {
            id: orgId,
            apiKeys: {
              create: {
                apiKey,
              },
            },
          },
        },
      },
    },
  })
}

export const seedDB = async (
  prisma: PrismaClient,
  users: string[],
  apiKey: string,
  orgId: string
) => {
  await syncNetworks(prisma)
  for (const user of users) {
    await createUser(prisma, user, apiKey, orgId)
  }
}
