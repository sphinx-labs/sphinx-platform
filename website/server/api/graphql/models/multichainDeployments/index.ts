import { MultichainDeploymentStatus } from '@prisma/client'

import { builder } from '@/server/api/graphql/builder'
import { MultichainDeploymentStatusType } from '@/server/api/graphql/scalars'
import { authorize } from '@/server/api/graphql/utils'

const GetMultichainDeploymentInput = builder.inputType(
  'GetMultichainDeploymentInput',
  {
    fields: (t) => ({
      id: t.string({ required: true }),
    }),
  }
)

builder.prismaObject('MultiChainDeployments', {
  fields: (t) => ({
    id: t.exposeID('id'),
    created: t.field({
      type: 'Date',
      resolve: (parent) => parent.created,
    }),
    modified: t.field({
      type: 'Date',
      resolve: (parent) => parent.modified,
    }),
    status: t.field({
      type: MultichainDeploymentStatusType,
      resolve: (parent) => parent.status,
    }),
    project: t.relation('project'),
    isTestnet: t.exposeBoolean('isTestnet'),
    treeRoot: t.exposeString('treeRoot'),
    totalTxs: t.exposeInt('totalTxs'),
    organization: t.relation('organization'),
    treeSigners: t.relation('treeSigners'),
    treeChainStatus: t.relation('treeChainStatus', {
      query: {
        orderBy: {
          chainId: 'asc',
        },
      },
    }),
    projectDeployments: t.relation('projectDeployments'),
  }),
})

builder.queryField('multichainDeployment', (t) =>
  t.prismaField({
    type: 'MultiChainDeployments',
    nullable: true,
    args: {
      input: t.arg({
        type: GetMultichainDeploymentInput,
        required: true,
      }),
    },
    resolve: async (_query, _root, _args, context) => {
      if (!_args.input.id) {
        return undefined
      }
      authorize(context)

      return context.prisma.multiChainDeployments.findUniqueOrThrow({
        where: {
          id: _args.input.id,
          orgId: context.token?.orgId,
          status: {
            not: MultichainDeploymentStatus.cancelled,
          },
        },
      })
    },
  })
)
