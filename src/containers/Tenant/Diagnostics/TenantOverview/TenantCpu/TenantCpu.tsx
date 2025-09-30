import {Flex} from '@gravity-ui/uikit';

import {setTopQueriesFilters} from '../../../../../store/reducers/executeTopQueries/executeTopQueries';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {ETenantType} from '../../../../../types/api/tenant';
import {useTypedDispatch} from '../../../../../utils/hooks';
import {useDiagnosticsPageLinkGetter} from '../../../Diagnostics/DiagnosticsPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {TopNodesByCpu} from './TopNodesByCpu';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import {cpuDashboardConfig} from './cpuDashboardConfig';

interface TenantCpuProps {
    database: string;
    databaseFullPath: string;
    databaseType?: ETenantType;
}

export function TenantCpu({database, databaseType, databaseFullPath}: TenantCpuProps) {
    const dispatch = useTypedDispatch();
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const allNodesLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.nodes);
    const topShardsLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.topShards);
    const topQueriesLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.topQueries);

    const isServerless = databaseType === 'Serverless';

    return (
        <Flex direction="column" gap={4}>
            {!isServerless && (
                <>
                    <TenantDashboard database={database} charts={cpuDashboardConfig} />
                    <StatsWrapper
                        allEntitiesLink={allNodesLink}
                        title={i18n('title_top-nodes-load')}
                    >
                        <TopNodesByLoad database={database} />
                    </StatsWrapper>
                    <StatsWrapper
                        title={i18n('title_top-nodes-pool')}
                        allEntitiesLink={allNodesLink}
                    >
                        <TopNodesByCpu database={database} />
                    </StatsWrapper>
                </>
            )}
            <StatsWrapper title={i18n('title_top-shards')} allEntitiesLink={topShardsLink}>
                <TopShards database={database} databaseFullPath={databaseFullPath} />
            </StatsWrapper>
            <StatsWrapper
                title={i18n('title_top-queries')}
                allEntitiesLink={topQueriesLink}
                onAllEntitiesClick={() =>
                    dispatch(setTopQueriesFilters({from: undefined, to: undefined}))
                }
            >
                <TopQueries database={database} />
            </StatsWrapper>
        </Flex>
    );
}
