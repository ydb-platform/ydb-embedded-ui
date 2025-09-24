import type {StorageNodesColumnsSettings} from '../../containers/Storage/PaginatedStorageNodesTable/columns/types';
import type {StorageViewContext} from '../../containers/Storage/types';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {GetNodeRefFunc} from '../../types/additionalProps';
import type {Column} from '../../utils/tableUtils/types';

export interface GetNodesColumnsParams {
    getNodeRef?: GetNodeRefFunc;
    database?: string;

    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}

export type NodesColumn = Column<PreparedStorageNode>;
