import type {VisibleEntities} from '../../../../store/reducers/storage/types';
import type {StorageViewContext} from '../../types';

export interface StorageNodesColumnsSettings {
    pDiskWidth?: number;
    pDiskContainerWidth?: number;
}

export interface GetStorageNodesColumnsParams {
    visibleEntities?: VisibleEntities;
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;

    highlightedDisk?: string;
    setHighlightedDisk?: (id: string | undefined) => void;
}
