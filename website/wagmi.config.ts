import {
  getCompatibilityFallbackHandlerAddress,
  getGnosisSafeProxyFactoryAddress,
  getGnosisSafeSingletonAddress,
  getMultiSendAddress,
  getSphinxModuleProxyFactoryAddress,
} from '@sphinx-labs/contracts'
import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'

export default defineConfig(() => {
  return {
    plugins: [
      foundry({
        artifacts: 'out/',
        project: '../../sphinx/packages/contracts',
        include: [
          'GnosisSafe.json',
          'GnosisSafeProxyFactory.json',
          'SphinxModule.json',
          'SphinxModuleFactory.json',
          'SphinxBalanceFactory.json',
          'SphinxBalance.json',
          'SphinxEscrow.json',
          'libraries/MultiSend.json',
          'handler/CompatibilityFallbackHandler.json',
        ],
        deployments: {
          GnosisSafeProxyFactory:
            getGnosisSafeProxyFactoryAddress() as `0x${string}`,
          GnosisSafe: getGnosisSafeSingletonAddress() as `0x${string}`,
          SphinxModuleFactory:
            getSphinxModuleProxyFactoryAddress() as `0x${string}`,
          MultiSend: getMultiSendAddress() as `0x${string}`,
          CompatibilityFallbackHandler:
            getCompatibilityFallbackHandlerAddress() as `0x${string}`,
        },
      }),
    ],
    out: 'types/wagmi/generated.ts',
  }
})
