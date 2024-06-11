import {
  builder,
  ProjectDeploymentErrorCode
} from '@/server/api/graphql/builder'
import { ProjectDeploymentStatusType } from '@/server/api/graphql/scalars'
import { authorize } from '@/server/api/graphql/utils'

builder.prismaObject('ProjectDeployments', {
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
    deploymentId: t.exposeString('deploymentId', { nullable: true }),
    errorCode: t.field({
      type: 'ProjectDeploymentErrorCode',
      nullable: true,
      resolve: (parent) => parent.errorCode as ProjectDeploymentErrorCode,
    }),
    status: t.field({
      type: ProjectDeploymentStatusType,
      resolve: (parent) => parent.status,
    }),
    failed: t.exposeBoolean('failed'),
    failureReason: t.exposeString('failureReason', { nullable: true }),
    failureIndex: t.exposeInt('failureIndex', { nullable: true }),
    multichainDeployment: t.relation('multichainDeployment'),
    project: t.relation('project'),
    network: t.relation('network'),
    contracts: t.relation('contracts'),
    projectVerification: t.relation('projectVerification')
  }),
})

builder.queryField('projectDeployment', (t) =>
  t.prismaField({
    type: 'ProjectDeployments',
    nullable: true,
    args: {
      id: t.arg.string(),
    },
    resolve: async (_query, _root, _args, context) => {
      if (!_args.id) {
        return undefined
      }
      authorize(context)

      return context.prisma.projectDeployments.findUniqueOrThrow({
        where: {
          id: _args.id,
        },
      })
    },
  })
)
