import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as PaginatedTableColumn} from '../../../../components/PaginatedTable';
import type {PreparedStorageGroup, VisibleEntities} from '../../../../store/reducers/storage/types';
import type {StorageViewContext} from '../../types';

export type StorageGroupsColumn = PaginatedTableColumn<PreparedStorageGroup> &
    DataTableColumn<PreparedStorageGroup>;

export interface GetStorageColumnsData {
    viewContext: StorageViewContext;
}

export interface GetStorageGroupsColumnsParams {
    visibleEntities?: VisibleEntities;
    viewContext: StorageViewContext;
}

export type StorageColumnsGetter = (data?: GetStorageColumnsData) => StorageGroupsColumn[];
