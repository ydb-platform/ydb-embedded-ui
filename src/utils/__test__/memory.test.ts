import {getNodeMemory} from '../memory';

describe('getNodeMemory', () => {
    test('uses the process consumption and effective YDB limit instead of host memory', () => {
        expect(
            getNodeMemory({
                MemoryUsed: '21474836480',
                MemoryLimit: '34359738368',
                MemoryStats: {AnonRss: '21474836480', HardLimit: '25769803776'},
            }),
        ).toEqual({memoryUsed: 21474836480, memoryLimit: 25769803776});
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

    test('includes allocator caches when anonymous RSS is unavailable', () => {
        expect(
            getNodeMemory({
                MemoryStats: {AllocatedMemory: '100', AllocatorCachesMemory: '20'},
            }),
        ).toEqual({memoryUsed: 120, memoryLimit: undefined});
    });

    test.each([{AllocatedMemory: '100'}, {AllocatorCachesMemory: '100'}])(
        'uses the available allocator counters: %j',
        (MemoryStats) => {
            expect(getNodeMemory({MemoryStats}).memoryUsed).toBe(100);
        },
    );

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

    test('falls back to the legacy limit for a zero hard limit', () => {
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
        'keeps unknown limits absent: %j',
        (value) => {
            expect(
                getNodeMemory({MemoryLimit: value, MemoryStats: {HardLimit: value}}).memoryLimit,
            ).toBeUndefined();
        },
    );
});
