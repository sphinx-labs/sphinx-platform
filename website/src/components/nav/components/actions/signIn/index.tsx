import { CheckIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

type Props = {
  text: string
  loadingText: string
  defaultButton?: boolean
}

export const SignIn: React.FC<Props> = ({
  defaultButton = false,
  text,
  loadingText,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const toast = useToast()

  const [didSubmit, setDidSubmit] = useState<boolean>(false)
  const [showCheck, setShowCheck] = useState<boolean>(false)

  const handleLogin = () => {
    setDidSubmit(true)
    signIn<'email'>(
      'email',
      {
        redirect: false,
        email,
      },
      { code: 'none' }
    )
      .then(async (value) => {
        console.log(value)
        if (value?.error === 'AccessDenied') {
          setDidSubmit(false)
          toast({
            title: 'Invite Required',
            description:
              "Sphinx is currently invite only, for now you'll need to join the waitlist and we'll reach out when we're ready to support you.",
            status: 'info',
            duration: 5000,
            isClosable: true,
          })
          close()
        } else if (value?.status === 200) {
          setDidSubmit(false)
          setShowCheck(true)
          toast({
            title: 'Submitted',
            description: 'Check your email for a sign in link',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        } else {
          setDidSubmit(false)
          toast({
            title: 'Error',
            description: value?.error,
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      })
      .catch((e) => {
        console.error(e)
      })
  }

  const close = () => {
    setIsLoading(false)
    onClose()
  }

  const defaultButtonStyle = { mr: 4 }
  const navButtonStyle = {
    variant: 'ghost',
    borderRadius: '3xl',
    _hover: {
      borderColor: useColorModeValue('black', 'white'),
    },
    borderColor: useColorModeValue('gray.200', 'gray.900'),
  }

  const styles = defaultButton ? defaultButtonStyle : navButtonStyle
  return (
    <>
      <Modal isOpen={isOpen} onClose={close}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign in</ModalHeader>
          <ModalCloseButton m="2" />
          <ModalBody>
            <Flex flexDir="column" mb="5">
              <Input
                borderRadius="lg"
                mb="3"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Flex flexDir="row" mb="3" justifyContent="center">
                <Button
                  isDisabled={showCheck || email === ''}
                  onClick={handleLogin}
                  isLoading={didSubmit}
                  loadingText="Sending email..."
                  rightIcon={
                    showCheck ? <CheckIcon color="green.500" /> : undefined
                  }
                >
                  {showCheck ? 'Email sent' : 'Sign in with Email'}
                </Button>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Flex flexDir="row">
        <Button
          isLoading={isLoading}
          loadingText={loadingText}
          onClick={(e) => {
            e.preventDefault()
            setIsLoading(true)
            onOpen()
          }}
          border="2px"
          {...styles}
        >
          {text}
        </Button>
      </Flex>
    </>
  )
}
