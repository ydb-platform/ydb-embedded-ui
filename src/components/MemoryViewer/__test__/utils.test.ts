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
