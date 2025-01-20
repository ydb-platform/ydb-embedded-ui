import React from 'react';

import type {IResponseError} from '../../../../types/api/error';
import {b} from '../../shared';

interface EmptyContentProps {
    error?: IResponseError;
    foundEntities?: number;
    renderErrorMessage?: (error: IResponseError) => React.ReactNode;
    renderEmptyDataMessage?: () => React.ReactNode;
}

export function EmptyContent({
    error,
    foundEntities,
    renderErrorMessage,
    renderEmptyDataMessage,
}: EmptyContentProps) {
    if (error && renderErrorMessage) {
        return (
            <div className={b('error-message')} role="alert">
                {renderErrorMessage(error)}
            </div>
        );
    }
    if (!foundEntities && renderEmptyDataMessage) {
        return <div className={b('empty-message')}>{renderEmptyDataMessage()}</div>;
    }
    return null;
}

EmptyContent.displayName = 'EmptyContent';
