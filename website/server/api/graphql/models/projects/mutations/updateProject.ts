import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'

export class ExistingSafeError extends Error {
  constructor() {
    super('Safe with that address already exists')
    this.name = 'InvariantError'
  }
}

const UpdateProjectInput = builder.inputType('UpdateProjectInput', {
  fields: (t) => ({
    projectId: t.string({ required: true }),
    projectName: t.string({ required: true }),
  }),
})

builder.mutationField('UpdateProject', (t) =>
  t.field({
    type: 'Projects',
    args: {
      input: t.arg({
        type: UpdateProjectInput,
        required: true,
      }),
    },
    resolve: async (_, { input }, context) => {
      authorize(context)

      const { projectName, projectId } = input

      if (!context.token?.orgId) {
        throw new Error('no org id found, should never happen')
      }

      const project = await context.prisma.projects.findUnique({
        where: {
          orgId: context.token?.orgId,
          id: projectId,
        },
      })

      if (project) {
        throw new Error('project not found with that id')
      }

      return context.prisma.projects.update({
        where: {
          id: projectId,
        },
        data: {
          name: projectName,
        },
      })
    },
  })
)
