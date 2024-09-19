import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';

import type {Column as PaginatedTableColumn} from '../../../components/PaginatedTable';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import type {GetNodeRefFunc} from '../../../types/additionalProps';

export interface GetNodesColumnsProps {
    database?: string;
    getNodeRef?: GetNodeRefFunc;
}

export type NodesColumn = PaginatedTableColumn<NodesPreparedEntity> &
    DataTableColumn<NodesPreparedEntity>;
