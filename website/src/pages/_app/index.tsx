import { ApolloProvider } from '@apollo/client'
import { ChakraProvider } from '@chakra-ui/react'
import '@fontsource/hanken-grotesk/400.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useApollo } from 'src/lib/apolloClient'
import { config, projectId } from 'src/pages/_app/constants'
import { theme } from 'src/theme'
import { WagmiProvider } from 'wagmi'

// Setup queryClient
const queryClient = new QueryClient()

if (!projectId) throw new Error('Project ID is not defined')

const MyApp = ({ Component, pageProps }: AppProps) => {
  const apolloClient = useApollo(pageProps)

  return (
    <ApolloProvider client={apolloClient}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <ChakraProvider theme={theme}>
              <Head>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1"
                />
              </Head>
              <Component {...pageProps} />
            </ChakraProvider>
          </SessionProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ApolloProvider>
  )
}

export default MyApp
