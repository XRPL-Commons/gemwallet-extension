import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { vi, Mock, describe, test, expect, beforeEach } from 'vitest';

import { Chain, XRPLNetwork } from '@gemwallet/constants';

import { DEFAULT_RESERVE, RESERVE_PER_OWNER } from '../../../constants';
import { formatToken } from '../../../utils';
import { TokenListing, TokenListingProps } from './TokenListing';

const user = userEvent.setup();

vi.mock('react-router-dom');

const mockGetBalancesPromise = vi.fn();
const mockFundWalletPromise = vi.fn();
const mockRequestPromise = vi.fn();
const mockGetAccountInfoPromise = vi.fn();

const mockChain = Chain.XRPL;
let mockNetwork = XRPLNetwork.TESTNET;
let mockClient: { getBalances: Mock; request: Mock } | null = {
  getBalances: mockGetBalancesPromise,
  request: mockRequestPromise
};

vi.mock('../../../contexts', () => {
  return {
    useNetwork: () => ({
      client: mockClient,
      reconnectToNetwork: vi.fn(),
      networkName: mockNetwork,
      chainName: mockChain
    }),
    useServer: () => ({
      serverInfo: {
        info: {
          validated_ledger: {
            reserve_base_xrp: DEFAULT_RESERVE,
            reserve_inc_xrp: RESERVE_PER_OWNER
          }
        }
      }
    }),
    useLedger: () => ({
      fundWallet: mockFundWalletPromise,
      getAccountInfo: mockGetAccountInfoPromise
    })
  };
});

// Create a wrapper with QueryClientProvider for tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0 // Don't cache between tests
      }
    }
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TokenListing', () => {
  let props: TokenListingProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      getBalances: mockGetBalancesPromise,
      request: mockRequestPromise
    };
    props = {
      address: 'r123'
    };

    // Default mocks
    mockGetAccountInfoPromise.mockResolvedValue({
      result: {
        account_data: {
          OwnerCount: 2
        }
      }
    });
    mockRequestPromise.mockResolvedValue({
      result: {
        lines: []
      }
    });
  });

  test('should display an error when client failed to load', () => {
    mockClient = null;
    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    expect(
      screen.queryByText(
        'There was an error attempting to connect to the network. Please refresh the page and try again.'
      )
    ).toBeVisible();
  });

  test('should display the loading token state when the XRPBalance is not calculated', () => {
    mockGetBalancesPromise.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    expect(screen.getByTestId('token-loader')).toBeInTheDocument();
  });

  test('should display the XRP balance and trust line balances', async () => {
    mockGetBalancesPromise.mockResolvedValue([
      { value: '100', currency: 'XRP', issuer: undefined },
      { value: '50', currency: 'USD', issuer: 'r123' },
      { value: '20', currency: 'ETH', issuer: 'r456' }
    ]);

    const reserve = DEFAULT_RESERVE + RESERVE_PER_OWNER * 2;

    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(`${100 - reserve} XRP`)).toBeInTheDocument();
      expect(screen.getByText('50 USD')).toBeInTheDocument();
      expect(screen.getByText('20 ETH')).toBeInTheDocument();
    });
  });

  test('should display an error message when there is an error fetching the balances', async () => {
    mockGetBalancesPromise.mockRejectedValue(
      new Error('Throw an error if there is an error fetching the balances')
    );
    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Account not activated')).toBeVisible();
    });
  });

  test('should open the explanation dialog when the explain button is clicked', async () => {
    mockGetBalancesPromise.mockResolvedValue([
      { value: '100', currency: 'XRP', issuer: undefined }
    ]);
    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    const explainButton = await screen.findByText('Explain');
    await user.click(explainButton);
    expect(
      screen.getByText(
        `The activation of this account was made through a minimum deposit of ${DEFAULT_RESERVE} XRP.`
      )
    ).toBeVisible();
  });

  test('Should display the fund wallet button when the network is testnet and XRP balance is 0', async () => {
    mockNetwork = XRPLNetwork.TESTNET;
    mockGetBalancesPromise.mockRejectedValue(
      new Error('Throw an error if there is an error fetching the balances')
    );
    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    await waitFor(() => {
      const button = screen.queryByTestId('fund-wallet-button');
      expect(button).toBeInTheDocument();
    });
  });

  test('Should not display the fund wallet button when the network is Mainnet and XRP balance is 0', async () => {
    mockNetwork = XRPLNetwork.MAINNET;
    mockGetBalancesPromise.mockRejectedValue(
      new Error('Throw an error if there is an error fetching the balances')
    );
    render(<TokenListing {...props} />, { wrapper: createWrapper() });
    await waitFor(() => {
      const button = screen.queryByTestId('fund-wallet-button');
      expect(button).not.toBeInTheDocument();
    });
  });

  test('Should display the amount of XRP when click on Fund Wallet Button', async () => {
    const reserve = DEFAULT_RESERVE + RESERVE_PER_OWNER * 2;

    mockNetwork = XRPLNetwork.TESTNET;
    mockFundWalletPromise.mockResolvedValue({ balance: 10000 });
    mockGetBalancesPromise
      .mockRejectedValueOnce(new Error('Account not found')) // Initial error
      .mockResolvedValueOnce([{ value: '10000', currency: 'XRP', issuer: undefined }]); // After fund

    render(<TokenListing {...props} />, { wrapper: createWrapper() });

    const button = await screen.findByTestId('fund-wallet-button');
    const format = formatToken(10000 - reserve, 'XRP');

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(format)).toBeInTheDocument();
    });
  });
});
