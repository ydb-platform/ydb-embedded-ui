import {
    disableAutorefresh,
    enableAutorefresh,
    FETCH_SCHEMA,
    preloadSchemas,
    resetLoadingState,
    setCurrentSchemaPath,
    setShowPreview,
} from '../../store/reducers/schema';
import {ApiRequestAction} from '../../store/utils';
import {IResponseError} from '../api/error';
import {TEvDescribeSchemeResult} from '../api/schema';

export type ISchemaData = Record<string, TEvDescribeSchemeResult>;

export interface ISchemaState {
    loading: boolean;
    wasLoaded: boolean;
    data: ISchemaData;
    currentSchema?: TEvDescribeSchemeResult;
    currentSchemaPath?: string;
    autorefresh: boolean;
    showPreview: boolean;
    error?: IResponseError;
}

type ISchemaApiRequestAction = ApiRequestAction<
    typeof FETCH_SCHEMA,
    TEvDescribeSchemeResult,
    IResponseError
>;

export type ISchemaAction =
    | ISchemaApiRequestAction
    | (
          | ReturnType<typeof setCurrentSchemaPath>
          | ReturnType<typeof enableAutorefresh>
          | ReturnType<typeof disableAutorefresh>
          | ReturnType<typeof setShowPreview>
          | ReturnType<typeof preloadSchemas>
          | ReturnType<typeof resetLoadingState>
      );

export interface ISchemaRootStateSlice {
    schema: ISchemaState;
}
