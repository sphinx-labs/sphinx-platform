import { IconProps } from '@chakra-ui/react'

import { ArbitrumIcon } from '@/components/icons/arbitrum-icon'
import { AvaxIcon } from '@/components/icons/avax-icon'
import { BaseIcon } from '@/components/icons/base-icon'
import { BlastIcon } from '@/components/icons/blast-icon'
import { BNBIcon } from '@/components/icons/bnb-icon'
import { EthereumIcon } from '@/components/icons/ethereum-icon'
import { FantomIcon } from '@/components/icons/fantom-icon'
import { GnosisIcon } from '@/components/icons/gnosis-icon'
import { LineaIcon } from '@/components/icons/linea-icon'
import { OptimismIcon } from '@/components/icons/optimism-icon'
import { PolygonIcon } from '@/components/icons/polygon-icon'

type Props = {
  iconProps: IconProps
  chainId: number
}

export const ArbitraryIcon: React.FC<Props> = ({ iconProps, chainId }) => {
  switch (chainId) {
    case 1:
      return <EthereumIcon {...iconProps} />
    case 5:
      return <EthereumIcon {...iconProps} />
    case 11155111:
      return <EthereumIcon {...iconProps} />
    case 10:
      return <OptimismIcon {...iconProps} />
    case 420:
      return <OptimismIcon {...iconProps} />
    case 11155420:
      return <OptimismIcon {...iconProps} />
    case 42161:
      return <ArbitrumIcon {...iconProps} />
    case 421613:
      return <ArbitrumIcon {...iconProps} />
    case 421614:
      return <ArbitrumIcon {...iconProps} />
    case 56:
      return <BNBIcon {...iconProps} />
    case 97:
      return <BNBIcon {...iconProps} />
    case 100:
      return <GnosisIcon {...iconProps} />
    case 10200:
      return <GnosisIcon {...iconProps} />
    case 137:
      return <PolygonIcon {...iconProps} />
    case 80001:
      return <PolygonIcon {...iconProps} />
    case 1101:
      return <PolygonIcon {...iconProps} />
    case 1442:
      return <PolygonIcon {...iconProps} />
    case 59144:
      return <LineaIcon {...iconProps} />
    case 59140:
      return <LineaIcon {...iconProps} />
    case 4002:
      return <FantomIcon {...iconProps} />
    case 250:
      return <FantomIcon {...iconProps} />
    case 43113:
      return <AvaxIcon {...iconProps} />
    case 43114:
      return <AvaxIcon {...iconProps} />
    case 8453:
      return <BaseIcon {...iconProps} />
    case 84531:
      return <BaseIcon {...iconProps} />
    case 84532:
      return <BaseIcon {...iconProps} />
    case 81457:
      return <BlastIcon {...iconProps} />
    case 168587773:
      return <BlastIcon {...iconProps} />
  }
}
