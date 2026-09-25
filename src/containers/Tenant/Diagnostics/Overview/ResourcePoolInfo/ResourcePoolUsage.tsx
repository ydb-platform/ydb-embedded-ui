import {Loader} from '../../../../../components/Loader';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {topQueriesApi} from '../../../../../store/reducers/executeTopQueries/executeTopQueries';
import {cn} from '../../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';

import i18n from './i18n';

import './ResourcePoolInfo.scss';

const b = cn('ydb-diagnostics-resource-pool-info');

interface ResourcePoolUsageProps {
    database: string;
    poolName: string;
}

/** Displays running/queued query counts for a resource pool */
export function ResourcePoolUsage({database, poolName}: ResourcePoolUsageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = topQueriesApi.useGetRunningQueriesByPoolQuery(
        {database, poolName},
        {skip: !poolName, pollingInterval: autoRefreshInterval, refetchOnMountOrArgChange: true},
    );

    const loading = isFetching && currentData === undefined;

    if (loading) {
        return <Loader size="s" className={b('loader')} />;
    }

    if (error || !poolName) {
        return null;
    }

    return (
        <YDBDefinitionList
            items={[
                {
                    name: i18n('field_running-queries'),
                    content: currentData?.runningQueriesCount ?? EMPTY_DATA_PLACEHOLDER,
                },
                {
                    name: i18n('field_queued-queries'),
                    content: currentData?.queuedQueriesCount ?? EMPTY_DATA_PLACEHOLDER,
                },
            ]}
            title={i18n('title_usage')}
            responsive
        />
    );
}
