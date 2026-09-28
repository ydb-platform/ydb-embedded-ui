import React from 'react';

import {QueryStatus} from '@reduxjs/toolkit/query';
import {act, fireEvent, render, screen} from '@testing-library/react';

import {
    TableKeyboardNavigationScope,
    useTableSearch,
} from '../../TableKeyboardNavigation/TableKeyboardNavigation';
import {KeyboardNavigation} from '../KeyboardNavigation';
import {TableRow} from '../TableRow';
import type {ChunkLookupState} from '../rowLookup';
import {getChunkLookupRevision, isChunkLookupPending} from '../rowLookup';
import type {Column} from '../types';

const columns: Column<number>[] = [{name: 'ID', align: 'left', render: ({row}) => row}];
const focusedRow = () => document.querySelector('.ydb-keyboard-focused-row');
const fulfilled = (offset: number, fulfilledTimeStamp: number): ChunkLookupState => ({
    offset,
    status: QueryStatus.fulfilled,
    fulfilledTimeStamp,
});

beforeEach(() => {
    const rect = new DOMRect(0, 0, 100, 20);
    jest.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(
        Object.assign([rect], {item: (index: number) => (index === 0 ? rect : null)}),
    );
});
afterEach(() => jest.restoreAllMocks());

function setup(rows: number[], states: ChunkLookupState[]) {
    const onActivate = jest.fn();
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    function Fixture({data, chunks}: {data: number[]; chunks: ChunkLookupState[]}) {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const tableRef = React.useRef<HTMLDivElement>(null);
        useTableSearch(inputRef, true);
        return (
            <KeyboardNavigation
                tableRef={tableRef}
                scrollContainerRef={tableRef}
                rowCount={data.length}
                rowHeight={0}
                subscribe={subscribe}
                getRowKey={(index) => data[index]}
                findRowIndex={(key) => {
                    const index = data.indexOf(Number(key));
                    return index < 0 ? undefined : index;
                }}
                getRowLookupRevision={(revision) => getChunkLookupRevision(chunks, revision)}
                isRowLookupPending={(revision) => isChunkLookupPending(chunks, revision)}
                onActivate={(index) => onActivate(data[index])}
            >
                <input ref={inputRef} aria-label="Filter" />
                <table>
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
        );
    }
    const table = (data: number[], chunks: ChunkLookupState[]) => (
        <TableKeyboardNavigationScope>
            <Fixture data={data} chunks={chunks} />
        </TableKeyboardNavigationScope>
    );
    const view = render(table(rows, states));
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, {key: 'ArrowUp'});
    return {
        input,
        onActivate,
        update(data: number[], chunks: ChunkLookupState[]) {
            view.rerender(table(data, chunks));
            act(() => listeners.forEach((listener) => listener()));
        },
        notify() {
            act(() => listeners.forEach((listener) => listener()));
        },
    };
}

test.each([false, true])(
    'preserves identity when refreshed head precedes initial tail: %s',
    (headFirst) => {
        const fixture = setup([120], [fulfilled(0, 10), {offset: 20, status: QueryStatus.pending}]);
        expect(focusedRow()).toHaveTextContent('120');
        if (headFirst) {
            fixture.update([119], [fulfilled(0, 30), {offset: 20, status: QueryStatus.pending}]);
            fireEvent.keyDown(fixture.input, {key: 'Enter'});
            expect(fixture.onActivate).not.toHaveBeenCalled();
        } else {
            fixture.update([120, 121], [fulfilled(0, 10), fulfilled(20, 20)]);
            expect(focusedRow()).toHaveTextContent('120');
        }
        fixture.update([119, 121], [fulfilled(0, 30), fulfilled(20, 20)]);
        expect(focusedRow()).toBeNull();
        for (let repeat = 0; repeat < 3; repeat++) {
            fixture.notify();
            fireEvent.keyDown(fixture.input, {key: 'Enter'});
        }
        expect(fixture.onActivate).not.toHaveBeenCalled();
        fixture.update([119, 120], [fulfilled(0, 30), fulfilled(20, 40)]);
        expect(focusedRow()).toHaveTextContent('120');
        expect(fixture.input).toHaveFocus();
        fireEvent.keyDown(fixture.input, {key: 'Enter'});
        expect(fixture.onActivate).toHaveBeenCalledTimes(1);
        expect(fixture.onActivate).toHaveBeenLastCalledWith(120);
    },
);

test('initialization while pending permits deletion fallback after sufficient refresh', () => {
    const fixture = setup([120], [fulfilled(0, 10), {offset: 20, status: QueryStatus.pending}]);
    fixture.update([119], [fulfilled(0, 30), {offset: 20, status: QueryStatus.pending}]);
    fixture.update([119, 121], [fulfilled(0, 30), fulfilled(20, 20)]);
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).not.toHaveBeenCalled();
    fixture.update([119, 121], [fulfilled(0, 30), fulfilled(20, 40)]);
    expect(focusedRow()).toHaveTextContent('119');
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).toHaveBeenLastCalledWith(119);
});

test('known revisions still allow same-cycle deletion and last/empty fallbacks', () => {
    const fixture = setup([120, 121, 122], [fulfilled(0, 10), fulfilled(20, 20)]);
    fireEvent.keyDown(fixture.input, {key: 'ArrowDown'});
    fixture.update([120, 121, 122], [fulfilled(0, 30), fulfilled(20, 20)]);
    fixture.update([120, 122], [fulfilled(0, 30), fulfilled(20, 40)]);
    expect(focusedRow()).toHaveTextContent('122');
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).toHaveBeenLastCalledWith(122);
    fixture.update([120], [fulfilled(0, 50)]);
    expect(focusedRow()).toHaveTextContent('120');
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).toHaveBeenLastCalledWith(120);
    fixture.onActivate.mockClear();
    fixture.update([], [fulfilled(0, 60)]);
    expect(focusedRow()).toBeNull();
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).not.toHaveBeenCalled();
});

test('unknown chunks and errors retain identity until a successful refresh', () => {
    const fixture = setup([120], [fulfilled(0, 10)]);
    fixture.update([119], []);
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).not.toHaveBeenCalled();
    fixture.update([119, 121], [fulfilled(0, 30), fulfilled(20, 20)]);
    fixture.update(
        [119, 121],
        [fulfilled(0, 30), {offset: 20, status: QueryStatus.rejected, fulfilledTimeStamp: 20}],
    );
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).not.toHaveBeenCalled();
    fixture.update([119, 120], [fulfilled(0, 30), fulfilled(20, 40)]);
    expect(focusedRow()).toHaveTextContent('120');
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).toHaveBeenLastCalledWith(120);
});

test('active window changes preserve identity and same-cycle deletion fallback', () => {
    const fixture = setup([120, 121, 122], [fulfilled(0, 10), fulfilled(20, 20)]);
    fixture.update([120, 121, 122], [fulfilled(20, 20)]);
    fixture.update([120, 121, 122], [fulfilled(20, 30), fulfilled(40, 40)]);
    fixture.update([120, 121, 122], []);
    fixture.update([120, 121, 122], [fulfilled(0, 50), fulfilled(20, 30)]);
    expect(focusedRow()).toHaveTextContent('120');
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).toHaveBeenLastCalledWith(120);
    fireEvent.keyDown(fixture.input, {key: 'ArrowDown'});
    fixture.update([120, 121, 122], [fulfilled(0, 60), fulfilled(20, 30)]);
    fixture.update([120, 122], [fulfilled(0, 60), fulfilled(20, 40)]);
    expect(focusedRow()).toHaveTextContent('122');
    fireEvent.keyDown(fixture.input, {key: 'Enter'});
    expect(fixture.onActivate).toHaveBeenLastCalledWith(122);
    expect(fixture.input).toHaveFocus();
});
