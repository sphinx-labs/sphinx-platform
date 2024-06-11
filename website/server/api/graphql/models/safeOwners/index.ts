import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('SafeOwners', {
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
    projectId: t.exposeID('projectId'),
    safeDeploymentStrategyId: t.exposeID('safeDeploymentStrategyId', {
      nullable: true,
    }),
    ownerAddress: t.exposeString('ownerAddress'),
    project: t.relation('project'),
    safeDeploymentStrategy: t.relation('safeDeploymentStrategy'),
  }),
})
