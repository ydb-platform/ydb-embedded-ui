import type {TStorageGroupStateInfo} from '../../../../types/api/storage';
import {getStorageGroupStateLabel} from '../getStorageGroupStateLabel';

describe('getStorageGroupStateLabel', () => {
    test.each([
        {state: 'ok', title: 'Ok', value: undefined, theme: 'success', dangerHeavy: false},
        {
            state: 'replicating',
            title: 'Replicating',
            value: undefined,
            theme: 'info',
            dangerHeavy: false,
        },
        {
            state: 'starting',
            title: 'Starting',
            value: undefined,
            theme: 'warning',
            dangerHeavy: false,
        },
        {state: 'dead', title: 'Dead', value: undefined, theme: 'danger', dangerHeavy: true},
        {
            state: 'replicating:3',
            title: 'Replicating',
            value: '3',
            theme: 'info',
            dangerHeavy: false,
        },
        {state: 'starting:2', title: 'Starting', value: '2', theme: 'warning', dangerHeavy: false},
        {state: 'degraded:1', title: 'Degraded', value: '1', theme: 'warning', dangerHeavy: false},
        {state: 'degraded:2', title: 'Degraded', value: '2', theme: 'danger', dangerHeavy: false},
        {state: 'dead:3', title: 'Dead', value: '3', theme: 'danger', dangerHeavy: true},
        {
            state: 'replicating:1(2)',
            title: 'Replicating',
            value: '1 (2)',
            theme: 'info',
            dangerHeavy: false,
        },
        {
            state: 'starting:1(3)',
            title: 'Starting',
            value: '1 (3)',
            theme: 'warning',
            dangerHeavy: false,
        },
        {
            state: 'degraded:1(3)',
            title: 'Degraded',
            value: '1 (3)',
            theme: 'warning',
            dangerHeavy: false,
        },
        {
            state: 'degraded:2(3,1)',
            title: 'Degraded',
            value: '2 (3,1)',
            theme: 'danger',
            dangerHeavy: false,
        },
        {
            state: 'dead:3(3,1,1)',
            title: 'Dead',
            value: '3 (3,1,1)',
            theme: 'danger',
            dangerHeavy: true,
        },
    ])('formats $state with its expected appearance', ({state, ...expected}) => {
        expect(getStorageGroupStateLabel(state)).toEqual(expected);
    });

    test.each([
        {state: 'degraded', title: 'Degraded', value: undefined},
        {state: 'degraded:0', title: 'Degraded', value: '0'},
        {state: 'degraded:3', title: 'Degraded', value: '3'},
        {state: 'degraded:10', title: 'Degraded', value: '10'},
        {state: 'degraded:20', title: 'Degraded', value: '20'},
        {state: 'degraded:3(3,1,1)', title: 'Degraded', value: '3 (3,1,1)'},
        {state: 'degraded:unknown', title: 'Degraded', value: 'unknown'},
    ])('keeps $state visibly degraded when the count is unsupported', ({state, ...expected}) => {
        expect(getStorageGroupStateLabel(state)).toEqual({
            ...expected,
            theme: 'warning',
            dangerHeavy: false,
        });
    });

    test.each([undefined, null, '', ' \n\t '])('returns no label for %p', (state) => {
        expect(getStorageGroupStateLabel(state)).toBeUndefined();
    });

    test.each([':()', ':0()', '  :0()  ', ':1(1)'])(
        'returns no label for State without a status: %p',
        (state) => {
            expect(getStorageGroupStateLabel(state)).toBeUndefined();
            expect(getStorageGroupStateLabel(state, {})).toBeUndefined();
            expect(getStorageGroupStateLabel(state, {Status: 'ok'})).toEqual({
                title: 'Ok',
                value: undefined,
                theme: 'success',
                dangerHeavy: false,
            });
        },
    );

    test('normalizes surrounding whitespace and spacing before the details', () => {
        expect(getStorageGroupStateLabel('  degraded: 2  (3, 1)  ')).toEqual({
            title: 'Degraded',
            value: '2 (3, 1)',
            theme: 'danger',
            dangerHeavy: false,
        });
    });

    test('preserves an unknown status and its details with a neutral appearance', () => {
        expect(getStorageGroupStateLabel('future-state:7(2,1)')).toEqual({
            title: 'Future-state',
            value: '7 (2,1)',
            theme: 'normal',
            dangerHeavy: false,
        });
    });

    test.each([
        {state: 'ok', stateInfo: {Status: 'ok'}},
        {state: 'starting:1', stateInfo: {Status: 'starting', Count: {Disks: {Value: 1}}}},
        {state: 'replicating:3', stateInfo: {Status: 'replicating', Count: {Disks: {Value: 3}}}},
        {state: 'degraded:0', stateInfo: {Status: 'degraded', Count: {Disks: {Value: 0}}}},
        {state: 'degraded:1', stateInfo: {Status: 'degraded', Count: {Disks: {Value: 1}}}},
        {state: 'degraded:2', stateInfo: {Status: 'degraded', Count: {Disks: {Value: 2}}}},
        {state: 'dead:3', stateInfo: {Status: 'dead', Count: {Disks: {Value: 3}}}},
        ...[
            {status: 'starting', count: 1, domains: [2]},
            {status: 'replicating', count: 1, domains: [2]},
            {status: 'degraded', count: 1, domains: [3]},
            {status: 'degraded', count: 2, domains: [3, 1]},
            {status: 'dead', count: 2, domains: [2, 2]},
            {status: 'dead', count: 3, domains: [3, 1, 1]},
        ].map(({status, count, domains}) => ({
            state: `${status}:${count}(${domains.join(',')})`,
            stateInfo: {
                Status: status,
                Count: {FailRealms: {Value: count}},
                FailedDomainsPerRealm: domains,
            },
        })),
    ] satisfies {state: string; stateInfo: TStorageGroupStateInfo}[])(
        'renders structured data like $state without depending on the legacy string',
        ({state, stateInfo}) => {
            const expected = getStorageGroupStateLabel(state);
            expect(getStorageGroupStateLabel(undefined, stateInfo)).toEqual(expected);
            expect(getStorageGroupStateLabel('future-format', stateInfo)).toEqual(expected);
        },
    );

    test.each([
        undefined,
        null,
        {},
        {Status: ''},
        {Status: '  '},
        {Status: 1},
        {Status: 'degraded'},
        {Status: 'degraded', Count: {}},
        {Status: 'degraded', Count: {Disks: {}}},
        {Status: 'degraded', Count: {Disks: {Value: 2}, FailRealms: {Value: 2}}},
        ...[-1, 1.5, NaN, Infinity, 2 ** 32, '2', null].map((Value) => ({
            Status: 'degraded',
            Count: {Disks: {Value}},
        })),
        ...[null, '3,1', [3, -1], [NaN]].map((FailedDomainsPerRealm) => ({
            Status: 'degraded',
            Count: {FailRealms: {Value: 2}},
            FailedDomainsPerRealm,
        })),
    ])('falls back to State for unavailable structured data: %j', (stateInfo) => {
        expect(
            getStorageGroupStateLabel('degraded:2(3,1)', stateInfo as TStorageGroupStateInfo),
        ).toEqual({
            title: 'Degraded',
            value: '2 (3,1)',
            theme: 'danger',
            dangerHeavy: false,
        });
    });

    test.each(['future-state:7(2,1)', 'unknown format', '', undefined])(
        'preserves unknown or missing legacy State %p without StateInfo',
        (state) => {
            expect(getStorageGroupStateLabel(state, {})).toEqual(getStorageGroupStateLabel(state));
        },
    );

    test('preserves an unknown structured status with a neutral appearance', () => {
        expect(
            getStorageGroupStateLabel('ok', {
                Status: 'future-state',
                Count: {FailRealms: {Value: 2}},
                FailedDomainsPerRealm: [3, 1],
            }),
        ).toEqual({
            title: 'Future-state',
            value: '2 (3,1)',
            theme: 'normal',
            dangerHeavy: false,
        });
    });
});
