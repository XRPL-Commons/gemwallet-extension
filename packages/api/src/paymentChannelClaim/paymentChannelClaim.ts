import {
  PaymentChannelClaimRequest,
  PaymentChannelClaimResponse,
  GEM_WALLET,
  RequestPaymentChannelClaimMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const paymentChannelClaim = async (
  payload: PaymentChannelClaimRequest
): Promise<PaymentChannelClaimResponse> => {
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
  let response: PaymentChannelClaimResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestPaymentChannelClaimMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_PAYMENT_CHANNEL_CLAIM/V3',
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
