import {ArrowToggle, DefinitionList, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {Issues} from '../../../containers/Tenant/Query/Issues/Issues';
import {cn} from '../../../utils/cn';
import type {ErrorDetails as ErrorDetailsData} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';

const b = cn('response-error');

function formatStatusLine(status: number, statusText?: string): string {
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

interface ErrorDetailsProps {
    details: ErrorDetailsData;
}

export function ErrorDetailsContent({details}: ErrorDetailsProps) {
    const {
        status,
        statusText,
        requestUrl,
        method,
        errorCode,
        traceId,
        requestId,
        proxyName,
        workerName,
        hasIssues,
        issues,
    } = details;

    const urlLine = formatUrlLine(method, requestUrl);
    const statusLine = status ? formatStatusLine(status, statusText) : undefined;
    const issueCount = issues?.length ?? 0;

    const hasFields = Boolean(
        statusLine || urlLine || errorCode || traceId || requestId || proxyName || workerName,
    );
    const hasIssueData = hasIssues && issues && issues.length > 0;

    if (!hasFields && !hasIssueData) {
        return null;
    }

    return (
        <Flex direction="column" gap={2} className={b('details')}>
            {hasFields && (
                <ErrorFieldsList
                    statusLine={statusLine}
                    urlLine={urlLine}
                    errorCode={errorCode}
                    traceId={traceId}
                    requestId={requestId}
                    proxyName={proxyName}
                    workerName={workerName}
                />
            )}
            {hasIssueData && <ErrorIssuesSection issues={issues} count={issueCount} />}
        </Flex>
    );
}

interface ErrorFieldsListProps {
    statusLine?: string;
    urlLine?: string;
    errorCode?: string;
    traceId?: string;
    requestId?: string;
    proxyName?: string;
    workerName?: string;
}

function ErrorFieldsList({
    statusLine,
    urlLine,
    errorCode,
    traceId,
    requestId,
    proxyName,
    workerName,
}: ErrorFieldsListProps) {
    return (
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
        </DefinitionList>
    );
}

interface ErrorIssuesSectionProps {
    issues: NonNullable<ErrorDetailsData['issues']>;
    count: number;
}

function ErrorIssuesSection({issues, count}: ErrorIssuesSectionProps) {
    return (
        <Disclosure className={b('issues')}>
            <Disclosure.Summary>
                {(props) => (
                    <button {...props} className={b('details-trigger')}>
                        <Flex alignItems="center" gap={1}>
                            <ArrowToggle
                                direction={props.expanded ? 'bottom' : 'right'}
                                size={14}
                            />
                            <Text variant="body-1">
                                {i18n('error-details.label_issues', {count})}
                            </Text>
                        </Flex>
                    </button>
                )}
            </Disclosure.Summary>
            <Issues issues={issues} />
        </Disclosure>
    );
}
