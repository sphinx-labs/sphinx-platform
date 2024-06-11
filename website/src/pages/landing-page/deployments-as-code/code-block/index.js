import React from 'react'
import { CodeBlock, atomOneDark } from 'react-code-blocks'

export const CustomCodeBlock = ({ text, format }) => {
  return (
    <CodeBlock
      showLineNumbers={false}
      language="typescript"
      text={text}
      theme={atomOneDark}
      customStyle={{
        borderRadius: '10px',
        fontSize: format === 'desktop' ? '0.8rem' : '0.6rem',
        marginBottom: '15px',
      }}
    />
  )
}
