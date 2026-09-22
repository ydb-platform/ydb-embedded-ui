import React from 'react';

import {QueryStatus} from '@reduxjs/toolkit/query';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';

import {
    TableKeyboardNavigationGroupContext,
    TableKeyboardNavigationScope,
    useTableSearch,
} from '../../TableKeyboardNavigation/TableKeyboardNavigation';
import {TableWithControlsLayout} from '../../TableWithControlsLayout/TableWithControlsLayout';
import {KeyboardNavigation} from '../KeyboardNavigation';
import {TableRow} from '../TableRow';
import type {ChunkLookupState} from '../rowLookup';
import {getChunkLookupRevision, isChunkLookupPending} from '../rowLookup';
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
    getRowLabel,
    onActivate,
}: {
    withSearch: boolean;
    showRows?: boolean;
    getRowLabel?: (index: number) => string | undefined;
    onActivate?: (index: number) => void;
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
            getRowLabel={getRowLabel}
            onActivate={onActivate}
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

test('announces the supplied row label instead of cell contents', () => {
    render(
        <TableKeyboardNavigationScope>
            <NavigationFixture withSearch getRowLabel={(index) => `Node ${index}`} />
        </TableKeyboardNavigationScope>,
    );
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(screen.getByRole('status').textContent).toBe('Selected row 2 of 2: Node 1');
    expect(input).toHaveFocus();
});

test('announces the group when selection moves between grouped tables', () => {
    function GroupTable({group}: {group: string}) {
        const tableRef = React.useRef<HTMLDivElement>(null);
        const rows = [`${group}-0`, `${group}-1`];
        return (
            <TableKeyboardNavigationGroupContext.Provider value={group}>
                <KeyboardNavigation
                    tableRef={tableRef}
                    scrollContainerRef={tableRef}
                    rowCount={rows.length}
                    rowHeight={0}
                    getRowLabel={(index) => rows[index]}
                >
                    <table>
                        <tbody>
                            {rows.map((row, index) => (
                                <TableRow
                                    key={row}
                                    row={row}
                                    rowIndex={index}
                                    height={0}
                                    columns={[
                                        {
                                            name: 'Name',
                                            align: 'left',
                                            render: ({row: value}) => value,
                                        },
                                    ]}
                                />
                            ))}
                        </tbody>
                    </table>
                </KeyboardNavigation>
            </TableKeyboardNavigationGroupContext.Provider>
        );
    }

    function GroupedNavigationFixture() {
        const inputRef = React.useRef<HTMLInputElement>(null);
        useTableSearch(inputRef, true);
        return (
            <React.Fragment>
                <input ref={inputRef} aria-label="Filter" />
                <GroupTable group="east" />
                <GroupTable group="west" />
            </React.Fragment>
        );
    }

    render(
        <TableKeyboardNavigationScope>
            <GroupedNavigationFixture />
        </TableKeyboardNavigationScope>,
    );
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(screen.getByRole('status')).toHaveTextContent('Group east. Selected row 2 of 2: east-1');
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(screen.getByRole('status')).toHaveTextContent('Group west. Selected row 1 of 2: west-0');
});

test('filter changes reset selection while rerenders preserve it', () => {
    const onActivate = jest.fn();
    const table = (status: string[]) => (
        <TableWithControlsLayout keyboardNavigationResetKey={JSON.stringify(status)}>
            <NavigationFixture withSearch onActivate={onActivate} />
        </TableWithControlsLayout>
    );
    const {rerender} = render(table([]));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('1');

    rerender(table([]));
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onActivate).toHaveBeenLastCalledWith(1);

    rerender(table(['Green']));
    expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onActivate).toHaveBeenLastCalledWith(0);
});

test('preserves a selected row until independently refreshed chunks are consistent', () => {
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    const notify = () => {
        act(() => listeners.forEach((listener) => listener()));
    };
    const onActivate = jest.fn();

    function KeyedNavigationFixture({
        rows,
        pending,
        lookupStates,
    }: {
        rows: number[];
        pending: boolean;
        lookupStates?: ChunkLookupState[];
    }) {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const tableRef = React.useRef<HTMLDivElement>(null);
        useTableSearch(inputRef, true);
        return (
            <KeyboardNavigation
                tableRef={tableRef}
                scrollContainerRef={tableRef}
                rowCount={rows.length}
                rowHeight={0}
                getRowKey={(index) => rows[index]}
                findRowIndex={(key) => {
                    const index = rows.indexOf(Number(key));
                    return index === -1 ? undefined : index;
                }}
                getRowLookupRevision={
                    lookupStates ? () => getChunkLookupRevision(lookupStates) : undefined
                }
                isRowLookupPending={(revision) =>
                    lookupStates ? isChunkLookupPending(lookupStates, revision) : pending
                }
                subscribe={subscribe}
                onActivate={onActivate}
            >
                <input ref={inputRef} aria-label="Filter" />
                <table>
                    <tbody>
                        {rows.map((row, index) => (
                            <TableRow
                                key={index}
                                row={row}
                                rowIndex={index}
                                height={0}
                                columns={[
                                    {name: 'ID', align: 'left', render: ({row: value}) => value},
                                ]}
                            />
                        ))}
                    </tbody>
                </table>
            </KeyboardNavigation>
        );
    }

    const table = (rows: number[], pending = false, lookupStates?: ChunkLookupState[]) => (
        <TableKeyboardNavigationScope>
            <KeyedNavigationFixture rows={rows} pending={pending} lookupStates={lookupStates} />
        </TableKeyboardNavigationScope>
    );
    const initialLookupStates: ChunkLookupState[] = [
        {offset: 0, status: QueryStatus.fulfilled, fulfilledTimeStamp: 1},
        {offset: 20, status: QueryStatus.fulfilled, fulfilledTimeStamp: 1},
    ];
    const {rerender} = render(table([20, 21], false, initialLookupStates));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, {key: 'ArrowUp'});
    expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('20');

    rerender(
        table([21, 21], false, [
            {offset: 0, status: QueryStatus.fulfilled, fulfilledTimeStamp: 2},
            {offset: 20, status: QueryStatus.fulfilled, fulfilledTimeStamp: 1},
        ]),
    );
    notify();
    expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onActivate).not.toHaveBeenCalled();

    rerender(
        table([21, 21], false, [
            {offset: 0, status: QueryStatus.fulfilled, fulfilledTimeStamp: 2},
            {offset: 20, status: QueryStatus.rejected, fulfilledTimeStamp: 1},
        ]),
    );
    notify();
    expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onActivate).not.toHaveBeenCalled();

    rerender(
        table([21, 20], false, [
            {offset: 0, status: QueryStatus.fulfilled, fulfilledTimeStamp: 2},
            {offset: 20, status: QueryStatus.fulfilled, fulfilledTimeStamp: 2},
        ]),
    );
    notify();
    expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('20');
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onActivate).toHaveBeenLastCalledWith(1);

    onActivate.mockClear();
    rerender(table([21, 21], true));
    notify();
    expect(document.querySelector('.ydb-keyboard-focused-row')).toBeNull();
    fireEvent.keyDown(input, {key: 'ArrowUp'});
    expect(document.querySelector('.ydb-keyboard-focused-row')).toHaveTextContent('21');
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onActivate).toHaveBeenLastCalledWith(0);
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
