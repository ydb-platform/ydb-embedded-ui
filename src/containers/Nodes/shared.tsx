import type {GetRowClassName} from '../../components/PaginatedTable';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {cn} from '../../utils/cn';
import {isUnavailableNode} from '../../utils/nodes';

export const b = cn('ydb-nodes');

export const getRowClassName: GetRowClassName<NodesPreparedEntity> = (row) => {
    return b('node', {unavailable: isUnavailableNode(row)});
};
