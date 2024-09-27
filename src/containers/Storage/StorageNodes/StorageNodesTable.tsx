import type {SortOrder} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import type {HandleSort} from '../../../utils/hooks/useTableSort';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {STORAGE_NODES_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import type {StorageNodesColumn} from './columns/types';
import i18n from './i18n';
import {getRowUnavailableClassName} from './shared';

const tableSettings = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRenderMinSize: 51,
} as const;

interface StorageNodesTableProps {
    data: PreparedStorageNode[];
    columns: StorageNodesColumn[];
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    sort?: SortOrder;
    onShowAll?: VoidFunction;
    handleSort?: HandleSort;
}

export function StorageNodesTable({
    data,
    columns,
    visibleEntities,
    nodesUptimeFilter,
    sort,
    onShowAll,
    handleSort,
}: StorageNodesTableProps) {
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
        <ResizeableDataTable
            columnsWidthLSKey={STORAGE_NODES_COLUMNS_WIDTH_LS_KEY}
            key={visibleEntities as string}
            data={data}
            columns={columns}
            settings={tableSettings}
            emptyDataMessage={i18n('empty.default')}
            rowClassName={getRowUnavailableClassName}
            sortOrder={sort}
            onSort={handleSort}
        />
    );
}
