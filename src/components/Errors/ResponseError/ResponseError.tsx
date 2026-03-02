import React from 'react';

import {Alert, Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import {extractErrorDetails, prepareCommonErrorMessage} from '../../../utils/errors';
import type {ErrorDetails} from '../../../utils/errors/extractErrorDetails';
import {getNetworkContext} from '../../../utils/networkInfo';
import {isNetworkError} from '../../../utils/response';
import i18n from '../i18n';

import {ErrorDetailsContent} from './ErrorDetails';

import './ResponseError.scss';

const b = cn('response-error');

interface ResponseErrorProps {
    error?: unknown;
    className?: string;
    defaultMessage?: string;
}

function enrichWithNetworkContext(
    details: ErrorDetails | null,
    error: unknown,
): ErrorDetails | null {
    if (!details || details.status) {
        return details;
    }
    const isNetworkErr = details.errorCode === 'ERR_NETWORK' || isNetworkError(error);
    if (!isNetworkErr) {
        return details;
    }
    const networkCtx = getNetworkContext();
    const extra: Partial<ErrorDetails> = {};
    if (!networkCtx.online) {
        extra.networkOnline = false;
    }
    if (networkCtx.effectiveType && networkCtx.effectiveType !== '4g') {
        extra.networkEffectiveType = networkCtx.effectiveType;
    }
    return Object.keys(extra).length > 0 ? {...details, ...extra} : details;
}

export function useErrorInfo(error: unknown, defaultMessage?: string) {
    const fallback = defaultMessage ?? i18n('responseError.defaultMessage');
    const fallbackMessage = prepareCommonErrorMessage(error, fallback);
    const baseDetails = React.useMemo(() => extractErrorDetails(error), [error]);
    const details = React.useMemo(
        () => enrichWithNetworkContext(baseDetails, error),
        [baseDetails, error],
    );

    const offlineTitle =
        details?.networkOnline === false ? i18n('error-details.network_offline') : undefined;
    const title = offlineTitle || details?.title || fallbackMessage;
    const subtitle =
        details?.dataMessage ||
        (details?.title &&
        fallbackMessage !== details.title &&
        fallbackMessage !== details.statusText
            ? fallbackMessage
            : undefined);
    const showSubtitle = Boolean(subtitle) && subtitle !== title;

    return {title, subtitle, showSubtitle, details};
}

interface ResponseErrorMessageProps {
    subtitle?: string;
    showSubtitle: boolean;
    details?: ErrorDetails | null;
    renderedTitle?: string;
}

export function ResponseErrorMessage({
    subtitle,
    showSubtitle,
    details,
    renderedTitle,
}: ResponseErrorMessageProps) {
    return (
        <Flex direction="column" gap={2}>
            {showSubtitle && (
                <Text variant="body-1" className={b('data-message')}>
                    {subtitle}
                </Text>
            )}
            {details && <ErrorDetailsContent details={details} renderedTitle={renderedTitle} />}
        </Flex>
    );
}

export const ResponseError = ({
    error,
    className,
    defaultMessage = i18n('responseError.defaultMessage'),
}: ResponseErrorProps) => {
    const {title, subtitle, showSubtitle, details} = useErrorInfo(error, defaultMessage);

    return (
        <Alert
            theme="danger"
            title={title}
            message={
                <ResponseErrorMessage
                    subtitle={subtitle}
                    showSubtitle={showSubtitle}
                    details={details}
                    renderedTitle={title}
                />
            }
            className={b(null, className)}
        />
    );
};
