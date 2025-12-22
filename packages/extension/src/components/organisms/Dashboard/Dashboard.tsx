import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Button, Link, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import { AccountLinesTrustline, TrustSetFlags as TrustSetFlagsBitmask } from 'xrpl';

import { Chain, XahauNetwork, XRPLNetwork } from '@gemwallet/constants';

import {
  ADD_NEW_TRUSTLINE_PATH,
  DEFAULT_RESERVE,
  ERROR_RED,
  RESERVE_PER_OWNER,
  STORAGE_MESSAGING_KEY,
  XAHAU_RESERVE_PER_OWNER
} from '../../../constants';
import { useLedger, useNetwork, useServer } from '../../../contexts';
import { useMainToken } from '../../../hooks';
import {
  addPortfolioSnapshot,
  convertHexCurrencyString,
  generateKey,
  getWalletPortfolioHistory,
  PortfolioSnapshot,
  saveInChromeSessionStorage
} from '../../../utils';
import { isLPToken } from '../../../utils/trustlines';
import { TokenLoader } from '../../atoms';
import { ActionGrid, InformationMessage, PortfolioChart, TokenDisplay } from '../../molecules';
import { MPTokenListing } from '../MPTokenListing';
import { DialogPage } from '../../templates';

const LOADING_STATE = 'Loading...';
const ERROR_STATE = 'Error';

// Mock XRP price - in production, fetch from an API like CoinGecko
const MOCK_XRP_PRICE = 2.2;

interface TrustLineBalance {
  value: string;
  currency: string;
  issuer: string;
  trustlineDetails?: {
    limit: number;
    noRipple: boolean;
  };
}

export interface DashboardProps {
  address: string;
}

export const Dashboard: FC<DashboardProps> = ({ address }) => {
  const [mainTokenBalance, setMainTokenBalance] = useState<string>(LOADING_STATE);
  const [reserve, setReserve] = useState<number>(DEFAULT_RESERVE);
  const [ownerReserve, setOwnerReserve] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [trustLineBalances, setTrustLineBalances] = useState<TrustLineBalance[]>([]);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [showTokens, setShowTokens] = useState(false);
  const { client, reconnectToNetwork, networkName, chainName } = useNetwork();
  const { serverInfo } = useServer();
  const { fundWallet, getAccountInfo } = useLedger();
  const mainToken = useMainToken();
  const navigate = useNavigate();

  const baseReserve = serverInfo?.info.validated_ledger?.reserve_base_xrp || DEFAULT_RESERVE;
  const ownerReserveBase =
    chainName === Chain.XAHAU
      ? serverInfo?.info.validated_ledger?.reserve_inc_xrp || XAHAU_RESERVE_PER_OWNER
      : serverInfo?.info.validated_ledger?.reserve_inc_xrp || RESERVE_PER_OWNER;

  // Calculate total portfolio value in USD
  const portfolioValue = useMemo(() => {
    if (mainTokenBalance === LOADING_STATE || mainTokenBalance === ERROR_STATE) {
      return 0;
    }
    const xrpValue = (Number(mainTokenBalance) - reserve) * MOCK_XRP_PRICE;
    return Math.max(0, xrpValue);
  }, [mainTokenBalance, reserve]);

  // Load portfolio history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await getWalletPortfolioHistory(address);
      setPortfolioHistory(history);
    };
    loadHistory();
  }, [address]);

  // Save portfolio snapshot when balance changes (only if value > 0)
  useEffect(() => {
    if (
      mainTokenBalance !== LOADING_STATE &&
      mainTokenBalance !== ERROR_STATE &&
      portfolioValue > 0
    ) {
      addPortfolioSnapshot(address, portfolioValue, Number(mainTokenBalance), MOCK_XRP_PRICE).then(
        () => {
          getWalletPortfolioHistory(address).then(setPortfolioHistory);
        }
      );
    }
  }, [address, mainTokenBalance, portfolioValue]);

  // Fetch balances - moved getAccountInfo into useEffect to fix performance
  useEffect(() => {
    async function fetchBalance() {
      try {
        const balances = await client?.getBalances(address);
        const mainTokenBalance = balances?.find((balance) => balance.issuer === undefined);
        let trustLineBalances = balances?.filter(
          (balance) => balance.issuer !== undefined
        ) as TrustLineBalance[];

        const accountLines = await client?.request({
          command: 'account_lines',
          account: address
        });

        if (accountLines?.result?.lines) {
          trustLineBalances = trustLineBalances
            .map((trustlineBalance) => {
              const trustlineDetails = accountLines.result.lines.find(
                (line: AccountLinesTrustline) =>
                  line.currency === trustlineBalance.currency &&
                  line.account === trustlineBalance.issuer
              );

              return {
                ...trustlineBalance,
                trustlineDetails:
                  trustlineDetails && Number(trustlineDetails.limit)
                    ? {
                        limit: Number(trustlineDetails.limit),
                        noRipple: trustlineDetails.no_ripple === true
                      }
                    : undefined
              };
            })
            .filter(
              (trustlineBalance) =>
                trustlineBalance.trustlineDetails || trustlineBalance.value !== '0'
            );
        }

        if (mainTokenBalance) {
          setMainTokenBalance(mainTokenBalance.value);
        }
        if (trustLineBalances) {
          setTrustLineBalances(trustLineBalances);
        }

        // Fetch account info for reserve calculation
        const accountInfo = await getAccountInfo();
        const calculatedOwnerReserve =
          accountInfo.result.account_data.OwnerCount * ownerReserveBase;
        setOwnerReserve(calculatedOwnerReserve);
        setReserve(calculatedOwnerReserve + baseReserve);
      } catch (e: unknown) {
        const error = e as { data?: { error?: string } };
        if (error?.data?.error !== 'actNotFound') {
          Sentry.captureException(e);
        }
        setMainTokenBalance(ERROR_STATE);
        setOwnerReserve(0);
        setReserve(DEFAULT_RESERVE);
      }
    }

    fetchBalance();
  }, [address, client, getAccountInfo, baseReserve, ownerReserveBase]);

  const handleOpen = useCallback(() => {
    setExplanationOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setExplanationOpen(false);
  }, []);

  const handleChartClick = useCallback(() => {
    setShowTokens((prev) => !prev);
  }, []);

  const hasFundWallet = useMemo(() => {
    switch (chainName) {
      case Chain.XRPL:
        return networkName === XRPLNetwork.TESTNET || networkName === XRPLNetwork.DEVNET;
      case Chain.XAHAU:
        return networkName === XahauNetwork.XAHAU_TESTNET;
      default:
        return false;
    }
  }, [chainName, networkName]);

  const handleFundWallet = useCallback(() => {
    setErrorMessage('');
    setMainTokenBalance(LOADING_STATE);
    fundWallet()
      .then(({ balance }) => setMainTokenBalance(balance.toString()))
      .catch((e) => {
        setMainTokenBalance(ERROR_STATE);
        setErrorMessage(e.message);
      });
  }, [fundWallet]);

  if (client === null) {
    return (
      <InformationMessage
        title="Failed to connect to the network"
        style={{
          padding: '15px'
        }}
      >
        <Typography style={{ marginBottom: '5px' }}>
          There was an error attempting to connect to the network. Please refresh the page and try
          again.
        </Typography>
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <Button variant="contained" onClick={reconnectToNetwork} style={{ marginBottom: '10px' }}>
            Refresh
          </Button>
          {errorMessage && <Typography style={{ color: ERROR_RED }}>{errorMessage}</Typography>}
        </div>
      </InformationMessage>
    );
  }

  if (mainTokenBalance === LOADING_STATE) {
    return <TokenLoader />;
  }

  if (mainTokenBalance === ERROR_STATE) {
    return (
      <InformationMessage title="Account not activated">
        <div style={{ marginBottom: '5px' }}>
          To create this account to the XRP ledger, you will have to make a first deposit of a
          minimum {baseReserve} {mainToken}.
        </div>
        <Link
          href="https://xrpl.org/reserves.html?utm_source=gemwallet.app"
          target="_blank"
          rel="noreferrer"
        >
          Learn more about the account reserve.
        </Link>
        <div style={{ marginTop: '5px' }}>
          Your reserved {mainToken} will not show up within your GemWallet's balance as you cannot
          spend it.
        </div>

        {hasFundWallet && (
          <div style={{ margin: '15px 0px', textAlign: 'center' }}>
            <Button variant="contained" onClick={handleFundWallet} data-testid="fund-wallet-button">
              Fund Wallet
            </Button>
          </div>
        )}
      </InformationMessage>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      {/* Portfolio Chart - Clickable to show/hide tokens */}
      <PortfolioChart
        totalValue={portfolioValue}
        snapshots={portfolioHistory}
        onClick={handleChartClick}
      />

      {/* Token List - shown when chart is clicked */}
      {showTokens && (
        <Box sx={{ mb: 2 }}>
          <TokenDisplay
            balance={Number(mainTokenBalance) - reserve}
            token={mainToken}
            isMainToken
            onExplainClick={handleOpen}
          />
          {trustLineBalances.map((trustedLine) => {
            const isAMMLPToken = isLPToken(trustedLine.currency);
            const currencyToDisplay = convertHexCurrencyString(trustedLine.currency);
            const canBeEdited =
              (trustedLine.trustlineDetails || trustedLine.value !== '0') && !isAMMLPToken;
            const limit = trustedLine.trustlineDetails?.limit || 0;
            const noRipple = trustedLine.trustlineDetails?.noRipple || false;
            const flags = noRipple ? TrustSetFlagsBitmask.tfSetNoRipple : undefined;
            const limitAmount = {
              currency: convertHexCurrencyString(trustedLine.currency),
              issuer: trustedLine.issuer,
              value: limit.toString()
            };
            return (
              <TokenDisplay
                balance={Number(trustedLine.value)}
                token={currencyToDisplay}
                issuer={trustedLine.issuer}
                key={`${trustedLine.issuer}|${currencyToDisplay}`}
                trustlineLimit={
                  trustedLine.trustlineDetails?.limit ? trustedLine.trustlineDetails?.limit : 0
                }
                trustlineNoRipple={noRipple}
                onTrustlineDetailsClick={
                  canBeEdited
                    ? () => {
                        const key = generateKey();
                        saveInChromeSessionStorage(
                          key,
                          JSON.stringify({
                            limitAmount,
                            flags
                          })
                        ).then(() => {
                          navigate(
                            `${ADD_NEW_TRUSTLINE_PATH}?showForm=true&inAppCall=true&${STORAGE_MESSAGING_KEY}=${key}`
                          );
                        });
                      }
                    : undefined
                }
              />
            );
          })}
          <MPTokenListing address={address} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate(`${ADD_NEW_TRUSTLINE_PATH}?showForm=true&inAppCall=true`)}
              size="small"
            >
              Add trustline
            </Button>
          </Box>
        </Box>
      )}

      {/* Action Grid */}
      <ActionGrid excludeItems={['Tokens']} />

      {/* Balance Explanation Dialog */}
      <DialogPage title="Account balance" onClose={handleClose} open={explanationOpen}>
        <div style={{ margin: '20px' }}>
          <InformationMessage
            title="Information"
            style={{
              padding: '15px'
            }}
          >
            <Typography style={{ marginBottom: '5px' }}>
              The activation of this account was made through a minimum deposit of {baseReserve}{' '}
              {mainToken}.
            </Typography>
            <Link
              href="https://xrpl.org/reserves.html?utm_source=gemwallet.app"
              target="_blank"
              rel="noreferrer"
            >
              Learn more about the account reserve.
            </Link>
          </InformationMessage>
          <Typography style={{ margin: '20px 0 10px 0' }}>Account balance</Typography>
          <TokenDisplay balance={Number(mainTokenBalance)} isMainToken token={mainToken} />
          <Typography style={{ margin: '20px 0 10px 0' }}>Amount that can be spent</Typography>
          <TokenDisplay
            balance={Number(mainTokenBalance) - reserve}
            isMainToken
            token={mainToken}
          />
          <Typography style={{ margin: '20px 0 10px 0' }}>Base reserve</Typography>
          <TokenDisplay balance={baseReserve} isMainToken token={mainToken} />
          <Typography style={{ margin: '20px 0 10px 0' }}>Owner reserve</Typography>
          <TokenDisplay balance={ownerReserve} isMainToken token={mainToken} />
        </div>
      </DialogPage>
    </Box>
  );
};
