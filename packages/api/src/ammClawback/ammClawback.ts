import {
  AMMClawbackRequest,
  AMMClawbackResponse,
  GEM_WALLET,
  RequestAMMClawbackMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const ammClawback = async (payload: AMMClawbackRequest): Promise<AMMClawbackResponse> => {
  let response: AMMClawbackResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestAMMClawbackMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_AMM_CLAWBACK/V3',
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
