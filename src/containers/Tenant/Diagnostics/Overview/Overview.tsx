import {useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@yandex-cloud/uikit';

//@ts-ignore
import SchemaInfoViewer from '../../Schema/SchemaInfoViewer/SchemaInfoViewer';
import {IndexInfoViewer} from '../../../../components/IndexInfoViewer/IndexInfoViewer';

import type {EPathType} from '../../../../types/api/schema';
import {isColumnEntityType, isTableType, mapPathTypeToNavigationTreeType} from '../../utils/schema';
import {AutoFetcher} from '../../../../utils/autofetcher';
//@ts-ignore
import {getSchema} from '../../../../store/reducers/schema';
//@ts-ignore
import {getOlapStats} from '../../../../store/reducers/olapStats';

import './Overview.scss';

function prepareOlapTableGeneral(tableData: any, olapStats: any[]) {
    const {ColumnShardCount} = tableData;
    const Bytes = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Bytes) ?? 0;
        return acc;
    }, 0);
    const Rows = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Rows) ?? 0;
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

const autofetcher = new AutoFetcher();

function Overview(props: OverviewProps) {
    const dispatch = useDispatch();
    const {
        currentSchema: currentItem = {},
        loading,
        wasLoaded,
        autorefresh,
        currentSchemaPath,
    } = useSelector((state: any) => state.schema);

    const {data: olapStats} = useSelector((state: any) => state.olapStats);

    const fetchOverviewData = () => {
        const {tenantName, type} = props;
        const schemaPath = currentSchemaPath || tenantName;
        dispatch(getSchema({path: schemaPath}));

        if (isTableType(type) && isColumnEntityType(type)) {
            dispatch(getOlapStats({path: schemaPath}));
        }
    };

    useEffect(() => {
        fetchOverviewData();
        return () => {
            autofetcher.stop();
        };
    }, []);

    useEffect(() => {
        if (autorefresh) {
            fetchOverviewData();
            autofetcher.stop();
            autofetcher.start();
            autofetcher.fetch(() => fetchOverviewData());
        }
        if (autorefresh === false) {
            autofetcher.stop();
        }
    }, [autorefresh]);

    const tableSchema =
        currentItem?.PathDescription?.Table || currentItem?.PathDescription?.ColumnTableDescription;

    const schemaData = useMemo(() => {
        return isTableType(props.type) && isColumnEntityType(props.type)
            ? prepareOlapTableGeneral(tableSchema, olapStats)
            : currentItem;
    }, [props.type, tableSchema, olapStats, currentItem]);

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        switch (mapPathTypeToNavigationTreeType(props.type)) {
            case 'index':
                return (
                    <IndexInfoViewer data={schemaData} />
                );
            default:
                return (
                    <SchemaInfoViewer fullPath={currentItem.Path} data={schemaData} />
                );
        }
    }

    return loading && !wasLoaded ? (
        renderLoader()
    ) : (
        <div className={props.className}>
            {renderContent()}
        </div>
    );
}

export default Overview;
