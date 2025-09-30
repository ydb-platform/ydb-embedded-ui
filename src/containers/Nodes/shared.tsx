import type {GetRowClassName} from '../../components/PaginatedTable';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import {cn} from '../../utils/cn';
import {isUnavailableNode} from '../../utils/nodes';

export const b = cn('ydb-nodes');

export const getRowClassName: GetRowClassName<PreparedStorageNode> = (row) => {
    return b('node', {unavailable: isUnavailableNode(row)});
};
