'use client'

import {
  Alert,
  AlertIcon,
  CloseButton,
  Flex,
  Spacer,
  useDisclosure,
} from '@chakra-ui/react'
import { RefObject } from 'react'

import { Audit } from 'src/pages/landing-page/audit'
import { DeploymentsAsCode } from 'src/pages/landing-page/deployments-as-code'
import { MainCTA } from 'src/pages/landing-page/main-cta'

type Props = {
  pricingRef: RefObject<HTMLDivElement>
  format: 'mobile' | 'desktop'
}

const LandingPage: React.FC<Props> = ({ pricingRef, format }) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true })

  return (
    <>
      {isOpen && (
        <Alert
          w="100vw"
          status="warning"
          position="fixed"
          bottom="0"
          variant="solid"
          zIndex={1}
        >
          <AlertIcon />
          Sphinx does not have a token. Please watch out for scammers.
          <Spacer />
          <CloseButton
            alignSelf="flex-end"
            position="relative"
            right={0}
            top={0}
            onClick={onClose}
          />
        </Alert>
      )}
      <Flex align="center" flexDir="column" width="100vw">
        <MainCTA format={format} />
        <DeploymentsAsCode format={format} />
        <Audit format={format} />
      </Flex>
    </>
  )
}

export default LandingPage
