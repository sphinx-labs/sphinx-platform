import {
  CheckCircleIcon,
  CloseIcon,
  ExternalLinkIcon,
  WarningIcon,
} from '@chakra-ui/icons'
import { Button, Flex, Spinner, useToast } from '@chakra-ui/react'
import { Blockexplorer } from '@prisma/client'
import { useRouter } from 'next/router'
import { MultichainDeployment } from 'src/pages/dashboard/components/main/projects/project'
import {
  fetchBlockscoutForNetwork,
  fetchEtherscanForNetwork,
  generateBlockscoutLink,
  generateEtherscanLink,
  isBlockscoutSupported,
  isEtherscanSupported,
} from 'src/utils'

type DeployedContracts =
  MultichainDeployment['treeChainStatus'][number]['projectDeployment']['contracts']

type Network = MultichainDeployment['treeChainStatus'][number]['network']

type ExplorerVerification = NonNullable<
  DeployedContracts[number]['projectVerification']
>['explorerVerifications'][number]

type Props = {
  explorer: Blockexplorer
  contract: DeployedContracts[number]
  network: Network
}

export const ExplorerButton: React.FC<Props> = ({
  explorer,
  network,
  contract,
}) => {
  const router = useRouter()

  const blockscoutConfig = fetchBlockscoutForNetwork(BigInt(network.id))
  const etherscanConfig = fetchEtherscanForNetwork(BigInt(network.id))

  const blockscoutVerification =
    contract.projectVerification?.explorerVerifications.find(
      (verification) => verification.explorer === 'Blockscout'
    )

  const etherscanVerification =
    contract.projectVerification?.explorerVerifications.find(
      (verification) => verification.explorer === 'Etherscan'
    )

  const fetchLinkForContract = () => {
    if (explorer === 'Blockscout') {
      return generateBlockscoutLink(contract.address, network.id)
    } else if (explorer === 'Etherscan') {
      return generateEtherscanLink(contract.address, network.id)
    } else {
      return ''
    }
  }

  const fetchExplorerVerification = () => {
    let explorerVerification
    if (explorer === 'Blockscout') {
      explorerVerification = blockscoutVerification
    } else {
      explorerVerification = etherscanVerification
    }

    return explorerVerification
  }

  const toast = useToast()
  const link = fetchLinkForContract()
  const explorerVerification = fetchExplorerVerification()

  const infoIcon = <WarningIcon mr="3" />
  const successfulVerificationIcon = <CheckCircleIcon color="green" mr="3" />
  const failedVerification = <CloseIcon color="red" mr="3" />
  const verificationInProgressIcon = (
    <Spinner width="20px" height="20px" mr="3" ml="0" />
  )

  const fetchIconForExplorerVerification = (
    verification: ExplorerVerification
  ) => {
    switch (verification.status) {
      case 'queued':
        return verificationInProgressIcon
      case 'failing':
        return failedVerification
      case 'unverified':
        return infoIcon
      case 'verification_unsupported':
        return infoIcon
      case 'verified':
        return successfulVerificationIcon
      default:
        return infoIcon
    }
  }

  const fetchIconButton = () => {
    if (explorer === 'Blockscout') {
      if (isBlockscoutSupported(BigInt(network.id))) {
        if (blockscoutVerification) {
          return fetchIconForExplorerVerification(blockscoutVerification)
        } else {
          return infoIcon
        }
      } else {
        return infoIcon
      }
    } else {
      if (isEtherscanSupported(BigInt(network.id))) {
        if (etherscanVerification) {
          return fetchIconForExplorerVerification(etherscanVerification)
        } else {
          return infoIcon
        }
      } else {
        return infoIcon
      }
    }
  }

  const showExternalLinkIcon = () => {
    const explorerVerification = fetchExplorerVerification()

    if (explorerVerification && explorerVerification.status === 'verified') {
      return true
    } else {
      return false
    }
  }

  const fetchToastMessage = (): { title: string; description: string } => {
    const explorerVerification = fetchExplorerVerification()

    const unverifiedDueToLegacy = `This contract has not been verified on ${network.displayName} ${explorer} because support for ${explorer} on this network was added after this contract was already deployed.`

    if (!explorerVerification) {
      return {
        title: `Contract has not been verified on ${explorer}`,
        description: unverifiedDueToLegacy,
      }
    }

    if (explorerVerification.status === 'queued') {
      return {
        title: 'Verification in progress',
        description: `We are still attempting to verify this contract on ${network.displayName} ${explorer}. If this is taking an unusually long time, it's likely because the block explorer API is experiencing a service degradation. Your contract has been deployed successfully. We will continue trying to verify this contract for the next week.`,
      }
    } else if (explorerVerification.status === 'failing') {
      return {
        title: 'Verification unsuccessful',
        description: `We were unable to successfully verify this contract on ${network.displayName} ${explorer}. This is most likely due to a service degradation in the block exploerer. Your contract has been deployed successfully. If verification on this explorer is important to you, please reach out to the Sphinx team for assistance.`,
      }
    } else if (explorerVerification.status === 'unverified') {
      return {
        title: `Contract has not been verified`,
        description: unverifiedDueToLegacy,
      }
    } else if (explorerVerification.status === 'verification_unsupported') {
      return {
        title: `${explorer} verification is not supported on ${network.displayName}`,
        description: `This is generally either because ${explorer} does not support this network or does not work reliably on this network. If you think this is a mistake, let us know!`,
      }
    } else if (explorerVerification.status === 'verified') {
      return {
        title: '',
        description: '',
      }
    }

    return {
      title: '',
      description: '',
    }
  }

  const button = (
    <Button
      mr="4"
      variant="ghost"
      onClick={() => {
        if (explorerVerification?.status !== 'verified') {
          const { title, description } = fetchToastMessage()
          if (title === '' && description === '') return

          toast({
            title,
            description,
            status: 'info',
            duration: 10000,
            isClosable: true,
          })
        }
      }}
    >
      {fetchIconButton()}
      <Flex flexDir="column">{explorer}</Flex>
      {showExternalLinkIcon() ? (
        <ExternalLinkIcon mx="3px" />
      ) : (
        <ExternalLinkIcon mx="3px" color="transparent" />
      )}
    </Button>
  )

  return explorerVerification?.status === 'verified' ? (
    <a target="_blank" href={link} rel="noopener noreferrer">
      {button}
    </a>
  ) : (
    button
  )
}
