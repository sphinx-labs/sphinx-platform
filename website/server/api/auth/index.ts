import { PrismaAdapter } from '@next-auth/prisma-adapter'
import generateApiKey from 'generate-api-key'
import { NextApiRequest, NextApiResponse } from 'next'
import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'
import EmailProvider from 'next-auth/providers/email'

import { prisma } from '@/server/utils/prisma'

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
const auth = async (req: NextApiRequest, res: NextApiResponse) => {
  const providers = [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ]

  const isDefaultSigninPage =
    req.method === 'GET' && req.query.nextauth?.includes('signin')

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    providers.pop()
  }

  return NextAuth(req, res, {
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    callbacks: {
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      async signIn(params) {
        const code = await prisma.inviteCodes.findFirst({
          where: {
            id: req.query.code as string,
          },
          include: {
            invite: true,
          },
        })

        if (code?.invite?.email && code?.invite?.email !== params.user.email) {
          return false
        }

        const userCode = await prisma.inviteCodes.findFirst({
          where: {
            usedByEmail: params.user.email,
          },
        })

        if (code?.used === false || userCode?.id !== undefined) {
          if (
            req.query.code &&
            req.query.code !== 'none' &&
            code?.used === false
          ) {
            try {
              await prisma.inviteCodes.update({
                where: {
                  id: code.id,
                },
                data: {
                  used: true,
                  usedByEmail: params.user.email,
                },
              })

              const invite = await prisma.invites.findUnique({
                where: {
                  code: code.id,
                },
              })

              if (invite) {
                await prisma.invites.update({
                  where: {
                    id: invite.id,
                  },
                  data: {
                    signedUp: true,
                  },
                })
              }
            } catch (e) {
              console.error(e)
              return false
            }
          }
          return true
        } else {
          const user = await prisma.user.findFirst({
            where: {
              email: params.user.email,
            },
            include: {
              organization: true,
            },
          })

          if (user) {
            return true
          } else {
            return false
          }
        }
      },
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      async session({ session, token }) {
        return {
          ...session,
          userId: token.userId,
          orgId: token.orgId,
          role: token.role,
          image: token.image,
          name: token.name,
        }
      },
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      async jwt({ token, user }) {
        if (!user) {
          return token
        }
        let prismaUser = await prisma.user.findUnique({
          include: {
            organization: true,
          },
          where: {
            id: user.id,
          },
        })

        if (!prismaUser) {
          throw new Error('User not found')
        }

        if (!prismaUser.organization) {
          const name = user.email!.split('@')[0]

          const userCode = await prisma.invites.findUnique({
            where: {
              email: user.email!,
            },
          })

          // If the user was invited to a specific org, then connect them to that org
          const connectOrCreateOrg = userCode?.orgId
            ? { connect: { id: userCode.orgId } }
            : {
                create: {
                  apiKeys: {
                    create: {
                      apiKey: generateApiKey({
                        method: 'string',
                        prefix: 'key',
                        batch: 1,
                      })[0],
                    },
                  },
                },
              }

          const role = userCode?.role ?? undefined

          prismaUser = await prisma.user.update({
            include: {
              organization: true,
            },
            where: {
              id: user.id,
            },
            data: {
              name,
              role,
              organization: {
                ...connectOrCreateOrg,
              },
            },
          })
        }

        return {
          userId: prismaUser.id,
          image: prismaUser.image,
          name: prismaUser.name,
          orgId: prismaUser.orgId,
          role: prismaUser.role,
        } as JWT
      },
    },
  })
}

export default auth
