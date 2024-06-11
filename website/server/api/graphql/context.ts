import { initContextCache } from '@pothos/core'
import { PrismaClient } from '@prisma/client'
import { NextApiRequest } from 'next'
import { getToken, JWT } from 'next-auth/jwt'

import { prisma } from '@/server/utils/prisma'

export type GraphQLContext = {
  prisma: PrismaClient
  token: JWT | null
}

export const createContext = async (req: NextApiRequest) => {
  const token = await getToken({ req })
  return {
    ...initContextCache(),
    prisma,
    token,
  }
}
