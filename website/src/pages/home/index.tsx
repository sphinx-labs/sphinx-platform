'use client'

import { GetServerSidePropsContext } from 'next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import { useRef } from 'react'

import DefaultPage from '@/components/default-page'
import { useBreakpoint } from '@chakra-ui/react'
import { Dashboard } from 'src/pages/dashboard'
import LandingPage from 'src/pages/landing-page'

type Props = {
  session: Session | null
}

const Home = ({ session }: Props) => {
  const pricingRef = useRef<HTMLDivElement>(null)

  const breakpoint = useBreakpoint()
  const format =
    breakpoint === 'base' || breakpoint === 'sm' ? 'mobile' : 'desktop'

  const page = session ? (
    <Dashboard />
  ) : (
    <LandingPage pricingRef={pricingRef} format={format} />
  )
  return (
    <DefaultPage pricingRef={pricingRef} session={session} format={format}>
      {page}
    </DefaultPage>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  return {
    props: {
      session: await getSession(ctx),
    },
  }
}

export default Home
