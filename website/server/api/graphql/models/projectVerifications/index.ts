import { builder } from '@/server/api/graphql/builder'
import { ProjectVerificationStatusType } from '@/server/api/graphql/scalars'

builder.prismaObject('ProjectVerifications', {
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
    status: t.field({
      type: ProjectVerificationStatusType,
      resolve: (parent) => parent.status,
    }),
    explorerVerifications: t.relation('explorerVerifications'),
  }),
})
