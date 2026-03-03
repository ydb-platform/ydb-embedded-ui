import {ArrowToggle, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import type {ErrorDetails as ErrorDetailsData} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';
import {ErrorFieldsList, hasVisibleFields} from '../shared/ErrorFieldsList';
import {IssuesSection} from '../shared/IssuesSection';

const b = cn('response-error');

interface ErrorDetailsProps {
    details: ErrorDetailsData;
}

export function ErrorDetailsContent({details}: ErrorDetailsProps) {
    const {responseBody, title, dataMessage, hasIssues, issues} = details;
    const issueCount = issues?.length ?? 0;
    const hasIssueData = Boolean(hasIssues && issues && issueCount > 0);

    const redundantValues = [title, dataMessage].filter(Boolean) as string[];
    const hasFields = hasVisibleFields(details, redundantValues);

    const isBodyRedundant =
        Boolean(responseBody) && redundantValues.some((v) => v === responseBody);
    const visibleResponseBody =
        responseBody && !hasIssueData && !isBodyRedundant ? responseBody : undefined;

    if (!hasFields && !hasIssueData && !visibleResponseBody) {
        return null;
    }

    return (
        <Flex direction="column" gap={2} className={b('details')}>
            {hasFields && (
                <ErrorFieldsList
                    details={details}
                    redundantValues={redundantValues}
                    className={b('fields')}
                />
            )}
            {visibleResponseBody && <ResponseBodySection body={visibleResponseBody} />}
            {hasIssueData && issues && (
                <IssuesSection
                    issues={issues}
                    triggerClassName={b('details-trigger')}
                    disclosureClassName={b('issues')}
                />
            )}
        </Flex>
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
