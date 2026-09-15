import React from 'react';

import {fireEvent, render, screen} from '@testing-library/react';

import {
    TableKeyboardNavigationScope,
    useTableSearch,
} from '../../TableKeyboardNavigation/TableKeyboardNavigation';
import {KeyboardNavigation} from '../KeyboardNavigation';
import {TableRow} from '../TableRow';
import type {Column} from '../types';

beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
        new DOMRect(0, 0, 100, 20),
    ] as unknown as DOMRectList);
});

afterEach(() => jest.restoreAllMocks());

test('arrows update selection without rendering controls or cells, and data updates still render', () => {
    const renderCell = jest.fn(({row}: {row: {name: string}}) => <a href="#node">{row.name}</a>);
    const Controls = jest.fn(() => {
        const ref = React.useRef<HTMLInputElement>(null);
        useTableSearch(ref, true);
        return <input ref={ref} aria-label="Search nodes" />;
    });
    const columns: Column<{name: string}>[] = [{name: 'Host', align: 'left', render: renderCell}];
    const rows = [{name: 'first'}, {name: 'second'}];

    function Table({data = rows}: {data?: typeof rows}) {
        const tableRef = React.useRef<HTMLDivElement>(null);
        const scrollContainerRef = React.useRef<HTMLDivElement>(null);
        return (
            <TableKeyboardNavigationScope>
                <div ref={scrollContainerRef}>
                    <KeyboardNavigation
                        tableRef={tableRef}
                        scrollContainerRef={scrollContainerRef}
                        rowCount={data.length}
                        rowHeight={0}
                    >
                        <Controls />
                        <table>
                            <thead />
                            <tbody>
                                {data.map((row, index) => (
                                    <TableRow
                                        key={index}
                                        row={row}
                                        rowIndex={index}
                                        columns={columns}
                                        height={0}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </KeyboardNavigation>
                </div>
            </TableKeyboardNavigationScope>
        );
    }

    const {rerender} = render(<Table />);
    const input = screen.getByRole('textbox');
    expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    Controls.mockClear();
    renderCell.mockClear();

    for (let iteration = 0; iteration < 20; iteration++) {
        fireEvent.keyDown(input, {key: 'ArrowDown'});
        expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('second');
        fireEvent.keyDown(input, {key: 'ArrowUp'});
        expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('first');
    }
    expect(Controls).not.toHaveBeenCalled();
    expect(renderCell).not.toHaveBeenCalled();

    rerender(<Table data={[{name: 'updated'}, rows[1]]} />);
    expect(screen.getByRole('link', {name: 'updated'})).toBeVisible();
    expect(renderCell).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('updated');
});

function NavigationFixture({withSearch}: {withSearch: boolean}) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const tableRef = React.useRef<HTMLDivElement>(null);
    useTableSearch(inputRef, withSearch);
    return (
        <KeyboardNavigation
            tableRef={tableRef}
            scrollContainerRef={tableRef}
            rowCount={2}
            rowHeight={0}
        >
            <input ref={inputRef} aria-label="Filter" />
            <table>
                <tbody>
                    {[0, 1].map((index) => (
                        <TableRow
                            key={index}
                            row={index}
                            rowIndex={index}
                            height={0}
                            columns={[{name: 'ID', align: 'left', render: ({row}) => row}]}
                        />
                    ))}
                </tbody>
            </table>
        </KeyboardNavigation>
    );
}

test.each([
    {enabled: true, withSearch: false},
    {enabled: false, withSearch: true},
])('leaves keys native when navigation is unavailable: %j', ({enabled, withSearch}) => {
    render(
        <TableKeyboardNavigationScope enabled={enabled}>
            <NavigationFixture withSearch={withSearch} />
        </TableKeyboardNavigationScope>,
    );
    for (const key of ['ArrowDown', 'ArrowUp', 'Enter']) {
        const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
        fireEvent(screen.getByRole('textbox', {name: 'Filter'}), event);
        expect(event.defaultPrevented).toBe(false);
        expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    }
});
