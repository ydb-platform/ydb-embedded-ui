import React from 'react';

import {dateTimeParse} from '@gravity-ui/date-utils';
import {Label} from '@gravity-ui/uikit';

import {Loader} from '../../../../../components/Loader';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YQLCodePreview} from '../../../../../components/YQLCodePreview/YQLCodePreview';
import {streamingQueriesApi} from '../../../../../store/reducers/streamingQuery/streamingQuery';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {EPathType} from '../../../../../types/api/schema';
import type {IQueryResult} from '../../../../../types/store/query';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {
    getStringifiedData,
    stripIndentByFirstLine,
    trimOuterEmptyLines,
} from '../../../../../utils/dataFormatters/dataFormatters';
import {parseIssuesData} from '../../../../../utils/query';
import {ResultIssuesModal} from '../../../Query/Issues/Issues';
import {SchemaObjectInfo} from '../SchemaObjectInfo/SchemaObjectInfo';

import i18n from './i18n';

import './StreamingQueryInfo.scss';

interface StreamingQueryProps {
    database: string;
    path: string;
    data?: TEvDescribeSchemeResult;
}

const b = cn('ydb-streaming-query-info');

export function StreamingQueryInfo({database, path, data}: StreamingQueryProps) {
    const {currentData: sysData, isFetching} = streamingQueriesApi.useGetStreamingQueryInfoQuery(
        {database, path},
        {skip: !database || !path},
    );
    const loading = isFetching && sysData === undefined;

    const {items, queryText, createdContent, stateItems} = prepareStreamingQueryInfo(
        sysData,
        data?.PathDescription?.Self?.CreateStep,
    );

    return (
        <React.Fragment>
            <SchemaObjectInfo
                data={data}
                fallbackType={EPathType.EPathTypeStreamingQuery}
                path={path}
                createdContent={createdContent}
                itemsAfterType={stateItems}
            />
            {loading ? (
                <Loader size="s" className={b('loader')} />
            ) : items.length ? (
                <YDBDefinitionList items={items} />
            ) : null}
            {queryText ? (
                <YQLCodePreview title={i18n('field_query-text')} text={queryText} />
            ) : null}
        </React.Fragment>
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

export function prepareStreamingQueryInfo(sysData?: IQueryResult, createStep?: string | number) {
    if (!sysData) {
        return {items: [], queryText: undefined, createdContent: undefined, stateItems: []};
    }

    const row = sysData.resultSets?.[0]?.result?.[0];
    const createdContent =
        formatLifecycleValue(row?.CreatedAt, row?.CreatedBy, createStep) ??
        (row && 'CreatedAt' in row ? EMPTY_DATA_PLACEHOLDER : undefined);
    const lifecycleFields = [
        {name: i18n('field_started'), timestamp: 'StartedAt', user: 'StartedBy'},
        {name: i18n('field_modified'), timestamp: 'ModifiedAt', user: 'ModifiedBy'},
        {name: i18n('field_stopped'), timestamp: 'FinishedAt', user: 'StoppedBy'},
    ];
    const info: YDBDefinitionListItem[] = lifecycleFields
        .filter(({timestamp}) => row && timestamp in row)
        .map(({name, timestamp, user}) => ({
            name,
            content: formatLifecycleValue(row?.[timestamp], row?.[user]) ?? EMPTY_DATA_PLACEHOLDER,
        }));
    const state = getStringifiedData(row?.Status);

    const queryText = getStringifiedData(row?.Text);
    let normalizedQueryText = trimOuterEmptyLines(queryText);
    normalizedQueryText = stripIndentByFirstLine(normalizedQueryText);

    const errorRaw = row?.Issues;

    // We use custom error check, because error type can be non-standard
    const errorData = parseIssuesData(errorRaw);

    const stateItems: YDBDefinitionListItem[] = [
        {name: i18n('field_query-state'), content: <StateLabel state={state} />},
    ];

    if (errorData) {
        info.push({
            name: i18n('field_query-error'),
            content: <ResultIssuesModal data={errorData} />,
        });
    }

    return {items: info, queryText: normalizedQueryText, createdContent, stateItems};
}

function formatLifecycleValue(
    timestamp: string | number | null | undefined,
    user: string | number | null | undefined,
    fallback?: string | number,
) {
    let milliseconds = NaN;
    if (typeof timestamp === 'number') {
        milliseconds = timestamp;
    } else if (typeof timestamp === 'string') {
        milliseconds = Date.parse(timestamp);
    }
    const dateMilliseconds =
        Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : Number(fallback);
    const date =
        Number.isFinite(dateMilliseconds) && dateMilliseconds > 0
            ? dateTimeParse(dateMilliseconds)?.format('YYYY-MM-DD HH:mm:ss')
            : undefined;

    if (!date && !user) {
        return undefined;
    }

    if (!user) {
        return date;
    }

    return (
        <React.Fragment>
            {i18n('value_date-by-user', {date: date || EMPTY_DATA_PLACEHOLDER})}{' '}
            <Label theme="normal">{String(user)}</Label>
        </React.Fragment>
    );
}
