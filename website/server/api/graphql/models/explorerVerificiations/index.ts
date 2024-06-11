import { builder } from '@/server/api/graphql/builder'
import {
  BlockExplorerType,
  ExplorerVerificationStatusType,
} from '@/server/api/graphql/scalars'

builder.prismaObject('ExplorerVerifications', {
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
    tries: t.exposeInt('tries'),
    status: t.field({
      type: ExplorerVerificationStatusType,
      resolve: (parent) => parent.status,
    }),
    explorer: t.field({
      type: BlockExplorerType,
      resolve: (parent) => parent.explorer,
    }),
  }),
})
