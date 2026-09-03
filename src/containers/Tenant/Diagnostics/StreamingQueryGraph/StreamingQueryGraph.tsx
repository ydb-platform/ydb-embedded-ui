import {useThemeValue} from '@gravity-ui/uikit';

import {Loader} from '../../../../components/Loader';
import {parseStreamingQueryPlan} from '../../../../store/reducers/query/parsers/parseStreamingQueryPlan';
import {preparePlanData} from '../../../../store/reducers/query/parsers/preparePlanData';
import {streamingQueriesApi} from '../../../../store/reducers/streamingQuery/streamingQuery';
import type {ErrorResponse} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {isErrorResponse} from '../../../../utils/query';
import {ResultIssuesModal} from '../../Query/Issues/Issues';
import {Graph} from '../../Query/QueryResult/components/Graph/Graph';

import './StreamingQueryGraph.scss';

interface StreamingQueryGraphProps {
    database: string;
    path: string;
}

const b = cn('ydb-streaming-query-graph');

export function StreamingQueryGraph({database, path}: StreamingQueryGraphProps) {
    // theme triggers key= remount of YDBGraph so it re-reads CSS colour variables from the DOM
    const theme = useThemeValue();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {data: queryResult, isFetching} = streamingQueriesApi.useGetStreamingQueryPlanQuery(
        {database, path},
        {skip: !database || !path, pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && queryResult === undefined;

    if (loading) {
        return <Loader size="s" className={b('loader')} />;
    }

    const row = queryResult?.resultSets?.[0]?.result?.[0];
    const preparedPlan = preparePlanData(parseStreamingQueryPlan(getStringifiedData(row?.Plan)));

    const hasNodes = Boolean(preparedPlan?.nodes?.length);
    const issuesRaw = row?.Issues;
    const issues = parseIssues(issuesRaw);

    if (!hasNodes && issues) {
        return (
            <div className={b()}>
                <ResultIssuesModal data={issues} />
            </div>
        );
    }

    return (
        <div className={b()}>
            <Graph explain={preparedPlan} theme={theme} />
        </div>
    );
}

function parseIssues(raw: unknown): ErrorResponse | string | undefined {
    if (typeof raw === 'string' && raw) {
        try {
            const parsed: unknown = JSON.parse(raw);
            return isErrorResponse(parsed) ? parsed : raw;
        } catch {
            return raw;
        }
    }
    if (isErrorResponse(raw)) {
        return raw;
    }
    return undefined;
}
