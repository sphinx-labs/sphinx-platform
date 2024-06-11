import { builder } from '@/server/api/graphql/builder'

builder.prismaObject('TreeSigners', {
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
    signer: t.exposeString('signer'),
    signature: t.exposeString('signature', { nullable: true }),
    signed: t.exposeBoolean('signed'),
    multichainDeployment: t.relation('multichainDeployment'),
    isProposer: t.exposeBoolean('isProposer'),
  }),
})
