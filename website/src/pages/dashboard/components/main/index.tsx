import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { useState } from 'react'

import { GetUserQuery } from '@/types/gql/graphql'
import { GettingStarted } from 'src/pages/dashboard/components/getting-started'
import { Options } from 'src/pages/dashboard/components/main/options'
import { Projects } from 'src/pages/dashboard/components/main/projects'

type Props = {
  user: GetUserQuery['user']
}

export const MainBoard: React.FC<Props> = ({ user }) => {
  const [tabIndex, setTabIndex] = useState(0)

  const handleTabsChange = (index: number) => {
    setTabIndex(index)
  }

  const projects = user.organization.projects

  const goToInvitePage = () => {
    setTabIndex(1)
  }

  return (
    <>
      <Box w="100%" h="100%">
        <Tabs
          mt="5%"
          variant="enclosed"
          index={tabIndex}
          onChange={handleTabsChange}
        >
          <TabList>
            <Tab ml="5">Projects</Tab>
            <Tab>Options</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {projects.length > 0 ? (
                <Projects
                  projects={projects}
                  organization={user.organization}
                  goToInvitePage={goToInvitePage}
                />
              ) : (
                <GettingStarted
                  organization={user.organization}
                  goToInvitePage={goToInvitePage}
                />
              )}
            </TabPanel>
            <TabPanel>
              <Options organization={user?.organization} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  )
}
