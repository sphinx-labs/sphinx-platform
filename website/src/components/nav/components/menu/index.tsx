import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { BiLogOut } from 'react-icons/bi'
import { useAccount } from 'wagmi'

import { WalletConnectIcon } from '@/components/icons/wallet-connect-icon'
import { Identicon } from '@/components/nav/components/identicon'

export const NavMenu = () => {
  const session = useSession()
  const name = session.data?.name
  const { address, isConnected } = useAccount()
  const [connected, setConnected] = useState<boolean>(false)
  const { open } = useWeb3Modal()

  useEffect(() => {
    setConnected(isConnected)
  }, [isConnected])

  return (
    <Menu>
      <MenuButton
        as={Button}
        aria-label="Options"
        variant="ghost"
        textOverflow="ellipsis"
        borderRadius="3xl"
        _hover={{
          borderColor: useColorModeValue('black', 'white'),
        }}
        border="2px"
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        px="2"
      >
        <Flex align="center">
          <HamburgerIcon />
          <Text pl="3">{name}</Text>
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={() => open()}
          pl="4"
          icon={!connected ? <WalletConnectIcon boxSize={6} /> : undefined}
        >
          {connected ? (
            <Flex>
              <Identicon address={address} image={session.data?.image} />
              <Text pl="3">
                {address &&
                  `${address.slice(0, 6)}...${address.slice(
                    address.length - 4,
                    address.length
                  )}`}
              </Text>
            </Flex>
          ) : (
            'Connect Wallet'
          )}
        </MenuItem>
        <MenuItem
          m="0"
          alignItems="center"
          icon={<Icon as={BiLogOut} boxSize={6} mt="1" />}
          onClick={() => signOut()}
        >
          Sign Out
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
