import type {IResponseError} from '../../../types/api/error';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import type {ApiRequestAction} from '../../utils';

import type {
    FETCH_SCHEMA,
    SET_AUTOREFRESH_INTERVAL,
    preloadSchemas,
    resetLoadingState,
    setCurrentSchemaPath,
    setShowPreview,
} from './schema';

export type SchemaData = Record<string, TEvDescribeSchemeResult>;

export interface SchemaState {
    loading: boolean;
    wasLoaded: boolean;
    data: SchemaData;
    currentSchema?: TEvDescribeSchemeResult;
    currentSchemaPath?: string;
    autorefresh: number;
    showPreview: boolean;
    error?: IResponseError;
}

export interface SchemaHandledResponse {
    path?: string;
    currentSchema?: TEvDescribeSchemeResult;
    data?: SchemaData;
}

type SchemaApiRequestAction = ApiRequestAction<
    typeof FETCH_SCHEMA,
    SchemaHandledResponse,
    IResponseError
>;

export type SchemaAction =
    | SchemaApiRequestAction
    | (
          | ReturnType<typeof setCurrentSchemaPath>
          | {type: typeof SET_AUTOREFRESH_INTERVAL; data: number}
          | ReturnType<typeof setShowPreview>
          | ReturnType<typeof preloadSchemas>
          | ReturnType<typeof resetLoadingState>
      );

export interface SchemaStateSlice {
    schema: SchemaState;
}
