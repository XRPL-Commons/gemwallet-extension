import {
  AMMDeleteRequest,
  AMMDeleteResponse,
  GEM_WALLET,
  RequestAMMDeleteMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const ammDelete = async (payload: AMMDeleteRequest): Promise<AMMDeleteResponse> => {
  let response: AMMDeleteResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestAMMDeleteMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_AMM_DELETE/V3',
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
