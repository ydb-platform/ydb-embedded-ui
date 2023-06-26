import type {ValueOf} from '../../../types/common';

import {StorageTypes, VisibleEntities} from './constants';

export type VisibleEntity = ValueOf<typeof VisibleEntities>;
export type StorageType = ValueOf<typeof StorageTypes>;
