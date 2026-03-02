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
    redundantValues?: string[];
    className?: string;
}

export function ErrorFieldsList({details, redundantValues = [], className}: ErrorFieldsListProps) {
    const {requestUrl, method, errorCode, traceId, requestId, proxyName, workerName, responseBody} =
        details;

    const urlLine = formatUrlLine(method, requestUrl);
    const isBodyRedundant = !responseBody || redundantValues.some((v) => v === responseBody);

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
                <DefinitionList.Item name="Trace-ID" copyText={traceId}>
                    {traceId}
                </DefinitionList.Item>
            )}
            {requestId && (
                <DefinitionList.Item name="Request-ID" copyText={requestId}>
                    {requestId}
                </DefinitionList.Item>
            )}
            {proxyName && (
                <DefinitionList.Item name="x-proxy-name" copyText={proxyName}>
                    {proxyName}
                </DefinitionList.Item>
            )}
            {workerName && (
                <DefinitionList.Item name="x-worker-name" copyText={workerName}>
                    {workerName}
                </DefinitionList.Item>
            )}
            {responseBody && !isBodyRedundant && (
                <DefinitionList.Item
                    name={i18n('error-details.label_response-body')}
                    copyText={responseBody}
                >
                    {responseBody}
                </DefinitionList.Item>
            )}
        </DefinitionList>
    );
}

export function hasVisibleFields(details: ErrorDetails, redundantValues: string[] = []): boolean {
    const {requestUrl, errorCode, traceId, requestId, proxyName, workerName, responseBody} =
        details;
    const isBodyRedundant = !responseBody || redundantValues.some((v) => v === responseBody);

    return Boolean(
        requestUrl ||
            errorCode ||
            traceId ||
            requestId ||
            proxyName ||
            workerName ||
            (responseBody && !isBodyRedundant),
    );
}
