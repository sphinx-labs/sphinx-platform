import {
  CloseButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  Flex,
  Spacer,
  useDisclosure,
} from '@chakra-ui/react'

type Props = {
  children: React.ReactNode
}

export const AlertDrawer: React.FC<Props> = ({ children }) => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true })

  return (
    <Drawer
      placement="bottom"
      onClose={onClose}
      isOpen={isOpen}
      autoFocus={false}
      variant="alert"
      trapFocus={false}
      blockScrollOnMount={false}
    >
      <DrawerContent>
        <DrawerBody>
          <Flex flexDir="row" h="100%" w="100%" alignItems="center">
            {children}
            <Spacer />
            <CloseButton onClick={onClose} mr={-2} />
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
