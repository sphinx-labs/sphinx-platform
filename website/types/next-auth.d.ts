import { type Roles } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Session {
    userId?: string
    orgId?: string
    role?: Roles
    name?: string
    image?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    orgId?: string
    role?: Roles
    name?: string
    image?: string
  }
}
