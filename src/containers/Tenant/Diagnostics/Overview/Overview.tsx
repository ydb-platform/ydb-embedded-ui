import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {Loader} from '../../../../components/Loader';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {
    selectSchemaMergedChildrenPaths,
    useGetSchemaQuery,
} from '../../../../store/reducers/schema/schema';
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
        currentData,
        isFetching,
        error: overviewError,
    } = overviewApi.useGetOverviewQuery(paths.length ? {paths, database} : skipToken, {
        pollingInterval: autoRefreshInterval,
    });
    const overviewLoading = isFetching && currentData === undefined;
    const {data: rawData, additionalData} = currentData || {};

    const {error: schemaError} = useGetSchemaQuery({path, database});

    const entityLoading = overviewLoading;
    const entityNotReady = isEntityWithMergedImpl && !mergedChildrenPaths;

    const renderContent = () => {
        const data = rawData ?? undefined;
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => React.ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: () => <TableIndexInfo data={data} />,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: undefined,
            [EPathType.EPathTypeColumnTable]: undefined,
            [EPathType.EPathTypeCdcStream]: () => (
                <ChangefeedInfo path={path} data={data} topic={additionalData?.[0] ?? undefined} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => <TopicInfo data={data} path={path} />,
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
            {schemaError || overviewError ? (
                <ResponseError error={schemaError || overviewError} />
            ) : null}
            {renderContent()}
        </React.Fragment>
    );
}

export default Overview;
