import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as PaginatedTableColumn} from '../../../../components/PaginatedTable';
import type {PreparedStorageGroup} from '../../../../store/reducers/storage/types';
import type {NodesMap} from '../../../../types/store/nodesList';

export type StorageGroupsColumn = PaginatedTableColumn<PreparedStorageGroup> &
    DataTableColumn<PreparedStorageGroup>;

interface GetStorageColumnsData {
    nodes?: NodesMap;
}

export type StorageColumnsGetter = (data?: GetStorageColumnsData) => StorageGroupsColumn[];
