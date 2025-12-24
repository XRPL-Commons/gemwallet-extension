import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  DEFAULT_SLIPPAGE,
  HOME_PATH,
  PRICE_IMPACT_BLOCK_THRESHOLD,
  QUOTE_REFRESH_INTERVAL
} from '../../../../constants';
import { useSwapQuote, useSwapTokens } from '../../../../hooks';
import { SwapData, SwapToken } from '../../../../types/swap.types';
import { convertHexCurrencyString } from '../../../../utils';
import { PageWithReturn } from '../../../templates';
import { QuoteDisplay } from './QuoteDisplay';
import { SlippageSettings } from './SlippageSettings';
import { TokenSelector } from './TokenSelector';

export interface PrepareSwapProps {
  onSwapClick: (data: SwapData) => void;
}

export const PrepareSwap: FC<PrepareSwapProps> = ({ onSwapClick }) => {
  const navigate = useNavigate();
  const { tokens, popularTokens } = useSwapTokens();

  // State
  const [fromToken, setFromToken] = useState<SwapToken | null>(null);
  const [toToken, setToToken] = useState<SwapToken | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);

  // Fetch quote
  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
    refetch: refetchQuote
  } = useSwapQuote({
    fromToken,
    toToken,
    amount,
    slippage
  });

  // Auto-refresh quote
  useEffect(() => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) return;

    const interval = setInterval(() => {
      refetchQuote();
    }, QUOTE_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fromToken, toToken, amount, refetchQuote]);

  // Set default XRP as from token on load
  useEffect(() => {
    if (!fromToken && tokens.length > 0) {
      const xrpToken = tokens.find((t) => t.currency === 'XRP' && !t.issuer);
      if (xrpToken) {
        setFromToken(xrpToken);
      }
    }
  }, [tokens, fromToken]);

  // Get available balance for from token
  const availableBalance = useMemo(() => {
    if (!fromToken) return null;
    const token = tokens.find(
      (t) => t.currency === fromToken.currency && (t.issuer || '') === (fromToken.issuer || '')
    );
    return token?.value || null;
  }, [fromToken, tokens]);

  // Handle amount change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  // Handle max button
  const handleMaxClick = useCallback(() => {
    if (availableBalance) {
      // For XRP, leave some for fees
      if (fromToken?.currency === 'XRP') {
        const maxAmount = Math.max(0, parseFloat(availableBalance) - 1);
        setAmount(maxAmount.toString());
      } else {
        setAmount(availableBalance);
      }
    }
  }, [availableBalance, fromToken]);

  // Handle swap direction
  const handleSwapDirection = useCallback(() => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
  }, [fromToken, toToken]);

  // Validate swap
  const canSwap = useMemo(() => {
    if (!fromToken || !toToken) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    if (!quote) return false;
    if (quoteLoading) return false;
    if (quote.priceImpact >= PRICE_IMPACT_BLOCK_THRESHOLD) return false;

    // Check balance
    if (availableBalance && parseFloat(amount) > parseFloat(availableBalance)) {
      return false;
    }

    return true;
  }, [fromToken, toToken, amount, quote, quoteLoading, availableBalance]);

  // Get validation error message
  const validationError = useMemo(() => {
    if (!fromToken || !toToken) return null;
    if (!amount || parseFloat(amount) <= 0) return null;

    if (availableBalance && parseFloat(amount) > parseFloat(availableBalance)) {
      return 'Insufficient balance';
    }

    if (quote?.priceImpact !== undefined && quote.priceImpact >= PRICE_IMPACT_BLOCK_THRESHOLD) {
      return 'Price impact too high';
    }

    return null;
  }, [fromToken, toToken, amount, availableBalance, quote]);

  // Handle swap click
  const handleSwapClick = useCallback(() => {
    if (!canSwap || !fromToken || !toToken || !quote) return;

    onSwapClick({
      fromToken,
      toToken,
      amount,
      quote,
      slippage
    });
  }, [canSwap, fromToken, toToken, amount, quote, slippage, onSwapClick]);

  // Token button component
  const TokenButton: FC<{
    token: SwapToken | null;
    onClick: () => void;
    placeholder?: string;
  }> = ({ token, onClick, placeholder = 'Select' }) => (
    <Button
      onClick={onClick}
      sx={{
        minWidth: 120,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        py: 1,
        px: 1.5,
        textTransform: 'none',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }
      }}
    >
      {token ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={token.icon}
            sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}
          >
            {convertHexCurrencyString(token.currency).slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {convertHexCurrencyString(token.currency)}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {placeholder}
        </Typography>
      )}
      <KeyboardArrowDownIcon fontSize="small" />
    </Button>
  );

  return (
    <PageWithReturn title="Swap" onBackClick={() => navigate(HOME_PATH)}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
        {/* From Token Section */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              From
            </Typography>
            {availableBalance && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'pointer' }}
                onClick={handleMaxClick}
              >
                Balance: {parseFloat(availableBalance).toFixed(4)}{' '}
                <Typography
                  component="span"
                  variant="caption"
                  color="primary.main"
                  sx={{ cursor: 'pointer' }}
                >
                  MAX
                </Typography>
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              placeholder="0.0"
              value={amount}
              onChange={handleAmountChange}
              fullWidth
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: '1.5rem', fontWeight: 500 }
              }}
              autoComplete="off"
            />
            <TokenButton token={fromToken} onClick={() => setShowFromSelector(true)} />
          </Box>
        </Box>

        {/* Swap Direction Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: -1, zIndex: 1 }}>
          <IconButton
            onClick={handleSwapDirection}
            sx={{
              backgroundColor: 'background.paper',
              border: '4px solid',
              borderColor: 'background.default',
              '&:hover': {
                backgroundColor: 'rgba(156, 39, 176, 0.1)'
              }
            }}
          >
            <SwapVertIcon color="primary" />
          </IconButton>
        </Box>

        {/* To Token Section */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 2
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            To
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              {quoteLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Getting quote...
                  </Typography>
                </Box>
              ) : quote ? (
                <Typography variant="h5" fontWeight={500}>
                  {parseFloat(quote.destinationAmount).toFixed(6)}
                </Typography>
              ) : (
                <Typography variant="h5" color="text.disabled">
                  0.0
                </Typography>
              )}
            </Box>
            <TokenButton token={toToken} onClick={() => setShowToSelector(true)} />
          </Box>
        </Box>

        {/* Slippage Settings */}
        <SlippageSettings slippage={slippage} onSlippageChange={setSlippage} />

        {/* Quote Display */}
        <QuoteDisplay
          quote={quote}
          loading={quoteLoading}
          error={quoteError}
          fromToken={fromToken}
          toToken={toToken}
        />

        {/* Error Message */}
        {validationError && (
          <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            {validationError}
          </Typography>
        )}

        {/* Swap Button */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSwapClick}
            disabled={!canSwap}
            sx={{
              py: 1.5,
              backgroundColor: '#9C27B0',
              '&:hover': {
                backgroundColor: '#7B1FA2'
              }
            }}
          >
            {quoteLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : !fromToken || !toToken ? (
              'Select Tokens'
            ) : !amount || parseFloat(amount) <= 0 ? (
              'Enter Amount'
            ) : validationError ? (
              validationError
            ) : (
              'Swap'
            )}
          </Button>
        </Box>

        {/* Token Selectors */}
        <TokenSelector
          open={showFromSelector}
          onClose={() => setShowFromSelector(false)}
          onSelect={setFromToken}
          tokens={tokens}
          popularTokens={popularTokens}
          excludeToken={toToken || undefined}
          title="Select Token to Swap"
        />
        <TokenSelector
          open={showToSelector}
          onClose={() => setShowToSelector(false)}
          onSelect={setToToken}
          tokens={tokens}
          popularTokens={popularTokens}
          excludeToken={fromToken || undefined}
          title="Select Token to Receive"
        />
      </Box>
    </PageWithReturn>
  );
};
