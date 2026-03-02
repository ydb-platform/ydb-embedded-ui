import {ArrowToggle, Disclosure, Flex, Text} from '@gravity-ui/uikit';

import {Issues} from '../../../containers/Tenant/Query/Issues/Issues';
import type {IssueMessage} from '../../../types/api/query';
import i18n from '../i18n';

interface IssuesSectionProps {
    issues: IssueMessage[];
    triggerClassName?: string;
    disclosureClassName?: string;
}

export function IssuesSection({issues, triggerClassName, disclosureClassName}: IssuesSectionProps) {
    const issueCount = issues.length;

    return (
        <Disclosure className={disclosureClassName}>
            <Disclosure.Summary>
                {(props) => (
                    <button {...props} className={triggerClassName}>
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
