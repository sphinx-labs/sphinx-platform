import { defineStyleConfig } from '@chakra-ui/react'

export const Button = defineStyleConfig({
  variants: {
    outline: {
      border: '2px solid',
      borderColor: 'black.500',
      color: 'black.500',
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'outline',
  },
})
