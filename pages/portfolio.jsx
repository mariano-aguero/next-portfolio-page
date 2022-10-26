import { getSession, signOut } from 'next-auth/react'
import { ethers, BigNumber } from "ethers"

const ROONIVERSE_ADDRESS = process.env.APP_ROONIVERSE_ADDRESS
const THEHARVEST_ADDRESS = process.env.APP_THEHARVEST_ADDRESS
const USDCOIN_ADDRESS = process.env.APP_USDCOIN_ADDRESS
const ALCHEMY_API = process.env.APP_ALCHEMY_ID

const GNOSIS_SAFE_ADDRESSES =  [{ name: 'The Harvest', address: ROONIVERSE_ADDRESS }, { name: 'Rooniverse', address: THEHARVEST_ADDRESS }]

const USDCOIN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount)",
    "event Transfer(address indexed from, address indexed to, uint amount)"
]

const USDCOIN_DECIMALS = 6

const getTotalContribution = (logs) => {
    const initialValue = BigNumber.from(0)
    return logs.reduce(
        (previousValue, event) => {
            const [, , amount] = event.args
            return previousValue.add(amount)
        },
        initialValue
    )
}

const getLastTimestamp = async (logs) => {
    if (!logs || logs.length === 0) return null

    const log = logs[logs.length - 1]
    const { timestamp } = await log.getBlock()

    const milliseconds = timestamp * 1000
    const dateObject = new Date(milliseconds)
    return dateObject.toLocaleString()
}

const Portfolio = ({ user, contributions }) => {
    return (
        <div>
            <h4>User session:</h4>
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <button onClick={() => {
                localStorage.clear()
                signOut({ redirect: '/signin' })
            }}>Sign out</button>

            <table>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Your committed capital</th>
                    <th>Total committed capital</th>
                    <th>Your last date contribution</th>
                </tr>
                </thead>
                <tbody>
                { contributions.map((contribution, index) => {
                    const { name, yourCommittedCapital, totalCommittedCapital, lastDateContribution } = contribution
                    return (
                       <tr key={index}>
                           <td>{name}</td>
                           <td>{yourCommittedCapital} USDC</td>
                           <td>{totalCommittedCapital} USDC</td>
                           <td>{lastDateContribution || "Not available"}</td>
                       </tr>
                   )
                })}
                </tbody>
            </table>

        </div>
    )
}

export const getServerSideProps = async (context) => {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false,
            },
        }
    }

    const address = session?.user?.address ?? ''

    const provider = new ethers.providers.AlchemyProvider( 'homestead', ALCHEMY_API)
    const USDCoinContract = new ethers.Contract(USDCOIN_ADDRESS, USDCOIN_ABI, provider)

    const contributionsPromises = GNOSIS_SAFE_ADDRESSES.map(async({ name , address: gnosisSafeAddress }) => {
        const filter = USDCoinContract.filters.Transfer('0x4b1eb3e93bb3441e2f85c9cb56c324568b0acb71', gnosisSafeAddress)
        const balance = await USDCoinContract.balanceOf(gnosisSafeAddress)
        const logs = await USDCoinContract.queryFilter(filter)
        const totalContribution = getTotalContribution(logs)
        const lastDateContribution = await getLastTimestamp(logs)
        return {
            name,
            yourCommittedCapital: ethers.utils.formatUnits(totalContribution, USDCOIN_DECIMALS),
            totalCommittedCapital: ethers.utils.formatUnits(balance, USDCOIN_DECIMALS),
            lastDateContribution,
        }
    })

    const contributions = await Promise.all(contributionsPromises)

    return {
        props: {
            user: session.user,
            contributions,
        },
    }
}

export default Portfolio
