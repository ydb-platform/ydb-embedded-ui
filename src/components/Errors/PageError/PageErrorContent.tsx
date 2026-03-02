import {Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import type {ErrorDetails} from '../../../utils/errors/extractErrorDetails';
import {ErrorFieldsList, hasVisibleFields} from '../shared/ErrorFieldsList';
import {IssuesSection} from '../shared/IssuesSection';

const b = cn('ydb-page-error');

interface PageErrorContentProps {
    message: string;
    dataMessage?: string;
    details: ErrorDetails | null;
}

export function PageErrorContent({message, dataMessage, details}: PageErrorContentProps) {
    const redundantValues = [message, dataMessage].filter(Boolean) as string[];
    const hasFields = details ? hasVisibleFields(details, redundantValues) : false;
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
                    redundantValues={redundantValues}
                    className={b('fields')}
                />
            )}

            {hasIssueData && (
                <IssuesSection issues={details.issues!} triggerClassName={b('details-trigger')} />
            )}
        </Flex>
    );
}
