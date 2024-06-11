import {
  MultichainDeploymentStatus,
  PrismaClient,
  ProjectDeploymentStatus,
} from '@prisma/client'

import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'

const CancelMultichainDeploymentInput = builder.inputType(
  'CancelMultichainDeploymentInput',
  {
    fields: (t) => ({
      multichainDeploymentId: t.string({ required: true }),
    }),
  }
)

export const cancelDeployment = async (
  multichainDeploymentId: string,
  prisma: PrismaClient,
  orgId: string
) => {
  const multichainDeployment = await prisma.multiChainDeployments.findUnique({
    where: {
      id: multichainDeploymentId,
    },
  })

  const allowedToCancel =
    multichainDeployment?.status === 'proposed' ||
    multichainDeployment?.status === 'approved'
  if (!allowedToCancel) {
    throw new Error(
      'You cannot cancel a deployment that is in progress or has already been executed'
    )
  }

  const result = await prisma.multiChainDeployments.update({
    where: {
      id: multichainDeploymentId,
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
      treeSigners: {
        updateMany: {
          where: {},
          data: {
            signature: null,
            signed: false,
          },
        },
      },
    },
  })

  return result
}

builder.mutationField('CancelMultiChainDeployment', (t) =>
  t.field({
    type: 'MultiChainDeployments',
    args: {
      input: t.arg({
        type: CancelMultichainDeploymentInput,
        required: true,
      }),
    },
    resolve: async (_, { input }, context) => {
      const { multichainDeploymentId } = input

      authorize(context)

      const orgId = context.token?.orgId

      if (!orgId) {
        throw new Error('Failed to find organization')
      }

      return cancelDeployment(multichainDeploymentId, context.prisma, orgId)
    },
  })
)
