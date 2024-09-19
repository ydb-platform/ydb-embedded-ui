import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {cn} from '../../../utils/cn';
import {isUnavailableNode} from '../../../utils/nodes';

export const b = cn('ydb-storage-nodes');

export const getRowUnavailableClassName = (row: PreparedStorageNode) =>
    b('node', {unavailable: isUnavailableNode(row)});
