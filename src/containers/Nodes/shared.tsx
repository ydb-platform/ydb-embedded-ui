import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import type {GetRowClassName, RenderErrorMessage} from '../../components/PaginatedTable';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {cn} from '../../utils/cn';
import {isUnavailableNode} from '../../utils/nodes';

export const b = cn('ydb-nodes');

export const getRowClassName: GetRowClassName<NodesPreparedEntity> = (row) => {
    return b('node', {unavailable: isUnavailableNode(row)});
};

export const renderPaginatedTableErrorMessage: RenderErrorMessage = (error) => {
    if (error && error.status === 403) {
        return <AccessDenied position="left" />;
    }

    return <ResponseError error={error} />;
};
