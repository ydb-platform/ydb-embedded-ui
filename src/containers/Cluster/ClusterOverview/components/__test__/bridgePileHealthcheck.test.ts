import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import {
    getHealthcheckIssuePileNames,
    getLeavesFromTree,
} from '../../../../../store/reducers/healthcheckInfo/utils';
import {EFlag} from '../../../../../types/api/enums';
import type {IssueLog, Location} from '../../../../../types/api/healthcheck';
import {StatusFlag} from '../../../../../types/api/healthcheck';
import {getBridgePileHealthcheck} from '../bridgePileHealthcheck';

function makeIssue(
    id: string,
    {
        status,
        level,
        pileName,
        parent,
        categoryForUI = 'storage',
    }: {
        status?: StatusFlag;
        level?: number;
        pileName?: string;
        parent?: IssuesTree;
        categoryForUI?: string;
    } = {},
): IssuesTree {
    return {
        id,
        status,
        level,
        categoryForUI,
        location: pileName
            ? {
                  storage: {
                      pool: {
                          group: {
                              pile: {name: pileName},
                          },
                      },
                  },
              }
            : undefined,
        parent,
    };
}

describe('getBridgePileHealthcheck', () => {
    test('uses the closest pile-scoped issue to the root in every branch', () => {
        const unscopedRoot = makeIssue('unscoped-root', {
            status: StatusFlag.RED,
            level: 1,
        });
        const scopedParent = makeIssue('scoped-parent', {
            status: StatusFlag.YELLOW,
            level: 2,
            pileName: 'himki',
            parent: unscopedRoot,
        });
        const worseScopedLeaf = makeIssue('worse-scoped-leaf', {
            status: StatusFlag.RED,
            level: 3,
            pileName: 'himki',
            parent: scopedParent,
        });

        const scopedRoot = makeIssue('scoped-root', {
            status: StatusFlag.ORANGE,
            level: 1,
            pileName: 'himki',
            categoryForUI: 'compute',
        });
        const unscopedWorseLeaf = makeIssue('unscoped-worse-leaf', {
            status: StatusFlag.RED,
            level: 2,
            parent: scopedRoot,
            categoryForUI: 'compute',
        });

        expect(
            getBridgePileHealthcheck('himki', [worseScopedLeaf, unscopedWorseLeaf], true),
        ).toEqual({
            status: EFlag.Orange,
            target: {
                issueId: 'scoped-root',
                leafIssueId: 'unscoped-worse-leaf',
                view: 'compute',
            },
        });
    });

    test('breaks equal-status ties by lower level', () => {
        const levelTwo = makeIssue('level-two', {
            status: StatusFlag.ORANGE,
            level: 2,
            pileName: 'himki',
        });
        const firstLevelOne = makeIssue('first-level-one', {
            status: StatusFlag.ORANGE,
            level: 1,
            pileName: 'himki',
        });

        expect(getBridgePileHealthcheck('himki', [levelTwo, firstLevelOne], true)).toEqual({
            status: EFlag.Orange,
            target: {
                issueId: 'first-level-one',
                leafIssueId: 'first-level-one',
                view: 'storage',
            },
        });
    });

    test('keeps backend reason order when equal candidates are rendered in another order', () => {
        const pileLocation: Location = {
            storage: {pool: {group: {pile: {name: 'himki'}}}},
        };
        const issues: IssueLog[] = [
            {
                id: 'root',
                type: 'STORAGE',
                reason: ['source-first', 'render-first'],
            },
            {
                id: 'source-first',
                type: 'STORAGE_GROUP',
                status: StatusFlag.ORANGE,
                level: 1,
                location: pileLocation,
                reason: ['source-first-leaf'],
            },
            {
                id: 'source-first-leaf',
                type: 'VDISK',
                status: StatusFlag.GREEN,
                level: 2,
            },
            {
                id: 'render-first',
                type: 'STORAGE_GROUP',
                status: StatusFlag.ORANGE,
                level: 1,
                location: pileLocation,
                reason: ['render-first-leaf'],
            },
            {
                id: 'render-first-leaf',
                type: 'VDISK',
                status: StatusFlag.RED,
                level: 2,
            },
        ];

        const leaves = getLeavesFromTree(issues, issues[0]);
        const sourceFirstLeaf = leaves.find((issue) => issue.id === 'source-first-leaf');
        const renderFirstLeaf = leaves.find((issue) => issue.id === 'render-first-leaf');

        if (!sourceFirstLeaf || !renderFirstLeaf) {
            throw new Error('Expected both healthcheck leaves in the source tree');
        }
        expect(getBridgePileHealthcheck('himki', [renderFirstLeaf, sourceFirstLeaf], true)).toEqual(
            {
                status: EFlag.Orange,
                target: {
                    issueId: 'source-first',
                    leafIssueId: 'source-first-leaf',
                    view: 'storage',
                },
            },
        );
    });

    test('falls back to branch position when issue levels are absent', () => {
        const root = makeIssue('root', {
            status: StatusFlag.YELLOW,
            pileName: 'himki',
        });
        const leaf = makeIssue('leaf', {
            status: StatusFlag.RED,
            pileName: 'himki',
            parent: root,
        });

        expect(getBridgePileHealthcheck('himki', [leaf], true)).toEqual({
            status: EFlag.Yellow,
            target: {
                issueId: 'root',
                leafIssueId: 'leaf',
                view: 'storage',
            },
        });
    });

    test.each([
        [StatusFlag.GREEN, EFlag.Green],
        [StatusFlag.BLUE, EFlag.Blue],
        [StatusFlag.YELLOW, EFlag.Yellow],
        [StatusFlag.ORANGE, EFlag.Orange],
        [StatusFlag.RED, EFlag.Red],
        [StatusFlag.GREY, EFlag.Grey],
        [StatusFlag.UNSPECIFIED, EFlag.Grey],
    ])('preserves %s issue status appearance as %s', (status, expected) => {
        const issue = makeIssue('issue', {status, level: 1, pileName: 'himki'});

        expect(getBridgePileHealthcheck('himki', [issue], true).status).toBe(expected);
    });

    test('returns good for a successful response without pile-scoped issues', () => {
        const otherPileIssue = makeIssue('other-pile', {
            status: StatusFlag.RED,
            level: 1,
            pileName: 'moscow',
        });

        expect(getBridgePileHealthcheck('himki', [otherPileIssue], true)).toEqual({
            status: EFlag.Green,
        });
    });

    test('does not match pile names that differ by surrounding whitespace', () => {
        const issue = makeIssue('issue', {
            status: StatusFlag.RED,
            level: 1,
            pileName: ' himki ',
        });

        expect(getBridgePileHealthcheck('himki', [issue], true)).toEqual({
            status: EFlag.Green,
        });
    });

    test('returns unknown when healthcheck data is unavailable', () => {
        const issue = makeIssue('issue', {
            status: StatusFlag.RED,
            level: 1,
            pileName: 'himki',
        });

        expect(getBridgePileHealthcheck('himki', [issue], false)).toEqual({
            status: EFlag.Grey,
        });
    });

    test('returns unknown when the pile has no name', () => {
        expect(getBridgePileHealthcheck(undefined, [], true)).toEqual({
            status: EFlag.Grey,
        });
    });
});

describe('healthcheck issue pile location', () => {
    test.each<[string, Location, string]>([
        [
            'storage group',
            {storage: {pool: {group: {pile: {name: 'storage-group-pile'}}}}},
            'storage-group-pile',
        ],
        [
            'storage node',
            {storage: {node: {pile: {name: 'storage-node-pile'}}}},
            'storage-node-pile',
        ],
        ['compute', {compute: {pile: {name: 'compute-pile'}}}, 'compute-pile'],
        [
            'state storage',
            {compute: {state_storage: {pile: {name: 'state-storage-pile'}}}},
            'state-storage-pile',
        ],
        [
            'compute node',
            {compute: {node: {pile: {name: 'compute-node-pile'}}}},
            'compute-node-pile',
        ],
        [
            'state storage node',
            {
                compute: {
                    state_storage: {node: {pile: {name: 'state-storage-node-pile'}}},
                },
            },
            'state-storage-node-pile',
        ],
        ['node', {node: {pile: {name: 'node-pile'}}}, 'node-pile'],
        ['peer', {peer: {pile: {name: 'peer-pile'}}}, 'peer-pile'],
    ])('finds a pile on %s location', (_label, location, expectedPileName) => {
        const issue: IssueLog = {id: 'issue', location};

        expect(getHealthcheckIssuePileNames(issue)).toEqual([expectedPileName]);
    });

    test('does not inherit a pile from the parent issue', () => {
        const parent = makeIssue('parent', {pileName: 'himki'});
        const leaf = makeIssue('leaf', {parent});

        expect(getHealthcheckIssuePileNames(leaf)).toEqual([]);
    });

    test('returns every distinct explicit pile name in deterministic order', () => {
        const issue: IssueLog = {
            id: 'issue',
            location: {
                storage: {
                    pool: {group: {pile: {name: 'group-pile'}}},
                    node: {pile: {name: 'node-pile'}},
                },
                compute: {
                    pile: {name: 'compute-pile'},
                    state_storage: {pile: {name: 'group-pile'}},
                },
            },
        };

        expect(getHealthcheckIssuePileNames(issue)).toEqual([
            'group-pile',
            'compute-pile',
            'node-pile',
        ]);
    });
});
