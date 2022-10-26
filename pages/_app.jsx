import { createClient, WagmiConfig, chain } from 'wagmi'
import { SessionProvider } from 'next-auth/react'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'

const client = createClient(
    getDefaultClient({
        appName: 'Portfolio Page',
        alchemyId: process.env.APP_ALCHEMY_ID,
        chains: [chain.mainnet],
    }),
)

function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={client}>
        <ConnectKitProvider theme='auto'>
            <SessionProvider session={pageProps.session} refetchInterval={0}>
                <Component {...pageProps} />
            </SessionProvider>
        </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default MyApp