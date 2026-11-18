import {Alert, Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {DataIssueKind} from '../../utils/dataIssues/classify';

import i18n from './i18n';

import './DataIssuesAlert.scss';

const b = cn('ydb-data-issues-alert');

const DATA_ISSUE_MESSAGES: Record<DataIssueKind, () => string> = {
    'database-unavailable': () => i18n('alert_database-unavailable'),
    'list-incomplete': () => i18n('alert_list-incomplete'),
    'filter-not-applied': () => i18n('alert_filter-not-applied'),
    'sort-not-applied': () => i18n('alert_sort-not-applied'),
    'group-not-applied': () => i18n('alert_group-not-applied'),
    'nodes-status-unreliable': () => i18n('alert_nodes-status-unreliable'),
    'disks-unavailable': () => i18n('alert_disks-unavailable'),
    'partial-data': () => i18n('alert_partial-data'),
};

export const DATA_ISSUES_ALERT_QA = 'data-issues-alert';
export const DATA_ISSUES_ITEM_QA = 'data-issues-item';
export const DATA_ISSUES_CODES_QA = 'data-issues-codes';

export function getEmptyDataWithIssuesMessage() {
    return i18n('context_empty-with-issues');
}

export interface DataIssuesProps {
    /** What to tell the user, see `getStorageGroupsDataIssues` and `getNodesDataIssues` */
    issues: DataIssueKind[];
    /** Raw problem codes of the response, shown as secondary details */
    problems?: string[];
}

export function DataIssuesList({issues, problems = []}: DataIssuesProps) {
    return (
        <Flex direction="column" gap={1}>
            {issues.map((kind) => (
                <div key={kind} data-qa={DATA_ISSUES_ITEM_QA} data-issue={kind}>
                    {DATA_ISSUE_MESSAGES[kind]()}
                </div>
            ))}
            {problems.length > 0 ? (
                <Text
                    variant="caption-2"
                    color="secondary"
                    className={b('codes')}
                    qa={DATA_ISSUES_CODES_QA}
                >
                    {i18n('context_problem-codes', {codes: problems.join(', ')})}
                </Text>
            ) : null}
        </Flex>
    );
}

interface DataIssuesAlertProps extends DataIssuesProps {
    className?: string;
}

/** Warns that the data below is incomplete or was not processed as requested */
export function DataIssuesAlert({issues, problems, className}: DataIssuesAlertProps) {
    if (!issues.length) {
        return null;
    }

    return (
        <Alert
            theme="warning"
            view="filled"
            className={b(null, className)}
            qa={DATA_ISSUES_ALERT_QA}
            message={<DataIssuesList issues={issues} problems={problems} />}
        />
    );
}
