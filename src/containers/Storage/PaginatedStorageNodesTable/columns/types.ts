import type {VisibleEntities} from '../../../../store/reducers/storage/types';
import type {StorageViewContext} from '../../types';

export interface StorageNodesColumnsSettings {
    pDisksPreviewEnabled?: boolean;
    pDiskWidth?: number;
    pDiskContainerWidth?: number;
}

export interface GetStorageNodesColumnsParams {
    visibleEntities?: VisibleEntities;
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}
