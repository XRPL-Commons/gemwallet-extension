import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Avatar, Box, Chip, Divider, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import { OfferCreate, Payment } from 'xrpl';

import { HOME_PATH, SWAP_FEE_PERCENTAGE } from '../../../../constants';
// Note: getFeeAddress is available for batch transaction support (see commented code below)
import { useLedger, useWallet } from '../../../../contexts';
// Note: useNetwork is available for batch transaction support (see commented code below)
import { TransactionStatus } from '../../../../types';
import { SwapData } from '../../../../types/swap.types';
import { convertHexCurrencyString } from '../../../../utils';
import { toUIError } from '../../../../utils/errors';
import { buildAMMSwapTransaction, buildDEXSwapTransaction } from '../../../../utils/swap';
// Note: buildFeePayment is available for batch transaction support (see commented code below)
import { AsyncTransaction, TransactionPage } from '../../../templates';

export interface ConfirmSwapProps {
  swapData: SwapData;
  onBack: () => void;
}

export const ConfirmSwap: FC<ConfirmSwapProps> = ({ swapData, onBack }) => {
  const navigate = useNavigate();
  const { getCurrentWallet } = useWallet();
  // Note: networkName from useNetwork() is available for batch transaction support
  const { estimateNetworkFees, sendPayment, createOffer } = useLedger();

  const [transaction, setTransaction] = useState<TransactionStatus>();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [networkFees, setNetworkFees] = useState<string>('Loading...');

  const wallet = getCurrentWallet();
  const { fromToken, toToken, amount, quote, slippage } = swapData;

  // Build the swap transaction
  const swapTransaction = useMemo(() => {
    if (!wallet) return null;

    if (quote.route === 'AMM') {
      return buildAMMSwapTransaction({
        account: wallet.publicAddress,
        sourceToken: fromToken,
        destToken: toToken,
        sourceAmount: amount,
        expectedOutput: quote.destinationAmount,
        minimumReceived: quote.minimumReceived
      });
    } else {
      // DEX swap using OfferCreate
      const takerGets =
        toToken.currency === 'XRP'
          ? (parseFloat(quote.destinationAmount) * 1_000_000).toString()
          : {
              currency: toToken.currency,
              issuer: toToken.issuer!,
              value: quote.destinationAmount
            };

      const takerPays =
        fromToken.currency === 'XRP'
          ? (parseFloat(amount) * 1_000_000).toString()
          : {
              currency: fromToken.currency,
              issuer: fromToken.issuer!,
              value: amount
            };

      return buildDEXSwapTransaction({
        account: wallet.publicAddress,
        takerGets,
        takerPays
      });
    }
  }, [wallet, quote, fromToken, toToken, amount]);

  // Fee payment transaction builder - ready for batch transactions
  // When batch transactions are enabled on mainnet, uncomment and use:
  /*
  const feeTransaction = useMemo(() => {
    if (!wallet) return null;
    const feeAddress = getFeeAddress(networkName);
    if (!feeAddress) return null;

    return buildFeePayment({
      account: wallet.publicAddress,
      feeAmount: quote.fee.amount,
      feeCurrency: quote.fee.currency,
      feeIssuer: quote.fee.issuer,
      feeRecipient: feeAddress
    });
  }, [wallet, networkName, quote.fee]);
  */

  // Estimate network fees
  useEffect(() => {
    const estimateFees = async () => {
      if (!swapTransaction) return;

      try {
        const fees = await estimateNetworkFees(swapTransaction as Payment | OfferCreate);
        setNetworkFees(fees);
      } catch (e) {
        Sentry.captureException(e);
        setNetworkFees('Unable to estimate');
      }
    };

    estimateFees();
  }, [swapTransaction, estimateNetworkFees]);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (!wallet || !swapTransaction) return;

    setTransaction(TransactionStatus.Pending);

    try {
      if (quote.route === 'AMM') {
        // AMM swap is a Payment transaction
        await sendPayment(swapTransaction as Payment);
      } else {
        // DEX swap is an OfferCreate transaction
        await createOffer(swapTransaction as OfferCreate);
      }

      setTransaction(TransactionStatus.Success);

      // Note: Fee collection is done separately for now (not in batch)
      // TODO: When batch transactions are enabled on mainnet, use buildBatchSwapTransaction
    } catch (e) {
      setErrorMessage(toUIError(e as Error).message);
      setTransaction(TransactionStatus.Rejected);
      Sentry.captureException(e);
    }
  }, [wallet, swapTransaction, quote.route, sendPayment, createOffer]);

  // Handle reject
  const handleReject = useCallback(() => {
    onBack();
  }, [onBack]);

  // Handle transaction complete
  const handleTransactionClick = useCallback(() => {
    navigate(HOME_PATH);
  }, [navigate]);

  // Format currency display
  const formatCurrency = (token: typeof fromToken) => {
    return convertHexCurrencyString(token.currency);
  };

  // Success/Pending state
  if (transaction === TransactionStatus.Success || transaction === TransactionStatus.Pending) {
    return (
      <AsyncTransaction
        title={transaction === TransactionStatus.Success ? 'Swap Successful' : 'Processing Swap'}
        subtitle={
          transaction === TransactionStatus.Success ? (
            `Swapped ${parseFloat(amount).toFixed(4)} ${formatCurrency(fromToken)} for ${parseFloat(quote.destinationAmount).toFixed(4)} ${formatCurrency(toToken)}`
          ) : (
            <>
              We are processing your swap
              <br />
              Please wait
            </>
          )
        }
        transaction={transaction}
        onClick={handleTransactionClick}
      />
    );
  }

  // Rejected state
  if (transaction === TransactionStatus.Rejected) {
    return (
      <AsyncTransaction
        title="Swap Failed"
        subtitle={
          <>
            Your swap could not be completed.
            <br />
            {errorMessage}
          </>
        }
        transaction={TransactionStatus.Rejected}
        onClick={handleTransactionClick}
      />
    );
  }

  return (
    <TransactionPage
      title="Confirm Swap"
      description="Review your swap details"
      approveButtonText="Confirm Swap"
      onClickApprove={handleConfirm}
      onClickReject={handleReject}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* From Token */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            You Pay
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}
          >
            <Typography variant="h5" fontWeight={600}>
              {parseFloat(amount).toFixed(6)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={fromToken.icon}
                sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}
              >
                {formatCurrency(fromToken).slice(0, 2).toUpperCase()}
              </Avatar>
              <Typography variant="body1" fontWeight={500}>
                {formatCurrency(fromToken)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Arrow */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ArrowDownwardIcon color="action" />
        </Box>

        {/* To Token */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            You Receive
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}
          >
            <Typography variant="h5" fontWeight={600} color="primary.main">
              {parseFloat(quote.destinationAmount).toFixed(6)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={toToken.icon}
                sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}
              >
                {formatCurrency(toToken).slice(0, 2).toUpperCase()}
              </Avatar>
              <Typography variant="body1" fontWeight={500}>
                {formatCurrency(toToken)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Details */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          {/* Route */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Route
            </Typography>
            <Chip
              label={quote.route}
              size="small"
              color={quote.route === 'AMM' ? 'primary' : 'secondary'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>

          {/* Rate */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Rate
            </Typography>
            <Typography variant="body2">
              1 {formatCurrency(fromToken)} = {quote.rate.toFixed(6)} {formatCurrency(toToken)}
            </Typography>
          </Box>

          {/* Price Impact */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Price Impact
            </Typography>
            <Typography
              variant="body2"
              color={
                quote.priceImpact > 0.05
                  ? 'error.main'
                  : quote.priceImpact > 0.03
                    ? 'warning.main'
                    : 'success.main'
              }
            >
              {(quote.priceImpact * 100).toFixed(2)}%
            </Typography>
          </Box>

          {/* Slippage */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Slippage Tolerance
            </Typography>
            <Typography variant="body2">{(slippage * 100).toFixed(1)}%</Typography>
          </Box>

          {/* Minimum Received */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Minimum Received
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {parseFloat(quote.minimumReceived).toFixed(6)} {formatCurrency(toToken)}
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Swap Fee */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Swap Fee ({(SWAP_FEE_PERCENTAGE * 100).toFixed(1)}%)
            </Typography>
            <Typography variant="body2">
              {parseFloat(quote.fee.amount).toFixed(6)} {formatCurrency(toToken)}
            </Typography>
          </Box>

          {/* Network Fee */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Network Fee
            </Typography>
            <Typography variant="body2">{networkFees} XRP</Typography>
          </Box>
        </Box>
      </Box>
    </TransactionPage>
  );
};
