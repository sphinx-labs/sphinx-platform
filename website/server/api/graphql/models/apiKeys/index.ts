import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('ApiKeys', {
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
    apiKey: t.exposeString('apiKey'),
    orgId: t.exposeString('orgId', { nullable: true }),
  }),
})
