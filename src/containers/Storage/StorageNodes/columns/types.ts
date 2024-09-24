import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as PaginatedTableColumn} from '../../../../components/PaginatedTable';
import type {PreparedStorageNode, VisibleEntities} from '../../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../../types/additionalProps';

export type StorageNodesColumn = PaginatedTableColumn<PreparedStorageNode> &
    DataTableColumn<PreparedStorageNode>;

export interface GetStorageNodesColumnsParams {
    additionalNodesProps: AdditionalNodesProps | undefined;
    visibleEntities?: VisibleEntities;
    database?: string;
    groupId?: string;
}
