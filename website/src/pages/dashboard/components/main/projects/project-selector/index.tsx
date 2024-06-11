import { GetUserQuery } from '@/types/gql/graphql'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { Dispatch, SetStateAction } from 'react'
import { CreateProject } from 'src/pages/dashboard/components/create-project'

type Props = {
  projects: GetUserQuery['user']['organization']['projects']
  projectName: string | null
  setProjectName: Dispatch<SetStateAction<string | null>>
}

export const ProjectSelector: React.FC<Props> = ({
  projects,
  projectName,
  setProjectName,
}) => {
  return (
    <Menu>
      <MenuButton
        width="min-content"
        as={Button}
        rightIcon={<ChevronDownIcon />}
      >
        {projectName}
      </MenuButton>
      <MenuList maxH="500px" overflow="scroll">
        <CreateProject
          projects={projects}
          buttonProps={{
            ml: 3,
          }}
          variant="menu"
          setSelectedProject={setProjectName}
        />
        {projects.map((project) => {
          return (
            <MenuItem onClick={() => setProjectName(project.name)}>
              {project.name}
            </MenuItem>
          )
        })}
      </MenuList>
    </Menu>
  )
}
