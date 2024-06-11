import { useMutation } from '@apollo/client'
import { CheckIcon, ChevronDownIcon, EditIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { Roles } from '@prisma/client'
import { useState } from 'react'

import {
  UpdateTeammateMutation,
  UpdateTeammateMutationVariables,
} from '@/types/gql/graphql'
import { capitalize } from 'src/utils'

import mutation from './updateTeammate.gql'

type Props = {
  email: string
  currentRole: Roles
}

export const EditRoleButton: React.FC<Props> = ({ email, currentRole }) => {
  const [role, setRole] = useState<Roles>(currentRole)
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [saving, setSaving] = useState(false)
  const [successfullySaved, setSuccessfullySaved] = useState(false)
  const toast = useToast()

  const disabled = saving || successfullySaved

  const [updateTeammateMutation] = useMutation<
    UpdateTeammateMutation,
    UpdateTeammateMutationVariables
  >(mutation, {
    refetchQueries: ['GetUser'],
    onError: (e) => {
      toast({
        title: 'Error',
        description: e.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setSaving(false)
    },
    onCompleted: () => {
      setSaving(false)
      setSuccessfullySaved(true)
      close()
    },
  })

  const close = () => {
    setSuccessfullySaved(false)
    onClose()
  }

  const editRole = () => {
    if (role === currentRole) {
      toast({
        title: 'Error',
        description: 'Role is already set to this value.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setSaving(true)

    updateTeammateMutation({
      variables: {
        input: {
          email,
          role,
        },
      },
    })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Role</ModalHeader>
          <ModalCloseButton m="2" />
          <ModalBody>
            <Flex flexDir="column" mb="4">
              <Flex flexDir="column" width="min-content" mb="4">
                <Heading size="md" mb="2">
                  Role
                </Heading>
                <Menu>
                  <MenuButton
                    isDisabled={disabled}
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                  >
                    {capitalize(role)}
                  </MenuButton>
                  <MenuList>
                    <Tooltip label="Able to access the Sphinx UI, propose, and sign for deployments.">
                      <MenuItem
                        onClick={() => {
                          setRole(Roles.developer)
                        }}
                      >
                        Developer
                      </MenuItem>
                    </Tooltip>
                    <Tooltip label="Able to invite new team members and update roles in addition to the other developer permissions.">
                      <MenuItem
                        onClick={() => {
                          setRole(Roles.owner)
                        }}
                      >
                        Owner
                      </MenuItem>
                    </Tooltip>
                  </MenuList>
                </Menu>
              </Flex>
              <Flex flexDir="row">
                <Spacer />
                <Button
                  aria-label="send invite button"
                  width="min-content"
                  onClick={editRole}
                  isDisabled={disabled || email === ''}
                  isLoading={saving}
                  rightIcon={
                    successfullySaved ? (
                      <CheckIcon color="green.500" />
                    ) : undefined
                  }
                >
                  Save
                </Button>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      <IconButton
        variant="ghost"
        aria-label="edit role icon"
        icon={<EditIcon />}
        onClick={onOpen}
      />
    </>
  )
}
