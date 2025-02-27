import React from 'react';

import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {Loader} from '../../../../components/Loader';
import {
    selectSchemaMergedChildrenPaths,
    useGetMultiOverviewQuery,
} from '../../../../store/reducers/overview/overview';
import {EPathType} from '../../../../types/api/schema';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {ExternalDataSourceInfo} from '../../Info/ExternalDataSource/ExternalDataSource';
import {ExternalTableInfo} from '../../Info/ExternalTable/ExternalTable';
import {ViewInfo} from '../../Info/View/View';
import {isEntityWithMergedImplementation} from '../../utils/schema';

import {AsyncReplicationInfo} from './AsyncReplicationInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {TableInfo} from './TableInfo';
import {TopicInfo} from './TopicInfo';

interface OverviewProps {
    type?: EPathType;
    path: string;
    database: string;
}

function Overview({type, path, database}: OverviewProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    // shallowEqual prevents rerenders when new schema data is loaded
    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, path, type, database),
        shallowEqual,
    );

    let paths: string[] = [];
    if (!isEntityWithMergedImpl) {
        paths = [path];
    } else if (mergedChildrenPaths) {
        paths = [path, ...mergedChildrenPaths];
    }

    const {
        mergedDescribe,
        loading: entityLoading,
        error,
    } = useGetMultiOverviewQuery({
        paths,
        database,
        autoRefreshInterval,
    });

    const rawData = mergedDescribe[path];

    const entityNotReady = isEntityWithMergedImpl && !mergedChildrenPaths;

    const renderContent = () => {
        const data = rawData ?? undefined;
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
            [EPathType.EPathTypeCdcStream]: () => {
                const topicPath = mergedChildrenPaths?.[0];
                if (topicPath) {
                    return (
                        <ChangefeedInfo
                            path={path}
                            database={database}
                            data={data}
                            topic={mergedDescribe?.[topicPath] ?? undefined}
                        />
                    );
                }
                return undefined;
            },
            [EPathType.EPathTypePersQueueGroup]: () => (
                <TopicInfo data={data} path={path} database={database} />
            ),
            [EPathType.EPathTypeExternalTable]: () => <ExternalTableInfo data={data} />,
            [EPathType.EPathTypeExternalDataSource]: () => <ExternalDataSourceInfo data={data} />,
            [EPathType.EPathTypeView]: () => <ViewInfo data={data} />,
            [EPathType.EPathTypeReplication]: () => <AsyncReplicationInfo data={data} />,
        };

        return (type && pathTypeToComponent[type]?.()) || <TableInfo data={data} type={type} />;
    };

    if (entityLoading || entityNotReady) {
        return <Loader size="m" />;
    }

    return (
        <React.Fragment>
            {error ? <ResponseError error={error} /> : null}
            {error && !rawData ? null : renderContent()}
        </React.Fragment>
    );
}

export default Overview;
