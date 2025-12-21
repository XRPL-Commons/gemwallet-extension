import {
  AMMBidRequest,
  AMMBidResponse,
  GEM_WALLET,
  RequestAMMBidMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const ammBid = async (payload: AMMBidRequest): Promise<AMMBidResponse> => {
  let response: AMMBidResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestAMMBidMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_AMM_BID/V3',
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
