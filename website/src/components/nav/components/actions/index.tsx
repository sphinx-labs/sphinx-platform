import { Session } from 'next-auth'

import { SignIn } from '@/components/nav/components/actions/signIn'
import { NavMenu } from '@/components/nav/components/menu'

type Props = {
  session: Session | null
}

export const NavActions: React.FC<Props> = ({ session }) => {
  return session ? (
    <NavMenu />
  ) : (
    <SignIn text="Sign In" loadingText="Signing in..." />
  )
}
