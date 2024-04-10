import type {IResponseError} from '../../../types/api/error';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import type {ApiRequestAction} from '../../utils';

import type {
    FETCH_SCHEMA,
    disableAutorefresh,
    enableAutorefresh,
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
    autorefresh: boolean;
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
          | ReturnType<typeof enableAutorefresh>
          | ReturnType<typeof disableAutorefresh>
          | ReturnType<typeof setShowPreview>
          | ReturnType<typeof preloadSchemas>
          | ReturnType<typeof resetLoadingState>
      );

export interface SchemaStateSlice {
    schema: SchemaState;
}
