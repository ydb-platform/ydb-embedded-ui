import {getMemorySegments} from '../utils';

const stats = {AllocatedMemory: '200', AllocatorCachesMemory: '600'};

test('keeps informational caches out of the displayed usage breakdown', () => {
    const segments = getMemorySegments(stats, 200, {allocatorCachesIncludedInUsage: false});

    expect(segments.filter(({isInfo}) => !isInfo).map(({key, value}) => ({key, value}))).toEqual([
        {key: 'Other', value: 200},
    ]);
    expect(segments.find(({key}) => key === 'AllocatorCachesMemory')).toMatchObject({
        value: 600,
        isInfo: true,
    });
});

test('preserves cache inclusion for consumers using allocated memory plus caches', () => {
    const segments = getMemorySegments(stats, 800);

    expect(segments.filter(({isInfo}) => !isInfo).map(({key, value}) => ({key, value}))).toEqual([
        {key: 'AllocatorCachesMemory', value: 600},
        {key: 'Other', value: 200},
    ]);
});

test('keeps system and controller limits separate from the usage breakdown', () => {
    const segments = getMemorySegments({HardLimit: '24', SoftLimit: '21'}, 26, {memoryLimit: 32});

    expect(segments.filter(({isInfo}) => isInfo).map(({key, value}) => ({key, value}))).toEqual([
        {key: 'Usage', value: 26},
        {key: 'MemoryLimit', value: 32},
        {key: 'SoftLimit', value: 21},
        {key: 'HardLimit', value: 24},
    ]);
    expect(segments.filter(({isInfo}) => !isInfo)).toMatchObject([{key: 'Other', value: 26}]);
});

test.each([undefined, '', 'invalid', '0', '-1', 'Infinity'])(
    'omits unavailable controller limits: %j',
    (value) => {
        const segments = getMemorySegments({HardLimit: value, SoftLimit: value}, 26, {
            memoryLimit: 32,
        });
        expect(segments.map(({key}) => key)).toEqual(['Other', 'Usage', 'MemoryLimit']);
    },
);
