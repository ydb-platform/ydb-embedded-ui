import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {
    getHealthcheckIssuePileNames,
    hcStatusToColorFlag,
} from '../../../../store/reducers/healthcheckInfo/utils';
import {EFlag} from '../../../../types/api/enums';
import {StatusFlag} from '../../../../types/api/healthcheck';

export interface BridgePileHealthcheckTarget {
    issueId: string;
    leafIssueId: string;
    view: string;
}

interface BridgePileHealthcheck {
    status: EFlag;
    target?: BridgePileHealthcheckTarget;
}

interface Candidate {
    issue: IssuesTree;
    leaf: IssuesTree;
    level: number;
}

const STATUS_PRIORITY: Record<StatusFlag, number> = {
    [StatusFlag.UNSPECIFIED]: 0,
    [StatusFlag.GREY]: 0,
    [StatusFlag.GREEN]: 1,
    [StatusFlag.BLUE]: 2,
    [StatusFlag.YELLOW]: 3,
    [StatusFlag.ORANGE]: 4,
    [StatusFlag.RED]: 5,
};

function normalizeStatus(status: unknown): StatusFlag {
    return typeof status === 'string' && Object.hasOwn(STATUS_PRIORITY, status)
        ? (status as StatusFlag)
        : StatusFlag.UNSPECIFIED;
}

function getBranch(leaf: IssuesTree): IssuesTree[] {
    const branch: IssuesTree[] = [];
    let current: IssuesTree | undefined = leaf;

    while (current) {
        branch.push(current);
        current = current.parent;
    }

    return branch.reverse();
}

function getBranchCandidate(leaf: IssuesTree, pileName: string): Candidate | undefined {
    const branch = getBranch(leaf);

    for (const [branchIndex, issue] of branch.entries()) {
        if (!getHealthcheckIssuePileNames(issue).includes(pileName)) {
            continue;
        }

        // Backend guarantees increasing levels; add validation here if that can change.
        const level = issue.level ?? branchIndex;
        return {issue, leaf, level};
    }

    return undefined;
}

function compareSourceOrder(left?: number[], right?: number[]): number {
    if (!left) {
        return right ? 1 : 0;
    }
    if (!right) {
        return -1;
    }

    const commonLength = Math.min(left.length, right.length);
    for (let index = 0; index < commonLength; index += 1) {
        if (left[index] !== right[index]) {
            return left[index] - right[index];
        }
    }

    return left.length - right.length;
}

function isWorseCandidate(candidate: Candidate, current: Candidate): boolean {
    const candidatePriority = STATUS_PRIORITY[normalizeStatus(candidate.issue.status)];
    const currentPriority = STATUS_PRIORITY[normalizeStatus(current.issue.status)];

    if (candidatePriority !== currentPriority) {
        return candidatePriority > currentPriority;
    }

    if (candidate.level !== current.level) {
        return candidate.level < current.level;
    }

    const issueOrder = compareSourceOrder(
        candidate.issue.sourceOrderPath,
        current.issue.sourceOrderPath,
    );
    if (issueOrder !== 0) {
        return issueOrder < 0;
    }

    return compareSourceOrder(candidate.leaf.sourceOrderPath, current.leaf.sourceOrderPath) < 0;
}

export function getBridgePileHealthcheck(
    pileName: string | undefined,
    leavesIssues: IssuesTree[],
    healthcheckAvailable: boolean,
): BridgePileHealthcheck {
    if (!healthcheckAvailable || !pileName?.trim()) {
        return {status: EFlag.Grey};
    }

    let selectedCandidate: Candidate | undefined;
    for (const leaf of leavesIssues) {
        const candidate = getBranchCandidate(leaf, pileName);
        if (candidate && (!selectedCandidate || isWorseCandidate(candidate, selectedCandidate))) {
            selectedCandidate = candidate;
        }
    }

    if (!selectedCandidate) {
        return {status: EFlag.Green};
    }

    const issueStatus = normalizeStatus(selectedCandidate.issue.status);
    return {
        status: hcStatusToColorFlag[issueStatus],
        target: {
            issueId: selectedCandidate.issue.id,
            leafIssueId: selectedCandidate.leaf.id,
            view: selectedCandidate.leaf.categoryForUI,
        },
    };
}
