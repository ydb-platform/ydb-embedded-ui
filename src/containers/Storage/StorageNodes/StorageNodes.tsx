import type {Settings, SortOrder} from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../types/additionalProps';
import type {HandleSort} from '../../../utils/hooks/useTableSort';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {STORAGE_NODES_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import {useGetStorageNodesColumns} from './columns/hooks';
import i18n from './i18n';
import {getRowUnavailableClassName} from './shared';

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
    database?: string;
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
    database,
}: StorageNodesProps) {
    const columns = useGetStorageNodesColumns({additionalNodesProps, visibleEntities, database});

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
