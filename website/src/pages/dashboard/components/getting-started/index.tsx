import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Spinner,
  Text,
} from '@chakra-ui/react'

import { GetUserQuery } from '@/types/gql/graphql'
import { CreateProject } from 'src/pages/dashboard/components/create-project'
import { IntegrateSphinx } from 'src/pages/dashboard/components/integrate'

type Props = {
  organization: GetUserQuery['user']['organization'] | undefined
  goToInvitePage: () => void
  projectName?: string
}

export const GettingStarted: React.FC<Props> = ({
  organization,
  goToInvitePage,
  projectName,
}) => {
  return (
    <Box width="100%" height="100%">
      <Card>
        <CardHeader mb="0" pb="0">
          <Heading size="lg">Welcome to Sphinx</Heading>
          <Text pt="2" fontSize="md">
            {'Sphinx is a DevOps platform for smart contract deployments.'}
          </Text>
        </CardHeader>
        {organization ? (
          <CardBody>
            {organization.projects.length === 0 ? (
              <Flex>
                <Box>
                  <Heading size="md">Get Started</Heading>
                  <Flex flexDir="column">
                    <Text pt="2" fontSize="md">
                      {
                        "Get started with Sphinx by creating your first project. If you're part of a team, invite your teammates to join Sphinx."
                      }
                    </Text>
                    <Flex mt="3">
                      <CreateProject
                        projects={organization.projects}
                        variant="standard"
                      />
                      <Button ml="3" onClick={goToInvitePage}>
                        Invite Teammates
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              </Flex>
            ) : (
              <IntegrateSphinx
                organization={organization}
                goToInvitePage={goToInvitePage}
                projectName={projectName}
              />
            )}
          </CardBody>
        ) : (
          <Spinner />
        )}
      </Card>
    </Box>
  )
}
