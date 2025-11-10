import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Flex, Label} from '@gravity-ui/uikit';

import {CONFIRMATION_DIALOG} from '../../../../../components/ConfirmationDialog/ConfirmationDialog';
import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {streamingQueriesApi} from '../../../../../store/reducers/streamingQuery/streamingQuery';
import type {ErrorResponse} from '../../../../../types/api/query';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import type {IQueryResult} from '../../../../../types/store/query';
import {getStringifiedData} from '../../../../../utils/dataFormatters/dataFormatters';
import {Issues, ResultIssues} from '../../../Query/Issues/Issues';
import {getEntityName} from '../../../utils';

import i18n from './i18n';

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
                {i18n('noData')} {entityName}
            </div>
        );
    }

    const {data: sysData} = streamingQueriesApi.useGetStreamingQueryInfoQuery(
        {database, path},
        {skip: !database || !path},
    );

    const items = prepareStreamingQueryItems(sysData);

    return (
        <Flex direction="column" gap="4">
            <YDBDefinitionList title={entityName} items={items} />
        </Flex>
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

function renderStateLabel(state?: string) {
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
    const normalizedQueryText = normalizeQueryText(queryText);

    const errorRaw = sysData.resultSets?.[0]?.result?.[0]?.Error;

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
        name: i18n('state.label'),
        content: renderStateLabel(state),
    });

    if (errorData && Object.keys(errorData).length > 0) {
        const issues = typeof errorData === 'string' ? undefined : errorData.issues;

        info.push({
            name: i18n('state.error'),
            content: (
                <ResultIssues
                    data={errorData}
                    titlePreviewMode="multi"
                    detailsMode="modal"
                    onOpenDetails={() =>
                        NiceModal.show(CONFIRMATION_DIALOG, {
                            caption: i18n('state.error'),
                            children: <Issues issues={issues ?? []} />,
                        })
                    }
                />
            ),
        });
    }

    info.push({
        name: i18n('text.label'),
        copyText: normalizedQueryText,
        content: normalizedQueryText ? (
            <YDBSyntaxHighlighter language="yql" text={normalizedQueryText} />
        ) : null,
    });

    return info;
}

function normalizeQueryText(text?: string) {
    if (!text) {
        return text;
    }

    let normalized = text.replace(/^\s*\n+/, '');
    normalized = normalized.replace(/\n+\s*$/, '');

    return normalized;
}
