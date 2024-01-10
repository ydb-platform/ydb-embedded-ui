import {useMemo} from 'react';

import DataTable, {Settings, SortOrder} from '@gravity-ui/react-data-table';

import type {NodesMap} from '../../../types/store/nodesList';
import type {PreparedStorageGroup, VisibleEntities} from '../../../store/reducers/storage/types';
import type {HandleSort} from '../../../utils/hooks/useTableSort';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import {getPreparedStorageGroupsColumns} from './getStorageGroupsColumns';
import {StorageGroupsEmptyDataMessage} from './StorageGroupsEmptyDataMessage';

import i18n from './i18n';
import './StorageGroups.scss';

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
    const columns = useMemo(() => {
        return getPreparedStorageGroupsColumns(nodes, visibleEntities);
    }, [nodes, visibleEntities]);

    if (!data.length && visibleEntities !== VISIBLE_ENTITIES.all) {
        return (
            <StorageGroupsEmptyDataMessage
                onShowAll={onShowAll}
                visibleEntities={visibleEntities}
            />
        );
    }

    return (
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
    );
}
