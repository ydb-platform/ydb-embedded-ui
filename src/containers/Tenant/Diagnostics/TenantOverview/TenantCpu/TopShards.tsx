import {useMemo} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {type Column} from '@gravity-ui/react-data-table';

import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {getSchema, setCurrentSchemaPath} from '../../../../../store/reducers/schema/schema';
import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import type {KeyValueRow} from '../../../../../types/api/query';
import {
    sendTopShardsQuery,
    setDataWasNotLoaded,
} from '../../../../../store/reducers/tenantOverview/executeTopShards/executeTopShards';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {getTopShardsColumns} from '../../TopShards/getTopShardsColumns';

const b = cn('tenant-overview-cpu');

interface TopShardsProps {
    path: string;
}

export const TopShards = ({path}: TopShardsProps) => {
    const dispatch = useDispatch();

    const {autorefresh, currentSchemaPath} = useTypedSelector((state) => state.schema);

    const {
        loading,
        data: {result: data = undefined} = {},
        error,
        wasLoaded,
    } = useTypedSelector((state) => state.executeTopShards);

    useAutofetcher(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }
            dispatch(sendTopShardsQuery(path, currentSchemaPath));
        },
        [dispatch, path, currentSchemaPath],
        autorefresh,
    );

    const columns = useMemo(() => {
        const onSchemaClick = (schemaPath: string) => {
            return () => {
                dispatch(setCurrentSchemaPath(schemaPath));
                dispatch(getSchema({path: schemaPath}));
                history.go(0);
            };
        };

        const tableColumns: Column<KeyValueRow>[] = getTopShardsColumns(onSchemaClick, path);

        return tableColumns;
    }, [dispatch, path]);

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return (
            <DataTable
                columns={columns}
                data={data || []}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                theme="yandex-cloud"
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top shards by cpu usage</div>
            <div className={b('table')}>{renderContent()}</div>
        </>
    );
};
