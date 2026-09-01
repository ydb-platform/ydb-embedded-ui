import {EFlag} from '../../../types/api/enums';
import type {IssueLog} from '../../../types/api/healthcheck';
import {SelfCheckResult, StatusFlag} from '../../../types/api/healthcheck';
import {uiFactory} from '../../../uiFactory/uiFactory';

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

export function getHealthcheckIssuePileNames(issue: Pick<IssueLog, 'location'>): string[] {
    const rawNames = [
        issue.location?.storage?.pool?.group?.pile?.name,
        issue.location?.compute?.pile?.name,
        issue.location?.compute?.state_storage?.pile?.name,
    ];

    const names = new Set<string>();
    for (const rawName of rawNames) {
        if (rawName?.trim()) {
            names.add(rawName);
        }
    }

    return Array.from(names);
}

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
const STORAGE_TAB_EXACT_TYPES = new Set(['BOARD']);

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
    return (
        STORAGE_TAB_EXACT_TYPES.has(type) ||
        STORAGE_TAB_PREFIXES.some((prefix) => type.startsWith(prefix))
    );
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
    // Pre-index ids by type once so we don't do O(n) lookups per issue.
    const idsByType: Partial<Record<string, string[]>> = {};
    for (const issue of issues) {
        if (!issue.type) {
            continue;
        }
        const bucket = idsByType[issue.type];
        if (bucket) {
            bucket.push(issue.id);
        } else {
            idsByType[issue.type] = [issue.id];
        }
    }

    // Detect whether any summary actually needs patching; if not, return the
    // original array so downstream selectors keep their reference equality.
    const needsLinking = issues.some((issue) => {
        const ringType = issue.type ? STATE_STORAGE_SUMMARY_TO_RING[issue.type] : undefined;
        if (!ringType || (issue.reason && issue.reason.length > 0)) {
            return false;
        }
        const ringIds = idsByType[ringType];
        return Boolean(ringIds && ringIds.length > 0);
    });

    if (!needsLinking) {
        return issues;
    }

    return issues.map((issue) => {
        const ringType = issue.type ? STATE_STORAGE_SUMMARY_TO_RING[issue.type] : undefined;
        if (!ringType || (issue.reason && issue.reason.length > 0)) {
            return issue;
        }
        const ringIds = idsByType[ringType];
        if (!ringIds || ringIds.length === 0) {
            return issue;
        }
        return {...issue, reason: ringIds};
    });
}

function getCategoryForUI(issueType?: string) {
    if (issueType) {
        // Compatibility fallback until HealthCheck links every PILE_* summary to its
        // *_RING children through reason. Once those links are guaranteed, the branch
        // category will come from the direct child after the root and this can be removed.
        const issueTypeVariants = issueType.startsWith('PILE_')
            ? [issueType, issueType.slice('PILE_'.length)]
            : [issueType];

        for (const type of issueTypeVariants) {
            for (const category of uiFactory.healthcheck.issueCategories) {
                if (uiFactory.healthcheck.isIssueTypeOfCategory(type, category)) {
                    return category;
                }
            }
        }
    }

    return 'unknown';
}

function extendIssue(
    issue: IssueLog,
    rootTypeForUI?: string,
    fields?: {parent?: IssuesTree; sourceOrderPath?: number[]},
): IssuesTree {
    return {
        ...issue,
        categoryForUI: rootTypeForUI ?? getCategoryForUI(issue.type),
        ...fields,
    };
}

export function getLeavesFromTree(issues: IssueLog[], root: IssueLog): IssuesTree[] {
    const result: IssuesTree[] = [];
    const rootSourceIndex = issues.findIndex((issue) => issue.id === root.id);
    const rootSourceOrderPath = [rootSourceIndex];

    if (!root.reason || root.reason.length === 0) {
        return [extendIssue(root, undefined, {sourceOrderPath: rootSourceOrderPath})];
    }

    for (const [reasonIndex, issueId] of root.reason.entries()) {
        const directChild: IssueLog | undefined = issues.find((issue) => issue.id === issueId);
        if (!directChild) {
            continue;
        }

        // Tab classification follows the direct child's type so that a
        // generic root (e.g. `DATABASE`, which is `unknown`) doesn't pull
        // storage-related leaves into the Unknown tab.
        const directChildCategory = getCategoryForUI(directChild.type);

        // Include the root in the breadcrumb chain as the parent of the
        // direct child so that every API issue is surfaced — either as a
        // standalone card (when it has no `reason` and is not referenced
        // by any other issue) or as a tab in some leaf's breadcrumb. The
        // leaf (issue without `reason`) is the rightmost tab.
        const rootNode = extendIssue(root, directChildCategory, {
            sourceOrderPath: rootSourceOrderPath,
        });
        const initialNode: IssuesTree = extendIssue(directChild, directChildCategory, {
            parent: rootNode,
            sourceOrderPath: [...rootSourceOrderPath, reasonIndex],
        });
        const stack: IssuesTree[] = [initialNode];

        while (stack.length > 0) {
            const currentNode = stack.pop();
            if (!currentNode) {
                continue;
            }

            if (!currentNode.reason || currentNode.reason.length === 0) {
                result.push(extendIssue(currentNode, directChildCategory));
                continue;
            }

            for (const [childReasonIndex, reason] of currentNode.reason.entries()) {
                const child: IssueLog | undefined = issues.find((issue) => issue.id === reason);
                if (!child) {
                    continue;
                }
                stack.push(
                    extendIssue(child, directChildCategory, {
                        parent: currentNode,
                        sourceOrderPath: [...(currentNode.sourceOrderPath ?? []), childReasonIndex],
                    }),
                );
            }
        }
    }

    return result;
}
