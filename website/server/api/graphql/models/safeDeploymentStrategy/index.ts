import { builder } from '@/server/api/graphql/builder'
import { SafeDeploymentMethodType } from '@/server/api/graphql/scalars'

builder.prismaObject('SafeDeploymentStrategy', {
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
    address: t.exposeString('address', { nullable: true }),
    safeName: t.exposeString('safeName', { nullable: true }),
    deploymentMethod: t.field({
      type: SafeDeploymentMethodType,
      resolve: (parent) => parent.deploymentMethod,
    }),
  }),
})
