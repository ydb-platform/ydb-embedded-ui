import type {VisibleEntities} from '../../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../../types/additionalProps';
import type {StorageViewContext} from '../../types';

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
