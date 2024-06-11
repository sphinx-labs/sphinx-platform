import { Box } from '@chakra-ui/react'
import styled from '@emotion/styled'
import Jazzicon from '@metamask/jazzicon'
import Image from 'next/image'
import React, { useEffect, useRef } from 'react'

const StyledIdenticon = styled.div`
  height: 1.5rem;
  width: 1.5rem;
  border-radius: 1.125rem;
  background-color: black;
`

type Props = {
  address: string | undefined
  image: string | undefined
}

export const Identicon: React.FC<Props> = ({ address, image }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (address && ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(Jazzicon(24, parseInt(address.slice(2, 10), 16)))
    }
  }, [address])

  return image ? (
    <Box
      width="1.5rem"
      height="1.5rem"
      borderRadius="1.125rem"
      position="relative"
      overflow="clip"
    >
      <Image src={image} alt="ens avatar" fill />
    </Box>
  ) : (
    <StyledIdenticon ref={ref} />
  )
}
