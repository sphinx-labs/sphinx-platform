import { InfisicalClient } from '@infisical/sdk'
import {
  ExplorerName,
  SPHINX_NETWORKS,
} from '@sphinx-labs/contracts/dist/networks'
import { fetchSecret } from './secrets'

export const BLOCK_EXPLORER_PATH = '/BlockExplorers'

export const selectAPIKey = async (
  chainId: bigint,
  explorer: ExplorerName,
  client: InfisicalClient
) => {
  if (explorer === 'Blockscout') {
    return await selectBlockscoutAPIKey(chainId, client)
  } else if (explorer === 'Etherscan') {
    return await selectEtherscanAPIKey(chainId, client)
  } else {
    throw new Error('unsupported explorer name')
  }
}

const selectEtherscanAPIKey = async (
  chainId: bigint,
  client: InfisicalClient
) => {
  const network = SPHINX_NETWORKS.find((n) => n.chainId === chainId)

  if (!network) {
    throw new Error('Unsupported network')
  } else {
    if (!network.blockexplorers.etherscan) {
      throw new Error('Etherscan is not supported on this network')
    }

    return await fetchSecret(
      client,
      network.blockexplorers.etherscan.envKey,
      BLOCK_EXPLORER_PATH
    )
  }
}

const selectBlockscoutAPIKey = async (
  chainId: bigint,
  client: InfisicalClient
) => {
  const network = SPHINX_NETWORKS.find((n) => n.chainId === chainId)

  if (!network) {
    throw new Error('Unsupported network')
  } else {
    if (!network.blockexplorers.blockscout) {
      throw new Error('Blockscout is not supported on this network')
    }

    return await fetchSecret(
      client,
      network.blockexplorers.blockscout.envKey,
      BLOCK_EXPLORER_PATH
    )
  }
}
