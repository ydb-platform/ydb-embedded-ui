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
 * Newer backends also name an unapplied operation in `Problems`, next to the `Need*` flag.
 * For /viewer/nodes the code is the only signal of a dropped storage group or pool filter.
 */
const NOT_APPLIED_PROBLEMS = new Map<string, DataIssueKind>([
    ['filter-not-applied', 'filter-not-applied'],
    ['sort-not-applied', 'sort-not-applied'],
    ['group-not-applied', 'group-not-applied'],
]);

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

/**
 * The groups of a database are the groups of its storage pools, which the handler takes from
 * the description of the database. Without it the groups of the whole cluster are returned.
 * Newer backends send this code together with `filter-not-applied`.
 */
const STORAGE_GROUPS_DATABASE_FILTER_DROPPED_PROBLEM = 'no-database-info';

export function getStorageGroupsDataIssues(quality?: ResponseDataQuality): DataIssueKind[] {
    if (!quality) {
        return [];
    }

    const issues = new Set<DataIssueKind>();

    for (const problem of quality.problems) {
        const notApplied = NOT_APPLIED_PROBLEMS.get(problem);
        if (notApplied) {
            issues.add(notApplied);
        } else if (problem === STORAGE_GROUPS_DATABASE_FILTER_DROPPED_PROBLEM) {
            issues.add('filter-not-applied');
        } else if (STORAGE_GROUPS_LIST_INCOMPLETE_PROBLEMS.has(problem)) {
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
    /**
     * The handler adds `filter-not-applied` itself when it drops a filter.
     * Older handlers drop the storage filters silently, so it has to be told from other problems.
     */
    reportsDroppedFilters?: boolean;
}

const NODES_DATABASE_UNAVAILABLE_PROBLEMS = new Set([
    'no-database-info',
    'no-shared-database-info',
]);
const NODES_DATABASE_BOARD_PROBLEMS = new Set([
    'no-database-board-info',
    'no-shared-database-board-info',
]);

/**
 * The nodes of a storage group are resolved through the VSlots of BS controller.
 * Only this code tells that they were not received and the group filter was dropped:
 * with other `bsc-*` problems (e.g. no PDisks) the filter is still applied.
 */
const NODES_GROUP_FILTER_DROPPED_PROBLEM = 'bsc-storage-slots-no-data';

/**
 * The storage nodes of a database are the nodes of its storage pools. The handler resolves
 * them through BS controller: the pools, their groups, the VSlots of the groups. When any
 * of the steps fails, the nodes of the whole cluster are returned.
 */
const NODES_DATABASE_FILTER_DROPPED_PROBLEMS = new Set([
    'bsc-storage-pools-no-data',
    'bsc-storage-groups-no-data',
    'bsc-storage-slots-no-data',
]);

function isDatabaseFilterDroppedSilently(
    problem: string,
    {hasDatabase, storageNodes, reportsDroppedFilters}: NodesDataIssuesContext,
) {
    return Boolean(
        storageNodes &&
            hasDatabase &&
            !reportsDroppedFilters &&
            NODES_DATABASE_FILTER_DROPPED_PROBLEMS.has(problem),
    );
}

function getNodesProblemIssue(
    problem: string,
    {hasGroupFilter, hasDatabase, storageNodes}: NodesDataIssuesContext,
): DataIssueKind {
    const notApplied = NOT_APPLIED_PROBLEMS.get(problem);
    if (notApplied) {
        return notApplied;
    }
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
    if (problem === NODES_GROUP_FILTER_DROPPED_PROBLEM && hasGroupFilter) {
        // The group filter is dropped silently, Need* flags stay clean
        return 'filter-not-applied';
    }
    if (problem.startsWith('bsc-')) {
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
        if (isDatabaseFilterDroppedSilently(problem, context)) {
            // Next to what the problem means by itself, as with `filter-not-applied` of newer handlers
            issues.add('filter-not-applied');
        }
        issues.add(getNodesProblemIssue(problem, context));
    }

    addUnappliedOperations(issues, quality);

    return orderIssues(issues);
}

/**
 * What the table shows: storage groups (/storage/groups) or nodes (/viewer/nodes)
 * together with what is known about the request for them.
 */
export type DataIssuesSubject =
    | {type: 'storageGroups'}
    | ({type: 'nodes'} & NodesDataIssuesContext);

export function getDataIssues(
    quality: ResponseDataQuality | undefined,
    subject: DataIssuesSubject,
): DataIssueKind[] {
    return subject.type === 'storageGroups'
        ? getStorageGroupsDataIssues(quality)
        : getNodesDataIssues(quality, subject);
}

/** These issues add rows or change their order, the rows that should be shown are all there */
const DATA_ISSUES_THAT_HIDE_NO_ROWS = new Set<DataIssueKind>([
    'filter-not-applied',
    'sort-not-applied',
    'group-not-applied',
]);

/**
 * Tells whether rows may be missing from the list because of the issues.
 * If so, an empty table does not prove that there is nothing to show.
 */
export function canDataIssuesHideRows(issues: DataIssueKind[]) {
    return issues.some((kind) => !DATA_ISSUES_THAT_HIDE_NO_ROWS.has(kind));
}
