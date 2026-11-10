import type {ResponseDataQuality} from './types';

/**
 * What the user should be told about the data on screen.
 * The order is the display order: the most misleading issues go first.
 */
export const DATA_ISSUE_KINDS = [
    'database-unavailable',
    'list-incomplete',
    'filter-not-applied',
    'sort-not-applied',
    'group-not-applied',
    'nodes-status-unreliable',
    'disks-unavailable',
    'partial-data',
] as const;

export type DataIssueKind = (typeof DATA_ISSUE_KINDS)[number];

function orderIssues(issues: Set<DataIssueKind>): DataIssueKind[] {
    return DATA_ISSUE_KINDS.filter((kind) => issues.has(kind));
}

function addUnappliedOperations(issues: Set<DataIssueKind>, quality: ResponseDataQuality) {
    if (quality.needFilter) {
        issues.add('filter-not-applied');
    }
    if (quality.needSort) {
        issues.add('sort-not-applied');
    }
    if (quality.needGroup) {
        issues.add('group-not-applied');
    }
}

/**
 * /storage/groups builds the list of groups from BS controller data and falls back
 * to whiteboard when the controller does not answer. With these problems
 * some groups may be missing from the list.
 */
const STORAGE_GROUPS_LIST_INCOMPLETE_PROBLEMS = new Set([
    'bsc-error',
    'bsc-timeout',
    'bsc-incomplete',
    'bsc-storage-groups-no-data',
    'wb-incomplete-groups',
]);

export function getStorageGroupsDataIssues(quality?: ResponseDataQuality): DataIssueKind[] {
    if (!quality) {
        return [];
    }

    const issues = new Set<DataIssueKind>();

    for (const problem of quality.problems) {
        if (STORAGE_GROUPS_LIST_INCOMPLETE_PROBLEMS.has(problem)) {
            issues.add('list-incomplete');
        } else {
            // Unknown codes of newer backends also get here
            issues.add('partial-data');
        }
    }

    addUnappliedOperations(issues, quality);

    return orderIssues(issues);
}

export interface NodesDataIssuesContext {
    /** Nodes are requested for a storage group: the handler resolves it through BS controller */
    hasGroupFilter?: boolean;
    /** Nodes are requested for a database: the handler resolves its nodes through Hive */
    hasDatabase?: boolean;
    /** Storage nodes with their disks are shown */
    storageNodes?: boolean;
}

const NODES_DATABASE_UNAVAILABLE_PROBLEMS = new Set([
    'no-database-info',
    'no-shared-database-info',
]);
const NODES_DATABASE_BOARD_PROBLEMS = new Set([
    'no-database-board-info',
    'no-shared-database-board-info',
]);

function getNodesProblemIssue(
    problem: string,
    {hasGroupFilter, hasDatabase, storageNodes}: NodesDataIssuesContext,
): DataIssueKind {
    if (NODES_DATABASE_UNAVAILABLE_PROBLEMS.has(problem)) {
        // The handler clears the list in this case
        return 'database-unavailable';
    }
    if (problem === 'no-nodes-info') {
        return 'list-incomplete';
    }
    if (problem.startsWith('hive-') || NODES_DATABASE_BOARD_PROBLEMS.has(problem)) {
        // Without Hive only the nodes that answered are attributed to the database
        return hasDatabase ? 'list-incomplete' : 'partial-data';
    }
    if (problem === 'wb-incomplete') {
        // The handler marks the nodes that did not answer in time as disconnected
        return 'nodes-status-unreliable';
    }
    if (problem.startsWith('bsc-')) {
        if (hasGroupFilter) {
            // The group filter is dropped silently, Need* flags stay clean
            return 'filter-not-applied';
        }
        return storageNodes ? 'disks-unavailable' : 'partial-data';
    }

    // Unknown codes of newer backends also get here
    return 'partial-data';
}

export function getNodesDataIssues(
    quality?: ResponseDataQuality,
    context: NodesDataIssuesContext = {},
): DataIssueKind[] {
    if (!quality) {
        return [];
    }

    const issues = new Set<DataIssueKind>();

    for (const problem of quality.problems) {
        issues.add(getNodesProblemIssue(problem, context));
    }

    addUnappliedOperations(issues, quality);

    return orderIssues(issues);
}
