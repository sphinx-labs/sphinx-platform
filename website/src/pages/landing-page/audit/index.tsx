'use client'

import { Button, Flex, Heading, Link } from '@chakra-ui/react'
import { useRouter } from 'next/router'

type Props = {
  format: 'mobile' | 'desktop'
}

export const Audit: React.FC<Props> = ({ format }) => {
  const router = useRouter()

  return (
    <Flex
      flexDirection="column"
      align="center"
      justifyContent="center"
      px="10"
      width="100%"
      mt="10"
      mb={format === 'desktop' ? '10%' : '20'}
    >
      <Flex flexDirection="column" alignItems="center" width="100%">
        <Heading
          mb="5"
          size={format === 'desktop' ? 'xl' : 'lg'}
          textAlign="center"
          lineHeight="normal"
        >
          Audited by <Link href="https://spearbit.com/">Spearbit</Link>
        </Heading>
        <Button
          onClick={() => {
            router.push(
              'https://github.com/sphinx-labs/sphinx/blob/main/audit/spearbit.pdf'
            )
          }}
        >
          Read the report
        </Button>
      </Flex>
    </Flex>
  )
}
