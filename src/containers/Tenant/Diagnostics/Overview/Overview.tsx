import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {Loader} from '../../../../components/Loader';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {useGetOverviewQuery} from '../../../../store/reducers/overview/overview';
import {selectSchemaObjectData} from '../../../../store/reducers/schema/schema';
import {EPathType} from '../../../../types/api/schema';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {ViewInfo} from '../../Info/View/View';
import {isDomain} from '../../ObjectSummary/transformPath';
import {isDocumentTable} from '../../utils';
import {useNavigationV2Enabled} from '../../utils/useNavigationV2Enabled';

import {AsyncReplicationInfo} from './AsyncReplicationInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {DatabaseInfo} from './DatabaseInfo/DatabaseInfo';
import {DefaultEntityInfo} from './DefaultEntityInfo';
import {DocumentTableInfo} from './DocumentTableInfo/DocumentTableInfo';
import {ResourcePoolInfo} from './ResourcePoolInfo';
import {ResourcePoolUsage} from './ResourcePoolInfo/ResourcePoolUsage';
import {SchemaObjectInfoContainer} from './SchemaObjectInfo/SchemaObjectInfoContainer';
import {StreamingQueryInfo} from './StreamingQueryInfo';
import {TableInfo} from './TableInfo';
import {TopicInfo} from './TopicInfo';
import {TransferInfo} from './TransferInfo';

interface OverviewProps {
    type?: EPathType;
    path: string;
    database: string;
    databaseFullPath: string;
}

const b = cn('ydb-diagnostics-resource-pool-info');

function Overview({type, path, database, databaseFullPath}: OverviewProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const useMetaProxy = useClusterWithProxy();

    const isV2Navigation = useNavigationV2Enabled();

    const {currentData, isFetching, error} = useGetOverviewQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const selectedPath = (currentData?.Path || path).replace(/\/+$/, '');
    const supportsDocumentTables = Boolean(uiFactory.documentTables?.getSchema);
    const lookupIndexParent = supportsDocumentTables && type === EPathType.EPathTypeTableIndex;
    const parentPath = selectedPath.slice(0, selectedPath.lastIndexOf('/'));
    const cachedDescription = useTypedSelector((state) => {
        if (!lookupIndexParent) {
            return undefined;
        }
        const table = selectSchemaObjectData(
            state,
            parentPath,
            database,
            databaseFullPath,
            useMetaProxy,
        );
        return table?.partial ? undefined : table?.PathDescription;
    });
    const parent = useGetOverviewQuery(
        {path: parentPath, database, databaseFullPath, useMetaProxy},
        {skip: !lookupIndexParent || Boolean(cachedDescription)},
    );
    const isStreamingQuery = type === EPathType.EPathTypeStreamingQuery;
    const loading =
        isFetching && currentData === undefined && (!isStreamingQuery || error === undefined);

    const renderContent = () => {
        const data = currentData ?? undefined;
        const tableDescription =
            cachedDescription ?? parent.currentData?.PathDescription ?? data?.PathDescription;
        if (data && supportsDocumentTables && isDocumentTable(tableDescription)) {
            return (
                <DocumentTableInfo
                    data={data}
                    path={selectedPath}
                    indexParentPath={lookupIndexParent ? parentPath : undefined}
                    database={database}
                    databaseFullPath={databaseFullPath}
                    pollingInterval={autoRefreshInterval}
                />
            );
        }

        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here

        const renderTableInfo = () => (
            <TableInfo path={path} data={data} type={type} database={database} />
        );

        const pathTypeToComponent: Record<EPathType, (() => React.ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeResourcePool]: () => (
                <div className={b('row')}>
                    <div className={b('col')}>
                        <ResourcePoolInfo data={data} />
                    </div>
                    <div className={b('col')}>
                        <ResourcePoolUsage
                            database={database}
                            poolName={data?.PathDescription?.ResourcePoolDescription?.Name || ''}
                        />
                    </div>
                </div>
            ),
            [EPathType.EPathTypeSecret]: undefined,
            [EPathType.EPathTypeTable]: renderTableInfo,
            [EPathType.EPathTypeSysView]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: () => <TableIndexInfo data={data} />,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: renderTableInfo,
            [EPathType.EPathTypeColumnTable]: renderTableInfo,
            [EPathType.EPathTypeCdcStream]: () => (
                <ChangefeedInfo
                    path={path}
                    database={database}
                    databaseFullPath={databaseFullPath}
                    data={data}
                />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => (
                <TopicInfo
                    data={data}
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                />
            ),
            [EPathType.EPathTypeExternalTable]: undefined,
            [EPathType.EPathTypeExternalDataSource]: undefined,
            [EPathType.EPathTypeView]: () => <ViewInfo data={data} />,
            [EPathType.EPathTypeReplication]: () => <AsyncReplicationInfo data={data} />,
            [EPathType.EPathTypeTransfer]: () => (
                <TransferInfo
                    path={path}
                    databaseFullPath={databaseFullPath}
                    database={database}
                    data={data}
                />
            ),
            [EPathType.EPathTypeStreamingQuery]: () => (
                <StreamingQueryInfo path={path} database={database} data={data} />
            ),
        };

        const isDatabase =
            type === EPathType.EPathTypeSubDomain ||
            type === EPathType.EPathTypeExtSubDomain ||
            isDomain(path, type);

        if (isV2Navigation && isDatabase) {
            return <DatabaseInfo data={data} path={path} database={database} />;
        }

        if (!type || type === EPathType.EPathTypeInvalid) {
            return <DefaultEntityInfo data={data} />;
        }

        const content = pathTypeToComponent[type]?.();

        if (isStreamingQuery) {
            return content;
        }

        const commonInfo = (
            <SchemaObjectInfoContainer data={currentData ?? undefined} type={type} path={path} />
        );

        if (!content) {
            return commonInfo;
        }

        return (
            <React.Fragment>
                {commonInfo}
                {content}
            </React.Fragment>
        );
    };

    if (loading || (parent.isFetching && !parent.currentData)) {
        return <Loader size="m" />;
    }

    if (error && !currentData && isStreamingQuery) {
        return renderContent();
    }

    return (
        <React.Fragment>
            {error ? <ResponseError error={error} /> : null}
            {error && !currentData ? null : renderContent()}
        </React.Fragment>
    );
}

export default Overview;
