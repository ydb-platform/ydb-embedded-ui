import {getNodeMemory} from '../memory';

describe('getNodeMemory', () => {
    test('uses the system limit even when consumption exceeds the controller hard limit', () => {
        expect(
            getNodeMemory({
                MemoryUsed: '27917287424',
                MemoryLimit: '34359738368',
                MemoryStats: {AnonRss: '27917287424', HardLimit: '25769803776'},
            }),
        ).toEqual({memoryUsed: 27917287424, memoryLimit: 34359738368});
    });

    test('uses the backend sorting value when detailed counters differ', () => {
        expect(
            getNodeMemory({
                MemoryUsed: '200',
                MemoryStats: {AnonRss: '0', AllocatedMemory: '100', AllocatorCachesMemory: '20'},
            }),
        ).toEqual({memoryUsed: 200, memoryLimit: undefined});
    });

    test('does not add allocator caches to the backend sorting value', () => {
        expect(
            getNodeMemory({
                MemoryUsed: '100',
                MemoryStats: {AllocatedMemory: '100', AllocatorCachesMemory: '20'},
            }).memoryUsed,
        ).toBe(100);
    });

    test('preserves a zero backend usage instead of falling back to detailed counters', () => {
        expect(getNodeMemory({MemoryUsed: '0', MemoryStats: {AnonRss: '200'}}).memoryUsed).toBe(0);
    });

    test.each([undefined, '', 'invalid', '-1', 'Infinity'])(
        'uses detailed consumption when backend usage is unavailable: %j',
        (MemoryUsed) => {
            expect(getNodeMemory({MemoryUsed, MemoryStats: {AnonRss: '0'}}).memoryUsed).toBe(0);
        },
    );

    test('falls back to allocated memory without adding allocator caches', () => {
        expect(
            getNodeMemory({
                MemoryStats: {AllocatedMemory: '100', AllocatorCachesMemory: '20'},
            }),
        ).toEqual({memoryUsed: 100, memoryLimit: undefined});
    });

    test('does not treat allocator caches alone as total process usage', () => {
        expect(
            getNodeMemory({MemoryStats: {AllocatorCachesMemory: '100'}}).memoryUsed,
        ).toBeUndefined();
    });

    test.each([undefined, {}, {HardLimit: '250'}])(
        'preserves legacy usage when detailed consumption is absent: %j',
        (MemoryStats) => {
            expect(getNodeMemory({MemoryUsed: '100', MemoryLimit: '250', MemoryStats})).toEqual({
                memoryUsed: 100,
                memoryLimit: 250,
            });
        },
    );

    test.each(['', ' ', 'invalid', '-1', 'Infinity'])('ignores invalid stats: %j', (value) => {
        expect(
            getNodeMemory({
                MemoryUsed: '100',
                MemoryLimit: '250',
                MemoryStats: {
                    AnonRss: value,
                    AllocatedMemory: value,
                    AllocatorCachesMemory: value,
                    HardLimit: value,
                },
            }),
        ).toEqual({memoryUsed: 100, memoryLimit: 250});
    });

    test('keeps the system limit when the controller hard limit is zero', () => {
        expect(getNodeMemory({MemoryLimit: '250', MemoryStats: {HardLimit: '0'}}).memoryLimit).toBe(
            250,
        );
    });

    test.each([undefined, '', 'invalid', '-1', 'Infinity'])(
        'keeps unknown usage absent: %j',
        (value) => {
            expect(getNodeMemory({MemoryUsed: value, MemoryStats: {}}).memoryUsed).toBeUndefined();
        },
    );

    test.each([undefined, '', 'invalid', '0', '-1', 'Infinity'])(
        'does not substitute a controller limit for an unknown system limit: %j',
        (value) => {
            expect(
                getNodeMemory({MemoryLimit: value, MemoryStats: {HardLimit: '250'}}).memoryLimit,
            ).toBeUndefined();
        },
    );
});
