import { GetUserQuery } from '@/types/gql/graphql'
import { Flex } from '@chakra-ui/react'
import { useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { Project } from 'src/pages/dashboard/components/main/projects/project'
import { ProjectSelector } from 'src/pages/dashboard/components/main/projects/project-selector'

type Props = {
  projects: GetUserQuery['user']['organization']['projects']
  organization: GetUserQuery['user']['organization']
  goToInvitePage: () => void
}

export const Projects: React.FC<Props> = ({
  projects,
  organization,
  goToInvitePage,
}) => {
  const [projectName, setProjectName] = useQueryState('project')
  const project = projects.find((project) => project.name === projectName)

  useEffect(() => {
    if (projectName === null) {
      setProjectName(projects.at(0)?.name ?? null)
    }
  }, [projects.at(0)?.name])

  return (
    <Flex flexDir="column">
      <Flex flexDir="row" mb="5">
        <ProjectSelector
          projects={projects}
          projectName={projectName}
          setProjectName={setProjectName}
        />
      </Flex>

      {project && (
        <Project
          key={projectName}
          projectId={project.id}
          organization={organization}
          goToInvitePage={goToInvitePage}
        />
      )}
    </Flex>
  )
}
