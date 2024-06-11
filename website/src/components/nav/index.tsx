import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Spacer,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react'
import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'
import { RefObject } from 'react'
import { FaDiscord, FaGithub } from 'react-icons/fa'

import { NavActions } from '@/components/nav/components/actions'

type Props = {
  session: Session | null
  displayActions: boolean | undefined
  pricingRef: RefObject<HTMLDivElement> | undefined
  format?: 'desktop' | 'mobile'
}

export const NavBar: React.FC<Props> = ({
  session,
  displayActions = true,
  pricingRef,
  format,
}) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const icon =
    colorMode === 'light' ? <MoonIcon boxSize="5" /> : <SunIcon boxSize="5" />
  const router = useRouter()
  const hoverBorderColor = useColorModeValue('black', 'white')

  const scrollToPricingRef = () => {
    pricingRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const buttonSpacing = format === 'desktop' ? '5' : '2'

  return (
    <Flex
      as="header"
      position="absolute"
      w="100vw"
      pl={format === 'desktop' ? '10' : '5'}
      pr={format === 'desktop' ? '10' : '3'}
      py="5"
    >
      <Heading onClick={() => router.push('/')} cursor="pointer">
        Sphinx
      </Heading>
      <Spacer />
      {pricingRef && session === null && (
        <Button
          onClick={() => scrollToPricingRef()}
          variant="ghost"
          mr={buttonSpacing}
          px="2"
        >
          Pricing
        </Button>
      )}
      <IconButton
        borderRadius="3xl"
        variant="ghost"
        onClick={() => router.push('https://github.com/sphinx-labs/sphinx')}
        icon={<FaGithub size={24} />}
        aria-label="visit github repo"
        mr={buttonSpacing}
        _hover={{
          borderColor: hoverBorderColor,
        }}
        border="2px"
        borderColor="transparent"
      />
      <IconButton
        borderRadius="3xl"
        variant="ghost"
        onClick={() => router.push('https://discord.gg/HefaZbcvaK')}
        icon={<FaDiscord size={24} />}
        aria-label="toggle darkmode"
        mr={buttonSpacing}
        _hover={{
          borderColor: hoverBorderColor,
        }}
        border="2px"
        borderColor="transparent"
      />
      <IconButton
        borderRadius="3xl"
        variant="ghost"
        onClick={toggleColorMode}
        icon={icon}
        aria-label="toggle darkmode"
        mr={displayActions && format === 'desktop' ? '5' : '0'}
        _hover={{
          borderColor: hoverBorderColor,
        }}
        border="2px"
        borderColor="transparent"
      />
      {displayActions && format === 'desktop' && (
        <NavActions session={session} />
      )}
    </Flex>
  )
}
