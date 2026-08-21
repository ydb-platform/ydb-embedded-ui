import {sortByTimestampDescending} from '../sortByTimestamp';

test('sorts newest timestamp first and puts undated items last in reverse source order', () => {
    const items = [
        {name: 'legacy-first'},
        {name: 'older', timestamp: 100},
        {name: 'newer', timestamp: 200},
        {name: 'legacy-last'},
    ];

    expect(sortByTimestampDescending(items, (item) => item.timestamp)).toEqual([
        {name: 'newer', timestamp: 200},
        {name: 'older', timestamp: 100},
        {name: 'legacy-last'},
        {name: 'legacy-first'},
    ]);
    expect(items.map(({name}) => name)).toEqual(['legacy-first', 'older', 'newer', 'legacy-last']);
});
