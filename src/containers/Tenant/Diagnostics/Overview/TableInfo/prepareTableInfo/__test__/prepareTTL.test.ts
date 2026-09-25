import {prepareTTL} from '../prepareTTL';

describe('prepareTTL', () => {
    test('shows every eviction and deletion tier instead of the legacy expiry', () => {
        const ttl = {
            Enabled: {
                ColumnName: 'created_at',
                ExpireAfterSeconds: 60,
                Tiers: [
                    {ApplyAfterSeconds: 3600, EvictToExternalStorage: {Storage: '/local/warm'}},
                    {ApplyAfterSeconds: 86400, EvictToExternalStorage: {Storage: '/local/cold'}},
                    {ApplyAfterSeconds: 604800, Delete: {}},
                ],
            },
        };

        expect(prepareTTL(ttl)?.content).toBe(
            "column: 'created_at', evict to: '/local/warm', after: 1\u00a0h; evict to: '/local/cold', after: 1\u00a0d; delete after: 7\u00a0d",
        );
    });

    test('shows eviction-only TTL with a zero delay', () => {
        const ttl = {
            Enabled: {
                ColumnName: 'created_at',
                Tiers: [{ApplyAfterSeconds: 0, EvictToExternalStorage: {Storage: '/local/cold'}}],
            },
        };

        expect(prepareTTL(ttl)?.content).toBe(
            "column: 'created_at', evict to: '/local/cold', after: 0\u00a0ms",
        );
    });

    test.each([undefined, []])('preserves legacy TTL when tiers are %p', (Tiers) => {
        const ttl = {Enabled: {ColumnName: 'created_at', ExpireAfterSeconds: 0, Tiers}};

        expect(prepareTTL(ttl)?.content).toBe("column: 'created_at', expire after: 0\u00a0ms");
    });

    test('shows a delete-only tier with a zero delay', () => {
        const ttl = {
            Enabled: {
                ColumnName: 'created_at',
                Tiers: [{ApplyAfterSeconds: 0, Delete: {}}],
            },
        };

        expect(prepareTTL(ttl)?.content).toBe("column: 'created_at', delete after: 0\u00a0ms");
    });

    test.each([undefined, ''])('shows a placeholder for a missing storage name %p', (Storage) => {
        const ttl = {
            Enabled: {
                ColumnName: 'created_at',
                Tiers: [{ApplyAfterSeconds: 3600, EvictToExternalStorage: {Storage}}],
            },
        };

        expect(prepareTTL(ttl)?.content).toBe(
            "column: 'created_at', evict to: '—', after: 1\u00a0h",
        );
    });

    test('ignores unknown tier actions without presenting legacy expiry as active', () => {
        const ttl = {
            Enabled: {
                ColumnName: 'created_at',
                ExpireAfterSeconds: 60,
                Tiers: [{ApplyAfterSeconds: 3600}],
            },
        };

        expect(prepareTTL(ttl)).toBeUndefined();
    });

    test.each([undefined, -1, NaN, Infinity])('ignores an invalid tier delay %p', (delay) => {
        const ttl = {
            Enabled: {
                ColumnName: 'created_at',
                Tiers: [
                    {ApplyAfterSeconds: delay, Delete: {}},
                    {ApplyAfterSeconds: 3600, EvictToExternalStorage: {Storage: '/local/cold'}},
                ],
            },
        };

        expect(prepareTTL(ttl)?.content).toBe(
            "column: 'created_at', evict to: '/local/cold', after: 1\u00a0h",
        );
    });

    test.each([{}, {Disabled: {}}, {Enabled: {}}, {Enabled: {ColumnName: ''}}])(
        'omits unconfigured TTL %p',
        (ttl) => {
            expect(prepareTTL(ttl)).toBeUndefined();
        },
    );
});
