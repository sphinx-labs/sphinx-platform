import { builder } from '@/server/api/graphql/builder'
import { TreeStatusType } from '@/server/api/graphql/scalars'

builder.prismaObject('TreeChainStatus', {
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
    leavesExecuted: t.exposeInt('leavesExecuted'),
    numLeaves: t.exposeInt('numLeaves'),
    status: t.field({
      type: TreeStatusType,
      resolve: (parent) => parent.status,
    }),
    multichainDeployment: t.relation('multichainDeployment'),
    network: t.relation('network'),
    projectDeployment: t.relation('projectDeployment'),
  }),
})
