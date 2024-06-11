import { PrismaClient } from '@prisma/client'
import { seedDB } from '@sphinx-managed/utilities'
const prisma = new PrismaClient()

if (!process.env.SPHINX_ORG_USERS) {
  throw new Error('no SPHINX_ORG_USERS found')
}

if (!process.env.SPHINX_API_KEY) {
  throw new Error('no SPHINX_ORG_USERS found')
}

if (!process.env.SPHINX_ORG_ID) {
  throw new Error('no SPHINX_ORG_ID found')
}

const users = process.env.SPHINX_ORG_USERS.split(',')

seedDB(prisma, users, process.env.SPHINX_API_KEY, process.env.SPHINX_ORG_ID)
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
