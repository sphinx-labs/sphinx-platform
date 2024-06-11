import { Button, Menu, MenuButton, MenuList } from '@chakra-ui/react'
import { Dispatch, SetStateAction, useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { CancelDeployment } from 'src/pages/dashboard/components/main/projects/project/multichainDeployment/deployment-options/cancel-deployment'

type Props = {
  multichainDeploymentId: string
  setIsVisible: Dispatch<SetStateAction<boolean>>
}

export const DeploymentOptions: React.FC<Props> = ({
  multichainDeploymentId,
  setIsVisible,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <Menu
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false)
      }}
    >
      <MenuButton
        as={Button}
        aria-label="deployment options"
        variant="ghost"
        onClick={(e) => {
          setIsOpen(!isOpen)
          e.preventDefault()
        }}
      >
        <BsThreeDotsVertical />
      </MenuButton>
      <MenuList>
        <CancelDeployment
          multichainDeploymentId={multichainDeploymentId}
          setIsVisible={setIsVisible}
        />
      </MenuList>
    </Menu>
  )
}
