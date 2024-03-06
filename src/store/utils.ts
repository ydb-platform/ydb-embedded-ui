import type {Dispatch} from '@reduxjs/toolkit';
import {AxiosResponse} from 'axios';

import createToast from '../utils/createToast';

import {SET_UNAUTHENTICATED} from './reducers/authentication/authentication';
import type {GetState} from '.';

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

type CreateApiRequestParams<Actions, Response, HandledResponse> = {
    actions: Actions;
    request: Promise<Response>;
    dataHandler?: (data: Response, getState: GetState) => HandledResponse;
};

export function createApiRequest<
    Actions extends ReturnType<typeof createRequestActionTypes>,
    Response,
    HandledResponse,
>({
    actions,
    request,
    dataHandler = nop,
}: CreateApiRequestParams<Actions, Response, HandledResponse>) {
    const doRequest = async function (dispatch: Dispatch, getState: GetState) {
        dispatch({
            type: actions.REQUEST,
        });

        try {
            const result = await request;
            const data = dataHandler(result, getState);

            dispatch({
                type: actions.SUCCESS,
                data,
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
> =
    | {
          type: Actions['REQUEST'];
      }
    | {
          type: Actions['SUCCESS'];
          data: SuccessResponse;
      }
    | {
          type: Actions['FAILURE'];
          error: ErrorResponse;
      };
