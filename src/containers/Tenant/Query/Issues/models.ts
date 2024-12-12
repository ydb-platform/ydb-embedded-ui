const SEVERITY_LIST = ['S_FATAL', 'S_ERROR', 'S_WARNING', 'S_INFO'] as const;

export type SEVERITY = (typeof SEVERITY_LIST)[number];

// Severity values from ydb/library/yql/public/issue/protos/issue_severity.proto
// FATAL = 0;
// ERROR = 1;
// WARNING = 2;
// INFO = 3;
function isSeverity(value: number | undefined) {
    return value ? SEVERITY_LIST[value] !== undefined : false;
}

export function getSeverity(value: number | undefined) {
    return isSeverity(value) ? SEVERITY_LIST[value!] : 'S_INFO';
}
