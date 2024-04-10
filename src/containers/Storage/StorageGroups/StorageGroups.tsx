import React from 'react';

import type {Settings, SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageGroup, VisibleEntities} from '../../../store/reducers/storage/types';
import type {NodesMap} from '../../../types/store/nodesList';
import type {HandleSort} from '../../../utils/hooks/useTableSort';

import {StorageGroupsEmptyDataMessage} from './StorageGroupsEmptyDataMessage';
import {getPreparedStorageGroupsColumns} from './getStorageGroupsColumns';
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
    const columns = React.useMemo(() => {
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
