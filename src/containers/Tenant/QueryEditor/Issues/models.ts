export interface IssueType {
    file?: string;
    position?: {row: number; column: number};
    // eslint-disable-next-line camelcase
    end_position?: {row: number; column: number};
    message?: string;
    code?: number;
    severity?: number;
    issues?: IssueType[];
}

export const SEVERITY_LIST = ['S_FATAL', 'S_ERROR', 'S_WARNING', 'S_INFO'] as const;

export type SEVERITY = typeof SEVERITY_LIST[number];

// Severity values from ydb/library/yql/public/issue/protos/issue_severity.proto
// FATAL = 0;
// ERROR = 1;
// WARNING = 2;
// INFO = 3;
export function isSeverity(value: number | undefined) {
    return value ? SEVERITY_LIST[value] !== undefined : false;
}

export function getSeverity(value: number | undefined) {
    return isSeverity(value) ? SEVERITY_LIST[value!] : 'S_INFO';
}
