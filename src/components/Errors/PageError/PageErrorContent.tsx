import {ArrowToggle, DefinitionList, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {Issues} from '../../../containers/Tenant/Query/Issues/Issues';
import type {IssueMessage} from '../../../types/api/query';
import {cn} from '../../../utils/cn';
import type {ErrorDetails} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';

const b = cn('ydb-page-error');

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
    message: string;
    dataMessage?: string;
    className?: string;
}

function ErrorFieldsList({details, message, dataMessage, className}: ErrorFieldsListProps) {
    const {requestUrl, method, errorCode, traceId, requestId, proxyName, workerName, responseBody} =
        details;

    const urlLine = formatUrlLine(method, requestUrl);
    const isBodyRedundant =
        responseBody && (responseBody === message || responseBody === dataMessage);

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

interface PageErrorContentProps {
    message: string;
    dataMessage?: string;
    details: ErrorDetails | null;
}

export function PageErrorContent({message, dataMessage, details}: PageErrorContentProps) {
    const isBodyRedundant =
        details?.responseBody &&
        (details.responseBody === message || details.responseBody === dataMessage);
    const hasFields = details
        ? Boolean(
              details.requestUrl ||
                  details.errorCode ||
                  details.traceId ||
                  details.requestId ||
                  details.proxyName ||
                  details.workerName ||
                  (details.responseBody && !isBodyRedundant),
          )
        : false;

    const hasIssueData = details?.hasIssues && details.issues && details.issues.length > 0;
    const showDataMessage = Boolean(dataMessage) && dataMessage !== message;

    return (
        <Flex direction="column" gap={3}>
            <Text variant="body-2">{message}</Text>

            {showDataMessage && (
                <Text variant="body-1" color="secondary">
                    {dataMessage}
                </Text>
            )}

            {hasFields && details && (
                <ErrorFieldsList
                    details={details}
                    message={message}
                    dataMessage={dataMessage}
                    className={b('fields')}
                />
            )}

            {hasIssueData && <IssuesSection issues={details.issues!} />}
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
