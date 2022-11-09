import {
    disableAutorefresh,
    enableAutorefresh,
    FETCH_SCHEMA,
    preloadSchemas,
    resetLoadingState,
    setCurrentSchemaPath,
    setShowPreview,
    resetCurrentSchemaNestedChildren,
} from '../../store/reducers/schema';
import {ApiRequestAction} from '../../store/utils';
import {IResponseError} from '../api/error';
import {TEvDescribeSchemeResult} from '../api/schema';

export type ISchemaData = Record<string, TEvDescribeSchemeResult>;

export interface ISchemaState {
    loading: boolean;
    wasLoaded: boolean;
    data: ISchemaData;
    currentSchemaPath: string | undefined;
    currentSchema?: TEvDescribeSchemeResult;
    currentSchemaNestedChildren?: TEvDescribeSchemeResult[];
    autorefresh: boolean;
    showPreview: boolean;
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
          | ReturnType<typeof resetCurrentSchemaNestedChildren>
      );

export interface ISchemaRootStateSlice {
    schema: ISchemaState;
}
