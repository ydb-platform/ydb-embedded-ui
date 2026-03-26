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
import {StorageUsage} from './StorageUsage/StorageUsage';
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

type DiagnosticsTabRenderer = (
    options: Omit<DiagnosticsTabContentOptions, 'activeTabId'>,
) => React.ReactNode;

const diagnosticsTabRenderers: Record<TenantDiagnosticsTab, DiagnosticsTabRenderer> = {
    [TENANT_DIAGNOSTICS_TABS_IDS.database]: ({
        database,
        databaseFullPath,
        additionalTenantProps,
    }) => (
        <TenantOverview
            database={database}
            databaseFullPath={databaseFullPath}
            additionalTenantProps={additionalTenantProps}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.overview]: ({
        type,
        database,
        path,
        databaseFullPath,
        additionalTenantProps,
    }) => (
        <DetailedOverview
            type={type}
            database={database}
            path={path}
            databaseFullPath={databaseFullPath}
            additionalTenantProps={additionalTenantProps}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.schema]: ({path, database, databaseFullPath, type}) => (
        <SchemaViewer
            path={path}
            database={database}
            databaseFullPath={databaseFullPath}
            type={type}
            extended
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.topQueries]: ({database}) => <TopQueries database={database} />,
    [TENANT_DIAGNOSTICS_TABS_IDS.topShards]: ({database, path, databaseFullPath}) => (
        <TopShards database={database} path={path} databaseFullPath={databaseFullPath} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.nodes]: ({
        path,
        databaseFullPath,
        database,
        scrollContainerRef,
    }) => (
        <Nodes
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
            scrollContainerRef={scrollContainerRef}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.access]: () => <AccessRights />,
    [TENANT_DIAGNOSTICS_TABS_IDS.tablets]: ({
        scrollContainerRef,
        path,
        databaseFullPath,
        database,
    }) => (
        <Tablets
            scrollContainerRef={scrollContainerRef}
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.storageUsage]: ({path, database, databaseFullPath}) => (
        <StorageUsage
            key={path}
            path={path}
            database={database}
            databaseFullPath={databaseFullPath}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.storage]: ({database, scrollContainerRef}) => (
        <PaginatedStorage database={database} scrollContainerRef={scrollContainerRef} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.network]: ({
        path,
        databaseFullPath,
        database,
        scrollContainerRef,
    }) => (
        <NetworkWrapper
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
            scrollContainerRef={scrollContainerRef}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.describe]: ({
        path,
        databaseFullPath,
        database,
        scrollContainerRef,
    }) => (
        <Describe
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
            scrollContainerRef={scrollContainerRef}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.hotKeys]: ({path, databaseFullPath, database}) => (
        <HotKeys path={path} databaseFullPath={databaseFullPath} database={database} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.graph]: ({path, databaseFullPath, database}) => (
        <Heatmap path={path} databaseFullPath={databaseFullPath} database={database} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.consumers]: ({path, databaseFullPath, database, type}) => (
        <Consumers
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
            type={type}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.partitions]: ({path, databaseFullPath, database}) => (
        <Partitions path={path} databaseFullPath={databaseFullPath} database={database} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.topicData]: ({
        path,
        databaseFullPath,
        database,
        scrollContainerRef,
    }) => (
        <TopicData
            key={path}
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
            scrollContainerRef={scrollContainerRef}
        />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.configs]: ({database, scrollContainerRef}) => (
        <Configs database={database} scrollContainerRef={scrollContainerRef} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.operations]: ({database, scrollContainerRef}) => (
        <Operations database={database} scrollContainerRef={scrollContainerRef} />
    ),
    [TENANT_DIAGNOSTICS_TABS_IDS.backups]: ({database, scrollContainerRef}) =>
        uiFactory.renderBackups?.({
            database,
            scrollContainerRef,
        }),
    [TENANT_DIAGNOSTICS_TABS_IDS.monitoring]: ({
        type,
        subType,
        database,
        path,
        databaseFullPath,
        additionalTenantProps,
        scrollContainerRef,
    }) => {
        const monitoringProps = {
            type,
            subType,
            database,
            path,
            databaseFullPath,
            additionalTenantProps,
            scrollContainerRef,
        };

        return uiFactory.renderMonitoring?.(monitoringProps);
    },
};

export function renderDiagnosticsTabContent({
    activeTabId,
    ...options
}: DiagnosticsTabContentOptions) {
    const renderTabContent = diagnosticsTabRenderers[activeTabId];

    return renderTabContent?.(options) ?? <div>{i18n('no-data')}</div>;
}
