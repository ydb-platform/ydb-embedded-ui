import {AccessDenied} from '../components/Errors/403';
import {ResponseError} from '../components/Errors/ResponseError';
import type {RenderErrorMessage} from '../components/PaginatedTable';

export const renderPaginatedTableErrorMessage: RenderErrorMessage = (error) => {
    if (error.status === 403) {
        return <AccessDenied position="left" />;
    }

    return <ResponseError error={error} />;
};
