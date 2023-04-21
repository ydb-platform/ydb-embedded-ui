import {
    SEND_QUERY,
    changeUserInput,
    saveQueryToHistory,
    selectRunAction,
    goToPreviousQuery,
    setMonacoHotKey,
    goToNextQuery,
    MONACO_HOT_KEY_ACTIONS,
    RUN_ACTIONS_VALUES,
} from '../../store/reducers/executeQuery';
import type {ApiRequestAction} from '../../store/utils';
import type {ErrorResponse} from '../api/query';
import type {ValueOf} from '../common';
import type {IQueryResult, QueryError} from './query';

export type MonacoHotKeyAction = ValueOf<typeof MONACO_HOT_KEY_ACTIONS>;
export type RunAction = ValueOf<typeof RUN_ACTIONS_VALUES>;

export interface ExecuteQueryState {
    loading: boolean;
    input: string;
    history: {
        queries: string[];
        currentIndex: number;
    };
    runAction: RunAction;
    monacoHotKey: null | MonacoHotKeyAction;
    data?: IQueryResult;
    stats?: IQueryResult['stats'];
    error?: string | ErrorResponse;
}

type SendQueryAction = ApiRequestAction<typeof SEND_QUERY, IQueryResult, QueryError>;

export type ExecuteQueryAction =
    | SendQueryAction
    | ReturnType<typeof goToNextQuery>
    | ReturnType<typeof goToPreviousQuery>
    | ReturnType<typeof changeUserInput>
    | ReturnType<typeof saveQueryToHistory>
    | ReturnType<typeof selectRunAction>
    | ReturnType<typeof setMonacoHotKey>;
