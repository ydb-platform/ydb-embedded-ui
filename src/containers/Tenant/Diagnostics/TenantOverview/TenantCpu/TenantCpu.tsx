import React from 'react';

import {ArrowRight} from '@gravity-ui/icons';
import {Flex, Icon, SegmentedRadioGroup, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {InternalLink} from '../../../../../components/InternalLink';
import {parseQuery} from '../../../../../routes';
import {
    TENANT_CPU_TABS_IDS,
    TENANT_DIAGNOSTICS_TABS_IDS,
} from '../../../../../store/reducers/tenant/constants';
import {setCpuTab} from '../../../../../store/reducers/tenant/tenant';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {cn} from '../../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import {useDiagnosticsPageLinkGetter} from '../../../Diagnostics/DiagnosticsPages';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {TopNodesByCpu} from './TopNodesByCpu';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import {cpuDashboardConfig} from './cpuDashboardConfig';

import './TenantCpu.scss';

const b = cn('tenant-cpu');

const cpuTabs = [
    {id: TENANT_CPU_TABS_IDS.nodes, title: 'Top Nodes'},
    {id: TENANT_CPU_TABS_IDS.shards, title: 'Top Shards'},
    {id: TENANT_CPU_TABS_IDS.queries, title: 'Top Queries'},
];

const NodesModeIds = {
    load: 'load',
    pools: 'pools',
} as const;

interface TenantCpuProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({tenantName, additionalNodesProps}: TenantCpuProps) {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const {cpuTab = TENANT_CPU_TABS_IDS.nodes} = useTypedSelector((state) => state.tenant);
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const [nodesMode, setNodesMode] = React.useState(NodesModeIds.load);

    const queryParams = parseQuery(location);

    React.useEffect(() => {
        if (!cpuTab) {
            dispatch(setCpuTab(TENANT_CPU_TABS_IDS.nodes));
        }
    }, [cpuTab, dispatch]);

    const renderNodesContent = () => {
        const nodesModeControl = (
            <SegmentedRadioGroup value={nodesMode} onUpdate={setNodesMode}>
                <SegmentedRadioGroup.Option value={NodesModeIds.load}>
                    By Load
                </SegmentedRadioGroup.Option>
                <SegmentedRadioGroup.Option value={NodesModeIds.pools}>
                    By Pool Usage
                </SegmentedRadioGroup.Option>
            </SegmentedRadioGroup>
        );

        const allNodesButton = (
            <InternalLink
                className={b('all-nodes-link')}
                to={getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.nodes)}
            >
                {i18n('action_all-nodes')}
                <Icon data={ArrowRight} size={16} />
            </InternalLink>
        );

        const nodesComponent =
            nodesMode === NodesModeIds.load ? (
                <TopNodesByLoad
                    tenantName={tenantName}
                    additionalNodesProps={additionalNodesProps}
                />
            ) : (
                <TopNodesByCpu
                    tenantName={tenantName}
                    additionalNodesProps={additionalNodesProps}
                />
            );

        return (
            <Flex direction="column" gap={2}>
                <Flex justifyContent="space-between" alignItems="center">
                    {nodesModeControl}
                    {allNodesButton}
                </Flex>
                {nodesComponent}
            </Flex>
        );
    };

    const renderTabContent = () => {
        switch (cpuTab) {
            case TENANT_CPU_TABS_IDS.nodes:
                return renderNodesContent();
            case TENANT_CPU_TABS_IDS.shards:
                return <TopShards tenantName={tenantName} path={tenantName} />;
            case TENANT_CPU_TABS_IDS.queries:
                return <TopQueries tenantName={tenantName} />;
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={cpuDashboardConfig} />

            <div className={b('tabs-container')}>
                <TabProvider value={cpuTab}>
                    <TabList size="m">
                        {cpuTabs.map(({id, title}) => {
                            const path = getTenantPath({
                                ...queryParams,
                                [TenantTabsGroups.cpuTab]: id,
                            });
                            return (
                                <Tab key={id} value={id}>
                                    <InternalLink to={path} as="tab">
                                        {title}
                                    </InternalLink>
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>

                <div className={b('tab-content')}>{renderTabContent()}</div>
            </div>
        </React.Fragment>
    );
}
