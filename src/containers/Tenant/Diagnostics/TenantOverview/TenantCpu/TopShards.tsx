import {useComponent} from '../../../../../components/ComponentsProvider/ComponentsProvider';
import type {TopShardsColumnId} from '../../../../../components/ShardsTable/constants';
import {topShardsApi} from '../../../../../store/reducers/tenantOverview/topShards/tenantOverviewTopShards';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../../utils/query';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
const columnsIds: TopShardsColumnId[] = ['TabletId', 'Path', 'CPUCores'];

interface TopShardsProps {
    tenantName: string;
    path: string;
    databaseFullPath?: string;
}

export const TopShards = ({tenantName, path, databaseFullPath = tenantName}: TopShardsProps) => {
    const ShardsTable = useComponent('ShardsTable');

    const [autoRefreshInterval] = useAutoRefreshInterval();

    let normalizedPath = path;
    if (tenantName !== databaseFullPath) {
        //tenantName may be database full path or database id. If it is database id, we must remove it from object's path and add database full path instead
        const shrinkedPath = path.startsWith(tenantName) ? path.slice(tenantName.length) : path;
        normalizedPath = databaseFullPath + shrinkedPath;
    }

    const {currentData, isFetching, error} = topShardsApi.useGetTopShardsQuery(
        {database: tenantName, path: normalizedPath, databaseFullPath},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const data = currentData?.resultSets?.[0]?.result || [];

    return (
        <TenantOverviewTableLayout
            loading={loading}
            error={parseQueryErrorToString(error)}
            withData={Boolean(currentData)}
        >
            <ShardsTable
                data={data}
                schemaPath={tenantName}
                database={tenantName}
                columnsIds={columnsIds}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
};
