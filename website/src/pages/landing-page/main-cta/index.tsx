'use client'

import { Flex, Heading, Spacer, Text } from '@chakra-ui/react'

import { JoinTheWaitlist } from '@/components/join-the-waitlist'

type Props = {
  format: 'mobile' | 'desktop'
}

export const MainCTA: React.FC<Props> = ({ format }) => {
  return (
    <Flex
      width="100vw"
      alignItems="center"
      justifyContent="center"
      px="20"
      paddingTop={format === 'desktop' ? '0' : '10'}
      flexDir={format === 'mobile' ? 'column' : 'row'}
    >
      <Flex
        flexDirection="column"
        alignItems={format === 'desktop' ? 'start' : 'center'}
        justifyContent="center"
        width={format === 'desktop' ? '40vw' : '90vw'}
        height={format === 'desktop' ? '88vh' : '400px'}
      >
        <Flex
          flexDirection="column"
          alignItems="start"
          width="100%"
          paddingBottom={format === 'desktop' ? '25' : '5'}
        >
          <Heading
            mb="5"
            size={format === 'desktop' ? '2xl' : 'lg'}
            textAlign={format === 'desktop' ? 'start' : 'center'}
            lineHeight="normal"
          >
            DevOps for smart contract deployments
          </Heading>
          <Text textAlign={format === 'desktop' ? 'start' : 'center'}>
            An automated deployment platform for Foundry users.
          </Text>
        </Flex>
        <JoinTheWaitlist />
      </Flex>
      <Spacer />
      {format === 'desktop' && (
        <iframe
          width="640"
          height="416"
          src="https://www.loom.com/embed/bdda9eae675f4cda818cb92558ee9f0f?sid=72258a59-fc35-4b21-a552-4b0886ee4ffa"
        ></iframe>
      )}
    </Flex>
  )
}
