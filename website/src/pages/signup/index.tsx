import { CheckIcon } from '@chakra-ui/icons'
import { Button, Flex, Heading, Input, useToast } from '@chakra-ui/react'
import { GetServerSidePropsContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signIn } from 'next-auth/react'
import { useState } from 'react'

import DefaultPage from '@/components/default-page'

type Props = {
  session: Session | null
  code: string
}

const SignIn: React.FC<Props> = ({ session, code }) => {
  const [email, setEmail] = useState<string>('')
  const toast = useToast()

  const [didSubmit, setDidSubmit] = useState<boolean>(false)
  const [showCheck, setShowCheck] = useState<boolean>(false)

  const handleLogin = () => {
    setDidSubmit(true)
    signIn<'email'>(
      'email',
      {
        redirect: false,
        email,
        callbackUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
      },
      { code }
    )
      .then(async (value) => {
        if (value?.error === 'AccessDenied') {
          setDidSubmit(false)
          toast({
            title: 'Invalid invite code',
            description:
              'Are you sure you are using the correct email and that this invite code has not already been used?',
            status: 'info',
            duration: 5000,
            isClosable: true,
          })
        } else {
          setDidSubmit(false)
          setShowCheck(true)
          toast({
            title: 'Submitted',
            description: 'Check your email for a sign in link',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        }
      })
      .catch((e) => {
        console.error(e)
      })
  }

  return (
    <DefaultPage
      pricingRef={undefined}
      session={session}
      displayActions={false}
    >
      <Flex flexDir="column" mb="5" justifyContent="center" height="100vh">
        <Heading textAlign="center" mb="4">
          Sign Up
        </Heading>
        <Input
          borderRadius="lg"
          mb="5"
          placeholder="Email"
          value={email}
          width="sm"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Flex flexDir="row" mb="3" justifyContent="center">
          <Button
            isDisabled={showCheck || email === ''}
            onClick={handleLogin}
            isLoading={didSubmit}
            loadingText="Sending email..."
            rightIcon={showCheck ? <CheckIcon color="green.500" /> : undefined}
          >
            {showCheck ? 'Email sent' : 'Sign up with Email'}
          </Button>
        </Flex>
      </Flex>
    </DefaultPage>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const code = ctx.query.code

  if (typeof code !== 'string') {
    return {
      redirect: {
        destination: '/',
      },
    }
  }

  return {
    props: {
      session: await getSession(ctx),
      code,
    },
  }
}

export default SignIn
