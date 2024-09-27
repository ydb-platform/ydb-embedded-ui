import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as PaginatedTableColumn} from '../../../../components/PaginatedTable';
import type {PreparedStorageGroup, VisibleEntities} from '../../../../store/reducers/storage/types';

export type StorageGroupsColumn = PaginatedTableColumn<PreparedStorageGroup> &
    DataTableColumn<PreparedStorageGroup>;

export interface GetStorageColumnsData {
    nodeId?: string;
}

export interface GetStorageGroupsColumnsParams {
    visibleEntities?: VisibleEntities;
    nodeId?: string;
}

export type StorageColumnsGetter = (data?: GetStorageColumnsData) => StorageGroupsColumn[];
