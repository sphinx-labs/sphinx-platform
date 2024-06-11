import { PrismaClient } from '@prisma/client'
import { SPHINX_NETWORKS } from '@sphinx-labs/contracts'
import { DEPRECATED_NETWORKS } from '../networks'

const createNetworkIfNotExist = async (
  id: number,
  name: string,
  displayName: string,
  prisma: PrismaClient
) => {
  await prisma.networks.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      displayName,
    },
    update: {
      id,
      name,
      displayName,
    },
  })
}

const deprecateNetwork = async (id: number, prisma: PrismaClient) => {
  const networkToDeprecate = await prisma.networks.findUnique({
    where: {
      id,
    },
  })

  if (networkToDeprecate) {
    await prisma.networks.update({
      where: {
        id,
      },
      data: {
        deprecated: true,
      },
    })
  }
}

export const syncNetworks = async (prisma: PrismaClient) => {
  for (const network of SPHINX_NETWORKS) {
    console.log(`Creating network: ${network.name}`)
    await createNetworkIfNotExist(
      Number(network.chainId),
      network.name,
      network.displayName,
      prisma
    )
  }

  for (const network of DEPRECATED_NETWORKS) {
    console.log(`Deprecating network: ${network.name}`)
    await deprecateNetwork(Number(network.chainId), prisma)
  }
}
