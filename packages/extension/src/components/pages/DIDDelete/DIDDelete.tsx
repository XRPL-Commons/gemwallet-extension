import { FC, useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { DIDDelete as DIDDeleteXRPL } from 'xrpl';

import {
  GEM_WALLET,
  ReceiveDIDDeleteBackgroundMessage,
  ResponseType,
  DIDDeleteRequest
} from '@gemwallet/constants';

import { HOME_PATH, STORAGE_MESSAGING_KEY } from '../../../constants';
import {
  buildDIDDelete,
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
  transaction: DIDDeleteXRPL | null;
}

export const DIDDelete: FC = () => {
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
  const { didDelete } = useLedger();
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
    fetchedData: DIDDeleteRequest | undefined;
  };

  const { hasEnoughFunds, transactionStatusComponent } = useTransactionStatus({
    isParamsMissing,
    errorFees,
    network: networkName,
    difference,
    transaction,
    errorRequestRejection,
    onClick: inAppCall ? () => navigate(HOME_PATH) : undefined
  });

  const sendMessageToBackground = useCallback(
    (message: ReceiveDIDDeleteBackgroundMessage) => {
      chrome.runtime.sendMessage(message);
      setTransactionProgress(TransactionProgressStatus.IDLE);
    },
    [setTransactionProgress]
  );

  const createMessage = useCallback(
    (messagePayload: {
      hash: string | null | undefined;
      error?: Error;
    }): ReceiveDIDDeleteBackgroundMessage => {
      const { hash, error } = messagePayload;

      return {
        app: GEM_WALLET,
        type: 'RECEIVE_DID_DELETE/V3',
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

    const baseParams = parseBaseParamsFromStoredData(fetchedData);
    const transaction = buildDIDDelete(
      {
        ...baseParams
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
    didDelete(params.transaction as DIDDeleteXRPL)
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
  }, [params, didDelete, sendMessageToBackground, createMessage]);

  if (transactionStatusComponent) {
    return <div>{transactionStatusComponent}</div>;
  }

  return (
    <TransactionPage
      title="Delete DID"
      description="Please review the DID deletion request below."
      approveButtonText="Delete"
      hasEnoughFunds={hasEnoughFunds}
      onClickApprove={handleConfirm}
      onClickReject={handleReject}
    >
      <TransactionDetails
        txParam={params.transaction}
        estimatedFees={estimatedFees}
        errorFees={errorFees}
        displayTransactionType={true}
      />
    </TransactionPage>
  );
};
