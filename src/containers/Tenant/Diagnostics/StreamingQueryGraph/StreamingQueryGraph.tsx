import React from 'react';

import {Text, useThemeValue} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {prepareStreamingQueryPlan} from '../../../../store/reducers/query/parsers/prepareStreamingQueryPlan';
import {streamingQueriesApi} from '../../../../store/reducers/streamingQuery/streamingQuery';
import {cn} from '../../../../utils/cn';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {parseIssuesData} from '../../../../utils/query';
import {ResultIssues} from '../../Query/Issues/Issues';
import {Graph} from '../../Query/QueryResult/components/Graph/Graph';

import i18n from './i18n';

import './StreamingQueryGraph.scss';

interface StreamingQueryGraphProps {
    database: string;
    path: string;
}

const RUNNING_STATUS = 'RUNNING';

const b = cn('ydb-streaming-query-graph');

const PLAN_STATE_MESSAGES = {
    empty: 'description_no-plan',
    unparsed: 'description_unparsed-plan',
    unsupported: 'description_unsupported-plan',
} as const;

export function StreamingQueryGraph({database, path}: StreamingQueryGraphProps) {
    const theme = useThemeValue();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {
        currentData: planData,
        isFetching,
        error,
    } = streamingQueriesApi.useGetStreamingQueryPlanQuery(
        {database, path},
        {skip: !database || !path, pollingInterval: autoRefreshInterval},
    );

    const row = planData?.resultSets?.[0]?.result?.[0];

    const {state, prepared} = React.useMemo(
        () => prepareStreamingQueryPlan(getStringifiedData(row?.Plan)),
        [row?.Plan],
    );

    if (isFetching && planData === undefined) {
        return <Loader size="s" className={b('loader')} />;
    }

    const status = getStringifiedData(row?.Status);
    const issues = parseIssuesData(row?.Issues);
    const showStatus = Boolean(issues) || Boolean(status && status !== RUNNING_STATUS);

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} /> : null}
            {showStatus ? (
                <div className={b('status')}>
                    {status ? <Text variant="subheader-2">{status}</Text> : null}
                    {issues ? <ResultIssues data={issues} /> : null}
                </div>
            ) : null}
            {state === 'ready' ? (
                <Graph explain={prepared} theme={theme} />
            ) : (
                <div>{i18n(PLAN_STATE_MESSAGES[state])}</div>
            )}
        </div>
    );
}
