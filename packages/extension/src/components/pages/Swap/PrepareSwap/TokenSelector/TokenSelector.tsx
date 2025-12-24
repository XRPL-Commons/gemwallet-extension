import { FC, useCallback, useMemo, useState } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography
} from '@mui/material';

import { SwapToken } from '../../../../../types/swap.types';
import { convertHexCurrencyString } from '../../../../../utils';

export interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: SwapToken) => void;
  tokens: SwapToken[];
  popularTokens: SwapToken[];
  excludeToken?: SwapToken;
  title?: string;
}

export const TokenSelector: FC<TokenSelectorProps> = ({
  open,
  onClose,
  onSelect,
  tokens,
  popularTokens,
  excludeToken,
  title = 'Select Token'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSelect = useCallback(
    (token: SwapToken) => {
      onSelect(token);
      onClose();
      setSearchQuery('');
    },
    [onSelect, onClose]
  );

  const isTokenExcluded = useCallback(
    (token: SwapToken) => {
      if (!excludeToken) return false;
      return (
        token.currency === excludeToken.currency &&
        (token.issuer || '') === (excludeToken.issuer || '')
      );
    },
    [excludeToken]
  );

  const filteredPopularTokens = useMemo(() => {
    return popularTokens.filter((token) => {
      if (isTokenExcluded(token)) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const currency = convertHexCurrencyString(token.currency).toLowerCase();
      const name = (token.name || '').toLowerCase();
      return currency.includes(query) || name.includes(query);
    });
  }, [popularTokens, searchQuery, isTokenExcluded]);

  const filteredUserTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (isTokenExcluded(token)) return false;
      // Exclude tokens that are already in popular tokens
      const isPopular = popularTokens.some(
        (pt) => pt.currency === token.currency && (pt.issuer || '') === (token.issuer || '')
      );
      if (isPopular) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const currency = convertHexCurrencyString(token.currency).toLowerCase();
      const name = (token.name || '').toLowerCase();
      return currency.includes(query) || name.includes(query);
    });
  }, [tokens, popularTokens, searchQuery, isTokenExcluded]);

  const renderTokenItem = (token: SwapToken, showBalance: boolean = false) => {
    const displayCurrency = convertHexCurrencyString(token.currency);
    const displayName = token.name || displayCurrency;

    return (
      <ListItemButton
        key={`${token.currency}-${token.issuer || 'native'}`}
        onClick={() => handleSelect(token)}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)'
          }
        }}
      >
        <ListItemAvatar>
          <Avatar
            src={token.icon}
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: '0.875rem'
            }}
          >
            {displayCurrency.slice(0, 2).toUpperCase()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="body1" fontWeight={500}>
              {displayCurrency}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" noWrap>
              {displayName !== displayCurrency ? displayName : token.issuer?.slice(0, 8) + '...'}
            </Typography>
          }
        />
        {showBalance && token.value && (
          <Typography variant="body2" color="text.secondary">
            {parseFloat(token.value).toFixed(4)}
          </Typography>
        )}
      </ListItemButton>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">{title}</Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name or symbol"
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
          autoComplete="off"
        />

        {filteredPopularTokens.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Popular Tokens
            </Typography>
            <List dense sx={{ mb: 1 }}>
              {filteredPopularTokens.map((token) => renderTokenItem(token))}
            </List>
          </>
        )}

        {filteredUserTokens.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Your Tokens
            </Typography>
            <List dense>{filteredUserTokens.map((token) => renderTokenItem(token, true))}</List>
          </>
        )}

        {filteredPopularTokens.length === 0 && filteredUserTokens.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No tokens found</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
