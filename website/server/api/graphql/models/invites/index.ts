import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('Invites', {
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
    role: t.exposeString('role'),
    email: t.exposeString('email'),
    signedUp: t.exposeBoolean('signedUp'),
  }),
})
