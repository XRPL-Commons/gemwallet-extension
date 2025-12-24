import { FC } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Box, Chip, CircularProgress, Skeleton, Tooltip, Typography } from '@mui/material';

import {
  PRICE_IMPACT_HIGH_THRESHOLD,
  PRICE_IMPACT_WARNING_THRESHOLD,
  SWAP_FEE_PERCENTAGE
} from '../../../../../constants';
import { SwapQuote, SwapToken } from '../../../../../types/swap.types';
import { convertHexCurrencyString } from '../../../../../utils';

export interface QuoteDisplayProps {
  quote: SwapQuote | null;
  loading: boolean;
  error: string | null;
  fromToken: SwapToken | null;
  toToken: SwapToken | null;
}

export const QuoteDisplay: FC<QuoteDisplayProps> = ({
  quote,
  loading,
  error,
  fromToken,
  toToken
}) => {
  if (!fromToken || !toToken) {
    return null;
  }

  if (loading) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Fetching best price...
          </Typography>
        </Box>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)'
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!quote) {
    return null;
  }

  const fromCurrency = convertHexCurrencyString(fromToken.currency);
  const toCurrency = convertHexCurrencyString(toToken.currency);

  const getPriceImpactColor = (impact: number): string => {
    if (impact >= PRICE_IMPACT_HIGH_THRESHOLD) return 'error.main';
    if (impact >= PRICE_IMPACT_WARNING_THRESHOLD) return 'warning.main';
    return 'success.main';
  };

  const formatRate = (rate: number): string => {
    if (rate >= 1000) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Exchange Rate */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SwapHorizIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Rate
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={500}>
          1 {fromCurrency} = {formatRate(quote.rate)} {toCurrency}
        </Typography>
      </Box>

      {/* Route Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
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

      {/* Price Impact */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrendingDownIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Price Impact
          </Typography>
          <Tooltip title="The difference between the market price and estimated price due to trade size">
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', fontSize: 14 }} />
          </Tooltip>
        </Box>
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{ color: getPriceImpactColor(quote.priceImpact) }}
        >
          {(quote.priceImpact * 100).toFixed(2)}%
        </Typography>
      </Box>

      {/* GemWallet Fee */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Swap Fee
          </Typography>
          <Tooltip title={`${(SWAP_FEE_PERCENTAGE * 100).toFixed(1)}% fee on swap output`}>
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', fontSize: 14 }} />
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {parseFloat(quote.fee.amount).toFixed(6)} {convertHexCurrencyString(quote.fee.currency)}
        </Typography>
      </Box>

      {/* Minimum Received */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: 1.5,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Minimum Received
          </Typography>
          <Tooltip title="The minimum amount you'll receive after slippage tolerance">
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', fontSize: 14 }} />
          </Tooltip>
        </Box>
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {parseFloat(quote.minimumReceived).toFixed(6)} {toCurrency}
        </Typography>
      </Box>

      {/* High Price Impact Warning */}
      {quote.priceImpact >= PRICE_IMPACT_WARNING_THRESHOLD && (
        <Box
          sx={{
            mt: 1.5,
            p: 1,
            borderRadius: 1,
            backgroundColor:
              quote.priceImpact >= PRICE_IMPACT_HIGH_THRESHOLD
                ? 'rgba(244, 67, 54, 0.1)'
                : 'rgba(255, 152, 0, 0.1)'
          }}
        >
          <Typography
            variant="caption"
            color={quote.priceImpact >= PRICE_IMPACT_HIGH_THRESHOLD ? 'error' : 'warning.main'}
          >
            {quote.priceImpact >= PRICE_IMPACT_HIGH_THRESHOLD
              ? 'Price impact is very high. You may receive significantly less than expected.'
              : 'Price impact is higher than normal. Consider reducing trade size.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
