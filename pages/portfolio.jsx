import { getSession, signOut } from 'next-auth/react';
import { ethers, BigNumber } from 'ethers';
import {
  Box,
  Button,
  Typography,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Paper
} from '@mui/material';
import { Links } from './signin';
import { useAccount } from 'wagmi';
import React from 'react';

const ROONIVERSE_ADDRESS = process.env.APP_ROONIVERSE_ADDRESS;
const THEHARVEST_ADDRESS = process.env.APP_THEHARVEST_ADDRESS;
const USDCOIN_ADDRESS = process.env.APP_USDCOIN_ADDRESS;
const ALCHEMY_API = process.env.APP_ALCHEMY_ID;

const GNOSIS_SAFE_ADDRESSES = [
  { name: 'The Harvest', address: ROONIVERSE_ADDRESS },
  { name: 'Rooniverse', address: THEHARVEST_ADDRESS }
];

const USDCOIN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint)',
  'function transfer(address to, uint amount)',
  'event Transfer(address indexed from, address indexed to, uint amount)'
];

const USDCOIN_DECIMALS = 6;

const getTotalContribution = logs => {
  const initialValue = BigNumber.from(0);
  return logs.reduce((previousValue, event) => {
    const [, , amount] = event.args;
    return previousValue.add(amount);
  }, initialValue);
};

const Portfolio = ({ user, contributions }) => {
  const { address } = useAccount();
  const isAccountDifferent =
    user?.address?.toLowerCase() !== address?.toLowerCase();

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          py: 2,
          px: 2
        }}
      >
        <Links />
        <Box textAlign="right">
          <Button
            variant="outlined"
            onClick={() => {
              localStorage.clear();
              signOut({ redirect: '/signin' });
            }}
          >
            {' '}
            Sign out
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          px: 2
        }}
      >
        {isAccountDifferent && (
          <Typography variant="h6" align="left" color="red" sx={{ py: 5 }}>
            You have changed your account. You are already logged in with the
            other account, if you want to log in with a new account please, log
            out, log in with the new account, validate it.
          </Typography>
        )}
        <Typography variant="h5" align="center">
          User session:
        </Typography>
        <Box sx={{ whiteSpace: 'pre-wrap', py: 5 }}>
          {JSON.stringify(user, null, 2)}
        </Box>

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Your committed capital</strong>
                </TableCell>
                <TableCell>
                  <strong>Total committed capital</strong>
                </TableCell>
                <TableCell>
                  <strong>Your last date contribution</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((contribution, index) => {
                const {
                  name,
                  yourCommittedCapital,
                  totalCommittedCapital,
                  lastDateContribution
                } = contribution;
                return (
                  <TableRow key={index}>
                    <TableCell>{name}</TableCell>
                    <TableCell>{yourCommittedCapital} USDC</TableCell>
                    <TableCell>{totalCommittedCapital} USDC</TableCell>
                    <TableCell>
                      {lastDateContribution || 'Not available'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

const getLastTimestamp = async logs => {
  if (!logs || logs.length === 0) return null;

  const log = logs[logs.length - 1];
  const { timestamp } = await log.getBlock();

  const milliseconds = timestamp * 1000;
  const dateObject = new Date(milliseconds);
  return dateObject.toLocaleString();
};

export const getServerSideProps = async context => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false
      }
    };
  }

  const address = session?.user?.address ?? '';

  const provider = new ethers.providers.AlchemyProvider(
    'homestead',
    ALCHEMY_API
  );
  const USDCoinContract = new ethers.Contract(
    USDCOIN_ADDRESS,
    USDCOIN_ABI,
    provider
  );

  const contributionsPromises = GNOSIS_SAFE_ADDRESSES.map(
    async ({ name, address: gnosisSafeAddress }) => {
      const filter = USDCoinContract.filters.Transfer(
        address,
        gnosisSafeAddress
      );
      const balance = await USDCoinContract.balanceOf(gnosisSafeAddress);
      const logs = await USDCoinContract.queryFilter(filter);
      const totalContribution = getTotalContribution(logs);
      const lastDateContribution = await getLastTimestamp(logs);
      return {
        name,
        yourCommittedCapital: ethers.utils.formatUnits(
          totalContribution,
          USDCOIN_DECIMALS
        ),
        totalCommittedCapital: ethers.utils.formatUnits(
          balance,
          USDCOIN_DECIMALS
        ),
        lastDateContribution
      };
    }
  );

  const contributions = await Promise.all(contributionsPromises);

  return {
    props: {
      user: session.user,
      contributions
    }
  };
};

export default Portfolio;
