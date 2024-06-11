import { Flex, Heading } from '@chakra-ui/react'
import React from 'react'

import { CodeCopy } from '@/components/code-copy'
import { GetUserQuery } from '@/types/gql/graphql'

type Props = {
  organization: GetUserQuery['user']['organization']
}

export const APICredentials: React.FC<Props> = ({ organization }) => {
  return (
    <Flex flexDir="column" width="min-content">
      <Heading size="md" mb="3">
        API Credentials
      </Heading>
      <CodeCopy code={organization.id} title={'Org ID:'} props={{ mb: 3 }} />
      <CodeCopy
        hide={true}
        code={organization.apiKeys.at(-1)?.apiKey ?? ''}
        title={'API Key:'}
      />
    </Flex>
  )
}
