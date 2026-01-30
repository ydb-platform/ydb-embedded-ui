import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import type {TenantDiagnosticsTab} from '../../../store/reducers/tenant/types';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {Configs} from '../../Configs/Configs';
import {Heatmap} from '../../Heatmap/Heatmap';
import {Nodes} from '../../Nodes/Nodes';
import {Operations} from '../../Operations/Operations';
import {PaginatedStorage} from '../../Storage/PaginatedStorage';
import {Tablets} from '../../Tablets/Tablets';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';

import {AccessRights} from './AccessRights/AccessRights';
import {Consumers} from './Consumers/Consumers';
import Describe from './Describe/Describe';
import DetailedOverview from './DetailedOverview/DetailedOverview';
import {HotKeys} from './HotKeys/HotKeys';
import {NetworkWrapper} from './Network/NetworkWrapper';
import {Partitions} from './Partitions/Partitions';
import {TenantOverview} from './TenantOverview/TenantOverview';
import {TopQueries} from './TopQueries/TopQueries';
import {TopShards} from './TopShards/TopShards';
import {TopicData} from './TopicData/TopicData';
import i18n from './i18n';

interface DiagnosticsTabContentOptions {
    activeTabId: TenantDiagnosticsTab;
    type?: EPathType;
    subType?: EPathSubType;
    database: string;
    path: string;
    databaseFullPath: string;
    additionalTenantProps?: AdditionalTenantsProps;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function renderDiagnosticsTabContent({
    activeTabId,
    type,
    subType,
    database,
    path,
    databaseFullPath,
    additionalTenantProps,
    scrollContainerRef,
}: DiagnosticsTabContentOptions) {
    switch (activeTabId) {
        case TENANT_DIAGNOSTICS_TABS_IDS.database: {
            return (
                <TenantOverview
                    database={database}
                    databaseFullPath={databaseFullPath}
                    additionalTenantProps={additionalTenantProps}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.overview: {
            return (
                <DetailedOverview
                    type={type}
                    database={database}
                    path={path}
                    databaseFullPath={databaseFullPath}
                    additionalTenantProps={additionalTenantProps}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.schema: {
            return (
                <SchemaViewer
                    path={path}
                    database={database}
                    databaseFullPath={databaseFullPath}
                    type={type}
                    extended
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.topQueries: {
            return <TopQueries database={database} />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.topShards: {
            return (
                <TopShards database={database} path={path} databaseFullPath={databaseFullPath} />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.nodes: {
            return (
                <Nodes
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    scrollContainerRef={scrollContainerRef}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.access: {
            return <AccessRights />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.tablets: {
            return (
                <Tablets
                    scrollContainerRef={scrollContainerRef}
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.storage: {
            return <PaginatedStorage database={database} scrollContainerRef={scrollContainerRef} />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.network: {
            return (
                <NetworkWrapper
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    scrollContainerRef={scrollContainerRef}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.describe: {
            return (
                <Describe
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    scrollContainerRef={scrollContainerRef}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.hotKeys: {
            return <HotKeys path={path} databaseFullPath={databaseFullPath} database={database} />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.graph: {
            return <Heatmap path={path} databaseFullPath={databaseFullPath} database={database} />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.consumers: {
            return (
                <Consumers
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    type={type}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.partitions: {
            return (
                <Partitions path={path} databaseFullPath={databaseFullPath} database={database} />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.topicData: {
            return (
                <TopicData
                    key={path}
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    scrollContainerRef={scrollContainerRef}
                />
            );
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.configs: {
            return <Configs database={database} scrollContainerRef={scrollContainerRef} />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.operations: {
            return <Operations database={database} scrollContainerRef={scrollContainerRef} />;
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.backups: {
            return uiFactory.renderBackups?.({
                database,
                scrollContainerRef,
            });
        }
        case TENANT_DIAGNOSTICS_TABS_IDS.monitoring: {
            return uiFactory.renderMonitoring?.({
                type,
                subType,
                database,
                path,
                databaseFullPath,
                additionalTenantProps,
                scrollContainerRef,
            });
        }
        default: {
            return <div>{i18n('no-data')}</div>;
        }
    }
}
