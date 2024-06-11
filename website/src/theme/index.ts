import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

import { Button } from 'src/theme/button'
import { Drawer } from 'src/theme/drawer'
import { Input } from 'src/theme/input'

export const initialColorMode = 'dark'

const config: ThemeConfig = {
  initialColorMode,
}

export const theme = extendTheme({
  config,
  fonts: {
    heading: 'Hanken Grotesk, sans-serif',
    body: 'Hanken Grotesk, sans-serif',
  },
  components: {
    Button,
    Input,
    Drawer,
  },
})
