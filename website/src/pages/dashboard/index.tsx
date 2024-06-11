import { useQuery } from '@apollo/client'
import { Box, Flex, Spinner } from '@chakra-ui/react'
import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

import { GetUserQuery, GetUserQueryVariables } from '@/types/gql/graphql'
import { MainBoard } from 'src/pages/dashboard/components/main'
import * as query from 'src/pages/dashboard/getUserQuery.gql'

export const Dashboard = () => {
  const session = useSession()
  const { loading, data, refetch } = useQuery<
    GetUserQuery,
    GetUserQueryVariables
  >(query, {
    fetchPolicy: 'cache-first',
  })

  const user = data?.user

  useEffect(() => {
    if (loading === false && data === undefined) {
      signOut()
    }
  }, [loading, data, session])

  if (loading || user === undefined) {
    return (
      <Box w="100%" h="100%">
        <Flex align="center" justify="start" flexDir="column" mt="10rem">
          <Spinner />
        </Flex>
      </Box>
    )
  }

  return <MainBoard user={user} />
}
