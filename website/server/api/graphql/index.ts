import { createYoga } from 'graphql-yoga'
import { NextApiRequest, NextApiResponse } from 'next'

import { createContext, GraphQLContext } from '@/server/api/graphql/context'
import { schema } from '@/server/api/graphql/schema'

export default createYoga<
  {
    req: NextApiRequest
    res: NextApiResponse
  },
  GraphQLContext
>({
  context: async ({ req }) => createContext(req),
  schema,
  graphqlEndpoint: '/api/graphql',
})
