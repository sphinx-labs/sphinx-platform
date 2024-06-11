import { Flex } from '@chakra-ui/react'
import { Session } from 'next-auth'
import { RefObject } from 'react'

import { NavBar } from 'src/components/nav'

const DefaultPage = ({
  children,
  session,
  displayActions,
  pricingRef,
  format,
}: {
  children: React.ReactNode
  session: Session | null
  displayActions?: boolean
  pricingRef: RefObject<HTMLDivElement> | undefined
  format?: 'desktop' | 'mobile'
}) => {
  return (
    <>
      <NavBar
        session={session}
        displayActions={displayActions}
        pricingRef={pricingRef}
        format={format}
      />
      <Flex height="100%" width="100%" align="center" justify="center">
        {children}
      </Flex>
    </>
  )
}

export default DefaultPage
