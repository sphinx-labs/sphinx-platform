import { SPHINX_NETWORKS } from '@sphinx-labs/contracts/dist/networks'
import { fetchNameForNetwork } from '@sphinx-labs/core'
import { JsonRpcProvider } from 'ethers'
import { fetchInfisicalClient, fetchSecret } from './secrets'

export const RPC_PATH = '/RPC'

export const fetchProviderURL = async (chainId: bigint) => {
  const client = fetchInfisicalClient()
  if (process.env.LOCAL_ANVIL_DOCKER === 'true') {
    return `http://${fetchNameForNetwork(chainId)}:${Number(
      BigInt(42000) + (chainId % BigInt(1000))
    )}`
  } else if (process.env.LOCAL_ANVIL === 'true') {
    return `http://127.0.0.1:${Number(
      BigInt(42000) + (chainId % BigInt(1000))
    )}`
  } else {
    const network = SPHINX_NETWORKS.find((n) => n.chainId === chainId)

    if (!network) {
      throw new Error(`Failed to find network for chainId: ${chainId}`)
    }

    const rpcSecretName = network.rpcUrlId
    return await fetchSecret(client, rpcSecretName, RPC_PATH)
  }
}

export const fetchRPCProvider = async (chainId: bigint) => {
  const url = await fetchProviderURL(chainId)
  return new JsonRpcProvider(url)
}
