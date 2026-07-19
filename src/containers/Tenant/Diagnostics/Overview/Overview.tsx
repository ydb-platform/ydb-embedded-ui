import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {Loader} from '../../../../components/Loader';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {EPathType} from '../../../../types/api/schema';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {ViewInfo} from '../../Info/View/View';
import {isDomain} from '../../ObjectSummary/transformPath';
import {useNavigationV2Enabled} from '../../utils/useNavigationV2Enabled';

import {AsyncReplicationInfo} from './AsyncReplicationInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {DatabaseInfo} from './DatabaseInfo/DatabaseInfo';
import {DefaultEntityInfo} from './DefaultEntityInfo';
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

function Overview({type, path, database, databaseFullPath}: OverviewProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const useMetaProxy = useClusterWithProxy();

    const isV2Navigation = useNavigationV2Enabled();

    const {currentData, isFetching, error} = overviewApi.useGetOverviewQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const renderContent = () => {
        const data = currentData ?? undefined;
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here

        const renderTableInfo = () => (
            <TableInfo path={path} data={data} type={type} database={database} />
        );

        const pathTypeToComponent: Record<EPathType, (() => React.ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeResourcePool]: undefined,
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
                <StreamingQueryInfo path={path} database={database} />
            ),
        };

        const isDatabase =
            type === EPathType.EPathTypeSubDomain ||
            type === EPathType.EPathTypeExtSubDomain ||
            isDomain(path, type);

        if (isV2Navigation && isDatabase) {
            return <DatabaseInfo data={data} path={path} />;
        }

        if (!type || type === EPathType.EPathTypeInvalid) {
            return <DefaultEntityInfo data={data} />;
        }

        const content = pathTypeToComponent[type]?.();

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

    if (loading) {
        return <Loader size="m" />;
    }

    return (
        <React.Fragment>
            {error ? <ResponseError error={error} /> : null}
            {error && !currentData ? null : renderContent()}
        </React.Fragment>
    );
}

export default Overview;
