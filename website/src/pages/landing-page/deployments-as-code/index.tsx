'use client'

import { Flex, Grid, GridItem, Heading, Text } from '@chakra-ui/react'

type Props = {
  format: 'mobile' | 'desktop'
}

export const DeploymentsAsCode: React.FC<Props> = ({ format }) => {
  const elements = [
    {
      id: 0,
      title: 'Deployments in CI',
      description:
        'Eliminate human error and improve security by gaslessly triggering deployments from your CI process. Sphinx trustlessly executes your smart contract deployment scripts across all chains.',
    },
    {
      id: 1,
      title: 'Gasless deployments',
      description:
        'The Sphinx protocol is a Gnosis Safe Module designed for deployments. With the Sphinx Module, your Gnosis Safe owners can approve deployments by signing a single meta transaction.',
    },
    {
      id: 2,
      title: 'Completely Trustless',
      description:
        "It's impossible for Sphinx to execute anything that your Gnosis Safe owners have not explicitly approved.",
    },
    {
      id: 3,
      title: 'Unified Billing',
      description:
        'Forget managing native tokens on every network. Sphinx handles the cost and bills you in USD after your deployment completes.',
    },
  ]

  return (
    <Flex
      flexDirection="column"
      align="center"
      justifyContent="center"
      px="10"
      width="100%"
      mb="5%"
    >
      <Flex
        flexDirection="column"
        alignItems="center"
        width="100%"
        paddingBottom="25"
      >
        <Heading
          mb="5"
          size={format === 'desktop' ? '2xl' : 'lg'}
          textAlign="center"
          lineHeight="normal"
        >
          Say goodbye to unreliable deployments{' '}
        </Heading>
        <Text textAlign="center">
          Sphinx gives you confidence in your deployment process by eliminating
          the manual work of creating, approving, executing, and verifying
          deployments on every chain.
        </Text>
      </Flex>
      <Flex
        mt="10"
        flexDir={format === 'desktop' ? 'row' : 'column'}
        alignItems="center"
      >
        <Grid
          ml={format === 'desktop' ? '20' : '0'}
          w={format === 'desktop' ? '80vw' : '100vw'}
          templateRows={
            format === 'desktop' ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)'
          }
          templateColumns={
            format === 'desktop' ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)'
          }
          gap={format === 'desktop' ? '50px' : '0px'}
        >
          {elements.map((element) => {
            return (
              <GridItem
                key={element.id}
                rowSpan={1}
                colSpan={1}
                m={format === 'desktop' ? '0' : '5'}
              >
                <Heading
                  size="lg"
                  textAlign={format === 'desktop' ? 'start' : 'center'}
                >
                  {element.title}
                </Heading>
                <Text
                  mt="2"
                  textAlign={format === 'desktop' ? 'start' : 'center'}
                >
                  {element.description}
                </Text>
              </GridItem>
            )
          })}
        </Grid>
      </Flex>
    </Flex>
  )
}
