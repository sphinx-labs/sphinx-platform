import { Roles } from '@prisma/client'
import { GraphQLError } from 'graphql'

import { builder } from '@/server/api/graphql/builder'
import { authorize } from '@/server/api/graphql/utils'
import { sendMemberInvite } from '@/server/sendgrid'

const InviteTeammateInput = builder.inputType('InviteTeammateInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    role: t.string({ required: true }),
  }),
})

builder.mutationField('InviteTeammate', (t) =>
  t.field({
    type: 'Organizations',
    args: {
      input: t.arg({
        type: InviteTeammateInput,
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
        throw new Error('Organization not found')
      }

      if (context.token?.role !== Roles.owner) {
        throw new Error('Only owners can invite teammates')
      }

      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY not found')
      }

      if (!process.env.EMAIL_FROM) {
        throw new Error('EMAIL_FROM not found')
      }

      if (!process.env.EMAIL_SERVER) {
        throw new Error('EMAIL_SERVER not found')
      }

      if (!process.env.SENDGRID_MEMBER_INVITE_EMAIL_TEMPLATE) {
        throw new Error('SENDGRID_MEMBER_INVITE_EMAIL_TEMPLATE not found')
      }

      const teammate = await context.prisma.user.findUnique({
        where: {
          email,
        },
      })

      const previousInvite = await context.prisma.invites.findUnique({
        where: {
          email,
        },
      })

      if (teammate) {
        throw new GraphQLError(
          'User already has an account, please contact support for assistance.'
        )
      }

      if (previousInvite) {
        throw new GraphQLError('Invite already sent to this email')
      }

      const roles = Object.values(Roles)
      if (!roles.includes(role as Roles)) {
        throw new GraphQLError('Invalid role')
      }

      await context.prisma.$transaction(async (prisma) => {
        // Create invite
        const invite = await prisma.invites.create({
          data: {
            email,
            role: role as Roles,
            organization: {
              connect: {
                id: organization.id,
              },
            },
            inviteCode: {
              create: {
                sent: true,
              },
            },
          },
        })

        // Sendgrid, send invite email
        const signupLink = `${process.env.NEXT_PUBLIC_VERCEL_URL}/signup?code=${invite.code}`
        await sendMemberInvite(email, signupLink)
      })

      return context.prisma.organizations.findUniqueOrThrow({
        where: {
          id: context.token?.orgId,
        },
        include: {
          teammates: true,
        },
      })
    },
  })
)
