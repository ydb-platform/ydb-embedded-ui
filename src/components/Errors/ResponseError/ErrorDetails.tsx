import {ArrowToggle, DefinitionList, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {Issues} from '../../../containers/Tenant/Query/Issues/Issues';
import {cn} from '../../../utils/cn';
import type {ErrorDetails as ErrorDetailsData} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';

const b = cn('response-error');

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

function computeDetailsSections(details: ErrorDetailsData) {
    const {requestUrl, method, responseBody, dataMessage, title, hasIssues, issues} = details;

    const urlLine = formatUrlLine(method, requestUrl);
    const hasIssueData = Boolean(hasIssues && issues && issues.length > 0);
    const isBodyRedundant =
        Boolean(responseBody) && (responseBody === dataMessage || responseBody === title);
    const showResponseBody = Boolean(responseBody) && !hasIssueData && !isBodyRedundant;

    return {urlLine, hasIssueData, showResponseBody};
}

export function ErrorDetailsContent({details}: ErrorDetailsProps) {
    const {errorCode, traceId, requestId, proxyName, workerName, responseBody, issues} = details;
    const {urlLine, hasIssueData, showResponseBody} = computeDetailsSections(details);
    const issueCount = issues?.length ?? 0;

    const hasFields = Boolean(
        urlLine || errorCode || traceId || requestId || proxyName || workerName,
    );

    if (!hasFields && !hasIssueData && !showResponseBody) {
        return null;
    }

    return (
        <Flex direction="column" gap={2} className={b('details')}>
            {hasFields && (
                <ErrorFieldsList
                    urlLine={urlLine}
                    errorCode={errorCode}
                    traceId={traceId}
                    requestId={requestId}
                    proxyName={proxyName}
                    workerName={workerName}
                />
            )}
            {showResponseBody && <ResponseBodySection body={responseBody!} />}
            {hasIssueData && issues && <ErrorIssuesSection issues={issues} count={issueCount} />}
        </Flex>
    );
}

interface ErrorFieldsListProps {
    urlLine?: string;
    errorCode?: string;
    traceId?: string;
    requestId?: string;
    proxyName?: string;
    workerName?: string;
}

function ErrorFieldsList({
    urlLine,
    errorCode,
    traceId,
    requestId,
    proxyName,
    workerName,
}: ErrorFieldsListProps) {
    return (
        <DefinitionList nameMaxWidth={130} className={b('fields')}>
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

interface ResponseBodySectionProps {
    body: string;
}

function ResponseBodySection({body}: ResponseBodySectionProps) {
    return (
        <Disclosure className={b('response-body')}>
            <Disclosure.Summary>
                {(props) => (
                    <button {...props} className={b('details-trigger')}>
                        <Flex alignItems="center" gap={1}>
                            <ArrowToggle
                                direction={props.expanded ? 'bottom' : 'right'}
                                size={14}
                            />
                            <Text variant="body-1">
                                {i18n('error-details.label_response-body')}
                            </Text>
                        </Flex>
                    </button>
                )}
            </Disclosure.Summary>
            <Text variant="code-1" className={b('response-body-content')}>
                {body}
            </Text>
        </Disclosure>
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
