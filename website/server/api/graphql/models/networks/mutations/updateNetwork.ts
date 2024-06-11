import { builder } from '@/server/api/graphql/builder'
import { authorizeAdmin } from '@/server/api/graphql/utils'

const UpdateNetworkInput = builder.inputType('UpdateNetworkInput', {
  fields: (t) => ({
    id: t.int({ required: true }),
    name: t.string(),
    displayName: t.string(),
  }),
})

builder.mutationField('UpdateNetwork', (t) =>
  t.field({
    type: 'Networks',
    args: {
      input: t.arg({
        type: UpdateNetworkInput,
        required: true,
      }),
    },
    resolve: async (_, { input: { id, name, displayName } }, context) => {
      authorizeAdmin(context)

      return context.prisma.networks.update({
        where: {
          id,
        },
        data: {
          name: name ?? undefined,
          displayName: displayName ?? undefined,
        },
      })
    },
  })
)
