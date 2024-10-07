import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {GetNodeRefFunc} from '../../types/additionalProps';
import type {Column as PaginatedTableColumn} from '../PaginatedTable';

export type Column<T> = PaginatedTableColumn<T> & DataTableColumn<T>;

export interface GetNodesColumnsParams {
    getNodeRef?: GetNodeRefFunc;
    database?: string;
}
