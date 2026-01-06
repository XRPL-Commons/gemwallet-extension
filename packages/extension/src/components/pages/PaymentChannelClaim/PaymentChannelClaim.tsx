import { FC, useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { PaymentChannelClaim as PaymentChannelClaimTransaction } from 'xrpl';

import {
  API_ERROR_BAD_REQUEST,
  PaymentChannelClaimRequest,
  GEM_WALLET,
  ReceivePaymentChannelClaimBackgroundMessage,
  ResponseType
} from '@gemwallet/constants';

import { HOME_PATH, STORAGE_MESSAGING_KEY } from '../../../constants';
import {
  buildPaymentChannelClaim,
  TransactionProgressStatus,
  useLedger,
  useNetwork,
  useTransactionProgress,
  useWallet
} from '../../../contexts';
import { useFees, useFetchFromSessionStorage, useTransactionStatus } from '../../../hooks';
import { TransactionStatus } from '../../../types';
import { parseBaseParamsFromStoredData } from '../../../utils/baseParams';
import { serializeError } from '../../../utils/errors';
import { TransactionDetails } from '../../organisms';
import { TransactionPage } from '../../templates';

interface Params {
  id: number;
  transaction: PaymentChannelClaimTransaction | null;
}

export const PaymentChannelClaim: FC = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const inAppCall = urlParams.get('inAppCall') === 'true';

  const [params, setParams] = useState<Params>({
    id: 0,
    transaction: null
  });
  const [errorRequestRejection, setErrorRequestRejection] = useState<Error>();
  const [isParamsMissing, setIsParamsMissing] = useState(false);
  const [transaction, setTransaction] = useState<TransactionStatus>(TransactionStatus.Waiting);
  const { paymentChannelClaim } = useLedger();
  const { getCurrentWallet } = useWallet();
  const { networkName } = useNetwork();
  const { setTransactionProgress } = useTransactionProgress();
  const { estimatedFees, errorFees, difference } = useFees(
    params.transaction ?? [],
    params.transaction?.Fee
  );
  const { fetchedData } = useFetchFromSessionStorage(
    urlParams.get(STORAGE_MESSAGING_KEY) ?? undefined
  ) as {
    fetchedData: PaymentChannelClaimRequest | undefined;
  };

  const sendMessageToBackground = useCallback(
    (message: ReceivePaymentChannelClaimBackgroundMessage) => {
      chrome.runtime.sendMessage(message);
      setTransactionProgress(TransactionProgressStatus.IDLE);
    },
    [setTransactionProgress]
  );

  const createMessage = useCallback(
    (messagePayload: {
      hash: string | null | undefined;
      error?: Error;
    }): ReceivePaymentChannelClaimBackgroundMessage => {
      const { hash, error } = messagePayload;

      return {
        app: GEM_WALLET,
        type: 'RECEIVE_PAYMENT_CHANNEL_CLAIM/V3',
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
    badRequestCallback,
    onClick: inAppCall ? () => navigate(HOME_PATH) : undefined
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

    const channel = 'channel' in fetchedData ? fetchedData.channel : undefined;
    // Payment Channels only support XRP amounts (string in drops)
    const balance =
      'balance' in fetchedData && fetchedData.balance ? String(fetchedData.balance) : undefined;
    const amount =
      'amount' in fetchedData && fetchedData.amount ? String(fetchedData.amount) : undefined;
    const signature = 'signature' in fetchedData ? fetchedData.signature : undefined;
    const publicKey = 'publicKey' in fetchedData ? fetchedData.publicKey : undefined;
    const flags = 'flags' in fetchedData ? fetchedData.flags : undefined;

    if (!channel) {
      setIsParamsMissing(true);
    }

    const transaction = buildPaymentChannelClaim(
      {
        ...parseBaseParamsFromStoredData(fetchedData),
        channel: channel ?? '',
        ...(balance && { balance }),
        ...(amount && { amount }),
        ...(signature && { signature }),
        ...(publicKey && { publicKey }),
        ...(flags !== undefined && { flags })
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
    paymentChannelClaim(params.transaction as PaymentChannelClaimTransaction)
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
  }, [params, paymentChannelClaim, sendMessageToBackground, createMessage]);

  if (transactionStatusComponent) {
    return <div>{transactionStatusComponent}</div>;
  }

  return (
    <TransactionPage
      title="Claim Payment Channel"
      description="Please review the payment channel claim transaction below."
      approveButtonText="Submit"
      hasEnoughFunds={hasEnoughFunds}
      onClickApprove={handleConfirm}
      onClickReject={handleReject}
    >
      <TransactionDetails
        txParam={params.transaction}
        estimatedFees={estimatedFees}
        errorFees={errorFees}
        displayTransactionType={false}
      />
    </TransactionPage>
  );
};
