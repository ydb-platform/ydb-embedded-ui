import {DefinitionList} from '@gravity-ui/uikit';

import type {ErrorDetails} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';

function formatUrlLine(method?: string, requestUrl?: string): string | undefined {
    if (!requestUrl) {
        return undefined;
    }
    if (method) {
        return `${method} ${requestUrl}`;
    }
    return requestUrl;
}

function formatProxyTargetLine(
    proxyTarget?: string,
    proxyRewrittenPath?: string,
): string | undefined {
    if (proxyTarget && proxyRewrittenPath) {
        const normalizedTarget = proxyTarget.endsWith('/') ? proxyTarget.slice(0, -1) : proxyTarget;

        return `${normalizedTarget}${proxyRewrittenPath}`;
    }

    return proxyTarget || proxyRewrittenPath;
}

function isUniqueMessage(
    message: string | undefined,
    details: ErrorDetails,
    renderedTitle?: string,
): message is string {
    if (!message) {
        return false;
    }
    return (
        message !== details.title && message !== details.dataMessage && message !== renderedTitle
    );
}

interface ErrorFieldsListProps {
    details: ErrorDetails;
    renderedTitle?: string;
    className?: string;
    valueClassName?: string;
}

export function ErrorFieldsList({
    details,
    renderedTitle,
    className,
    valueClassName,
}: ErrorFieldsListProps) {
    const {
        requestUrl,
        method,
        errorCode,
        message,
        traceId,
        requestId,
        proxyTraceId,
        proxyRequestId,
        proxyRewrittenPath,
        proxyTarget,
        proxyName,
        workerName,
        errorPhase,
        networkEffectiveType,
    } = details;

    const urlLine = formatUrlLine(method, requestUrl);
    const proxyTargetLine = formatProxyTargetLine(proxyTarget, proxyRewrittenPath);
    const showMessage = isUniqueMessage(message, details, renderedTitle);

    return (
        <DefinitionList nameMaxWidth={200} className={className}>
            {urlLine && (
                <DefinitionList.Item name={i18n('error-details.label_url')} copyText={urlLine}>
                    <span className={valueClassName}>{urlLine}</span>
                </DefinitionList.Item>
            )}
            {errorCode && (
                <DefinitionList.Item
                    name={i18n('error-details.label_error-code')}
                    copyText={errorCode}
                >
                    <span className={valueClassName}>{errorCode}</span>
                </DefinitionList.Item>
            )}
            {showMessage && (
                <DefinitionList.Item name={i18n('error-details.label_message')} copyText={message}>
                    <span className={valueClassName}>{message}</span>
                </DefinitionList.Item>
            )}
            {errorPhase && (
                <DefinitionList.Item name={i18n('error-details.label_error-phase')}>
                    <span className={valueClassName}>
                        {i18n(`error-details.phase_${errorPhase}`)}
                    </span>
                </DefinitionList.Item>
            )}
            {networkEffectiveType && (
                <DefinitionList.Item name={i18n('error-details.label_network-type')}>
                    <span className={valueClassName}>{networkEffectiveType}</span>
                </DefinitionList.Item>
            )}
            {traceId && (
                <DefinitionList.Item name={i18n('error-details.label_trace-id')} copyText={traceId}>
                    <span className={valueClassName}>{traceId}</span>
                </DefinitionList.Item>
            )}
            {requestId && (
                <DefinitionList.Item
                    name={i18n('error-details.label_request-id')}
                    copyText={requestId}
                >
                    <span className={valueClassName}>{requestId}</span>
                </DefinitionList.Item>
            )}
            {proxyTraceId && (
                <DefinitionList.Item
                    name={i18n('error-details.label_proxy-trace-id')}
                    copyText={proxyTraceId}
                >
                    <span className={valueClassName}>{proxyTraceId}</span>
                </DefinitionList.Item>
            )}
            {proxyRequestId && (
                <DefinitionList.Item
                    name={i18n('error-details.label_proxy-request-id')}
                    copyText={proxyRequestId}
                >
                    <span className={valueClassName}>{proxyRequestId}</span>
                </DefinitionList.Item>
            )}
            {proxyTargetLine && (
                <DefinitionList.Item
                    name={i18n('error-details.label_proxy-target')}
                    copyText={proxyTargetLine}
                >
                    <span className={valueClassName}>{proxyTargetLine}</span>
                </DefinitionList.Item>
            )}
            {proxyName && (
                <DefinitionList.Item
                    name={i18n('error-details.label_proxy-name')}
                    copyText={proxyName}
                >
                    <span className={valueClassName}>{proxyName}</span>
                </DefinitionList.Item>
            )}
            {workerName && (
                <DefinitionList.Item
                    name={i18n('error-details.label_worker-name')}
                    copyText={workerName}
                >
                    <span className={valueClassName}>{workerName}</span>
                </DefinitionList.Item>
            )}
        </DefinitionList>
    );
}

export function hasVisibleFields(details: ErrorDetails, renderedTitle?: string): boolean {
    const {
        requestUrl,
        errorCode,
        traceId,
        requestId,
        proxyTraceId,
        proxyRequestId,
        proxyRewrittenPath,
        proxyTarget,
        proxyName,
        workerName,
        errorPhase,
        networkEffectiveType,
    } = details;
    const proxyTargetLine = formatProxyTargetLine(proxyTarget, proxyRewrittenPath);
    const showMessage = isUniqueMessage(details.message, details, renderedTitle);

    return Boolean(
        requestUrl ||
            errorCode ||
            showMessage ||
            errorPhase ||
            networkEffectiveType ||
            traceId ||
            requestId ||
            proxyTraceId ||
            proxyRequestId ||
            proxyTargetLine ||
            proxyName ||
            workerName,
    );
}
