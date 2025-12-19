import {
  AMMVoteRequest,
  AMMVoteResponse,
  GEM_WALLET,
  RequestAMMVoteMessage,
  ResponseType
} from '@gemwallet/constants';

import { deserializeError } from '../helpers/errors';
import { sendMessageToContentScript } from '../helpers/extensionMessaging';

export const ammVote = async (payload: AMMVoteRequest): Promise<AMMVoteResponse> => {
  let response: AMMVoteResponse = {
    type: ResponseType.Reject,
    result: undefined
  };

  try {
    const message: RequestAMMVoteMessage = {
      app: GEM_WALLET,
      type: 'REQUEST_AMM_VOTE/V3',
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
