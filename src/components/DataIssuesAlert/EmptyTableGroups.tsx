import type {DataIssueKind} from '../../utils/dataIssues/classify';

import {DataIssuesAlert} from './DataIssuesAlert';
import i18n from './i18n';

interface EmptyTableGroupsProps {
    issues: DataIssueKind[];
    problems?: string[];
    /** Rows may be missing because of the issues, so there may be groups that are not listed */
    rowsMayBeMissing: boolean;
    /** What to say when there really are no groups */
    emptyMessage: string;
}

/** Takes the place of the groups of a table when there are none to show */
export function EmptyTableGroups({
    issues,
    problems,
    rowsMayBeMissing,
    emptyMessage,
}: EmptyTableGroupsProps) {
    if (issues.includes('group-not-applied')) {
        // The rows came back without groups: the reason is all there is to show
        return <DataIssuesAlert issues={issues} problems={problems} />;
    }

    return rowsMayBeMissing ? i18n('context_empty-with-issues') : emptyMessage;
}
