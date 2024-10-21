import type {PreparedStorageGroup, VisibleEntities} from '../../../../store/reducers/storage/types';
import type {Column} from '../../../../utils/tableUtils/types';
import type {StorageViewContext} from '../../types';

export type StorageGroupsColumn = Column<PreparedStorageGroup>;

export interface GetStorageColumnsData {
    viewContext: StorageViewContext;
}

export interface GetStorageGroupsColumnsParams {
    visibleEntities?: VisibleEntities;
    viewContext: StorageViewContext;
}

export type StorageColumnsGetter = (data?: GetStorageColumnsData) => StorageGroupsColumn[];
