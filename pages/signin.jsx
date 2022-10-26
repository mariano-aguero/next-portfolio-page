import { signIn } from 'next-auth/react'
import { useNetwork, useSignMessage, useAccount } from 'wagmi'
import { useRouter } from 'next/router'
import axios from 'axios'
import { ConnectKitButton } from 'connectkit'
import { Button, Box, Tooltip, Typography, Link } from '@mui/material'

export const truncateAddress = (address) =>
    address.replace(address.substring(6, 38), '...')

const ConnectedButton = ({ ensName, address, onClick }) => {
    const { chain } = useNetwork()
    const { signMessageAsync } = useSignMessage()
    const { push } = useRouter()

    const signMessage = async() => {
        const userData = {address, ensName, chain: '0x1', network: 'evm'}

        const { data: message } = await axios.post('/api/auth/request-message', userData, {
            headers: {
                'content-type': 'application/json',
            },
        })

        const signature = await signMessageAsync({ message })

        // redirect user after success authentication to '/portfolio' page
        const { url } = await signIn('credentials', {message, signature, redirect: false, callbackUrl: '/portfolio'})
        /**
         * instead of using signIn(..., redirect: "/portfolio")
         * we get the url from callback and push it to the router to avoid page refreshing
         */
        if (url) push(url)
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 2
        }}>
            <Box>
                <Tooltip title={ensName ?? address}>
                    <Button variant='outlined' onClick={onClick}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                flexDirection: 'column',
                            }}
                        >
                            <span>{ensName ?? truncateAddress(address)}</span>
                            <span>{chain?.name}</span>
                        </Box>
                    </Button>
                </Tooltip>
            </Box>
            <Box textAlign='right'>
                <Button variant='outlined' onClick={signMessage}>Sign Message</Button>
            </Box>
        </Box>
    )
}

const ConnectButton = () => {
    return (
        <ConnectKitButton.Custom>
            {({ isConnected, show, address, ensName }) => {
                if (!isConnected)
                    return (
                        <Button variant='contained' onClick={show}>
                            Connect Wallet
                        </Button>
                    )
                return <ConnectedButton address={address} ensName={ensName} onClick={show} />
            }}
        </ConnectKitButton.Custom>
    )
}

export const Links = () => {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
            <Link href='#'>Logo</Link>
            <Link href='#'>About</Link>
            <Link href='#'>Social</Link>
            <Link href='#'>Apply</Link>
            <Link href='#'>KYC</Link>
            <Link href='/portfolio'>Portfolio</Link>
        </Box>
    )
}

const SignIn = () => {
    const { isConnected } = useAccount()

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    py: 2,
                    px: 2,
                }}
            >
                <Links />
                <Box textAlign='right'>
                    <ConnectButton />
                </Box>
            </Box>


            {!isConnected && (
                <Typography variant='h6' align='center'>
                    Please connect your wallet.
                </Typography>
            )}
            {isConnected && (
                <Typography variant='h6' align='center'>
                    Please sign a message to prove the ownership of the given wallet.
                </Typography>
            )}
        </>
    )
}

export default SignIn