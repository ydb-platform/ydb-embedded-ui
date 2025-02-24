import React from 'react';

import {renderHook} from '@testing-library/react';

import {useTableSort} from '../useTableSort';

describe('useTableSort', function () {
    test('It works with single sort', () => {
        const onSortSpy = jest.fn();
        const {result} = renderHook(() =>
            useTableSort({
                initialSortColumn: 'col1',
                initialSortOrder: 1,
                onSort: onSortSpy,
            }),
        );
        const [sortOrder, handleTableSort] = result.current;
        expect(sortOrder).toStrictEqual([
            {
                columnId: 'col1',
                order: 1,
            },
        ]);

        // Change sort order
        React.act(() =>
            handleTableSort([
                {
                    columnId: 'col1',
                    order: -1,
                },
            ]),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col1',
                order: -1,
            },
        ]);

        // Reset sort order
        React.act(() => handleTableSort(undefined));
        expect(onSortSpy).toHaveBeenLastCalledWith(undefined);

        // Sort another column
        React.act(() =>
            handleTableSort({
                columnId: 'col2',
                order: 1,
            }),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col2',
                order: 1,
            },
        ]);

        // Sort multiple columns
        React.act(() =>
            handleTableSort([
                {
                    columnId: 'col1',
                    order: -1,
                },
                {
                    columnId: 'col2',
                    order: 1,
                },
            ]),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col1',
                order: -1,
            },
        ]);
    });
    test('It works with multiple sort', () => {
        const onSortSpy = jest.fn();
        const {result} = renderHook(() =>
            useTableSort({
                initialSortColumn: 'col1',
                initialSortOrder: 1,
                multiple: true,
                onSort: onSortSpy,
            }),
        );
        const [sortOrder, handleTableSort] = result.current;
        expect(sortOrder).toStrictEqual([
            {
                columnId: 'col1',
                order: 1,
            },
        ]);

        // Change sort order
        React.act(() =>
            handleTableSort([
                {
                    columnId: 'col1',
                    order: -1,
                },
            ]),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col1',
                order: -1,
            },
        ]);

        // Reset sort order
        React.act(() => handleTableSort(undefined));
        expect(onSortSpy).toHaveBeenLastCalledWith(undefined);

        // Sort another column
        React.act(() =>
            handleTableSort({
                columnId: 'col2',
                order: 1,
            }),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col2',
                order: 1,
            },
        ]);

        // Sort multiple columns
        React.act(() =>
            handleTableSort([
                {
                    columnId: 'col1',
                    order: -1,
                },
                {
                    columnId: 'col2',
                    order: 1,
                },
            ]),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col1',
                order: -1,
            },
            {
                columnId: 'col2',
                order: 1,
            },
        ]);
    });
    test('Have the same sort order if sort order is fixed', () => {
        const onSortSpy = jest.fn();
        const {result} = renderHook(() =>
            useTableSort({
                initialSortColumn: 'col1',
                fixedOrderType: -1,
                onSort: onSortSpy,
                multiple: true,
            }),
        );
        const [sortOrder, handleTableSort] = result.current;
        expect(sortOrder).toStrictEqual([
            {
                columnId: 'col1',
                order: -1,
            },
        ]);

        // Change sort order, sort should remain DESC
        React.act(() =>
            handleTableSort([
                {
                    columnId: 'col1',
                    order: 1,
                },
            ]),
        );
        expect(onSortSpy).not.toHaveBeenCalled();

        // Reset sort order, sort should remain DESC
        React.act(() => handleTableSort(undefined));
        expect(onSortSpy).not.toHaveBeenCalled();

        // Sort another column
        React.act(() =>
            handleTableSort({
                columnId: 'col2',
                order: 1,
            }),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col2',
                order: -1,
            },
        ]);

        // Sort multiple columns
        React.act(() =>
            handleTableSort([
                {
                    columnId: 'col1',
                    order: -1,
                },
                {
                    columnId: 'col2',
                    order: 1,
                },
            ]),
        );
        expect(onSortSpy).toHaveBeenLastCalledWith([
            {
                columnId: 'col1',
                order: -1,
            },
            {
                columnId: 'col2',
                order: -1,
            },
        ]);
    });
});
