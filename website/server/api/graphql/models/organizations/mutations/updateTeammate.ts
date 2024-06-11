import { Roles } from '@prisma/client'
import { GraphQLError } from 'graphql'

import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'

const UpdateTeammateInput = builder.inputType('UpdateTeammateInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
})

builder.mutationField('UpdateTeammate', (t) =>
  t.field({
    type: 'Organizations',
    args: {
      input: t.arg({
        type: UpdateTeammateInput,
        required: true,
      }),
    },
    resolve: async (_, { input }, context) => {
      authorize(context)

      const { email, role } = input

      const organization = await context.prisma.organizations.findUniqueOrThrow(
        {
          where: {
            id: context.token?.orgId,
          },
        }
      )

      if (!organization) {
        throw new GraphQLError('Organization not found')
      }

      const user = await context.prisma.user.findUnique({
        where: {
          id: context.token?.userId,
        },
      })

      if (user?.role !== Roles.owner) {
        throw new GraphQLError('Only owners can update teammates')
      }

      if (user.email === email && role !== Roles.owner) {
        const otherOwners = await context.prisma.user.findMany({
          where: {
            orgId: organization.id,
            role: Roles.owner,
            email: {
              not: email,
            },
          },
        })

        const otherInvitedOwners = await context.prisma.invites.findMany({
          where: {
            orgId: organization.id,
            role: Roles.owner,
            email: {
              not: email,
            },
          },
        })

        if (otherOwners.length === 0 && otherInvitedOwners.length === 0) {
          throw new GraphQLError('Cannot remove last owner')
        }
      }

      const teammate = await context.prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!teammate) {
        const invite = await context.prisma.invites.findUnique({
          where: {
            email,
          },
        })

        if (!invite) {
          throw new GraphQLError('User has not been invited yet')
        }

        if (invite.orgId !== context.token?.orgId) {
          throw new GraphQLError('User is not part of this organization')
        }

        await context.prisma.invites.update({
          where: {
            email,
          },
          data: {
            role: role as Roles,
          },
        })
      } else {
        if (teammate.orgId !== context.token?.orgId) {
          throw new GraphQLError('User is not part of this organization')
        }

        if (context.token?.role !== Roles.owner) {
          throw new GraphQLError('Only owners can invite teammates')
        }

        const roles = Object.values(Roles)
        if (!roles.includes(role as Roles)) {
          throw new GraphQLError('Invalid role')
        }

        if (role) {
          await context.prisma.user.update({
            where: {
              email,
            },
            data: {
              role: role as Roles,
            },
          })
        }
      }

      return context.prisma.organizations.findUniqueOrThrow({
        where: {
          id: organization.id,
        },
      })
    },
  })
)
