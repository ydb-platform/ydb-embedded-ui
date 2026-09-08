import {nodePageTabSchema} from './NodePages';

describe('nodePageTabSchema', () => {
    test('maps legacy structure links to storage', () => {
        expect(nodePageTabSchema.parse('structure')).toBe('storage');
    });

    test.each(['storage', 'tablets', 'threads', 'network', 'configs'])(
        'preserves the %s tab',
        (tab) => {
            expect(nodePageTabSchema.parse(tab)).toBe(tab);
        },
    );

    test.each([undefined, null, '', 'unknown', ['structure']])(
        'falls back to tablets for invalid tab %j',
        (tab) => {
            expect(nodePageTabSchema.parse(tab)).toBe('tablets');
        },
    );
});
