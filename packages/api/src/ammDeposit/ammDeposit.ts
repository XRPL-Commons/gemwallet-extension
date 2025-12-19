import {
  AMMDepositRequest,
  AMMDepositResponse,
  GEM_WALLET,
  RequestAMMDepositMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const ammDeposit = async (payload: AMMDepositRequest): Promise<AMMDepositResponse> => {
  let response: AMMDepositResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestAMMDepositMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_AMM_DEPOSIT/V3',
      payload
    };
    const { result, error } = await sendMessageToContentScript(message);
    const parsedError = error ? deserializeError(error) : undefined;
    if (parsedError) {
      throw parsedError;
    }

    if (result) {
      response.type = ResponseType.Response;
      response.result = result;
    }
  } catch (e) {
    throw e;
  }
  return response;
};
