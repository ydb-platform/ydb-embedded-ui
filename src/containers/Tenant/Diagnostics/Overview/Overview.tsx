import React from 'react';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {Loader} from '../../../../components/Loader';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {EPathType} from '../../../../types/api/schema';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {ExternalDataSourceInfo} from '../../Info/ExternalDataSource/ExternalDataSource';
import {ExternalTableInfo} from '../../Info/ExternalTable/ExternalTable';
import {ViewInfo} from '../../Info/View/View';

import {AsyncReplicationInfo} from './AsyncReplicationInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {TableInfo} from './TableInfo';
import {TopicInfo} from './TopicInfo';
import {TransferInfo} from './TransferInfo';

interface OverviewProps {
    type?: EPathType;
    path: string;
    database: string;
}

function Overview({type, path, database}: OverviewProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching, error} = overviewApi.useGetOverviewQuery(
        {path, database},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const renderContent = () => {
        const data = currentData ?? undefined;
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => React.ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeResourcePool]: undefined,
            [EPathType.EPathTypeTable]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: () => <TableIndexInfo data={data} />,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: undefined,
            [EPathType.EPathTypeColumnTable]: undefined,
            [EPathType.EPathTypeCdcStream]: () => (
                <ChangefeedInfo path={path} database={database} data={data} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => (
                <TopicInfo data={data} path={path} database={database} />
            ),
            [EPathType.EPathTypeExternalTable]: () => <ExternalTableInfo data={data} />,
            [EPathType.EPathTypeExternalDataSource]: () => <ExternalDataSourceInfo data={data} />,
            [EPathType.EPathTypeView]: () => <ViewInfo data={data} />,
            [EPathType.EPathTypeReplication]: () => <AsyncReplicationInfo data={data} />,
            [EPathType.EPathTypeTransfer]: () => (
                <TransferInfo path={path} database={database} data={data} />
            ),
        };

        return (type && pathTypeToComponent[type]?.()) || <TableInfo data={data} type={type} />;
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
