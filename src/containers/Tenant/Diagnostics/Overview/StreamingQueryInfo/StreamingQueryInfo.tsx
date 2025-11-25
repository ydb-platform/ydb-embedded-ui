import React from 'react';

import {Label} from '@gravity-ui/uikit';

import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {streamingQueriesApi} from '../../../../../store/reducers/streamingQuery/streamingQuery';
import type {ErrorResponse} from '../../../../../types/api/query';
import {EPathType} from '../../../../../types/api/schema';
import type {IQueryResult} from '../../../../../types/store/query';
import {
    getStringifiedData,
    stripIndentByFirstLine,
    trimOuterEmptyLines,
} from '../../../../../utils/dataFormatters/dataFormatters';
import {isErrorResponse} from '../../../../../utils/query';
import {ResultIssuesModal} from '../../../Query/Issues/Issues';
import {getEntityName} from '../../../utils';

import i18n from './i18n';

interface StreamingQueryProps {
    database: string;
    path: string;
}

export function StreamingQueryInfo({database, path}: StreamingQueryProps) {
    const entityName = getEntityName({Self: {PathType: EPathType.EPathTypeStreamingQuery}});

    const {data: sysData, isFetching} = streamingQueriesApi.useGetStreamingQueryInfoQuery(
        {database, path},
        {skip: !database || !path},
    );

    const items = prepareStreamingQueryItems(sysData);

    return (
        <LoaderWrapper loading={isFetching}>
            <YDBDefinitionList title={entityName} items={items} />
        </LoaderWrapper>
    );
}

const STATE_THEME_MAP: Record<string, React.ComponentProps<typeof Label>['theme']> = {
    CREATING: 'info',
    CREATED: 'normal',
    STARTING: 'info',
    RUNNING: 'success',
    STOPPING: 'info',
    STOPPED: 'normal',
    COMPLETED: 'success',
    SUSPENDED: 'warning',
    FAILED: 'danger',
};

function StateLabel({state}: {state?: string}) {
    if (!state) {
        return null;
    }

    const theme = STATE_THEME_MAP[state] ?? 'normal';

    return <Label theme={theme}>{state}</Label>;
}

function prepareStreamingQueryItems(sysData?: IQueryResult): YDBDefinitionListItem[] {
    if (!sysData) {
        return [];
    }

    const info: YDBDefinitionListItem[] = [];
    const state = getStringifiedData(sysData.resultSets?.[0]?.result?.[0]?.State);

    const queryText = getStringifiedData(sysData.resultSets?.[0]?.result?.[0]?.Text);
    let normalizedQueryText = trimOuterEmptyLines(queryText);
    normalizedQueryText = stripIndentByFirstLine(normalizedQueryText);

    const errorRaw = sysData.resultSets?.[0]?.result?.[0]?.Error;

    // We use custom error check, because error type can be non-standard
    const errorData = parseErrorData(errorRaw);

    info.push({
        name: i18n('field_query-state'),
        content: <StateLabel state={state} />,
    });

    if (errorData) {
        info.push({
            name: i18n('field_query-error'),
            content: <ResultIssuesModal data={errorData} />,
        });
    }

    info.push({
        name: i18n('field_query-text'),
        copyText: normalizedQueryText,
        content: normalizedQueryText ? (
            <YDBSyntaxHighlighter language="yql" text={normalizedQueryText} />
        ) : null,
    });

    return info;
}

function parseErrorData(raw: unknown): ErrorResponse | string | undefined {
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return isErrorResponse(parsed) ? parsed : undefined;
        } catch {
            return raw;
        }
    }

    if (isErrorResponse(raw)) {
        return raw;
    }

    return undefined;
}
