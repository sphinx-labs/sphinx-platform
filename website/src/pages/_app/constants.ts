import { mainnet, sepolia } from '@wagmi/core/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!
export const metadata = {
  name: 'Sphinx Connect Wallet Modal',
  url: 'https://sphinx.dev',
  description: '',
  icons: [],
}

export const chains = [mainnet, sepolia] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  allowUnsupportedChain: true,
})
