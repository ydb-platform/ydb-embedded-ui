import {ArrowToggle, DefinitionList, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {Issues} from '../../../containers/Tenant/Query/Issues/Issues';
import type {IssueMessage} from '../../../types/api/query';
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

    return (
        <Disclosure className={b('details')}>
            <Disclosure.Summary>
                {(props) => (
                    <button {...props} className={b('details-trigger')}>
                        <Flex alignItems="center" gap={1}>
                            <ArrowToggle
                                direction={props.expanded ? 'bottom' : 'right'}
                                size={14}
                            />
                            <Text variant="body-1">{i18n('error-details.summary')}</Text>
                        </Flex>
                    </button>
                )}
            </Disclosure.Summary>
            <div className={b('details-content')}>
                <DefinitionList nameMaxWidth={130}>
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
                        <DefinitionList.Item name="traceresponse" copyText={traceId}>
                            {traceId}
                        </DefinitionList.Item>
                    )}
                    {requestId && (
                        <DefinitionList.Item name="x-request-id" copyText={requestId}>
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
                {hasIssues && issues && issues.length > 0 && (
                    <ErrorIssuesSection issues={issues} count={issueCount} />
                )}
            </div>
        </Disclosure>
    );
}

interface ErrorIssuesSectionProps {
    issues: IssueMessage[];
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
