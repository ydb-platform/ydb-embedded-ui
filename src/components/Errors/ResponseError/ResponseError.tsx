import React from 'react';

import {cn} from '../../../utils/cn';
import {extractErrorDetails, prepareCommonErrorMessage} from '../../../utils/errors';
import i18n from '../i18n';

import {ErrorDetailsContent} from './ErrorDetails';

import './ResponseError.scss';

const b = cn('response-error');

interface ResponseErrorProps {
    error?: unknown;
    className?: string;
    defaultMessage?: string;
}

export const ResponseError = ({
    error,
    className,
    defaultMessage = i18n('responseError.defaultMessage'),
}: ResponseErrorProps) => {
    const message = prepareCommonErrorMessage(error, defaultMessage);
    const details = React.useMemo(() => extractErrorDetails(error), [error]);

    return (
        <div className={b(null, className)}>
            {message}
            {details && <ErrorDetailsContent details={details} />}
        </div>
    );
};
