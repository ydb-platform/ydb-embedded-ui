import DataTable, {Settings, SortOrder} from '@gravity-ui/react-data-table';

import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {HandleSort} from '../../../utils/hooks/useTableSort';
import type {AdditionalNodesProps} from '../../../types/additionalProps';

import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

import {getPreparedStorageNodesColumns} from './getStorageNodesColumns';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {getRowUnavailableClassName} from './shared';
import i18n from './i18n';
import './StorageNodes.scss';

interface StorageNodesProps {
    data: PreparedStorageNode[];
    tableSettings: Settings;
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    onShowAll?: VoidFunction;
    additionalNodesProps?: AdditionalNodesProps;
    sort?: SortOrder;
    handleSort?: HandleSort;
}

export function StorageNodes({
    data,
    tableSettings,
    visibleEntities,
    onShowAll,
    nodesUptimeFilter,
    additionalNodesProps,
    sort,
    handleSort,
}: StorageNodesProps) {
    const columns = getPreparedStorageNodesColumns(additionalNodesProps, visibleEntities);

    if (
        !data.length &&
        (visibleEntities !== VISIBLE_ENTITIES.all ||
            nodesUptimeFilter !== NodesUptimeFilterValues.All)
    ) {
        return (
            <StorageNodesEmptyDataMessage
                visibleEntities={visibleEntities}
                nodesUptimeFilter={nodesUptimeFilter}
                onShowAll={onShowAll}
            />
        );
    }

    return (
        <DataTable
            key={visibleEntities as string}
            theme="yandex-cloud"
            data={data}
            columns={columns}
            settings={{
                ...tableSettings,
                dynamicRenderType: 'variable',
            }}
            emptyDataMessage={i18n('empty.default')}
            rowClassName={getRowUnavailableClassName}
            sortOrder={sort}
            onSort={handleSort}
        />
    );
}
