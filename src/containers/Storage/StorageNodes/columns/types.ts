import type {Column} from '../../../../components/nodesColumns/types';
import type {PreparedStorageNode, VisibleEntities} from '../../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../../types/additionalProps';
import type {StorageViewContext} from '../../types';

export type StorageNodesColumn = Column<PreparedStorageNode>;

export interface GetStorageNodesColumnsParams {
    additionalNodesProps?: AdditionalNodesProps | undefined;
    visibleEntities?: VisibleEntities;
    database?: string;
    viewContext: StorageViewContext;
}
