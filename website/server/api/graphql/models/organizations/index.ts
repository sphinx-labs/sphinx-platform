import { MultichainDeploymentStatus } from '@prisma/client'

import { builder } from '@/server/api/graphql/builder'

export const getLastMonth = () => {
  const monthStart = new Date()
  monthStart.setMonth(monthStart.getMonth() - 1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
}

builder.prismaObject('Organizations', {
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
    teammates: t.relation('teammates'),
    invites: t.relation('invites'),
    apiKeys: t.relation('apiKeys'),
    projects: t.relation('projects', {
      query: {
        orderBy: {
          created: 'desc',
        },
      },
    }),
    multiChainDeployments: t.relation('multiChainDeployments', {
      query: {
        where: {
          status: {
            not: MultichainDeploymentStatus.cancelled,
          },
        },
        orderBy: {
          modified: 'desc',
        },
      },
    }),
  }),
})
