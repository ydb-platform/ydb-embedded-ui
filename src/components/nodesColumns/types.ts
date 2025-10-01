import type {StorageNodesColumnsSettings} from '../../containers/Storage/PaginatedStorageNodesTable/columns/types';
import type {StorageViewContext} from '../../containers/Storage/types';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {Column} from '../../utils/tableUtils/types';

export interface GetNodesColumnsParams {
    database?: string;

    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}

export type NodesColumn = Column<PreparedStorageNode>;
