import {Unauthenticated} from '../components/Errors/401';
import {AccessDenied} from '../components/Errors/403';
import {ResponseError} from '../components/Errors/ResponseError';
import type {RenderErrorMessage} from '../components/PaginatedTable';
import {isRedirectToAuth} from '../utils/response';

export const renderPaginatedTableErrorMessage: RenderErrorMessage = (error) => {
    if (isRedirectToAuth(error)) {
        return null;
    }

    if (error.status === 401) {
        return <Unauthenticated position="left" />;
    }

    if (error.status === 403) {
        return <AccessDenied position="left" />;
    }

    return <ResponseError error={error} />;
};
