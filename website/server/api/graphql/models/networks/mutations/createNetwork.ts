import { builder } from '@/server/api/graphql/builder'
import { authorizeAdmin } from '@/server/api/graphql/utils'

const CreateNetworkInput = builder.inputType('CreateNetworkInput', {
  fields: (t) => ({
    id: t.int({ required: true }),
    name: t.string({ required: true }),
    displayName: t.string({ required: true }),
  }),
})

builder.mutationField('CreateNetwork', (t) =>
  t.field({
    type: 'Networks',
    args: {
      input: t.arg({
        type: CreateNetworkInput,
        required: true,
      }),
    },
    resolve: async (_, { input: { name, displayName, id } }, context) => {
      authorizeAdmin(context)

      return context.prisma.networks.create({
        data: {
          id,
          name,
          displayName,
        },
      })
    },
  })
)
