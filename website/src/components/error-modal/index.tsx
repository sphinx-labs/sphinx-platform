import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

type Props = {
  errorMessage: string
}

export const ErrorModal: React.FC<Props> = ({ errorMessage }) => {
  return (
    <Modal isOpen={true} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{errorMessage}</ModalHeader>
        <ModalBody>
          This is a bug, please report it to the developers.
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
