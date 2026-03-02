import {ArrowToggle, DefinitionList, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {Issues} from '../../../containers/Tenant/Query/Issues/Issues';
import type {IssueMessage} from '../../../types/api/query';
import {cn} from '../../../utils/cn';
import type {ErrorDetails} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';

const b = cn('ydb-page-error');

function formatStatusLine(status?: number, statusText?: string): string | undefined {
    if (!status) {
        return undefined;
    }
    if (statusText) {
        return `${status} ${statusText}`;
    }
    return String(status);
}

function formatUrlLine(method?: string, requestUrl?: string): string | undefined {
    if (!requestUrl) {
        return undefined;
    }
    if (method) {
        return `${method} ${requestUrl}`;
    }
    return requestUrl;
}

interface PageErrorContentProps {
    message: string;
    details: ErrorDetails | null;
}

export function PageErrorContent({message, details}: PageErrorContentProps) {
    const {
        requestUrl,
        method,
        errorCode,
        traceId,
        requestId,
        proxyName,
        workerName,
        hasIssues,
        issues,
        status,
        statusText,
    } = details ?? {};

    const urlLine = formatUrlLine(method, requestUrl);
    const statusLine = formatStatusLine(status, statusText);

    const hasFields = Boolean(
        statusLine || urlLine || errorCode || traceId || requestId || proxyName || workerName,
    );
    const hasIssueData = hasIssues && issues && issues.length > 0;

    return (
        <Flex direction="column" gap={3}>
            <Text variant="body-1">{message}</Text>

            {hasFields && (
                <DefinitionList nameMaxWidth={130} className={b('fields')}>
                    {statusLine && (
                        <DefinitionList.Item
                            name={i18n('error-details.label_status')}
                            copyText={statusLine}
                        >
                            {statusLine}
                        </DefinitionList.Item>
                    )}
                    {urlLine && (
                        <DefinitionList.Item
                            name={i18n('error-details.label_url')}
                            copyText={urlLine}
                        >
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
                </DefinitionList>
            )}

            {hasIssueData && <IssuesSection issues={issues} />}
        </Flex>
    );
}

interface IssuesSectionProps {
    issues: IssueMessage[];
}

function IssuesSection({issues}: IssuesSectionProps) {
    const issueCount = issues.length;

    return (
        <Disclosure>
            <Disclosure.Summary>
                {(props) => (
                    <button {...props} className={b('details-trigger')}>
                        <Flex alignItems="center" gap={1}>
                            <ArrowToggle
                                direction={props.expanded ? 'bottom' : 'right'}
                                size={14}
                            />
                            <Text variant="body-1">
                                {i18n('error-details.label_issues', {count: issueCount})}
                            </Text>
                        </Flex>
                    </button>
                )}
            </Disclosure.Summary>
            <Issues issues={issues} />
        </Disclosure>
    );
}
