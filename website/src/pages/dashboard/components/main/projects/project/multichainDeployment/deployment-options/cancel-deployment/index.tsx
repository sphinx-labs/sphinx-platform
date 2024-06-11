import {
  CancelDeploymentMutation,
  CancelDeploymentMutationVariables,
} from '@/types/gql/graphql'
import { useMutation } from '@apollo/client'
import {
  Button,
  Flex,
  Heading,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react'
import { Dispatch, SetStateAction, useState } from 'react'
import { sleep } from 'src/utils'
import cancelMutation from './cancelDeployment.gql'

type Props = {
  multichainDeploymentId: string
  setIsVisible: Dispatch<SetStateAction<boolean>>
}

export const CancelDeployment: React.FC<Props> = ({
  multichainDeploymentId,
  setIsVisible,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [loading, setLoading] = useState<boolean>(false)

  const [cancel] = useMutation<
    CancelDeploymentMutation,
    CancelDeploymentMutationVariables
  >(cancelMutation, {
    refetchQueries: ['GetProject'],
    variables: {
      input: {
        multichainDeploymentId,
      },
    },
    onCompleted: () => {
      setLoading(false)
      onClose()
      setIsVisible(false)
    },
  })

  return (
    <>
      <MenuItem
        onClick={(e) => {
          e.preventDefault()
          onOpen()
        }}
        pl="4"
      >
        Cancel Deployment
      </MenuItem>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton m="2" />
          <ModalHeader>Confirm</ModalHeader>
          <ModalBody mb="5" justifyItems="end">
            <Flex
              flexDir="column"
              width="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Heading size="md" textAlign="center">
                Are you sure you want to cancel this deployment?
              </Heading>
              <Button
                mt="5"
                isLoading={loading}
                onClick={async (e) => {
                  e.preventDefault()
                  setLoading(true)
                  await sleep(1000)
                  await cancel()
                }}
              >
                Yes
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
