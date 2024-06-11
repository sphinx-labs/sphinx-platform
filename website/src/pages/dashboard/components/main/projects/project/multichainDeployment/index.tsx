import { useMutation } from '@apollo/client'
import { ChevronDownIcon, InfoOutlineIcon } from '@chakra-ui/icons'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Spacer,
  Stack,
  StackDivider,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
  useToast,
} from '@chakra-ui/react'
import { getWalletClient, signTypedData } from '@wagmi/core'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { ArbitraryIcon } from '@/components/icons/arbitrary-network-icon'
import {
  AddSignatureMutation,
  AddSignatureMutationVariables,
  GetUserQuery,
} from '@/types/gql/graphql'
import { ChainStatusIndicator } from 'src/pages/dashboard/components/main/projects/project/multichainDeployment/chain-status'
import { Signers } from 'src/pages/dashboard/components/main/projects/project/multichainDeployment/signers'
import { MultichainDeploymentStatusIndicator } from 'src/pages/dashboard/components/main/projects/project/multichainDeployment/status-indicator'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { config } from 'src/pages/_app/constants'
import { MultichainDeployment } from 'src/pages/dashboard/components/main/projects/project'
import { DeploymentOptions } from 'src/pages/dashboard/components/main/projects/project/multichainDeployment/deployment-options'
import signatureMutation from './addSignatureMutation.gql'

type Props = {
  multichainDeployment: MultichainDeployment
  organization: GetUserQuery['user']['organization']
}

const getDuration = (multichainDeployment: MultichainDeployment | null) => {
  if (multichainDeployment === null) {
    return '--'
  }
  const start = new Date(multichainDeployment?.created)
  let endDate

  if (multichainDeployment?.status === 'completed') {
    endDate = new Date(multichainDeployment.modified)
  } else {
    endDate = new Date()
  }

  const diff = endDate.getTime() - start.getTime()
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff - minutes * 60000) / 1000)
  const hoursAgo = Math.floor(
    (new Date().getTime() - start.getTime()) / 3_600_000
  )
  let timeString = ''
  timeString += minutes > 0 ? `${minutes}m ` : ''
  timeString += `${seconds}s `
  timeString +=
    multichainDeployment?.status === 'completed' ? `(${hoursAgo}h ago)` : ''
  return timeString
}

const variants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
}

export const MultiChainDeployment: React.FC<Props> = ({
  multichainDeployment,
  organization,
}) => {
  const { isConnected, address } = useAccount()
  const { open } = useWeb3Modal()

  const [isVisible, setIsVisible] = useState<boolean>(true)
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(
    multichainDeployment.status !== 'completed' ? false : true
  )
  const [accordionIndex, setAccordionIndex] = useState<number[]>(
    multichainDeployment.status === 'completed' ? [] : [0]
  )
  const [isApproving, setIsApproving] = useState<boolean>(false)
  const [duration, setDuration] = useState<string>(
    getDuration(multichainDeployment)
  )
  const [showApproveButton, setShowApproveButton] = useState<boolean>(
    multichainDeployment.status === 'proposed'
  )

  useEffect(() => {
    if (multichainDeployment && multichainDeployment?.status !== 'completed') {
      const interval = setInterval(() => {
        setDuration(getDuration(multichainDeployment))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [multichainDeployment])

  const [addSignatureMutation] = useMutation<
    AddSignatureMutation,
    AddSignatureMutationVariables
  >(signatureMutation, {
    refetchQueries: ['GetUser'],
  })

  const failure = multichainDeployment?.treeChainStatus.some(
    (treeChainStatus) => treeChainStatus.projectDeployment.failed === true
  )

  const showRequiredSigners = multichainDeployment?.status === 'proposed'
  const allowedToCancel =
    multichainDeployment.status === 'proposed' ||
    multichainDeployment.status === 'approved'

  const connectedSigner = multichainDeployment.treeSigners.find(
    (treeSigner) => treeSigner.signer === address
  )

  const deploymentStatus = multichainDeployment?.status

  const showDeploymentStatus =
    multichainDeployment?.status === 'approved' ||
    multichainDeployment?.status === 'funded' ||
    multichainDeployment?.status === 'executed' ||
    multichainDeployment?.status === 'completed'

  const handleSign = async (merkleRoot: string) => {
    const domain = {
      name: 'Sphinx',
      version: '1.0.0',
    }

    const types = { MerkleRoot: [{ name: 'root', type: 'bytes32' }] }
    const message = { root: merkleRoot }

    const signature = await signTypedData(config, {
      domain,
      message,
      primaryType: 'MerkleRoot',
      types,
    })

    return signature
  }

  const handleApproval = async () => {
    setIsApproving(true)

    if (!isConnected) {
      open()
      toast({
        title: 'No wallet connected',
        description: 'Connect your wallet and try again.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
      setIsApproving(false)
      return
    }

    const walletClient = await getWalletClient(config)

    if (!multichainDeployment) {
      toast({
        title: 'No deployment found',
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
      setIsApproving(false)
      return
    }

    const signers = multichainDeployment.treeSigners.map(
      (treeSigner) => treeSigner.signer
    )

    if (!signers.includes(walletClient.account.address)) {
      toast({
        title: 'Incorrect Wallet',
        description: `The connected wallet cannot approve this deployment. Required signers: ${signers.join(
          ', '
        )}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
      setIsApproving(false)
      return
    }

    let signature
    try {
      signature = await handleSign(multichainDeployment.treeRoot)
    } catch (e: any) {
      if (!e.message.includes('User denied')) {
        toast({
          title: 'Error',
          description: e.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
      setIsApproving(false)
      return
    }

    // Update the DB
    try {
      await addSignatureMutation({
        variables: {
          input: {
            multichainDeploymentId: multichainDeployment.id,
            signature: signature as string,
            signer: walletClient?.account.address,
          },
        },
      })
    } catch (e) {
      // display error writing to our DB
      toast({
        title: 'Error',
        description: 'Unexpected error approving deployment',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
      setIsApproving(false)
      return
    }

    toast({
      title: 'Successfully Approved',
      status: 'success',
      duration: 5000,
      isClosable: true,
    })

    const threshold = multichainDeployment.project.threshold
    let signed = multichainDeployment.treeSigners.filter(
      (treeSigner) => treeSigner.signed && !treeSigner.isProposer
    ).length

    const proposerSigner = multichainDeployment.treeSigners.find(
      (treeSigner) => treeSigner.isProposer
    )
    const proposerOwner = multichainDeployment.project.projectOwners.find(
      (signer) => signer.ownerAddress === proposerSigner?.signer
    )
    if (proposerOwner) {
      signed += 1
    }

    if (signed + 1 >= threshold) {
      setShowApproveButton(false)
    }

    setIsApproving(false)
    setAccordionIndex([0])
    setIsOpen(true)
  }

  return (
    <>
      {isVisible && (
        <Accordion
          allowToggle
          width="100%"
          onChange={() => {
            setIsOpen(!isOpen)
            if (accordionIndex.length > 0) {
              setAccordionIndex([])
            } else {
              setAccordionIndex([0])
            }
          }}
          index={accordionIndex}
          mb="3"
        >
          {multichainDeployment && (
            <AccordionItem border="none">
              <AccordionButton m="0" p="0">
                <Card
                  width="100%"
                  borderBottomRadius={!isOpen ? 'none' : undefined}
                >
                  <CardHeader alignSelf="start" width="100%">
                    <Flex flexDir="row" width="100%">
                      <Heading size="lg" mt={2}>
                        {multichainDeployment.status !== 'completed'
                          ? 'Deploying'
                          : 'Deployed'}{' '}
                        {multichainDeployment.project.name}
                      </Heading>
                      <Spacer />
                      {failure && (
                        <Tooltip label="This deployment failed due to either one of your contracts constructors reverting or a post deployment action failing.">
                          <Flex
                            flexDir="row"
                            alignItems="center"
                            backgroundColor="red.700"
                            px="4"
                            borderRadius="md"
                          >
                            <Text mr="2" color="white">
                              Deployment Failed
                            </Text>
                            <InfoOutlineIcon color="white" />
                          </Flex>
                        </Tooltip>
                      )}
                      {allowedToCancel && (
                        <DeploymentOptions
                          setIsVisible={setIsVisible}
                          multichainDeploymentId={multichainDeployment.id}
                        />
                      )}
                    </Flex>
                    <Flex flexDir="row" alignItems="center" pt="3">
                      <Flex>
                        <Wrap>
                          {multichainDeployment?.treeChainStatus.map(
                            (chainStatus) => (
                              <WrapItem key={chainStatus.id}>
                                <Flex flexDir="row" mr="3">
                                  <ArbitraryIcon
                                    chainId={chainStatus.network.id}
                                    iconProps={{ boxSize: '6' }}
                                  />
                                  <Text ml="2">
                                    {chainStatus.network.displayName}
                                  </Text>
                                </Flex>
                              </WrapItem>
                            )
                          )}
                        </Wrap>
                      </Flex>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack divider={<StackDivider />} spacing="4">
                      <Stack
                        divider={<StackDivider />}
                        spacing="4"
                        direction="row"
                      >
                        <Box w="full">
                          <Heading
                            size="xs"
                            textTransform="uppercase"
                            mb="1"
                            textAlign="start"
                          >
                            Status
                          </Heading>
                          <Flex flexDir="row" alignItems="center" mt={3}>
                            <MultichainDeploymentStatusIndicator
                              status={deploymentStatus}
                            />
                            <Spacer />
                            {showApproveButton && (
                              <Button
                                isDisabled={
                                  isApproving || connectedSigner?.signed
                                }
                                isLoading={isApproving}
                                loadingText="Approving..."
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleApproval()
                                }}
                              >
                                Approve Deployment
                              </Button>
                            )}
                            <Flex flexDir="row" alignItems="center" ml="7">
                              <Text mr="2" w="20">
                                View More
                              </Text>
                              <motion.nav
                                animate={!isOpen ? 'open' : 'closed'}
                                variants={variants}
                              >
                                <ChevronDownIcon boxSize="10" />
                              </motion.nav>
                            </Flex>
                          </Flex>
                        </Box>
                        <Box minW="7rem">
                          <Heading
                            size="xs"
                            textTransform="uppercase"
                            textAlign="start"
                          >
                            Duration
                          </Heading>
                          <Text pt="5" fontSize="sm" textAlign="start">
                            {duration}
                          </Text>
                        </Box>
                      </Stack>
                    </Stack>
                  </CardBody>
                </Card>
              </AccordionButton>
              <AccordionPanel p={0}>
                <Card p={4} borderTopRadius="none">
                  {showRequiredSigners && (
                    <Signers
                      signers={multichainDeployment.treeSigners}
                      threshold={multichainDeployment.project.threshold}
                      owners={multichainDeployment.project.projectOwners}
                    />
                  )}
                  {showDeploymentStatus &&
                    multichainDeployment?.treeChainStatus.map((chainStatus) => (
                      <ChainStatusIndicator
                        key={chainStatus.id}
                        chainStatus={chainStatus}
                      />
                    ))}
                </Card>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </>
  )
}
