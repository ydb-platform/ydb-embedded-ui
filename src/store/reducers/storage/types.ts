import type {ValueOf} from '../../../types/common';

import {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';

export type VisibleEntities = ValueOf<typeof VISIBLE_ENTITIES>;
export type StorageType = ValueOf<typeof STORAGE_TYPES>;

export interface StorageApiRequestParams {
    tenant?: string;
    nodeId?: string;
    visibleEntities?: VisibleEntities;
}
