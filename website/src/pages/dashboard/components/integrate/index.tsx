import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'

import { CodeCopy } from '@/components/code-copy'
import { GetUserQuery } from '@/types/gql/graphql'

type Props = {
  organization: GetUserQuery['user']['organization']
  goToInvitePage: () => void
  projectName: string | undefined
}

export const IntegrateSphinx: React.FC<Props> = ({
  organization,
  goToInvitePage,
  projectName,
}) => {
  const router = useRouter()

  return (
    <Stack divider={<StackDivider />} spacing="4">
      <Box>
        <Heading size="md">Start Integrating</Heading>
        <Flex flexDir="column">
          <Text pt="2" fontSize="md">
            {
              "Check out one of our getting started guides to set up Sphinx and trigger your first deployment. You'll need your Organization ID, API Key, and Project Name. If you're part of a team, invite your teammates to join Sphinx."
            }
          </Text>
          <Flex mt="3">
            <Button
              onClick={() =>
                router.push(
                  'https://github.com/sphinx-labs/sphinx#getting-started'
                )
              }
              rightIcon={<ExternalLinkIcon />}
            >
              Getting Started
            </Button>
            <Button ml="3" mr="3" onClick={goToInvitePage}>
              Invite Teammates
            </Button>
            <CodeCopy code={organization.id} title={'Org ID:'} />
            <CodeCopy
              hide={true}
              code={organization.apiKeys.at(-1)?.apiKey ?? ''}
              title={'API Key:'}
            />
            <CodeCopy
              hide={true}
              code={projectName ?? ''}
              title={'Project Name:'}
            />
          </Flex>
        </Flex>
      </Box>
    </Stack>
  )
}
