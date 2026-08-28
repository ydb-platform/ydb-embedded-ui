import {act, renderHook} from '@testing-library/react';

import {TabletTypesParam, useTabletQueryParams} from './useTabletQueryParams';

const mockSetQueryParams = jest.fn();
let mockQueryParams: {tabletsSearch?: string | null; tabletTypes?: string[]} = {};

jest.mock('use-query-params', () => {
    const actual = jest.requireActual('use-query-params');

    return {
        ...actual,
        useQueryParams: () => [mockQueryParams, mockSetQueryParams],
    };
});

describe('useTabletQueryParams', () => {
    beforeEach(() => {
        mockQueryParams = {};
        mockSetQueryParams.mockClear();
    });

    test('normalizes missing tablet query parameters', () => {
        const {result} = renderHook(() => useTabletQueryParams());

        expect(result.current.tabletsSearch).toBe('');
        expect(result.current.tabletTypes).toEqual([]);
    });

    test('updates and clears the tablet ID search in the URL', () => {
        const {result} = renderHook(() => useTabletQueryParams());

        act(() => {
            result.current.handleTabletsSearchChange('101');
            result.current.handleTabletsSearchChange('');
        });

        expect(mockSetQueryParams).toHaveBeenNthCalledWith(1, {tabletsSearch: '101'}, 'replaceIn');
        expect(mockSetQueryParams).toHaveBeenNthCalledWith(
            2,
            {tabletsSearch: undefined},
            'replaceIn',
        );
    });

    test('updates and clears tablet types in the URL', () => {
        const {result} = renderHook(() => useTabletQueryParams());

        act(() => {
            result.current.handleTabletTypesChange(['DataShard', 'Hive']);
            result.current.handleTabletTypesChange([]);
        });

        expect(mockSetQueryParams).toHaveBeenNthCalledWith(
            1,
            {tabletTypes: ['DataShard', 'Hive']},
            'replaceIn',
        );
        expect(mockSetQueryParams).toHaveBeenNthCalledWith(
            2,
            {tabletTypes: undefined},
            'replaceIn',
        );
    });
});

describe('TabletTypesParam', () => {
    test('round-trips known and future tablet types as a comma-delimited value', () => {
        const tabletTypes = ['DataShard', 'Future_Shard'];

        expect(TabletTypesParam.encode(tabletTypes)).toBe('DataShard,Future_Shard');
        expect(TabletTypesParam.decode('DataShard,Future_Shard')).toEqual(tabletTypes);
    });

    test('deduplicates tablet types decoded from the URL', () => {
        expect(TabletTypesParam.decode('DataShard,DataShard,Hive')).toEqual(['DataShard', 'Hive']);
    });

    test('falls back to no type filter for malformed URL values', () => {
        expect(TabletTypesParam.decode('DataShard,<script>')).toEqual([]);
        expect(TabletTypesParam.decode(['DataShard', 'Hive'])).toEqual([]);
    });
});
