import { signIn } from 'next-auth/react'
import { useNetwork, useSignMessage } from 'wagmi'
import { useRouter } from 'next/router'
import axios from 'axios'
import { ConnectKitButton } from 'connectkit'

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
        <>
            <button onClick={onClick}>
                <span>{ensName ?? truncateAddress(address)}</span>
                <span>{chain?.name}</span>
            </button>
            <button onClick={signMessage}>Sign Message</button>
        </>
    )
}

const ConnectButton = () => {
    return (
        <ConnectKitButton.Custom>
            {({ isConnected, show, address, ensName }) => {
                if (!isConnected) {
                    return (
                        <button onClick={show}>
                            Connect Wallet
                        </button>
                    )
                }

                return <ConnectedButton address={address} ensName={ensName} onClick={show} />
            }}
        </ConnectKitButton.Custom>
    )
}

const SignIn = () => {
    return (
        <div>
            <h3>Web3 Authentication</h3>
            <ConnectButton />
        </div>
    )
}

export default SignIn