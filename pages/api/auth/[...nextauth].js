import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import { verifyMessage } from 'ethers/lib/utils'

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Auth',
            credentials: {
                message: {
                    label: 'Message',
                    type: 'text',
                    placeholder: '0x0',
                },
                signature: {
                    label: 'Signature',
                    type: 'text',
                    placeholder: '0x0',
                },
            },
            async authorize(credentials) {
                try {
                    const { message, signature } = credentials
                    const address = verifyMessage(message, signature)
                    const user = { address, signature }
                    return user
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        // See problem https://github.com/nextauthjs/next-auth/discussions/1039#discussion-1336033
        async jwt({ token, user }) {
            user && (token.user = user)
            return token
        },
        async session({ session, token }) {
            const currentTime = new Date().getTime()
            // Current time plus 2 hours
            const expirationTime = new Date(currentTime + 2 * 60 * 60 * 1000).toISOString()
            session.expires = expirationTime
            session.user = token.user
            return session
        },
    },
    session: {
        strategy: 'jwt',
    },
})
