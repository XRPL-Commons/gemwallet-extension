import { FC, useCallback, useEffect, useState } from 'react';

import { AMMBid as AMMBidTx, Currency } from 'xrpl';

import {
  API_ERROR_BAD_REQUEST,
  AMMBidRequest,
  GEM_WALLET,
  ReceiveAMMBidBackgroundMessage,
  ResponseType
} from '@gemwallet/constants';

import { STORAGE_MESSAGING_KEY } from '../../../constants';
import {
  buildAMMBid,
  TransactionProgressStatus,
  useLedger,
  useNetwork,
  useTransactionProgress,
  useWallet
} from '../../../contexts';
import {
  useAMMInfo,
  useFees,
  useFetchFromSessionStorage,
  useTransactionStatus
} from '../../../hooks';
import { TransactionStatus } from '../../../types';
import { parseBaseParamsFromStoredData } from '../../../utils/baseParams';
import { serializeError } from '../../../utils/errors';
import { AMMPoolInfo } from '../../molecules';
import { TransactionDetails } from '../../organisms';
import { TransactionPage } from '../../templates';

interface Params {
  id: number;
  transaction: AMMBidTx | null;
}

export const AMMBid: FC = () => {
  const [params, setParams] = useState<Params>({
    id: 0,
    transaction: null
  });
  const [errorRequestRejection, setErrorRequestRejection] = useState<Error>();
  const [isParamsMissing, setIsParamsMissing] = useState(false);
  const [transaction, setTransaction] = useState<TransactionStatus>(TransactionStatus.Waiting);
  const [asset, setAsset] = useState<Currency | null>(null);
  const [asset2, setAsset2] = useState<Currency | null>(null);

  const { ammBid } = useLedger();
  const { getCurrentWallet } = useWallet();
  const { networkName } = useNetwork();
  const { setTransactionProgress } = useTransactionProgress();
  const { estimatedFees, errorFees, difference } = useFees(
    params.transaction ?? [],
    params.transaction?.Fee
  );

  // Fetch AMM Pool info for unique UI display
  const {
    ammInfo,
    loading: ammLoading,
    error: ammError,
    refetch: refetchAMM
  } = useAMMInfo(asset, asset2);

  const urlParams = new URLSearchParams(window.location.search);
  const { fetchedData } = useFetchFromSessionStorage(
    urlParams.get(STORAGE_MESSAGING_KEY) ?? undefined
  ) as {
    fetchedData: AMMBidRequest | undefined;
  };

  const sendMessageToBackground = useCallback(
    (message: ReceiveAMMBidBackgroundMessage) => {
      chrome.runtime.sendMessage(message);
      setTransactionProgress(TransactionProgressStatus.IDLE);
    },
    [setTransactionProgress]
  );

  const createMessage = useCallback(
    (messagePayload: {
      hash: string | null | undefined;
      error?: Error;
    }): ReceiveAMMBidBackgroundMessage => {
      const { hash, error } = messagePayload;

      return {
        app: GEM_WALLET,
        type: 'RECEIVE_AMM_BID/V3',
        payload: {
          id: params.id,
          type: ResponseType.Response,
          result: hash
            ? {
                hash: hash
              }
            : undefined,
          error: error ? serializeError(error) : undefined
        }
      };
    },
    [params.id]
  );

  const badRequestCallback = useCallback(() => {
    sendMessageToBackground(
      createMessage({
        hash: null,
        error: new Error(API_ERROR_BAD_REQUEST)
      })
    );
  }, [createMessage, sendMessageToBackground]);

  const { hasEnoughFunds, transactionStatusComponent } = useTransactionStatus({
    isParamsMissing,
    errorFees,
    network: networkName,
    difference,
    transaction,
    errorRequestRejection,
    badRequestCallback
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = Number(urlParams.get('id')) || 0;
    const wallet = getCurrentWallet();

    if (!wallet) {
      setIsParamsMissing(true);
      return;
    }

    if (!fetchedData) {
      return;
    }

    // Extract Asset and Asset2 for AMM info lookup
    if (fetchedData.Asset && fetchedData.Asset2) {
      setAsset(fetchedData.Asset as Currency);
      setAsset2(fetchedData.Asset2 as Currency);
    } else {
      setIsParamsMissing(true);
      return;
    }

    const transaction = buildAMMBid(
      {
        ...parseBaseParamsFromStoredData(fetchedData),
        Asset: fetchedData.Asset as Currency,
        Asset2: fetchedData.Asset2 as Currency,
        ...(fetchedData.BidMax && { BidMax: fetchedData.BidMax }),
        ...(fetchedData.BidMin && { BidMin: fetchedData.BidMin }),
        ...(fetchedData.AuthAccounts && { AuthAccounts: fetchedData.AuthAccounts })
      },
      wallet
    );

    setParams({
      id,
      transaction
    });
  }, [fetchedData, getCurrentWallet]);

  const handleReject = useCallback(() => {
    setTransaction(TransactionStatus.Rejected);
    const message = createMessage({
      hash: null
    });
    sendMessageToBackground(message);
  }, [createMessage, sendMessageToBackground]);

  const handleConfirm = useCallback(() => {
    setTransaction(TransactionStatus.Pending);
    ammBid(params.transaction as AMMBidTx)
      .then((response) => {
        setTransaction(TransactionStatus.Success);
        sendMessageToBackground(createMessage(response));
      })
      .catch((e) => {
        setErrorRequestRejection(e);
        setTransaction(TransactionStatus.Rejected);
        const message = createMessage({
          hash: undefined,
          error: e
        });
        sendMessageToBackground(message);
      });
  }, [params, ammBid, sendMessageToBackground, createMessage]);

  if (transactionStatusComponent) {
    return <div>{transactionStatusComponent}</div>;
  }

  return (
    <TransactionPage
      title="AMM Auction Bid"
      description="Bid on the auction slot to get a discounted trading fee."
      approveButtonText="Place Bid"
      hasEnoughFunds={hasEnoughFunds}
      onClickApprove={handleConfirm}
      onClickReject={handleReject}
    >
      <AMMPoolInfo ammInfo={ammInfo} loading={ammLoading} error={ammError} onRefresh={refetchAMM} />
      <TransactionDetails
        txParam={params.transaction}
        estimatedFees={estimatedFees}
        errorFees={errorFees}
        displayTransactionType={false}
      />
    </TransactionPage>
  );
};
