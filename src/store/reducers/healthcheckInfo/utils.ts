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
// covering ring/board/state-storage issues alongside regular disk issues.
// 'BOARD_' (with underscore) is intentionally narrow to match only BOARD_RING /
// BOARD_NODE and avoid silently capturing any unrelated future BOARD* types.
const STORAGE_TAB_PREFIXES = ['SCHEME_BOARD', 'BOARD_', 'STATE_STORAGE'];

// Root issue types that should be included in the breadcrumb chain.
// For these roots, the leaf preserves a parent link to the root so that the
// breadcrumb shows e.g. "Scheme board ring / Scheme board node",
// similar to how disk issues show "Storage / Storage pool / ... / PDisk".
const RING_ROOT_TYPES = new Set(['SCHEME_BOARD_RING', 'BOARD_RING', 'STATE_STORAGE_RING']);

export function isStorageRelatedType(type?: string): boolean {
    if (!type) {
        return false;
    }
    if (type.startsWith('STORAGE')) {
        return true;
    }
    return STORAGE_TAB_PREFIXES.some((prefix) => type.startsWith(prefix));
}

export function isComputeRelatedType(type?: string): boolean {
    return Boolean(type?.startsWith('COMPUTE'));
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

    // Include the root in the parent chain for ring-style roots so that the
    // breadcrumb shows e.g. "Scheme board ring / Scheme board node".
    const includeRootInChain = RING_ROOT_TYPES.has(root.type ?? '');

    for (const issueId of root.reason) {
        const directChild: IssuesTree | undefined = issues.find((issue) => issue.id === issueId);
        if (!directChild) {
            continue;
        }

        const directChildType = getTypeForUI(directChild.type);

        const initialNode: IssuesTree = includeRootInChain
            ? extendIssue(directChild, directChildType, {
                  parent: extendIssue(root, getTypeForUI(root.type)),
              })
            : directChild;
        const stack: IssuesTree[] = [initialNode];

        while (stack.length > 0) {
            const currentNode = stack.pop()!;

            if (!currentNode.reason || currentNode.reason.length === 0) {
                result.push(extendIssue(currentNode, directChildType));
                continue;
            }

            for (const reason of currentNode.reason) {
                const child: IssuesTree | undefined = issues.find((issue) => issue.id === reason);
                if (!child) {
                    continue;
                }
                stack.push(extendIssue(child, directChildType, {parent: currentNode}));
            }
        }
    }

    return result;
}
