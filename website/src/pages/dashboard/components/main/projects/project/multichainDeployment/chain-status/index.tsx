import { Divider, Flex, Heading, Spinner, Text } from '@chakra-ui/react'
import { ProjectDeploymentStatus } from '@prisma/client'

import { ArbitraryIcon } from '@/components/icons/arbitrary-network-icon'
import { TreeStatusType } from '@/types/gql/graphql'
import { MultichainDeployment } from 'src/pages/dashboard/components/main/projects/project'
import { ContractTable } from '../../contract-table'

type Props = {
  chainStatus: MultichainDeployment['treeChainStatus'][number]
}

const fetchStatusText = (
  status: TreeStatusType,
  projectStatus: ProjectDeploymentStatus | undefined,
  networkName: string | undefined,
  failed: boolean
) => {
  switch (status) {
    case 'proposed':
      return `${networkName}: Awaiting funding`
    case 'executingDeployment':
      switch (projectStatus) {
        case 'approved':
          return `${networkName}: Executing deployment`
        case 'executed':
          return `${networkName}: Verifying on Etherscan`
        case 'cancelled':
          return `${networkName}: Cancelled`
        default:
          return "Sorry! You shouldn't be seeing this!"
      }
    case 'completed':
      if (failed) {
        return `${networkName}: Failed`
      } else {
        return `${networkName}: Completed`
      }
  }
}

export const ChainStatusIndicator: React.FC<Props> = ({ chainStatus }) => {
  const failureTip = `Failed while executing ${chainStatus.projectDeployment.failureReason?.replace(
    /\s/g,
    ''
  )} because the transaction reverted. Any actions that followed it were not executed. Any contracts that were deployed successfully have still been verified and are listed below.`

  return (
    <Flex flexDir="column">
      <Flex flexDir="row" alignItems="center" pb="3" pt="3">
        {chainStatus.status !== 'completed' && <Spinner mr="4" />}
        <ArbitraryIcon
          chainId={chainStatus.network.id}
          iconProps={{ boxSize: '6' }}
        />
        <Heading size="md" mx="2">
          {fetchStatusText(
            chainStatus.status,
            chainStatus.projectDeployment?.status,
            chainStatus.network.displayName,
            chainStatus.projectDeployment.failed
          )}
        </Heading>
      </Flex>
      {chainStatus.projectDeployment.failed && (
        <Text mr="2" color="red">
          {failureTip}
        </Text>
      )}
      <Divider mb="3" />
      {(chainStatus.status === 'completed' ||
        chainStatus.projectDeployment.status === 'executed') && (
        <ContractTable
          contracts={chainStatus.projectDeployment.contracts}
          network={chainStatus.network}
        />
      )}
    </Flex>
  )
}
