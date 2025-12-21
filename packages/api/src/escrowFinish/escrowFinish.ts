import {
  EscrowFinishRequest,
  EscrowFinishResponse,
  GEM_WALLET,
  RequestEscrowFinishMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const escrowFinish = async (payload: EscrowFinishRequest): Promise<EscrowFinishResponse> => {
  /* response:
   * if the transaction succeeds:
   * - type: 'response'
   * - result:
   *    - hash: transaction hash
   *
   * if the user rejects the transaction:
   * - type: 'reject'
   * - result: undefined
   *
   * if the transaction fails:
   * - throw an error
   */
  let response: EscrowFinishResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestEscrowFinishMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_ESCROW_FINISH/V3',
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
