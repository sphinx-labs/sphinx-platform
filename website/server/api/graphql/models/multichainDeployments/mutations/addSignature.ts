import {
  MultiChainDeployments,
  MultichainDeploymentStatus,
  Prisma,
  PrismaClient,
  ProjectDeployments,
  ProjectNetworks,
  Projects,
  TreeStatus,
} from '@prisma/client'

import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'
import { DefaultArgs } from '@prisma/client/runtime/library'

const AddMultiChainDeploymentSignatureInput = builder.inputType(
  'AddMultiChainDeploymentSignatureInput',
  {
    fields: (t) => ({
      multichainDeploymentId: t.string({ required: true }),
      signer: t.string({ required: true }),
      signature: t.string({ required: true }),
    }),
  }
)

export const triggerDeployment = async (
  prisma: Omit<
    PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  multichainDeployment: MultiChainDeployments & {
    projectDeployments: (ProjectDeployments & {
      projectNetwork: ProjectNetworks
    })[]
    project: Projects
  }
) => {
  // Trigger the deployment
  const unregisteredNetworks = multichainDeployment.projectDeployments.filter(
    (projectDeployment) => !projectDeployment.projectNetwork.registered
  )

  // If there's any networks where the project multisig is unregistered, then register it
  if (unregisteredNetworks.length > 0) {
    await prisma.projectNetworks.updateMany({
      where: {
        projectId: multichainDeployment.project.id,
      },
      data: {
        registered: true,
      },
    })
  }

  await prisma.treeChainStatus.updateMany({
    where: {
      multichainDeploymentId: multichainDeployment.id,
    },
    data: {
      status: TreeStatus.executingDeployment,
    },
  })

  await prisma.multiChainDeployments.update({
    where: {
      id: multichainDeployment.id,
    },
    data: {
      status: MultichainDeploymentStatus.funded,
    },
  })
}

export const handleAddSignature = async (
  prismaClient: PrismaClient,
  multichainDeploymentId: string,
  signer: string,
  signature: string
) => {
  await prismaClient.$transaction(async (prisma) => {
    const alreadySigned = await prisma.treeSigners.findFirst({
      where: {
        multichainDeploymentId,
        signer,
        signed: true,
      },
    })

    if (alreadySigned) {
      throw new Error('Already signed')
    }

    // Add the signature
    await prisma.treeSigners.update({
      where: {
        multichainDeploymentId_signer: {
          multichainDeploymentId,
          signer,
        },
      },
      data: {
        signature,
        signed: true,
      },
    })

    // Fetch the org deployment and all leaves, so we can check if it is complete
    const multichainDeployment =
      await prisma.multiChainDeployments.findUniqueOrThrow({
        where: {
          id: multichainDeploymentId,
        },
        include: {
          treeSigners: true,
          projectDeployments: {
            include: {
              projectNetwork: true,
            },
          },
          project: {
            include: {
              projectOwners: true,
              projectNetworks: true,
            },
          },
        },
      })

    // If any signers are still required, then return the deployment
    const signatures = multichainDeployment.treeSigners.filter(
      (s) => s.signed
    ).length

    if (signatures < multichainDeployment.project.threshold) {
      return multichainDeployment
    }

    // Otherwise, mark the deployment as approved
    await prisma.multiChainDeployments.update({
      where: {
        id: multichainDeploymentId,
      },
      data: {
        status: MultichainDeploymentStatus.approved,
      },
    })

    await triggerDeployment(prisma, multichainDeployment)
  })

  return prismaClient.multiChainDeployments.findUniqueOrThrow({
    where: {
      id: multichainDeploymentId,
    },
  })
}

builder.mutationField('AddMultiChainDeploymentSignature', (t) =>
  t.field({
    type: 'MultiChainDeployments',
    args: {
      input: t.arg({
        type: AddMultiChainDeploymentSignatureInput,
        required: true,
      }),
    },
    resolve: async (_, { input }, context) => {
      const { multichainDeploymentId, signer, signature } = input

      authorize(context)

      const orgId = context.token?.orgId

      if (!orgId) {
        throw new Error('Failed to find organization')
      }

      const result = await handleAddSignature(
        context.prisma,
        multichainDeploymentId,
        signer,
        signature
      )

      return result
    },
  })
)
