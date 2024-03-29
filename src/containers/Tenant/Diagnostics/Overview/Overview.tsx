import {ReactNode, useCallback} from 'react';
import {shallowEqual} from 'react-redux';

import {Loader} from '../../../../components/Loader';
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {EPathType} from '../../../../types/api/schema';
import {useAutofetcher, useTypedSelector, useTypedDispatch} from '../../../../utils/hooks';
import {selectSchemaMergedChildrenPaths} from '../../../../store/reducers/schema/schema';
import {getTopic} from '../../../../store/reducers/topic';
import {
    getOlapStats,
    resetLoadingState as resetOlapLoadingState,
} from '../../../../store/reducers/olapStats';
import {
    getOverview,
    getOverviewBatched,
    setCurrentOverviewPath,
    setDataWasNotLoaded,
} from '../../../../store/reducers/overview/overview';

import {
    isEntityWithMergedImplementation,
    isColumnEntityType,
    isTableType,
    isPathTypeWithTopic,
} from '../../utils/schema';

import {ExternalTableInfo} from '../../Info/ExternalTable/ExternalTable';
import {ExternalDataSourceInfo} from '../../Info/ExternalDataSource/ExternalDataSource';

import {TopicInfo} from './TopicInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {TableInfo} from './TableInfo';

interface OverviewProps {
    type?: EPathType;
    tenantName?: string;
}

function Overview({type, tenantName}: OverviewProps) {
    const dispatch = useTypedDispatch();

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);
    const {
        data: rawData,
        additionalData,
        loading: overviewLoading,
        wasLoaded: overviewWasLoaded,
        error: overviewError,
    } = useTypedSelector((state) => state.overview);
    const {
        data: {result: olapStats} = {result: undefined},
        loading: olapStatsLoading,
        wasLoaded: olapStatsWasLoaded,
    } = useTypedSelector((state) => state.olapStats);

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    // shalloEqual prevents rerenders when new schema data is loaded
    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, type),
        shallowEqual,
    );

    const entityLoading =
        (overviewLoading && !overviewWasLoaded) || (olapStatsLoading && !olapStatsWasLoaded);
    const entityNotReady = isEntityWithMergedImpl && !mergedChildrenPaths;

    const fetchData = useCallback(
        (isBackground: boolean) => {
            const schemaPath = currentSchemaPath || tenantName;

            if (!schemaPath) {
                return;
            }

            dispatch(setCurrentOverviewPath(schemaPath));

            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            if (!isEntityWithMergedImpl) {
                dispatch(getOverview({path: schemaPath}));
            } else if (mergedChildrenPaths) {
                dispatch(getOverviewBatched([schemaPath, ...mergedChildrenPaths]));
            }

            if (isTableType(type) && isColumnEntityType(type)) {
                if (!isBackground) {
                    dispatch(resetOlapLoadingState());
                }
                dispatch(getOlapStats({path: schemaPath}));
            }

            if (isPathTypeWithTopic(type)) {
                dispatch(getTopic(currentSchemaPath));
            }
        },
        [
            tenantName,
            currentSchemaPath,
            type,
            isEntityWithMergedImpl,
            mergedChildrenPaths,
            dispatch,
        ],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const renderContent = () => {
        const data = rawData ?? undefined;
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => ReactNode) | undefined> = {
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

    return <div>{renderContent()}</div>;
}

export default Overview;
