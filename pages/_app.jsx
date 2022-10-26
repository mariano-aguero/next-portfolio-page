import { createClient, WagmiConfig, chain } from 'wagmi';
import { SessionProvider } from 'next-auth/react';
import { ConnectKitProvider, getDefaultClient } from 'connectkit';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import theme from '../config/theme';
import createEmotionCache from '../config/createEmotionCache';
import React from 'react';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const client = createClient(
  getDefaultClient({
    appName: 'Portfolio Page',
    alchemyId: process.env.APP_ALCHEMY_ID,
    chains: [chain.mainnet]
  })
);

function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const [showChild, setShowChild] = React.useState(false);

  React.useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }
  if (typeof window === 'undefined') {
    return <></>;
  }

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <WagmiConfig client={client}>
          <ConnectKitProvider theme="auto">
            <SessionProvider session={pageProps.session} refetchInterval={0}>
              {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
              <CssBaseline />
              <Component {...pageProps} />
            </SessionProvider>
          </ConnectKitProvider>
        </WagmiConfig>
        `
      </ThemeProvider>
    </CacheProvider>
  );
}

export default MyApp;
