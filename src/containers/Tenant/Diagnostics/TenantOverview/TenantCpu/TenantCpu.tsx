import {Flex} from '@gravity-ui/uikit';

import {setTopQueriesFilters} from '../../../../../store/reducers/executeTopQueries/executeTopQueries';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
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
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
    mode?: 'default' | 'serverless';
}

export function TenantCpu({tenantName, additionalNodesProps, mode = 'default'}: TenantCpuProps) {
    const dispatch = useTypedDispatch();
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const allNodesLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.nodes);
    const topShardsLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.topShards);
    const topQueriesLink = getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.topQueries);

    const isServerless = mode === 'serverless';

    return (
        <Flex direction="column" gap={4}>
            {!isServerless && (
                <>
                    <TenantDashboard database={tenantName} charts={cpuDashboardConfig} />
                    <StatsWrapper
                        allEntitiesLink={allNodesLink}
                        title={i18n('title_top-nodes-load')}
                    >
                        <TopNodesByLoad
                            tenantName={tenantName}
                            additionalNodesProps={additionalNodesProps}
                        />
                    </StatsWrapper>
                    <StatsWrapper
                        title={i18n('title_top-nodes-pool')}
                        allEntitiesLink={allNodesLink}
                    >
                        <TopNodesByCpu
                            tenantName={tenantName}
                            additionalNodesProps={additionalNodesProps}
                        />
                    </StatsWrapper>
                </>
            )}
            <StatsWrapper title={i18n('title_top-shards')} allEntitiesLink={topShardsLink}>
                <TopShards tenantName={tenantName} path={tenantName} />
            </StatsWrapper>
            <StatsWrapper
                title={i18n('title_top-queries')}
                allEntitiesLink={topQueriesLink}
                onAllEntitiesClick={() =>
                    dispatch(setTopQueriesFilters({from: undefined, to: undefined}))
                }
            >
                <TopQueries tenantName={tenantName} />
            </StatsWrapper>
        </Flex>
    );
}
