import type {QuerySourcePosition} from '../../../../store/reducers/query/types';
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

function offsetPosition(position: IssueMessage['position'], sourcePosition: QuerySourcePosition) {
    if (!position || !isNumeric(position.row)) {
        return position;
    }

    const row = Number(position.row);
    return {
        ...position,
        row: row + sourcePosition.lineNumber - 1,
        column:
            row === 1 && isNumeric(position.column)
                ? Number(position.column) + sourcePosition.column - 1
                : position.column,
    };
}

function offsetIssuePositions(
    issue: IssueMessage,
    sourcePosition: QuerySourcePosition,
): IssueMessage {
    return {
        ...issue,
        position: offsetPosition(issue.position, sourcePosition),
        end_position: offsetPosition(issue.end_position, sourcePosition),
        issues: issue.issues?.map((nestedIssue) =>
            offsetIssuePositions(nestedIssue, sourcePosition),
        ),
    };
}

export function offsetErrorResponsePositions(
    error: ErrorResponse,
    sourcePosition: QuerySourcePosition,
): ErrorResponse {
    return {
        ...error,
        error: error.error ? offsetIssuePositions(error.error, sourcePosition) : undefined,
        issues: error.issues?.map((issue) => offsetIssuePositions(issue, sourcePosition)),
    };
}
