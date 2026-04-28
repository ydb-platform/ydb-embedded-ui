import {EFlag} from '../../../types/api/enums';
import type {IssueLog} from '../../../types/api/healthcheck';
import {SelfCheckResult, StatusFlag} from '../../../types/api/healthcheck';

import type {IssuesTree} from './types';

export const hcStatusToColorFlag: Record<StatusFlag, EFlag> = {
    [StatusFlag.UNSPECIFIED]: EFlag.Grey,
    [StatusFlag.GREY]: EFlag.Grey,
    [StatusFlag.GREEN]: EFlag.Green,
    [StatusFlag.BLUE]: EFlag.Blue,
    [StatusFlag.YELLOW]: EFlag.Yellow,
    [StatusFlag.ORANGE]: EFlag.Orange,
    [StatusFlag.RED]: EFlag.Red,
};

export const selfCheckResultToHcStatus: Record<SelfCheckResult, StatusFlag> = {
    [SelfCheckResult.UNSPECIFIED]: StatusFlag.GREY,
    [SelfCheckResult.GOOD]: StatusFlag.GREEN,
    [SelfCheckResult.DEGRADED]: StatusFlag.YELLOW,
    [SelfCheckResult.MAINTENANCE_REQUIRED]: StatusFlag.RED,
    [SelfCheckResult.EMERGENCY]: StatusFlag.RED,
};

// Issue type prefixes that should be routed to the "storage" tab in the UI,
// covering regular disk issues alongside ring/board/state-storage issues.
// 'BOARD_' (with underscore) is intentionally narrow to match only BOARD_RING /
// BOARD_NODE and avoid silently capturing any unrelated future BOARD* types.
const STORAGE_TAB_PREFIXES = [
    'STORAGE',
    'PDISK',
    'VDISK',
    'SCHEME_BOARD',
    'BOARD_',
    'STATE_STORAGE',
];

// Maps a state-storage summary issue type to the corresponding `_RING` type.
// Backend reports the summary (BLUE) and the detailed RING/NODE chain as
// independent trees; we link them so that the UI shows a single chain
// "<summary> / Ring / Node" instead of two unrelated cards.
const STATE_STORAGE_SUMMARY_TO_RING: Record<string, string> = {
    SCHEME_BOARD: 'SCHEME_BOARD_RING',
    BOARD: 'BOARD_RING',
    STATE_STORAGE: 'STATE_STORAGE_RING',
};

export function isStorageRelatedType(type?: string): boolean {
    if (!type) {
        return false;
    }
    return STORAGE_TAB_PREFIXES.some((prefix) => type.startsWith(prefix));
}

export function isComputeRelatedType(type?: string): boolean {
    return Boolean(type?.startsWith('COMPUTE'));
}

/**
 * Links state-storage summary issues (`SCHEME_BOARD`, `BOARD`, `STATE_STORAGE`)
 * to their corresponding `_RING` issues by synthesizing a `reason` array.
 *
 * Backend emits these as parallel trees — the summary as a BLUE root with no
 * reason, and the RING/NODE chain as a separate RED root. After linking, the
 * RING is no longer a root (because the summary references it) and the leaf
 * inherits a breadcrumb chain `<summary> / Ring / Node`, mirroring the
 * existing `Storage / Storage pool / ... / PDisk` rendering.
 */
export function linkStateStorageSummaries(issues: IssueLog[]): IssueLog[] {
    return issues.map((issue) => {
        const ringType = issue.type ? STATE_STORAGE_SUMMARY_TO_RING[issue.type] : undefined;
        if (!ringType || (issue.reason && issue.reason.length > 0)) {
            return issue;
        }
        const ringIds = issues
            .filter((candidate) => candidate.type === ringType)
            .map((candidate) => candidate.id);
        if (ringIds.length === 0) {
            return issue;
        }
        return {...issue, reason: ringIds};
    });
}

function getTypeForUI(type?: string) {
    if (isStorageRelatedType(type) || isComputeRelatedType(type)) {
        return type;
    } else {
        return 'unknown';
    }
}

function extendIssue(
    issue: IssueLog,
    rootTypeForUI?: string,
    fields?: {parent: IssuesTree},
): IssuesTree {
    return {
        ...issue,
        rootTypeForUI: rootTypeForUI ?? getTypeForUI(issue.type),
        ...fields,
    };
}

export function getLeavesFromTree(issues: IssueLog[], root: IssueLog): IssuesTree[] {
    const result: IssuesTree[] = [];

    if (!root.reason || root.reason.length === 0) {
        return [extendIssue(root)];
    }

    for (const issueId of root.reason) {
        const directChild: IssueLog | undefined = issues.find((issue) => issue.id === issueId);
        if (!directChild) {
            continue;
        }

        // Tab classification follows the direct child's type so that a
        // generic root (e.g. `DATABASE`, which is `unknown`) doesn't pull
        // storage-related leaves into the Unknown tab.
        const directChildType = getTypeForUI(directChild.type);

        // Include the root in the breadcrumb chain as the parent of the
        // direct child so that every API issue is surfaced — either as a
        // standalone card (when it has no `reason` and is not referenced
        // by any other issue) or as a tab in some leaf's breadcrumb. The
        // leaf (issue without `reason`) is the rightmost tab.
        const rootNode = extendIssue(root, directChildType);
        const initialNode: IssuesTree = extendIssue(directChild, directChildType, {
            parent: rootNode,
        });
        const stack: IssuesTree[] = [initialNode];

        while (stack.length > 0) {
            const currentNode = stack.pop()!;

            if (!currentNode.reason || currentNode.reason.length === 0) {
                result.push(extendIssue(currentNode, directChildType));
                continue;
            }

            for (const reason of currentNode.reason) {
                const child: IssueLog | undefined = issues.find((issue) => issue.id === reason);
                if (!child) {
                    continue;
                }
                stack.push(extendIssue(child, directChildType, {parent: currentNode}));
            }
        }
    }

    return result;
}
