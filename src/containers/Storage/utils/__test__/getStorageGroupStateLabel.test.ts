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
});
