import {
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import { MultichainDeployment } from 'src/pages/dashboard/components/main/projects/project'
import { ExplorerButton } from './block-explorer-button'

type DeployedContracts =
  MultichainDeployment['treeChainStatus'][number]['projectDeployment']['contracts']

type Props = {
  contracts: DeployedContracts
  network: MultichainDeployment['treeChainStatus'][number]['network']
}

export const ContractTable: React.FC<Props> = ({ contracts, network }) => {
  if (!contracts) {
    return <></>
  }

  return (
    <TableContainer width="100%">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Contract</Th>
            <Th>Address</Th>
            <Th pl="4">Block explorers</Th>
          </Tr>
        </Thead>
        <Tbody>
          {contracts.map((contract) => {
            return (
              <Tr key={contract.id}>
                <Td>{contract.contractName.split(':').at(1)}</Td>
                <Td>{contract.address}</Td>
                <Flex alignItems="start" justifyContent="start" width="350px">
                  <ExplorerButton
                    explorer="Blockscout"
                    network={network}
                    contract={contract}
                  />
                  <ExplorerButton
                    explorer="Etherscan"
                    network={network}
                    contract={contract}
                  />
                </Flex>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}
