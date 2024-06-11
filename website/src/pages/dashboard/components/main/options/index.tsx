import { Card, CardBody, Flex } from '@chakra-ui/react'
import React from 'react'

import { GetUserQuery } from '@/types/gql/graphql'
import { APICredentials } from 'src/pages/dashboard/components/main/options/api-credentials'
import { Teammates } from 'src/pages/dashboard/components/main/options/teammates'

type Props = {
  organization: GetUserQuery['user']['organization']
}

export const Options: React.FC<Props> = ({ organization }) => {
  return (
    <Flex flexDir="column" width="100%">
      <Card>
        <CardBody>
          <Teammates organization={organization} />
          <APICredentials organization={organization} />
        </CardBody>
      </Card>
    </Flex>
  )
}
