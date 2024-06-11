import { Roles } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { GraphQLContext } from '@/server/api/graphql/context'
import { prisma } from '@/server/utils/prisma'

export const isDifferenceGreaterThan7Days = (
  date1: Date,
  date2: Date
): boolean => {
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  const differenceInTime = Math.abs(date2.getTime() - date1.getTime())
  const differenceInDays = differenceInTime / millisecondsPerDay
  return differenceInDays > 7
}

export const authorizeAPIKey = async (key: string, orgId: string) => {
  if (!key || !orgId) {
    throw new Error('Unauthorized')
  }

  const apiKey = await prisma.apiKeys.findFirst({
    where: {
      AND: {
        apiKey: key,
        organization: {
          id: orgId,
        },
      },
    },
  })

  if (!apiKey) {
    throw new Error('Unauthorized')
  }
}

export const authorize = (context: GraphQLContext) => {
  if (!context.token?.userId) {
    throw new Error('Unauthorized')
  }

  if (!context.token.orgId) {
    throw new Error('No org id found')
  }
}

export const authorizeExecutor = (publicKey: string) => {
  const secret = process.env.ADMIN_SECRET_KEY
  const salt = process.env.ADMIN_SALT

  if (!secret || !salt) {
    throw new Error('Admin secret key and/or salt are not defined')
  }

  const hash = bcrypt.hashSync(secret, salt)
  if (hash !== publicKey) {
    throw new Error('Unauthorized')
  }
}

export const authorizeAdmin = (context: GraphQLContext) => {
  if (!context.token?.role?.includes(Roles.admin)) {
    throw new Error('Unauthorized')
  }
}
