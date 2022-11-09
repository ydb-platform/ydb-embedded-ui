import {ReactNode, useMemo} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';

import {
    CDCStreamInfo,
    TableIndexInfo,
    PersQueueGroupInfo,
} from '../../../../components/InfoViewer/schemaInfo';
import SchemaInfoViewer from '../../Schema/SchemaInfoViewer/SchemaInfoViewer';

import {EPathType} from '../../../../types/api/schema';
import {checkIfPathHasNestedChildren, isColumnEntityType, isTableType} from '../../utils/schema';
import {
    getSchema,
    resetCurrentSchemaNestedChildren,
    resetLoadingState,
    selectSchemaChildrenPaths,
} from '../../../../store/reducers/schema';
import {
    getOlapStats,
    resetLoadingState as resetOlapLoadingState,
} from '../../../../store/reducers/olapStats';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';

import './Overview.scss';

function prepareOlapTableGeneral(tableData: any, olapStats?: any[]) {
    const {ColumnShardCount} = tableData;
    const Bytes = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Bytes) || 0;
        return acc;
    }, 0);
    const Rows = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Rows) || 0;
        return acc;
    }, 0);
    const tabletIds = olapStats?.reduce((acc, el) => {
        acc.add(el.TabletId);
        return acc;
    }, new Set());

    return {
        PathDescription: {
            TableStats: {
                ColumnShardCount,
                Bytes: Bytes?.toLocaleString('ru-RU', {useGrouping: true}) ?? 0,
                Rows: Rows?.toLocaleString('ru-RU', {useGrouping: true}) ?? 0,
                Parts: tabletIds?.size ?? 0,
            },
        },
    };
}

interface OverviewProps {
    type?: EPathType;
    className?: string;
    tenantName?: string;
}

const b = cn('kv-tenant-overview');

function Overview(props: OverviewProps) {
    const {tenantName, type} = props;

    const dispatch = useDispatch();

    const {
        currentSchema: currentItem = {},
        loading: schemaLoading,
        wasLoaded,
        autorefresh,
        currentSchemaPath,
        currentSchemaNestedChildren,
    } = useTypedSelector((state: any) => state.schema);

    const {data: {result: olapStats} = {result: undefined}, loading: olapStatsLoading} =
        useSelector((state: any) => state.olapStats);

    const hasNestedChildren = checkIfPathHasNestedChildren(type);
    const nestedChildrenPaths = useTypedSelector((state) =>
        selectSchemaChildrenPaths(state, currentSchemaPath), shallowEqual
    );

    const loading = schemaLoading || olapStatsLoading;

    const fetchData = (isBackground: boolean) => {
        if (!isBackground) {
            dispatch(resetLoadingState());
            dispatch(resetCurrentSchemaNestedChildren());
        }
        const schemaPath = currentSchemaPath || tenantName;
        if (hasNestedChildren && nestedChildrenPaths && nestedChildrenPaths.length > 0) {
            const paths = [schemaPath, ...nestedChildrenPaths];
            dispatch(getSchema({path: paths}));
        } else {
            dispatch(getSchema({path: schemaPath}));
        }
        if (isTableType(type) && isColumnEntityType(type)) {
            if (!isBackground) {
                dispatch(resetOlapLoadingState());
            }
            dispatch(getOlapStats({path: schemaPath}));
        }
    };

    useAutofetcher(
        (isBackground) => {
            fetchData(isBackground);
        },
        [currentSchemaPath, dispatch, tenantName, type, nestedChildrenPaths],
        autorefresh,
    );

    const tableSchema =
        currentItem?.PathDescription?.Table || currentItem?.PathDescription?.ColumnTableDescription;

    const schemaData = useMemo(() => {
        return isTableType(type) && isColumnEntityType(type)
            ? prepareOlapTableGeneral(tableSchema, olapStats)
            : currentItem;
    }, [type, tableSchema, olapStats, currentItem]);

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: () => <TableIndexInfo data={schemaData} />,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: undefined,
            [EPathType.EPathTypeColumnTable]: undefined,
            [EPathType.EPathTypeCdcStream]: () => (
                <CDCStreamInfo data={schemaData} nestedChildren={currentSchemaNestedChildren} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => <PersQueueGroupInfo data={schemaData} />,
        };

        return (
            (type && pathTypeToComponent[type]?.()) || (
                <SchemaInfoViewer fullPath={currentItem.Path} data={schemaData} />
            )
        );
    };

    return loading && !wasLoaded ? (
        renderLoader()
    ) : (
        <div className={props.className}>{renderContent()}</div>
    );
}

export default Overview;
