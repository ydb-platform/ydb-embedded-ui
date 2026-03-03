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

interface ErrorFieldsListProps {
    details: ErrorDetails;
    className?: string;
}

export function ErrorFieldsList({details, className}: ErrorFieldsListProps) {
    const {requestUrl, method, errorCode, traceId, requestId, proxyName, workerName} = details;

    const urlLine = formatUrlLine(method, requestUrl);

    return (
        <DefinitionList nameMaxWidth={130} className={className}>
            {urlLine && (
                <DefinitionList.Item name={i18n('error-details.label_url')} copyText={urlLine}>
                    {urlLine}
                </DefinitionList.Item>
            )}
            {errorCode && (
                <DefinitionList.Item
                    name={i18n('error-details.label_error-code')}
                    copyText={errorCode}
                >
                    {errorCode}
                </DefinitionList.Item>
            )}
            {traceId && (
                <DefinitionList.Item name={i18n('error-details.label_trace-id')} copyText={traceId}>
                    {traceId}
                </DefinitionList.Item>
            )}
            {requestId && (
                <DefinitionList.Item
                    name={i18n('error-details.label_request-id')}
                    copyText={requestId}
                >
                    {requestId}
                </DefinitionList.Item>
            )}
            {proxyName && (
                <DefinitionList.Item
                    name={i18n('error-details.label_proxy-name')}
                    copyText={proxyName}
                >
                    {proxyName}
                </DefinitionList.Item>
            )}
            {workerName && (
                <DefinitionList.Item
                    name={i18n('error-details.label_worker-name')}
                    copyText={workerName}
                >
                    {workerName}
                </DefinitionList.Item>
            )}
        </DefinitionList>
    );
}

export function hasVisibleFields(details: ErrorDetails): boolean {
    const {requestUrl, errorCode, traceId, requestId, proxyName, workerName} = details;

    return Boolean(requestUrl || errorCode || traceId || requestId || proxyName || workerName);
}
