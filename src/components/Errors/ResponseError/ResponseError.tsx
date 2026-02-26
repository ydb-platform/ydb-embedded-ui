import {cn} from '../../../utils/cn';
import {prepareCommonErrorMessage} from '../../../utils/errors';
import {extractErrorDetails} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';

import {ErrorDetails} from './ErrorDetails';

import './ResponseError.scss';

const b = cn('ydb-response-error');

interface ResponseErrorProps {
    error?: unknown;
    className?: string;
    defaultMessage?: string;
    withDetails?: boolean;
}

export const ResponseError = ({
    error,
    className,
    defaultMessage = i18n('responseError.defaultMessage'),
    withDetails = true,
}: ResponseErrorProps) => {
    const message = prepareCommonErrorMessage(error, defaultMessage);
    const details = withDetails ? extractErrorDetails(error) : null;

    return (
        <div className={b(null, className)}>
            <div className={b('message')}>{message}</div>
            {details && <ErrorDetails details={details} error={error} />}
        </div>
    );
};
