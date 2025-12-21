import { FC, useCallback, useEffect, useState } from 'react';

import { EscrowCreate as EscrowCreateTransaction } from 'xrpl';

import {
  API_ERROR_BAD_REQUEST,
  EscrowCreateRequest,
  GEM_WALLET,
  ReceiveEscrowCreateBackgroundMessage,
  ResponseType
} from '@gemwallet/constants';

import { STORAGE_MESSAGING_KEY } from '../../../constants';
import {
  buildEscrowCreate,
  TransactionProgressStatus,
  useLedger,
  useNetwork,
  useTransactionProgress,
  useWallet
} from '../../../contexts';
import { useFees, useFetchFromSessionStorage, useTransactionStatus } from '../../../hooks';
import { TransactionStatus } from '../../../types';
import { parseAmount } from '../../../utils';
import { parseBaseParamsFromStoredData } from '../../../utils/baseParams';
import { serializeError } from '../../../utils/errors';
import { TransactionDetails } from '../../organisms';
import { TransactionPage } from '../../templates';

interface Params {
  id: number;
  transaction: EscrowCreateTransaction | null;
}

export const EscrowCreate: FC = () => {
  const [params, setParams] = useState<Params>({
    id: 0,
    transaction: null
  });
  const [errorRequestRejection, setErrorRequestRejection] = useState<Error>();
  const [isParamsMissing, setIsParamsMissing] = useState(false);
  const [transaction, setTransaction] = useState<TransactionStatus>(TransactionStatus.Waiting);
  const { escrowCreate } = useLedger();
  const { getCurrentWallet } = useWallet();
  const { networkName } = useNetwork();
  const { setTransactionProgress } = useTransactionProgress();
  const { estimatedFees, errorFees, difference } = useFees(
    params.transaction ?? [],
    params.transaction?.Fee
  );

  const urlParams = new URLSearchParams(window.location.search);
  const { fetchedData } = useFetchFromSessionStorage(
    urlParams.get(STORAGE_MESSAGING_KEY) ?? undefined
  ) as {
    fetchedData: EscrowCreateRequest | undefined;
  };

  const sendMessageToBackground = useCallback(
    (message: ReceiveEscrowCreateBackgroundMessage) => {
      chrome.runtime.sendMessage(message);
      setTransactionProgress(TransactionProgressStatus.IDLE);
    },
    [setTransactionProgress]
  );

  const createMessage = useCallback(
    (messagePayload: {
      hash: string | null | undefined;
      error?: Error;
    }): ReceiveEscrowCreateBackgroundMessage => {
      const { hash, error } = messagePayload;

      return {
        app: GEM_WALLET,
        type: 'RECEIVE_ESCROW_CREATE/V3',
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

    const amount =
      'amount' in fetchedData ? parseAmount(fetchedData.amount, null, null, '') : undefined;
    const destination = 'destination' in fetchedData ? fetchedData.destination : undefined;
    const cancelAfter = 'cancelAfter' in fetchedData ? Number(fetchedData.cancelAfter) : undefined;
    const finishAfter = 'finishAfter' in fetchedData ? Number(fetchedData.finishAfter) : undefined;
    const condition = 'condition' in fetchedData ? fetchedData.condition : undefined;
    const destinationTag =
      'destinationTag' in fetchedData ? Number(fetchedData.destinationTag) : undefined;

    if (!amount || !destination) {
      setIsParamsMissing(true);
    }

    const transaction = buildEscrowCreate(
      {
        ...parseBaseParamsFromStoredData(fetchedData),
        amount: amount ?? '0',
        destination: destination ?? '',
        ...(cancelAfter && { cancelAfter }),
        ...(finishAfter && { finishAfter }),
        ...(condition && { condition }),
        ...(destinationTag && { destinationTag })
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
    escrowCreate(params.transaction as EscrowCreateTransaction)
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
  }, [params, escrowCreate, sendMessageToBackground, createMessage]);

  if (transactionStatusComponent) {
    return <div>{transactionStatusComponent}</div>;
  }

  return (
    <TransactionPage
      title="Create Escrow"
      description="Please review the escrow transaction below."
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
