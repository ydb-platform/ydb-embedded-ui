import React from 'react';

import {Label} from '@gravity-ui/uikit';

import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {streamingQueriesApi} from '../../../../../store/reducers/streamingQuery/streamingQuery';
import type {ErrorResponse} from '../../../../../types/api/query';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import type {IQueryResult} from '../../../../../types/store/query';
import {cn} from '../../../../../utils/cn';
import {getStringifiedData} from '../../../../../utils/dataFormatters/dataFormatters';
import {ResultIssues} from '../../../Query/Issues/Issues';
import {ISSUES_VIEW_MODE} from '../../../Query/Issues/models';
import {getEntityName} from '../../../utils';

import i18n from './i18n';

import './StreamingQueryInfo.scss';

const b = cn('kv-streaming-query-info');

interface StreamingQueryProps {
    data?: TEvDescribeSchemeResult;
    database: string;
    path: string;
}

/** Displays overview for StreamingQuery EPathType */
export function StreamingQueryInfo({data, database, path}: StreamingQueryProps) {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return (
            <div className="error">
                {i18n('no-data')} {entityName}
            </div>
        );
    }

    const {data: sysData} = streamingQueriesApi.useGetStreamingQueryInfoQuery(
        {database, path},
        {skip: !database || !path},
    );

    const items = prepareStreamingQueryItems(sysData);

    return <YDBDefinitionList title={entityName} items={items} />;
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
    const normalizedQueryText = typeof queryText === 'string' ? queryText.trim() : '';

    const errorRaw = sysData.resultSets?.[0]?.result?.[0]?.Error;

    // We need custom error check, because error type can be non-standard
    let errorData: ErrorResponse | string | undefined;
    if (typeof errorRaw === 'string') {
        try {
            errorData = JSON.parse(errorRaw) as ErrorResponse;
        } catch {
            errorData = errorRaw;
        }
    } else if (errorRaw) {
        errorData = errorRaw as ErrorResponse;
    }

    info.push({
        name: i18n('query.state-field'),
        content: <StateLabel state={state} />,
    });

    if (errorData && Object.keys(errorData).length > 0) {
        info.push({
            name: i18n('query.error-field'),
            content: <ResultIssues data={errorData} detailsMode={ISSUES_VIEW_MODE.MODAL} />,
        });
    }

    info.push({
        name: i18n('query.text-field'),
        copyText: normalizedQueryText,
        content: normalizedQueryText ? (
            <YDBSyntaxHighlighter language="yql" className={b()} text={normalizedQueryText} />
        ) : null,
    });

    return info;
}
