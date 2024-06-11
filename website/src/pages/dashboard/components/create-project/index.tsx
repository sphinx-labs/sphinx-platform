import {
  DisallowedOwnersError,
  DuplicateNameError,
  DuplicateOwnersError,
  ForbiddenCharsNameError,
  InvalidThresholdError,
  NameLengthError,
  ReservedNameError,
  WhitespaceNameError,
  ZeroOwnersError,
  assertNoInvalidOwners,
  assertValidOwner,
  assertValidProjectName,
  assertValidSaltNonce,
  assertValidThreshold,
} from '@/server/api/graphql/models/projects/mutations/createProject'
import {
  CreateProjectMutation,
  CreateProjectMutationVariables,
  GetUserQuery,
} from '@/types/gql/graphql'
import { useMutation } from '@apollo/client'
import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import {
  Button,
  ButtonProps,
  Flex,
  Heading,
  IconButton,
  Input,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { getGnosisSafeProxyAddress } from '@sphinx-labs/contracts/dist/addresses'
import { ChangeEvent, Dispatch, SetStateAction, useState } from 'react'
import { InvalidAddressError } from 'viem'
import * as mutation from './createProjectMutation.gql'

type Props = {
  projects: GetUserQuery['user']['organization']['projects']
  variant: 'standard' | 'menu'
  setSelectedProject?: Dispatch<SetStateAction<string | null>>
  buttonProps?: ButtonProps
}

export const CreateProject: React.FC<Props> = ({
  projects,
  setSelectedProject,
  buttonProps,
  variant,
}) => {
  const toast = useToast()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [owners, setOwners] = useState<
    {
      id: number
      address: string
    }[]
  >([
    {
      id: 0,
      address: '',
    },
  ])
  const [threshold, setThreshold] = useState<string>('')
  const [saltNonce, setSaltNonce] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [creatingProject, setCreatingProject] = useState<boolean>(false)

  const [createProjectMutation] = useMutation<
    CreateProjectMutation,
    CreateProjectMutationVariables
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
      setCreatingProject(false)
    },
    onCompleted: () => {
      setCreatingProject(false)
      if (setSelectedProject) {
        setSelectedProject(projectName)
      }
      onClose()
    },
  })

  const handleInputChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const newOwners = [...owners]
    newOwners[index] = { ...newOwners[index], address: event.target.value }
    setOwners(newOwners)
  }

  const handleAddOwner = () => {
    const newOwners = [...owners]
    newOwners.push({
      id: newOwners.length,
      address: '',
    })
    setOwners(newOwners)
  }

  const handleRemoveOwner = (indexToRemove: number) => {
    setOwners(owners.filter((_, index) => index !== indexToRemove))
  }

  function isInt(str: string) {
    var n = Math.floor(Number(str))
    return n !== Infinity && String(n) === str && n >= 0
  }

  const handleThresholdError = (e: any, silent: boolean) => {
    if (e instanceof InvalidThresholdError) {
      if (!silent) {
        toast({
          title: 'Invalid Threshold',
          description: `${e.message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    } else {
      if (!silent) {
        toast({
          title: `Unexpected error ${(e as any).name}`,
          description: `${(e as any).message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    }
  }

  const isValidThreshold = (silent: boolean) => {
    try {
      assertValidThreshold(
        threshold,
        owners.map((owner) => owner.address)
      )
    } catch (e) {
      handleThresholdError(e, silent)
      return false
    }

    return true
  }

  const handleSaltError = (e: any, silent: boolean) => {
    if (e instanceof InvalidThresholdError) {
      if (!silent) {
        toast({
          title: 'Invalid Salt Nonce',
          description: `${e.message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    } else {
      if (!silent) {
        toast({
          title: `Unexpected error ${(e as any).name}`,
          description: `${(e as any).message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    }
  }

  const isValidNonce = (silent: boolean) => {
    try {
      assertValidSaltNonce(saltNonce)
    } catch (e) {
      handleSaltError(e, silent)
      return false
    }

    return true
  }

  const handleOwnerError = (e: any, silent: boolean) => {
    if (
      e instanceof InvalidAddressError ||
      e instanceof DisallowedOwnersError ||
      e instanceof DuplicateOwnersError ||
      e instanceof ZeroOwnersError
    ) {
      if (!silent) {
        toast({
          title: 'Invalid Address',
          description: `${e.message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    } else {
      if (!silent) {
        toast({
          title: `Unexpected error ${(e as any).name}`,
          description: `${(e as any).message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    }
  }

  const isValidOwners = (silent: boolean): boolean => {
    try {
      assertNoInvalidOwners(owners.map((owner) => owner.address))
    } catch (e) {
      handleOwnerError(e, silent)
      return false
    }

    return true
  }

  const isValidOwner = (owner: string, silent: boolean): boolean => {
    try {
      assertValidOwner(owner)
      return true
    } catch (e) {
      if (!silent) {
        handleOwnerError(e, silent)
      }

      return false
    }
  }

  const isValidSafeConfig = (): boolean => {
    const safeAddress = getGnosisSafeProxyAddress(
      owners.map((owner) => owner.address),
      Number(threshold),
      Number(saltNonce)
    )

    // Unlike the rest of the checks, we do not share this one with the backend logic because it requires querying the database for any project with this Safe address
    // that is owned by any organization. On the frontend, we just check against all the Safes owned by this organization.
    if (
      projects
        .map((project) => project.safeDeploymentStrategy.address)
        .includes(safeAddress)
    ) {
      toast({
        title: 'Safe already exists',
        description:
          "This Safe belongs to an existing project. Please change the owners, threshold, or salt nonce. If you'd like to use a single Gnosis Safe for multiple projects, please let us know.",
        status: 'error',
        duration: 10000,
        isClosable: true,
      })
      return false
    } else {
      return true
    }
  }

  const handleProjectNameError = (e: any, silent: boolean) => {
    if (
      e instanceof ForbiddenCharsNameError ||
      e instanceof NameLengthError ||
      e instanceof ReservedNameError ||
      e instanceof DuplicateNameError ||
      e instanceof WhitespaceNameError
    ) {
      if (!silent) {
        toast({
          title: 'Invalid Project Name',
          description: `${e.message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    } else {
      if (!silent) {
        toast({
          title: `Unexpected error ${(e as any).name}`,
          description: `${(e as any).message}`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        })
      }
    }
  }

  const isValidProjectName = (silent: boolean): boolean => {
    try {
      assertValidProjectName(
        projectName,
        projects.map((project) => project.name)
      )
      return true
    } catch (e) {
      if (!silent) {
        handleProjectNameError(e, silent)
      }

      return false
    }
  }

  const checkFormValid = () => {
    if (!isValidProjectName(false)) {
      return false
    }

    if (!isValidOwners(false)) {
      return false
    }

    if (!isValidThreshold(false)) {
      return false
    }

    if (!isValidNonce(false)) {
      return false
    }

    if (!isValidSafeConfig()) {
      return false
    }

    return true
  }

  const handleCreate = () => {
    if (!checkFormValid()) {
      return
    }
    setCreatingProject(true)
    createProjectMutation({
      variables: {
        input: {
          owners: owners.map((o) => o.address),
          threshold: threshold,
          saltNonce: saltNonce !== '' ? saltNonce : '0',
          projectName,
        },
      },
    })
  }

  const buttonVariant = () => {
    if (variant === 'standard') {
      return (
        <Button onClick={onOpen} {...buttonProps}>
          Create Project
        </Button>
      )
    } else {
      return (
        <MenuItem onClick={onOpen} icon={<AddIcon />}>
          Create Project
        </MenuItem>
      )
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <Heading my="5" ml="5">
            Create Project
          </Heading>
          <ModalCloseButton m="2" />
          <ModalBody>
            <Flex flexDir="column" h="85vh">
              <Flex flexDir="column" mb="3">
                <Flex flexDir="column" mb="3">
                  <Heading size="md">Project Name</Heading>
                  <Text>
                    This is used to uniquely identify your project and cannot be
                    changed later.
                  </Text>
                  <Input
                    mt="3"
                    isInvalid={
                      projectName.length > 0 && !isValidProjectName(true)
                    }
                    onChange={(e) => {
                      setProjectName(e.target.value)
                    }}
                    value={projectName}
                    placeholder="Project Name"
                    width="552px"
                  />
                </Flex>
                <Heading size="md">Gnosis Safe Owners</Heading>
                <Text>
                  All Sphinx deployments are executed through a Gnosis Safe
                  multisig wallet, which Sphinx automatically deploys on your
                  behalf on each network. The owners set here will own that
                  Gnosis Safe. Sphinx can only execute transactions your owners
                  have approved. Every Sphinx project has a unique Gnosis Safe
                  associated with it.
                </Text>
                <Flex flexDir="column" w="min-content">
                  {owners.map((owner) => {
                    return (
                      <Flex mt="3" key={owner.id}>
                        <Input
                          isInvalid={
                            owner.address.length > 0 &&
                            !isValidOwner(owner.address, true)
                          }
                          onChange={(e) => {
                            handleInputChange(owner.id, e)
                          }}
                          value={owner.address}
                          placeholder="Owner Address"
                          width="500px"
                        />
                        <IconButton
                          ml="3"
                          icon={<MinusIcon />}
                          aria-label="remove owner button"
                          onClick={() => handleRemoveOwner(owner.id)}
                        />
                      </Flex>
                    )
                  })}
                  <Button
                    mt="3"
                    leftIcon={<AddIcon />}
                    aria-label="add owner button"
                    onClick={handleAddOwner}
                  >
                    Add Owner
                  </Button>
                </Flex>
              </Flex>
              <Flex flexDir="column" mb="3">
                <Heading size="md">Gnosis Safe Threshold</Heading>
                <Text>
                  The number of owner signatures required to approve deployments
                  via your Gnosis Safe.
                </Text>
                <Input
                  mt="3"
                  isInvalid={threshold !== '' && !isValidThreshold(true)}
                  onChange={(e) => {
                    setThreshold(e.target.value)
                  }}
                  value={threshold}
                  placeholder="Multisig Threshold"
                  width="552px"
                />
              </Flex>
              <Flex flexDir="column" mb="3">
                <Heading size="md">Gnosis Safe Salt Nonce (optional)</Heading>
                <Text>
                  An integer nonce that changes the address of your Gnosis Safe.
                  Using a salt nonce allows you to have multiple Safes with the
                  same set of owners and threshold.
                </Text>
                <Input
                  mt="3"
                  isInvalid={!isValidNonce(true)}
                  onChange={(e) => {
                    setSaltNonce(e.target.value)
                  }}
                  value={saltNonce}
                  placeholder="Defaults to 0"
                  width="552px"
                />
              </Flex>
              <Flex>
                <Button
                  mt="3"
                  onClick={handleCreate}
                  isLoading={creatingProject}
                  isDisabled={creatingProject}
                >
                  Create Project
                </Button>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      {buttonVariant()}
    </>
  )
}
