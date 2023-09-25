import DataTable, {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';

import type {NodesMap} from '../../../types/store/nodesList';
import type {PreparedStorageGroup, VisibleEntities} from '../../../store/reducers/storage/types';
import type {HandleSort} from '../../../utils/hooks/useTableSort';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import {isSortableStorageProperty} from '../../../utils/storage';
import {EmptyFilter} from '../EmptyFilter/EmptyFilter';
import {getStorageGroupsColumns} from './getStorageGpoupsColumns';

import i18n from './i18n';
import './StorageGroups.scss';

const TableColumnsIds = {
    PoolName: 'PoolName',
    Kind: 'Kind',
    Erasure: 'Erasure',
    GroupId: 'GroupId',
    Used: 'Used',
    Limit: 'Limit',
    Usage: 'Usage',
    UsedSpaceFlag: 'UsedSpaceFlag',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Degraded: 'Degraded',
} as const;

interface StorageGroupsProps {
    data: PreparedStorageGroup[];
    nodes?: NodesMap;
    tableSettings: Settings;
    visibleEntities: VisibleEntities;
    onShowAll?: VoidFunction;
    sort?: SortOrder;
    handleSort?: HandleSort;
}

export function StorageGroups({
    data,
    tableSettings,
    visibleEntities,
    nodes,
    onShowAll,
    sort,
    handleSort,
}: StorageGroupsProps) {
    const rawColumns: Column<PreparedStorageGroup>[] = getStorageGroupsColumns(nodes);

    let columns = rawColumns.map((column) => ({
        ...column,
        sortable: isSortableStorageProperty(column.name),
    }));

    if (visibleEntities === VISIBLE_ENTITIES.all) {
        columns = columns.filter((col) => {
            return (
                col.name !== TableColumnsIds.Degraded && col.name !== TableColumnsIds.UsedSpaceFlag
            );
        });
    }

    if (visibleEntities === VISIBLE_ENTITIES.space) {
        columns = columns.filter((col) => col.name !== TableColumnsIds.Degraded);

        if (!data.length) {
            return (
                <EmptyFilter
                    title={i18n('empty.out_of_space')}
                    showAll={i18n('show_all')}
                    onShowAll={onShowAll}
                />
            );
        }
    }

    if (visibleEntities === VISIBLE_ENTITIES.missing) {
        columns = columns.filter((col) => col.name !== TableColumnsIds.UsedSpaceFlag);

        if (!data.length) {
            return (
                <EmptyFilter
                    title={i18n('empty.degraded')}
                    showAll={i18n('show_all')}
                    onShowAll={onShowAll}
                />
            );
        }
    }

    return data ? (
        <DataTable
            key={visibleEntities}
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={tableSettings}
            emptyDataMessage={i18n('empty.default')}
            sortOrder={sort}
            onSort={handleSort}
        />
    ) : null;
}
