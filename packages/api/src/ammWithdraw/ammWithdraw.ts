import {
  AMMWithdrawRequest,
  AMMWithdrawResponse,
  GEM_WALLET,
  RequestAMMWithdrawMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const ammWithdraw = async (payload: AMMWithdrawRequest): Promise<AMMWithdrawResponse> => {
  let response: AMMWithdrawResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestAMMWithdrawMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_AMM_WITHDRAW/V3',
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
