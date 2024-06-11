import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'
import { MultichainDeploymentStatus } from '@prisma/client'

const GetProjectQueryInput = builder.inputType('GetProjectQueryInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
  }),
})

builder.prismaObject('Projects', {
  fields: (t) => ({
    created: t.field({
      type: 'Date',
      resolve: (parent) => parent.created,
    }),
    modified: t.field({
      type: 'Date',
      resolve: (parent) => parent.modified,
    }),
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    threshold: t.exposeInt('threshold'),
    projectNetworks: t.relation('projectNetworks'),
    projectDeployments: t.relation('projectDeployments', {
      query: {
        orderBy: {
          created: 'desc',
        },
      },
    }),
    multichainDeployments: t.relation('multichainDeployments', {
      query: {
        orderBy: {
          created: 'desc',
        },
        where: {
          status: {
            not: MultichainDeploymentStatus.cancelled,
          },
        },
      },
    }),
    projectOwners: t.relation('projectOwners'),
    contracts: t.relation('contracts'),
    organization: t.relation('organization'),
    safeDeploymentStrategy: t.relation('safeDeploymentStrategy'),
  }),
})

builder.queryField('project', (t) =>
  t.prismaField({
    type: 'Projects',
    nullable: true,
    args: {
      input: t.arg({
        type: GetProjectQueryInput,
        required: true,
      }),
    },
    resolve: async (_query, _root, _args, context) => {
      if (!_args.input.id) {
        return undefined
      }
      authorize(context)

      return context.prisma.projects.findUniqueOrThrow({
        where: {
          id: _args.input.id,
          orgId: context.token?.orgId,
        },
      })
    },
  })
)
