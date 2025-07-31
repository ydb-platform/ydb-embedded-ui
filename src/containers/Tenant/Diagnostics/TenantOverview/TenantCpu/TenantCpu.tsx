import React from 'react';

import {ArrowRight} from '@gravity-ui/icons';
import {Flex, Icon, SegmentedRadioGroup, Tab, TabList, TabProvider} from '@gravity-ui/uikit';

import {InternalLink} from '../../../../../components/InternalLink';
import {
    TENANT_CPU_NODES_MODE_IDS,
    TENANT_CPU_TABS_IDS,
    TENANT_DIAGNOSTICS_TABS_IDS,
} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {cn} from '../../../../../utils/cn';
import {useDiagnosticsPageLinkGetter} from '../../../Diagnostics/DiagnosticsPages';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {TopNodesByCpu} from './TopNodesByCpu';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import {cpuDashboardConfig} from './cpuDashboardConfig';
import {useTenantCpuQueryParams} from './useTenantCpuQueryParams';

import './TenantCpu.scss';

const b = cn('tenant-cpu');

const cpuTabs = [
    {id: TENANT_CPU_TABS_IDS.nodes, title: i18n('title_top-nodes')},
    {id: TENANT_CPU_TABS_IDS.shards, title: i18n('title_top-shards')},
    {id: TENANT_CPU_TABS_IDS.queries, title: i18n('title_top-queries')},
];

interface TenantCpuProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({tenantName, additionalNodesProps}: TenantCpuProps) {
    const {cpuTab, nodesMode, handleCpuTabChange, handleNodesModeChange} =
        useTenantCpuQueryParams();
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const renderNodesContent = () => {
        const nodesModeControl = (
            <SegmentedRadioGroup value={nodesMode} onUpdate={handleNodesModeChange}>
                <SegmentedRadioGroup.Option value={TENANT_CPU_NODES_MODE_IDS.load}>
                    {i18n('action_by-load')}
                </SegmentedRadioGroup.Option>
                <SegmentedRadioGroup.Option value={TENANT_CPU_NODES_MODE_IDS.pools}>
                    {i18n('action_by-pool-usage')}
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
            nodesMode === TENANT_CPU_NODES_MODE_IDS.load ? (
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
                            return (
                                <Tab key={id} value={id} onClick={() => handleCpuTabChange(id)}>
                                    {title}
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
