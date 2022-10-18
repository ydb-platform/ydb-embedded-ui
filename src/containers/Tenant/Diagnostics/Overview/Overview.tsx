import {ReactNode, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';

//@ts-ignore
import SchemaInfoViewer from '../../Schema/SchemaInfoViewer/SchemaInfoViewer';
import {
    CDCStreamInfo,
    TableIndexInfo,
    PersQueueGroupInfo,
} from '../../../../components/InfoViewer/schemaInfo';

import {EPathType} from '../../../../types/api/schema';
import {isColumnEntityType, isTableType} from '../../utils/schema';
//@ts-ignore
import {getSchema} from '../../../../store/reducers/schema';
//@ts-ignore
import {getOlapStats} from '../../../../store/reducers/olapStats';
import {useAutofetcher} from '../../../../utils/hooks';

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
        loading,
        wasLoaded,
        autorefresh,
        currentSchemaPath,
    } = useSelector((state: any) => state.schema);

    const {data: {result: olapStats} = {result: undefined}} = useSelector(
        (state: any) => state.olapStats,
    );

    useAutofetcher(
        () => {
            const schemaPath = currentSchemaPath || tenantName;
            dispatch(getSchema({path: schemaPath}));

            if (isTableType(type) && isColumnEntityType(type)) {
                dispatch(getOlapStats({path: schemaPath}));
            }
        },
        [currentSchemaPath, dispatch, tenantName, type],
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
            [EPathType.EPathTypeCdcStream]: () => <CDCStreamInfo data={schemaData} />,
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
