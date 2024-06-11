import { CheckIcon } from '@chakra-ui/icons'
import {
  Flex,
  Spacer,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { MultichainDeployment } from 'src/pages/dashboard/components/main/projects/project'
import { useAccount } from 'wagmi'

export type RequiredSigners = MultichainDeployment['treeSigners']
export type ProjectOwners = MultichainDeployment['project']['projectOwners']

type Props = {
  signers: RequiredSigners
  owners: ProjectOwners
  threshold: number
}

export const Signers: React.FC<Props> = ({ signers, threshold, owners }) => {
  const { address } = useAccount()
  return (
    <TableContainer>
      <Table variant="simple">
        <TableCaption>
          {threshold} of {owners.length} signers required
        </TableCaption>
        <Thead>
          <Tr>
            <Th>Address</Th>
          </Tr>
        </Thead>
        <Tbody>
          {owners.map((owner) => {
            const signer = signers.find((s) => owner.ownerAddress === s.signer)
            if (!signer) {
              throw new Error(
                'Signer not found, please report this to the developers.'
              )
            }

            return (
              <Tr key={signer.signer}>
                <Td
                  background={
                    signer.signer === address ? 'whiteAlpha.300' : undefined
                  }
                >
                  <Flex>
                    {signer.signer}
                    {signer.signer === address && <Text ml="5">Connected</Text>}
                    <Spacer />
                    {signer.signed && <CheckIcon color="green.500" />}
                  </Flex>
                </Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}
