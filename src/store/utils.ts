import type {Dispatch} from 'redux';
import {AxiosResponse} from 'axios';

import createToast from '../utils/createToast';

import {SET_UNAUTHENTICATED} from './reducers/authentication';

export const nop = (result: any) => result;

export function createRequestActionTypes<Prefix extends string, Type extends string>(
    prefix: Prefix,
    type: Type,
) {
    return {
        REQUEST: `${prefix}/${type}_REQUEST`,
        SUCCESS: `${prefix}/${type}_SUCCESS`,
        FAILURE: `${prefix}/${type}_FAILURE`,
    } as const;
}

const isAxiosResponse = (response: any): response is AxiosResponse =>
    response && 'status' in response;

type CreateApiRequestParams<Actions, Response, HandledResponse, AdditionalParams> = {
    actions: Actions;
    request: Promise<Response> | Promise<Response>[];
    dataHandler?: (data: Response | Response[], getState?: () => any) => HandledResponse;
    additionalParams?: AdditionalParams;
};

export function createApiRequest<
    Actions extends ReturnType<typeof createRequestActionTypes>,
    Response,
    HandledResponse,
    AdditionalParams = unknown,
>({
    actions,
    request,
    dataHandler = nop,
    additionalParams,
}: CreateApiRequestParams<Actions, Response, HandledResponse, AdditionalParams>) {
    const doRequest = async function (dispatch: Dispatch, getState: () => any) {
        dispatch({
            type: actions.REQUEST,
            additionalParams,
        });

        try {
            let result;

            if (Array.isArray(request)) {
                result = await Promise.all(request);
            } else {
                result = await request;
            }

            const data = dataHandler(result, getState);

            dispatch({
                type: actions.SUCCESS,
                data,
                additionalParams,
            });

            return data;
        } catch (error) {
            if (isAxiosResponse(error) && error.status === 401) {
                dispatch({
                    type: SET_UNAUTHENTICATED.SUCCESS,
                });
            } else if (isAxiosResponse(error) && error.status >= 500 && error.statusText) {
                createToast({
                    name: 'Request failure',
                    title: 'Request failure',
                    type: 'error',
                    content: `${error.status} ${error.statusText}`,
                });
            }

            dispatch({
                type: actions.FAILURE,
                error,
                additionalParams,
            });

            // TODO should probably throw the received error here, but this change requires a thorough revision of all api calls
            return undefined;
        }
    };

    return doRequest;
}

export type ApiRequestAction<
    Actions extends ReturnType<typeof createRequestActionTypes>,
    SuccessResponse = unknown,
    ErrorResponse = unknown,
    AdditionalParams = unknown,
> =
    | {
          type: Actions['REQUEST'];
          additionalParams?: AdditionalParams;
      }
    | {
          type: Actions['SUCCESS'];
          data: SuccessResponse;
          additionalParams?: AdditionalParams;
      }
    | {
          type: Actions['FAILURE'];
          error: ErrorResponse;
          additionalParams?: AdditionalParams;
      };
