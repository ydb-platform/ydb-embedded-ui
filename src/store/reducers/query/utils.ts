import {v4 as uuidv4} from 'uuid';

import type {Actions, ErrorResponse} from '../../../types/api/query';
import type {QueryAction, QueryMode, QuerySyntax} from '../../../types/store/query';
import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
    StreamingChunk,
} from '../../../types/store/streaming';
import {valueIsDefined} from '../../../utils';

import type {QueryExecutionStatusType, QueryInHistory, RawQueryInHistory} from './types';

export function getActionAndSyntaxFromQueryMode(
    baseAction: QueryAction = 'execute',
    queryMode: QueryMode = 'query',
) {
    let action: Actions = baseAction;
    let syntax: QuerySyntax = 'yql_v1';

    if (queryMode === 'pg') {
        action = `${baseAction}-query`;
        syntax = 'pg';
    } else if (queryMode) {
        action = `${baseAction}-${queryMode}`;
    }

    return {action, syntax};
}

const QUERY_EXECUTION_STATUS_VALUES: QueryExecutionStatusType[] = [
    'loading',
    'completed',
    'failed',
    'stopped',
    'aborted',
];

function isQueryExecutionStatusType(value: unknown): value is QueryExecutionStatusType {
    return (
        typeof value === 'string' &&
        QUERY_EXECUTION_STATUS_VALUES.includes(value as QueryExecutionStatusType)
    );
}

export function getQueryInHistory(rawQuery: string | RawQueryInHistory): QueryInHistory {
    if (typeof rawQuery === 'string') {
        return {
            queryText: rawQuery,
            queryId: uuidv4(),
        };
    }

    const enhancedQuery: QueryInHistory = {
        ...rawQuery,
        status: isQueryExecutionStatusType(rawQuery.status) ? rawQuery.status : undefined,
    };
    if (
        !valueIsDefined(enhancedQuery.startTime) &&
        valueIsDefined(enhancedQuery.durationUs) &&
        valueIsDefined(enhancedQuery.endTime)
    ) {
        enhancedQuery.startTime =
            Number(enhancedQuery.endTime) - Math.round(Number(enhancedQuery.durationUs) / 1000);
    }
    if (!enhancedQuery.queryId) {
        enhancedQuery.queryId = uuidv4();
    }
    return enhancedQuery;
}

export function isSessionChunk(content: StreamingChunk): content is SessionChunk {
    return content?.meta?.event === 'SessionCreated';
}

export function isStreamDataChunk(content: StreamingChunk): content is StreamDataChunk {
    return content?.meta?.event === 'StreamData';
}

export function isQueryResponseChunk(content: StreamingChunk): content is QueryResponseChunk {
    return content?.meta?.event === 'QueryResponse';
}

export function isKeepAliveChunk(content: StreamingChunk): content is SessionChunk {
    return content?.meta?.event === 'KeepAlive';
}

export function isErrorChunk(content: unknown): content is ErrorResponse {
    return Boolean(
        content && typeof content === 'object' && ('error' in content || 'issues' in content),
    );
}

export const prepareQueryWithPragmas = (query: string, pragmas?: string): string => {
    if (!pragmas || !pragmas.trim()) {
        return query;
    }

    // Add pragmas at the beginning with proper line separation
    const trimmedPragmas = pragmas.trim();
    const separator = trimmedPragmas.endsWith(';') ? '\n\n' : ';\n\n';

    return `${trimmedPragmas}${separator}${query}`;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export interface QueryTabPersistedState {
    id: string;
    title: string;
    isTitleUserDefined?: boolean;
    input: string;
    savedInput?: string;
    createdAt: number;
    updatedAt: number;
}

export interface QueryTabsPersistedState {
    activeTabId: string;
    tabsOrder: string[];
    tabsById: Record<string, QueryTabPersistedState>;
    newTabCounter?: number;
}

export type QueryTabsDirtyPersistedState = Record<string, boolean>;

function isQueryTabPersistedState(value: unknown): value is QueryTabPersistedState {
    if (!isRecord(value)) {
        return false;
    }

    if ('isTitleUserDefined' in value && typeof value.isTitleUserDefined !== 'boolean') {
        return false;
    }

    if ('savedInput' in value && typeof value.savedInput !== 'string') {
        return false;
    }

    return (
        typeof value.id === 'string' &&
        typeof value.title === 'string' &&
        typeof value.input === 'string' &&
        typeof value.createdAt === 'number' &&
        typeof value.updatedAt === 'number'
    );
}

export function isQueryTabsPersistedState(value: unknown): value is QueryTabsPersistedState {
    if (!isRecord(value)) {
        return false;
    }

    if (
        typeof value.activeTabId !== 'string' ||
        !isStringArray(value.tabsOrder) ||
        !isRecord(value.tabsById)
    ) {
        return false;
    }

    return Object.values(value.tabsById).every(isQueryTabPersistedState);
}

export function isQueryTabsDirtyPersistedState(
    value: unknown,
): value is QueryTabsDirtyPersistedState {
    if (!isRecord(value)) {
        return false;
    }

    return Object.values(value).every((item) => typeof item === 'boolean');
}

export function getUniqueTabTitle(
    tabsById: Record<string, {title: string}>,
    baseTitle: string,
): string {
    const existingTitles = new Set(Object.values(tabsById).map((tab) => tab.title));
    if (!existingTitles.has(baseTitle)) {
        return baseTitle;
    }
    let counter = 2;
    while (existingTitles.has(`${baseTitle} ${counter}`)) {
        counter++;
    }
    return `${baseTitle} ${counter}`;
}
