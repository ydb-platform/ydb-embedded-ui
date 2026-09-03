import React from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {parseStreamingQueryPlan} from '../../../../store/reducers/query/parsers/parseStreamingQueryPlan';
import {preparePlanData} from '../../../../store/reducers/query/parsers/preparePlanData';
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

const b = cn('ydb-streaming-query-graph');

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

    const preparedPlan = React.useMemo(
        () => preparePlanData(parseStreamingQueryPlan(getStringifiedData(row?.Plan))),
        [row?.Plan],
    );

    const loading = isFetching && planData === undefined;

    if (loading) {
        return <Loader size="s" className={b('loader')} />;
    }

    if (error && !planData) {
        return (
            <div className={b()}>
                <ResponseError error={error} />
            </div>
        );
    }

    const hasNodes = Boolean(preparedPlan?.nodes?.length);
    const issues = parseIssuesData(row?.Issues);

    if (!hasNodes && issues) {
        return (
            <div className={b()}>
                <ResultIssues data={issues} />
            </div>
        );
    }

    if (!hasNodes) {
        return <div className={b()}>{i18n('description_no-plan')}</div>;
    }

    return (
        <div className={b()}>
            <Graph explain={preparedPlan} theme={theme} />
        </div>
    );
}
