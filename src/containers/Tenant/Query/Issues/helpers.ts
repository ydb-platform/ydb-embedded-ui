import type {ErrorResponse, IssueMessage} from '../../../../types/api/query';
import {isNumeric} from '../../../../utils/utils';

export function hasRootIssues(issues?: IssueMessage[]): issues is IssueMessage[] {
    return Array.isArray(issues) && issues.length > 0;
}

export function normalizeRoots(data: ErrorResponse | string): IssueMessage[] {
    if (typeof data === 'string') {
        return [];
    }

    if (data?.error?.message) {
        return [
            {
                message: data.error.message,
                severity: data.error.severity,
                position: data.error.position,
                end_position: data.error.end_position,
                issue_code: data.error.issue_code,
                issues: Array.isArray(data.issues) ? data.issues : [],
            },
        ];
    }

    return Array.isArray(data.issues) ? data.issues : [];
}

export function getIssuePosition(issue: IssueMessage): string {
    const {position} = issue;
    if (typeof position !== 'object' || position === null || !isNumeric(position.row)) {
        return '';
    }

    const {row, column} = position;

    return isNumeric(column) ? `${row}:${column}` : `line ${row}`;
}

export function getMostSevere(issues?: IssueMessage[] | null) {
    return issues?.reduce((result, issue) => {
        const severity = issue.severity ?? 10;
        return Math.min(result, severity);
    }, 10);
}
