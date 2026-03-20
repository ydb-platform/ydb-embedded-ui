import React from 'react';

import {renderHook} from '@testing-library/react';

import {useSelectedColumns} from '../useSelectedColumns';

// Mock useSetting hook
jest.mock('../useSetting', () => ({
    useSetting: jest.fn(),
}));

const {useSetting} = jest.requireMock('../useSetting');

type TestColumn = {name: string};

describe('useSelectedColumns', () => {
    const columns: TestColumn[] = [
        {name: 'col1'},
        {name: 'col2'},
        {name: 'col3'},
        {name: 'col4'},
        {name: 'col5'},
    ];

    const columnsTitles = {
        col1: 'Column 1',
        col2: 'Column 2',
        col3: 'Column 3',
        col4: 'Column 4',
        col5: 'Column 5',
    };

    const defaultColumnsIds = ['col1', 'col2', 'col3'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('uses columns definition order when no custom order saved (default columns)', () => {
        const setSavedColumns = jest.fn();
        // When savedColumns equals defaultColumnsIds, use columns definition order
        useSetting.mockReturnValue([defaultColumnsIds, setSavedColumns]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToSelect} = result.current;

        // Columns should be in original definition order: col1, col2, col3, col4, col5
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col1', 'col2', 'col3', 'col4', 'col5']);

        // Check selection state from defaultColumnsIds
        expect(columnsToSelect[0].selected).toBe(true); // col1
        expect(columnsToSelect[1].selected).toBe(true); // col2
        expect(columnsToSelect[2].selected).toBe(true); // col3
        expect(columnsToSelect[3].selected).toBe(false); // col4
        expect(columnsToSelect[4].selected).toBe(false); // col5
    });

    test('preserves user custom column order when saved', () => {
        const setSavedColumns = jest.fn();
        // User has customized order: col3, col1, col2, col4, col5
        useSetting.mockReturnValue([
            [
                {id: 'col3', selected: true},
                {id: 'col1', selected: true},
                {id: 'col2', selected: false},
                {id: 'col4', selected: false},
                {id: 'col5', selected: false},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToSelect} = result.current;

        // Columns should preserve user's custom order: col3, col1, col2, col4, col5
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col3', 'col1', 'col2', 'col4', 'col5']);

        // Check selection state
        expect(columnsToSelect[0].selected).toBe(true); // col3
        expect(columnsToSelect[1].selected).toBe(true); // col1
        expect(columnsToSelect[2].selected).toBe(false); // col2
        expect(columnsToSelect[3].selected).toBe(false); // col4
        expect(columnsToSelect[4].selected).toBe(false); // col5
    });

    test('appends new columns to the end when user has custom order', () => {
        const setSavedColumns = jest.fn();
        // User saved order with only col1, col2, col3
        // col4 and col5 are new columns added later
        useSetting.mockReturnValue([
            [
                {id: 'col2', selected: true},
                {id: 'col1', selected: false},
                {id: 'col3', selected: true},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToSelect} = result.current;

        // Should preserve saved order (col2, col1, col3) and append new columns (col4, col5)
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col2', 'col1', 'col3', 'col4', 'col5']);

        // New columns should be unselected by default
        expect(columnsToSelect[3].selected).toBe(false); // col4
        expect(columnsToSelect[4].selected).toBe(false); // col5
    });

    test('required columns are first, then others in saved custom order', () => {
        const setSavedColumns = jest.fn();
        // User has custom order: col2, col4, col1, col3, col5
        useSetting.mockReturnValue([
            [
                {id: 'col2', selected: true},
                {id: 'col4', selected: true},
                {id: 'col1', selected: false},
                {id: 'col3', selected: false},
                {id: 'col5', selected: false},
            ],
            setSavedColumns,
        ]);

        const requiredColumnsIds = ['col3'];

        const {result} = renderHook(() =>
            useSelectedColumns(
                columns,
                'test-key',
                columnsTitles,
                defaultColumnsIds,
                requiredColumnsIds,
            ),
        );

        const {columnsToSelect} = result.current;

        // Required column (col3) should be first, then others in saved custom order
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col3', 'col2', 'col4', 'col1', 'col5']);

        // col3 should be required and selected
        expect(columnsToSelect[0].required).toBe(true);
        expect(columnsToSelect[0].selected).toBe(true);
        expect(columnsToSelect[0].sticky).toBe('start');
    });

    test('multiple required columns preserve order among themselves', () => {
        const setSavedColumns = jest.fn();
        useSetting.mockReturnValue([defaultColumnsIds, setSavedColumns]);

        const requiredColumnsIds = ['col2', 'col4'];

        const {result} = renderHook(() =>
            useSelectedColumns(
                columns,
                'test-key',
                columnsTitles,
                defaultColumnsIds,
                requiredColumnsIds,
            ),
        );

        const {columnsToSelect} = result.current;

        // Required columns (col2, col4) should be first in their original order,
        // then others in original order
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col2', 'col4', 'col1', 'col3', 'col5']);

        // Both should be required
        expect(columnsToSelect[0].required).toBe(true); // col2
        expect(columnsToSelect[1].required).toBe(true); // col4
    });

    test('columnsToShow contains only selected columns in saved order', () => {
        const setSavedColumns = jest.fn();
        // User has custom order: col3, col1, col2 (col3 and col1 selected)
        useSetting.mockReturnValue([
            [
                {id: 'col3', selected: true},
                {id: 'col1', selected: true},
                {id: 'col2', selected: false},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToShow} = result.current;

        // Only selected columns in saved order: col3, col1
        expect(columnsToShow.map((c) => c.name)).toEqual(['col3', 'col1']);
    });

    test('setColumns callback updates saved columns', () => {
        const setSavedColumns = jest.fn();
        useSetting.mockReturnValue([defaultColumnsIds, setSavedColumns]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {setColumns} = result.current;

        const newColumns = [
            {id: 'col1', title: 'Column 1', selected: true},
            {id: 'col2', title: 'Column 2', selected: false},
            {id: 'col3', title: 'Column 3', selected: true},
        ];

        React.act(() => {
            setColumns(newColumns);
        });

        expect(setSavedColumns).toHaveBeenCalledWith([
            {id: 'col1', selected: true},
            {id: 'col2', selected: false},
            {id: 'col3', selected: true},
        ]);
    });

    test('handles legacy string format for saved columns with custom order', () => {
        const setSavedColumns = jest.fn();
        // Legacy format: array of strings (all selected) with custom order: col3, col1
        useSetting.mockReturnValue([['col3', 'col1'], setSavedColumns]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToSelect} = result.current;

        // Should preserve legacy custom order: col3, col1, then append others
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col3', 'col1', 'col2', 'col4', 'col5']);

        // Check selection state
        expect(columnsToSelect[0].selected).toBe(true); // col3
        expect(columnsToSelect[1].selected).toBe(true); // col1
        expect(columnsToSelect[2].selected).toBe(false); // col2
        expect(columnsToSelect[3].selected).toBe(false); // col4
        expect(columnsToSelect[4].selected).toBe(false); // col5
    });

    test('uses default columns when saved columns is not an array', () => {
        const setSavedColumns = jest.fn();
        useSetting.mockReturnValue([null, setSavedColumns]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToSelect} = result.current;

        // Should use defaultColumnsIds
        expect(columnsToSelect[0].selected).toBe(true); // col1
        expect(columnsToSelect[1].selected).toBe(true); // col2
        expect(columnsToSelect[2].selected).toBe(true); // col3
        expect(columnsToSelect[3].selected).toBe(false); // col4
        expect(columnsToSelect[4].selected).toBe(false); // col5
    });

    test('filters out saved columns that no longer exist and preserves order', () => {
        const setSavedColumns = jest.fn();
        // User had custom order with a column that no longer exists
        useSetting.mockReturnValue([
            [
                {id: 'col1', selected: true},
                {id: 'nonexistent', selected: true},
                {id: 'col2', selected: false},
            ],
            setSavedColumns,
        ]);

        const {result} = renderHook(() =>
            useSelectedColumns(columns, 'test-key', columnsTitles, defaultColumnsIds),
        );

        const {columnsToSelect} = result.current;

        // Should preserve saved order (col1, col2) and append new columns (col3, col4, col5)
        // 'nonexistent' is filtered out
        expect(columnsToSelect.map((c) => c.id)).toEqual(['col1', 'col2', 'col3', 'col4', 'col5']);

        // Check selection state
        expect(columnsToSelect[0].selected).toBe(true); // col1
        expect(columnsToSelect[1].selected).toBe(false); // col2
        expect(columnsToSelect[2].selected).toBe(false); // col3 (new)
        expect(columnsToSelect[3].selected).toBe(false); // col4 (new)
        expect(columnsToSelect[4].selected).toBe(false); // col5 (new)
    });
});
