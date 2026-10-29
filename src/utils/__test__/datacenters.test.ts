import {
    createDatacenterColorIndexes,
    getDatacenterColor,
    getDatacenterColorVariant,
    getDatacenterKey,
    getNodeDatacenterKey,
} from '../datacenters';

describe('datacenter identities', () => {
    test.each([
        [{DataCenter: 'dc-a'}, undefined, 'DC-A'],
        [{DataCenter: 'dc-a', BridgePileName: 'pile-a'}, undefined, 'P=PILE-A/DC-A'],
        [{BridgePileName: 'pile-a'}, undefined, 'P=PILE-A/'],
        [undefined, 'P=pile-a/dc-a', 'P=PILE-A/DC-A'],
        [{DataCenter: '', BridgePileName: 'pile-a'}, 'dc-a', 'P=PILE-A/DC-A'],
        [{BridgePileName: 'pile-a'}, 'P=pile-a/dc-a', 'P=PILE-A/DC-A'],
        [undefined, 'legacy-dc', 'LEGACY-DC'],
        [{}, undefined, undefined],
        [{DataCenter: ''}, '', undefined],
    ])('normalizes location %p with legacy value %p', (location, fallback, expected) => {
        expect(getDatacenterKey(location, fallback)).toBe(expected);
    });

    test('uses the nodes API pile name when structured location has none', () => {
        expect(
            getNodeDatacenterKey({
                PileName: 'pile-a',
                SystemState: {DataCenter: 'dc-a'},
            }),
        ).toBe('P=PILE-A/DC-A');
        expect(
            getNodeDatacenterKey({
                PileName: 'fallback-pile',
                SystemState: {Location: {BridgePileName: 'pile-a', DataCenter: 'dc-a'}},
            }),
        ).toBe('P=PILE-A/DC-A');
    });
});

describe('datacenter indexes', () => {
    test('assigns one-based indexes to sorted distinct names', () => {
        expect(createDatacenterColorIndexes(['dc-b', undefined, 'DC-A', '', 'dc-a'])).toEqual({
            'DC-A': 1,
            'DC-B': 2,
        });
    });

    test('keeps existing indexes when new or missing names arrive', () => {
        const initial = createDatacenterColorIndexes(['DC-C']);
        const extended = createDatacenterColorIndexes(['DC-A'], initial);
        expect(initial).toEqual({'DC-C': 1});
        expect(extended).toEqual({'DC-C': 1, 'DC-A': 2});
        expect(createDatacenterColorIndexes(['dc-a', 'dc-c'], extended)).toEqual(extended);
    });

    test('allocates after the largest configured index without filling gaps', () => {
        const configured = {'DC-PINNED': 7};
        expect(createDatacenterColorIndexes(['DC-A', 'dc-pinned'], configured)).toEqual({
            'DC-PINNED': 7,
            'DC-A': 8,
        });
        expect(configured).toEqual({'DC-PINNED': 7});
    });
});

describe('datacenter palette', () => {
    test.each([
        [1, 'turquoise', 'soft'],
        [10, 'yellow', 'soft'],
        [11, 'turquoise', 'muted'],
        [20, 'yellow', 'muted'],
        [21, 'turquoise', 'outline'],
        [30, 'yellow', 'outline'],
        [31, 'reserve-orange', 'soft'],
        [42, 'reserve-night', 'soft'],
        [43, 'reserve-orange', 'outline'],
        [54, 'reserve-night', 'outline'],
        [55, 'turquoise', 'soft'],
        [108, 'reserve-night', 'outline'],
    ])('maps index %i to %s / %s', (index, color, variant) => {
        const indexes = {'DC-A': index};
        expect(getDatacenterColor('dc-a', indexes)).toBe(color);
        expect(getDatacenterColorVariant('dc-a', indexes)).toBe(variant);
    });

    test.each([0, -1, 1.5, NaN, Infinity])('uses neutral for invalid index %s', (index) => {
        expect(getDatacenterColor('DC-A', {'DC-A': index})).toBe('neutral');
        expect(getDatacenterColorVariant('DC-A', {'DC-A': index})).toBe('soft');
    });

    test('uses neutral for missing names or indexes', () => {
        expect(getDatacenterColor(undefined, {'DC-A': 1})).toBe('neutral');
        expect(getDatacenterColor('', {'DC-A': 1})).toBe('neutral');
        expect(getDatacenterColor('DC-A')).toBe('neutral');
        expect(getDatacenterColor('DC-B', {'DC-A': 1})).toBe('neutral');
    });
});
