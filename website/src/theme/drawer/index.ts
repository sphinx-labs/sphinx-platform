import { defineStyleConfig } from '@chakra-ui/react'

export const Drawer = defineStyleConfig({
  variants: {
    alert: {
      dialog: {
        pointerEvents: 'auto',
      },
      dialogContainer: {
        pointerEvents: 'none',
      },
    },
  },
})
