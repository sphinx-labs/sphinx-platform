import { SPHINX_NETWORKS } from '@sphinx-labs/contracts/dist/networks'
import { DEPRECATED_NETWORKS } from '@sphinx-managed/utilities/src/networks'
import { goerli, hardhat, optimismGoerli } from '@wagmi/core/chains'

export const fetchLocalRPCUrl = (chainId: number) => {
  return `http://127.0.0.1:${42000 + (chainId % 1000)}`
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const sleep = async (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export const isBlockscoutSupported = (chainId: bigint) => {
  const blockscoutConfig = fetchBlockscoutForNetwork(chainId)
  if (blockscoutConfig) {
    return true
  } else {
    return false
  }
}

export const isEtherscanSupported = (chainId: bigint) => {
  const etherscanConfig = fetchEtherscanForNetwork(chainId)
  if (etherscanConfig) {
    return true
  } else {
    return false
  }
}

export const fetchBlockscoutForNetwork = (chainId: bigint) => {
  const network = [...SPHINX_NETWORKS, ...DEPRECATED_NETWORKS].find(
    (n) => n.chainId === chainId
  )

  if (network) {
    return network.blockexplorers.blockscout
  } else {
    throw new Error(`Unsupported network id ${chainId}`)
  }
}

export const fetchEtherscanForNetwork = (chainId: bigint) => {
  const network = [...SPHINX_NETWORKS, ...DEPRECATED_NETWORKS].find(
    (n) => n.chainId === chainId
  )

  if (network) {
    return network.blockexplorers.etherscan
  } else {
    throw new Error(`Unsupported network id ${chainId}`)
  }
}

const appendPathToUrl = (url: string, path: string) => {
  if (path.startsWith('/')) {
    path = path.substring(1)
  }

  if (url.endsWith('/')) {
    return url + path
  } else {
    return url + '/' + path
  }
}

export const generateBlockscoutLink = (address: string, network: number) => {
  const baseUrl = fetchBlockscoutForNetwork(BigInt(network))?.browserURL

  if (baseUrl) {
    return `${appendPathToUrl(`${baseUrl}/address/`, address)}?tab=contract`
  } else {
    return ''
  }
}

export const generateEtherscanLink = (address: string, network: number) => {
  const baseUrl = fetchEtherscanForNetwork(BigInt(network))?.browserURL

  if (baseUrl) {
    return `${appendPathToUrl(`${baseUrl}/address/`, address)}#code`
  } else {
    return ''
  }
}

export const isValidNetworkId = (id: number | undefined) => {
  if (!id) {
    return false
  }

  if (id === goerli.id || id === optimismGoerli.id) {
    return true
  }

  if (
    process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== 'preview' &&
    id === hardhat.id
  ) {
    return true
  }

  return false
}

export const filterUsefulErrors = (e: any) => {
  const errors = ['Nonce too low', 'Nonce too high']

  for (const error of errors) {
    if (e.message.includes(error)) {
      return error
    }
  }

  return 'An unknown error occurred'
}
