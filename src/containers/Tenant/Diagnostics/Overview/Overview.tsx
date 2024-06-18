import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {shallowEqual} from 'react-redux';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {Loader} from '../../../../components/Loader';
import {olapApi} from '../../../../store/reducers/olapStats';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {selectSchemaMergedChildrenPaths} from '../../../../store/reducers/schema/schema';
import {EPathType} from '../../../../types/api/schema';
import {useTypedSelector} from '../../../../utils/hooks';
import {ExternalDataSourceInfo} from '../../Info/ExternalDataSource/ExternalDataSource';
import {ExternalTableInfo} from '../../Info/ExternalTable/ExternalTable';
import {ViewInfo} from '../../Info/View/View';
import {
    isColumnEntityType,
    isEntityWithMergedImplementation,
    isTableType,
} from '../../utils/schema';

import {AsyncReplicationInfo} from './AsyncReplicationInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {TableInfo} from './TableInfo';
import {TopicInfo} from './TopicInfo';

interface OverviewProps {
    type?: EPathType;
    tenantName?: string;
}

function Overview({type, tenantName}: OverviewProps) {
    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const schemaPath = currentSchemaPath || tenantName;
    const olapParams =
        isTableType(type) && isColumnEntityType(type) ? {path: schemaPath} : skipToken;
    const {currentData: olapData, isFetching: olapIsFetching} = olapApi.useGetOlapStatsQuery(
        olapParams,
        {pollingInterval: autorefresh},
    );
    const olapStatsLoading = olapIsFetching && olapData === undefined;
    const {result: olapStats} = olapData || {result: undefined};

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    // shalloEqual prevents rerenders when new schema data is loaded
    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, type),
        shallowEqual,
    );

    let paths: string[] | typeof skipToken = skipToken;
    if (schemaPath) {
        if (!isEntityWithMergedImpl) {
            paths = [schemaPath];
        } else if (mergedChildrenPaths) {
            paths = [schemaPath, ...mergedChildrenPaths];
        }
    }

    const {
        currentData,
        isFetching,
        error: overviewError,
    } = overviewApi.useGetOverviewQuery(paths, {
        pollingInterval: autorefresh,
    });
    const overviewLoading = isFetching && currentData === undefined;
    const {data: rawData, additionalData} = currentData || {};

    const entityLoading = overviewLoading || olapStatsLoading;
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
                <ChangefeedInfo data={data} topic={additionalData?.[0] ?? undefined} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => <TopicInfo data={data} />,
            [EPathType.EPathTypeExternalTable]: () => <ExternalTableInfo data={data} />,
            [EPathType.EPathTypeExternalDataSource]: () => <ExternalDataSourceInfo data={data} />,
            [EPathType.EPathTypeView]: () => <ViewInfo data={data} />,
            [EPathType.EPathTypeReplication]: () => <AsyncReplicationInfo data={data} />,
        };

        return (
            (type && pathTypeToComponent[type]?.()) || (
                <TableInfo data={data} type={type} olapStats={olapStats} />
            )
        );
    };

    if (entityLoading || entityNotReady) {
        return <Loader size="m" />;
    }

    if (overviewError) {
        return <ResponseError error={overviewError} />;
    }

    return renderContent();
}

export default Overview;
