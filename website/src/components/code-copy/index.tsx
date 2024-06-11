import { CheckCircleIcon, CopyIcon } from '@chakra-ui/icons'
import {
  Code,
  CodeProps,
  Flex,
  IconButton,
  Text,
  useClipboard,
} from '@chakra-ui/react'
import { Roles } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

type Props = {
  code: string
  title: string
  hide?: boolean
  props?: CodeProps
}

export const CodeCopy: React.FC<Props> = ({
  code,
  title,
  hide = false,
  props,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false)
  const { onCopy: onCopyCode, value } = useClipboard(code)
  const session = useSession()

  return (
    <Code borderRadius="md" mr="2" {...props}>
      <Flex ml="2" alignItems="center">
        <Text mr={2} whiteSpace="nowrap">
          {title}
        </Text>
        {hide && session.data?.role !== Roles.owner ? (
          <Text p="2.5">Ask your organization admin for the API key</Text>
        ) : (
          <>
            <Text mr={0}>{value}</Text>
            <IconButton
              variant="ghost"
              aria-label="Copy org id to clipboard"
              onClick={() => {
                onCopyCode()
                setCopiedCode(true)
                setTimeout(() => {
                  setCopiedCode(false)
                }, 2000)
              }}
              ml="2"
              icon={!copiedCode ? <CopyIcon /> : <CheckCircleIcon />}
            />
          </>
        )}
      </Flex>
    </Code>
  )
}
