import type {PreparedStorageNode, VisibleEntities} from '../../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../../types/additionalProps';
import type {Column} from '../../../../utils/tableUtils/types';
import type {StorageViewContext} from '../../types';

export type StorageNodesColumn = Column<PreparedStorageNode>;

export interface StorageNodesColumnsSettings {
    pDiskWidth?: number;
    pDiskContainerWidth?: number;
}

export interface GetStorageNodesColumnsParams {
    additionalNodesProps?: AdditionalNodesProps | undefined;
    visibleEntities?: VisibleEntities;
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}
