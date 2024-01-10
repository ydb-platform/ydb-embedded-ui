import cn from 'bem-cn-lite';

import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {isUnavailableNode} from '../../../utils/nodes';

export const b = cn('global-storage-nodes');

export const getRowUnavailableClassName = (row: PreparedStorageNode) =>
    b('node', {unavailable: isUnavailableNode(row)});
