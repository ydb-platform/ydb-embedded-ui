import {formatUsage, getNbsStorage} from './getData';

test.each([undefined, NaN, Infinity, -0.1])('missing or invalid usage %s is unknown', (value) => {
    expect(formatUsage(value)).toBeUndefined();
});

test('zero and overfull usage remain distinct from missing monitoring', () => {
    expect(formatUsage(0)).toBe('0.0%');
    expect(formatUsage(1.2)).toBe('120.0%');
});

test('page totals and large tablet identifiers are preserved', async () => {
    const originalApi = window.api;
    const get = jest.fn().mockResolvedValue({
        Status: {Code: 'OK'},
        TotalCount: 200,
        Tablets: [{TabletId: '18446744073709551615', DiskUsage: 0}],
    });
    Object.defineProperty(window, 'api', {
        value: {storage: {getNbsStorage: get}},
        writable: true,
        configurable: true,
    });
    const signal = new AbortController().signal;
    const result = await getNbsStorage({
        limit: 10,
        offset: 20,
        columnsIds: [],
        signal,
        filters: {
            disks: false,
            group_by: 'disk_usage',
            filter_group: '0',
            sort_by: 'disk_usage',
            sort_desc: true,
        },
    });
    expect(result).toEqual({
        data: [{TabletId: '18446744073709551615', DiskUsage: 0}],
        found: 200,
        total: 200,
    });
    expect(get).toHaveBeenCalledWith(
        'tablets',
        expect.objectContaining({offset: 20, limit: 10, filter_group: '0'}),
        {signal},
    );
    window.api = originalApi;
});
