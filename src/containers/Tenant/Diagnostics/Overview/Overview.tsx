import {ReactNode, useCallback} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';

import {Loader} from '../../../../components/Loader';

//@ts-ignore
import {TableIndexInfo} from '../../../../components/InfoViewer/schemaInfo';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {TopicInfo} from './TopicInfo';
import {ChangefeedInfo} from './ChangefeedInfo';
import {TableInfo} from './TableInfo';

import {EPathType} from '../../../../types/api/schema';
import {
    isEntityWithMergedImplementation,
    isColumnEntityType,
    isTableType,
    isPathTypeWithTopic,
} from '../../utils/schema';
//@ts-ignore
import {
    getSchema,
    getSchemaBatched,
    resetLoadingState,
    selectSchemaMergedChildrenPaths,
} from '../../../../store/reducers/schema/schema';
import {getTopic} from '../../../../store/reducers/topic';
//@ts-ignore
import {
    getOlapStats,
    resetLoadingState as resetOlapLoadingState,
} from '../../../../store/reducers/olapStats';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';

interface OverviewProps {
    type?: EPathType;
    className?: string;
    tenantName?: string;
}

function Overview({type, tenantName, className}: OverviewProps) {
    const dispatch = useDispatch();

    const {
        currentSchema: currentItem = {},
        loading: schemaLoading,
        wasLoaded,
        autorefresh,
        currentSchemaPath,
        error,
    } = useSelector((state: any) => state.schema);

    const {data: {result: olapStats} = {result: undefined}, loading: olapStatsLoading} =
        useTypedSelector((state) => state.olapStats);

    const loading = schemaLoading || olapStatsLoading;

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    // There is a circular dependency here. Fetch data depends on children paths
    // When data in store updated on fetch request,
    // new object is set there, so source children array is updated
    // This updates selector, the selector returns a new array, and data is fetched again
    // To prevent it, shallowEqual, which compares array content, was added
    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, type),
        shallowEqual,
    );

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(resetLoadingState());
            }

            const schemaPath = currentSchemaPath || tenantName;

            if (!isEntityWithMergedImpl) {
                dispatch(getSchema({path: schemaPath}));
            } else if (mergedChildrenPaths) {
                dispatch(getSchemaBatched([schemaPath, ...mergedChildrenPaths]));
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
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: () => <TableIndexInfo data={currentItem} />,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: undefined,
            [EPathType.EPathTypeColumnTable]: undefined,
            [EPathType.EPathTypeCdcStream]: () => (
                <ChangefeedInfo data={currentItem} childrenPaths={mergedChildrenPaths} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => <TopicInfo data={currentItem} />,
        };

        return (
            (type && pathTypeToComponent[type]?.()) || (
                <TableInfo data={currentItem} type={type} olapStats={olapStats} />
            )
        );
    };

    if ((loading && !wasLoaded) || (isEntityWithMergedImpl && !mergedChildrenPaths)) {
        return <Loader size="m" />;
    }

    if (error) {
        return <ResponseError error={error} />;
    }

    return <div className={className}>{renderContent()}</div>;
}

export default Overview;
