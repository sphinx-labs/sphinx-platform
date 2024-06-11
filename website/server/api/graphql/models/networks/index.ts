import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('Networks', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    created: t.field({
      type: 'Date',
      resolve: (parent) => parent.created,
    }),
    modified: t.field({
      type: 'Date',
      resolve: (parent) => parent.modified,
    }),
    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
  }),
})
