import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'

builder.prismaObject('User', {
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
    name: t.exposeString('name', { nullable: true }),
    image: t.exposeString('image', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    role: t.exposeString('role'),
    organization: t.relation('organization'),
  }),
})

builder.queryField('user', (t) =>
  t.prismaField({
    type: 'User',
    resolve: async (_query, _root, _args, context) => {
      authorize(context)
      return context.prisma.user.findUniqueOrThrow({
        where: {
          id: context.token?.userId,
        },
      })
    },
  })
)
