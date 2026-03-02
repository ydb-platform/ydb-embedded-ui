import React from 'react';

import {Text} from '@gravity-ui/uikit';

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
    const fallbackMessage = prepareCommonErrorMessage(error, defaultMessage);
    const details = React.useMemo(() => extractErrorDetails(error), [error]);

    const title = details?.title || fallbackMessage;
    const subtitle = details?.dataMessage;
    const showSubtitle = Boolean(subtitle) && subtitle !== title;

    return (
        <div className={b(null, className)}>
            {title}
            {showSubtitle && (
                <Text variant="body-2" color="secondary" className={b('data-message')}>
                    {subtitle}
                </Text>
            )}
            {details && <ErrorDetailsContent details={details} />}
        </div>
    );
};
