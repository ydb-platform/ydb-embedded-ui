import React from 'react';

import {fireEvent, render, screen, waitFor} from '@testing-library/react';

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
    input.focus();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
    expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    Controls.mockClear();
    renderCell.mockClear();

    for (let iteration = 0; iteration < 20; iteration++) {
        fireEvent.keyDown(input, {key: 'ArrowDown'});
        expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('second');
        expect(screen.getByRole('status')).toHaveTextContent('Selected row 2 of 2: second');
        expect(input).toHaveFocus();
        fireEvent.keyDown(input, {key: 'ArrowUp'});
        expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('first');
        expect(screen.getByRole('status')).toHaveTextContent('Selected row 1 of 2: first');
    }
    expect(Controls).not.toHaveBeenCalled();
    expect(renderCell).not.toHaveBeenCalled();

    rerender(<Table data={[{name: 'updated'}, rows[1]]} />);
    expect(screen.getByRole('link', {name: 'updated'})).toBeVisible();
    expect(renderCell).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('updated');
});

function NavigationFixture({
    withSearch,
    showRows = true,
}: {
    withSearch: boolean;
    showRows?: boolean;
}) {
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
                    {(showRows ? [0, 1] : []).map((index) => (
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

test('announces the latest selection after virtual rows mount', async () => {
    const {rerender} = render(
        <TableKeyboardNavigationScope>
            <NavigationFixture withSearch showRows={false} />
        </TableKeyboardNavigationScope>,
    );
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    fireEvent.keyDown(input, {key: 'ArrowUp'});
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(
        <TableKeyboardNavigationScope>
            <NavigationFixture withSearch />
        </TableKeyboardNavigationScope>,
    );

    await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Selected row 1 of 2: 0');
    });
    expect(input).toHaveFocus();
});

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
