import {
  GetProjectQuery,
  GetProjectQueryVariables,
  GetUserQuery,
} from '@/types/gql/graphql'
import { useQuery } from '@apollo/client'
import { Flex, Spinner } from '@chakra-ui/react'
import { useEffect } from 'react'
import { GettingStarted } from 'src/pages/dashboard/components/getting-started'
import { MultiChainDeployment } from 'src/pages/dashboard/components/main/projects/project/multichainDeployment'
import * as query from './getProjectQuery.gql'

type Props = {
  projectId: string
  organization: GetUserQuery['user']['organization']
  goToInvitePage: () => void
}

export type MultichainDeployment = NonNullable<
  NonNullable<GetProjectQuery['project']>['multichainDeployments'][number]
>

export const Project: React.FC<Props> = ({
  projectId,
  organization,
  goToInvitePage,
}) => {
  const { loading, data, refetch } = useQuery<
    GetProjectQuery,
    GetProjectQueryVariables
  >(query, {
    fetchPolicy: 'cache-first',
    variables: {
      input: {
        id: projectId,
      },
    },
  })

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5000)
    return () => clearInterval(interval)
  }, [refetch])

  if (loading) {
    return <Spinner />
  }

  return (
    <Flex flexDir="column">
      {data?.project?.multichainDeployments.length === 0 && (
        <GettingStarted
          organization={organization}
          goToInvitePage={goToInvitePage}
          projectName={data.project.name ?? undefined}
        />
      )}
      {data?.project?.multichainDeployments.map((deployment) => (
        <MultiChainDeployment
          key={deployment.id}
          multichainDeployment={deployment}
          organization={organization}
        />
      ))}
    </Flex>
  )
}
