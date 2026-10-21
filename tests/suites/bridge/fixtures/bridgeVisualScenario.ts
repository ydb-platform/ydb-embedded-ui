import type {TClusterInfo} from '../../../../src/types/api/cluster';
import {BridgePileState} from '../../../../src/types/api/cluster';
import type {HealthCheckAPIResponse, IssueLog} from '../../../../src/types/api/healthcheck';
import {SelfCheckResult, StatusFlag} from '../../../../src/types/api/healthcheck';

interface PileScenario {
    name: string;
    state: BridgePileState;
    nodes: number;
    healthStatus?: StatusFlag;
}

const pileScenarios: PileScenario[] = [
    {
        name: 'primary-pile',
        state: BridgePileState.PRIMARY,
        nodes: 16,
    },
    {
        name: 'promoted-pile',
        state: BridgePileState.PROMOTED,
        nodes: 12,
        healthStatus: StatusFlag.BLUE,
    },
    {
        name: 'synchronized-pile',
        state: BridgePileState.SYNCHRONIZED,
        nodes: 8,
        healthStatus: StatusFlag.RED,
    },
    {
        name: 'not-synchronized-pile',
        state: BridgePileState.NOT_SYNCHRONIZED,
        nodes: 4,
        healthStatus: StatusFlag.YELLOW,
    },
    {
        name: 'suspended-pile',
        state: BridgePileState.SUSPENDED,
        nodes: 6,
        healthStatus: StatusFlag.ORANGE,
    },
    {
        name: 'disconnected-pile',
        state: BridgePileState.DISCONNECTED,
        nodes: 0,
        healthStatus: StatusFlag.GREY,
    },
];

function makePileIssueBranch({name, healthStatus}: PileScenario, pileIndex: number): IssueLog[] {
    if (!healthStatus) {
        return [];
    }

    const issuePrefix = `${healthStatus}-${name}`;
    const groupIssueId = `${issuePrefix}-group`;
    const pileLocation = {
        storage: {
            pool: {
                name: 'static',
                group: {
                    id: [String(pileIndex + 1)],
                    pile: {name},
                },
            },
        },
    };

    return [
        {
            id: `${issuePrefix}-pool`,
            status: healthStatus,
            message: `Pool has issues in pile ${name}`,
            location: pileLocation,
            reason: [groupIssueId],
            type: 'STORAGE_POOL',
            level: 3,
        },
        {
            id: groupIssueId,
            status: healthStatus,
            message: `Group has issues in pile ${name}`,
            location: pileLocation,
            type: 'STORAGE_GROUP',
            level: 4,
        },
    ];
}

export const bridgeVisualCluster: TClusterInfo = {
    Version: 8,
    Domain: '/Root',
    BridgeInfo: {
        Piles: pileScenarios.map(({name, state, nodes}, index) => ({
            PileId: index + 1,
            Name: name,
            State: state,
            Nodes: nodes,
        })),
    },
};

export const bridgeVisualHealthcheck: HealthCheckAPIResponse = {
    self_check_result: SelfCheckResult.EMERGENCY,
    issue_log: pileScenarios.flatMap(makePileIssueBranch),
    location: {
        id: 3,
        host: 'synchronized-pile-node',
        pile: {name: 'synchronized-pile'},
    },
};
