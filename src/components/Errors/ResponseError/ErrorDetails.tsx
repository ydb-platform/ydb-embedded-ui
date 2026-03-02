import React from 'react';

import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import type {ErrorDetails as ErrorDetailsData} from '../../../utils/errors/extractErrorDetails';
import i18n from '../i18n';
import {ErrorFieldsList, hasVisibleFields} from '../shared/ErrorFieldsList';
import {IssuesSection} from '../shared/IssuesSection';
import {ResponseBodySection} from '../shared/ResponseBodySection';

import './ErrorDetails.scss';

const b = cn('error-details');

interface ExpandableContent {
    visibleResponseBody?: string;
    hasIssueData: boolean;
}

function getExpandableContent(details: ErrorDetailsData): ExpandableContent {
    const {responseBody, title, dataMessage, hasIssues, issues} = details;
    const issueCount = issues?.length ?? 0;
    const hasIssueData = Boolean(hasIssues && issues && issueCount > 0);

    const redundantValues = [title, dataMessage].filter(Boolean) as string[];
    const isBodyRedundant =
        Boolean(responseBody) && redundantValues.some((v) => v === responseBody);
    const visibleResponseBody =
        responseBody && !hasIssueData && !isBodyRedundant ? responseBody : undefined;

    return {visibleResponseBody, hasIssueData};
}

interface ErrorDetailsProps {
    details: ErrorDetailsData;
    renderedTitle?: string;
}

export function ErrorDetailsContent({details, renderedTitle}: ErrorDetailsProps) {
    const hasFields = hasVisibleFields(details, renderedTitle);
    const {visibleResponseBody, hasIssueData} = getExpandableContent(details);

    const hasExpandableContent = Boolean(visibleResponseBody) || hasIssueData;
    const [expanded, setExpanded] = React.useState(false);

    const handleToggle = React.useCallback(() => {
        setExpanded((prev) => !prev);
    }, []);

    const expandButtonLabel = hasIssueData
        ? i18n('error-details.button_issues')
        : i18n('error-details.button_response');

    if (!hasFields && !hasExpandableContent) {
        return null;
    }

    return (
        <Flex direction="column" gap={2} className={b()}>
            {hasFields && (
                <ErrorFieldsList
                    details={details}
                    renderedTitle={renderedTitle}
                    className={b('fields')}
                    valueClassName={b('field-value')}
                />
            )}
            {hasExpandableContent && (
                <Flex gap={2}>
                    <Button view="outlined" size="m" onClick={handleToggle}>
                        {expandButtonLabel}
                        <Icon data={expanded ? ChevronUp : ChevronDown} size={16} />
                    </Button>
                </Flex>
            )}
            {expanded && visibleResponseBody && <ResponseBodySection body={visibleResponseBody} />}
            {expanded && hasIssueData && details.issues && (
                <IssuesSection
                    issues={details.issues}
                    triggerClassName={b('details-trigger')}
                    disclosureClassName={b('issues')}
                />
            )}
        </Flex>
    );
}
