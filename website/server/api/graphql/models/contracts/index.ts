import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('Contracts', {
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
    referenceName: t.exposeString('referenceName'),
    contractName: t.exposeString('contractName'),
    address: t.exposeString('address'),
    project: t.relation('project'),
    network: t.relation('network'),
    projectNetwork: t.relation('projectNetwork'),
    projectVerification: t.relation('projectVerification', { nullable: true }),
  }),
})
