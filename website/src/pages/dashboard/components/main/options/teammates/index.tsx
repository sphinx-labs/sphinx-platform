import { useMutation } from '@apollo/client'
import { AddIcon, CheckIcon, ChevronDownIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  Heading,
  Input,
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
  Table,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { Roles } from '@prisma/client'
import { useSession } from 'next-auth/react'
import React, { useState } from 'react'

import {
  GetUserQuery,
  InviteMutation,
  InviteMutationVariables,
} from '@/types/gql/graphql'
import { EditRoleButton } from 'src/pages/dashboard/components/main/options/teammates/edit-role-button'
import { capitalize } from 'src/utils'

import mutation from './inviteTeammate.gql'

type Props = {
  organization: GetUserQuery['user']['organization']
}

export const Teammates: React.FC<Props> = ({ organization }) => {
  const session = useSession()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const toast = useToast()
  const [role, setRole] = useState<Roles>(Roles.developer)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [successfullyInvited, setSuccessfullyInvited] = useState(false)
  const [email, setEmail] = useState<string | undefined>()

  const disabled = sendingInvite || successfullyInvited

  const [inviteTeammateMutation] = useMutation<
    InviteMutation,
    InviteMutationVariables
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
      setSendingInvite(false)
    },
    onCompleted: () => {
      setSendingInvite(false)
      setSuccessfullyInvited(true)
      close()
    },
  })

  const close = () => {
    setSuccessfullyInvited(false)
    onClose()
  }

  const sendInvite = () => {
    setSendingInvite(true)

    if (!email) {
      toast({
        title: 'Error',
        description: 'Must provide an email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setSendingInvite(false)
      return
    }

    inviteTeammateMutation({
      variables: {
        input: {
          email,
          role,
        },
      },
    })
  }

  return (
    <Flex flexDir="column" mb="6" width="min-content">
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invite a Teammate</ModalHeader>
          <ModalCloseButton m="2" />
          <ModalBody>
            <Flex flexDir="column" mb="4">
              <Flex flexDir="column" mb="4">
                <Heading size="md" mb="2">
                  Email
                </Heading>
                <Input
                  disabled={disabled}
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Flex>

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
                  onClick={sendInvite}
                  isDisabled={disabled || email === ''}
                  isLoading={sendingInvite}
                  rightIcon={
                    successfullyInvited ? (
                      <CheckIcon color="green.500" />
                    ) : undefined
                  }
                >
                  Send
                </Button>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Heading size="md" mb="3">
        Team Members
      </Heading>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th px="0">Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              {session.data?.role === Roles.owner && <Th>Edit</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {organization.teammates.map((teammate) => {
              return teammate ? (
                <Tr mt="0" key={teammate.id}>
                  <Td py="0" px="0">
                    {teammate.email}
                  </Td>
                  <Td py="0">{capitalize(teammate.role)}</Td>
                  <Td py="0">Signed Up</Td>
                  {session.data?.role === Roles.owner && (
                    <Td py="0">
                      <EditRoleButton
                        email={teammate.email!}
                        currentRole={teammate.role as Roles}
                      />
                    </Td>
                  )}
                </Tr>
              ) : undefined
            })}
            {organization.invites
              .filter((invite) => invite.signedUp === false)
              .map((invite) => {
                return (
                  <Tr mt="0" key={invite.id}>
                    <Td px="0">{invite.email}</Td>
                    <Td>{capitalize(invite.role)}</Td>
                    <Td>Invite Sent</Td>
                    {session.data?.role === Roles.owner && (
                      <Td>
                        <EditRoleButton
                          email={invite.email!}
                          currentRole={invite.role as Roles}
                        />
                      </Td>
                    )}
                  </Tr>
                )
              })}
          </Tbody>
          <Tfoot>
            {session.data?.role === Roles.owner && (
              <Button
                mt="3"
                mb="3"
                aria-label="add teammate button"
                leftIcon={<AddIcon />}
                width="min-content"
                onClick={onOpen}
              >
                Invite
              </Button>
            )}
          </Tfoot>
        </Table>
      </TableContainer>
    </Flex>
  )
}
