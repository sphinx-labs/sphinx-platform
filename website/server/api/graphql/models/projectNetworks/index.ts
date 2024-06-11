import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('ProjectNetworks', {
  fields: (t) => ({
    id: t.exposeID('id'),
    registered: t.exposeBoolean('registered'),
    project: t.relation('project'),
    network: t.relation('network'),
    contracts: t.relation('contracts'),
    projectDeployments: t.relation('projectDeployments'),
  }),
})
