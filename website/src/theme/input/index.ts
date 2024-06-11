import { defineStyleConfig } from '@chakra-ui/styled-system'

export const Input = defineStyleConfig({
  variants: {
    outline: {
      field: {
        border: '2px',
        borderColor: 'black.500',
        _hover: {
          boxShadow: 'none !important',
          borderColor: 'blue.500',
        },
      },
    },
  },
  defaultProps: {
    variant: 'outline',
  },
})
