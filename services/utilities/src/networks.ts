export const DEPRECATED_NETWORKS = [
  {
    name: 'goerli',
    chainId: BigInt(5),
    blockexplorers: {
      etherscan: {
        browserURL: 'https://goerli.etherscan.io',
        blockExplorer: 'Etherscan',
      },
      blockscout: undefined,
    },
  },
  {
    name: 'arbitrum_goerli',
    chainId: BigInt(421613),
    blockexplorers: {
      etherscan: {
        browserURL: 'https://goerli.arbiscan.io/',
        blockExplorer: 'Etherscan',
      },
      blockscout: undefined,
    },
  },
  {
    name: 'optimism_goerli',
    chainId: BigInt(420),
    blockexplorers: {
      etherscan: {
        browserURL: 'https://goerli-optimism.etherscan.io/',
        blockExplorer: 'Etherscan',
      },
      blockscout: undefined,
    },
  },
  {
    name: 'base_goerli',
    chainId: BigInt(84531),
    blockexplorers: {
      etherscan: {
        browserURL: 'https://goerli.basescan.org/',
        blockExplorer: 'Etherscan',
      },
      blockscout: undefined,
    },
  },
  {
    name: 'oktc',
    chainId: BigInt(66),
    blockexplorers: {},
  },
  {
    name: 'linea_goerli',
    chainId: BigInt(59140),
    blockexplorers: {
      etherscan: {
        apiURL: 'https://api-goerli.lineascan.build/api',
        browserURL: 'https://goerli.lineascan.build',
        envKey: 'LINEA_ETHERSCAN_API_KEY',
      },
    },
  },
  {
    name: 'polygon_zkevm_goerli',
    chainId: BigInt(1442),
    blockexplorers: {
      etherscan: {
        apiURL: 'https://api-testnet-zkevm.polygonscan.com/api',
        browserURL: 'https://testnet-zkevm.polygonscan.com',
        envKey: 'POLYGON_ZKEVM_ETHERSCAN_API_KEY',
      },
    },
  },
  {
    name: 'polygon_mumbai',
    chainId: BigInt(80001),
    blockexplorers: {
      etherscan: {
        apiURL: 'https://api-testnet.polygonscan.com/api',
        browserURL: 'https://mumbai.polygonscan.com/',
        envKey: 'POLYGON_ETHERSCAN_API_KEY',
      },
    },
  },
]
