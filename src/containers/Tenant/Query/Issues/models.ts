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

// 'inline': Expands/collapses the full issues tree right below the preview.
// 'modal': Opens the full issues tree in an extra modal on "Show details".
export const ISSUES_VIEW_MODE = {
    INLINE: 'inline',
    MODAL: 'modal',
};

export type IssuesViewMode = (typeof ISSUES_VIEW_MODE)[keyof typeof ISSUES_VIEW_MODE];
