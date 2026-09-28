import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import {fireEvent, screen} from '@testing-library/react';

import {renderWithStore} from '../../utils/tests/providers';
import {
    TableKeyboardNavigationScope,
    useTableSearch,
} from '../TableKeyboardNavigation/TableKeyboardNavigation';

import {ResizeableDataTable} from './ResizeableDataTable';

type Row = {id: number};
const columns: Column<Row>[] = [{name: 'id'}];

test('unpaginated selection follows its identity and falls back after removal', () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = jest.fn();
    const rect = new DOMRect(0, 0, 100, 20);
    jest.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(
        Object.assign([rect], {item: (index: number) => (index === 0 ? rect : null)}),
    );
    const onActivate = jest.fn();
    function Fixture({data}: {data: Row[]}) {
        const ref = React.useRef<HTMLInputElement>(null);
        useTableSearch(ref, true);
        return (
            <React.Fragment>
                <input ref={ref} aria-label="Filter" />
                <ResizeableDataTable
                    data={data}
                    columns={columns}
                    getKeyboardRowKey={(row) => row.id}
                    onKeyboardActivate={onActivate}
                />
            </React.Fragment>
        );
    }
    const table = (data: Row[]) => (
        <TableKeyboardNavigationScope>
            <Fixture data={data} />
        </TableKeyboardNavigationScope>
    );
    try {
        const {rerender} = renderWithStore(table([{id: 120}, {id: 121}]));
        const input = screen.getByRole('textbox');
        input.focus();
        fireEvent.keyDown(input, {key: 'ArrowUp'});
        rerender(table([{id: 119}, {id: 120}, {id: 121}]));
        fireEvent.keyDown(input, {key: 'Enter'});
        expect(onActivate).toHaveBeenLastCalledWith({id: 120});
        rerender(table([{id: 119}, {id: 121}]));
        fireEvent.keyDown(input, {key: 'Enter'});
        expect(onActivate).toHaveBeenLastCalledWith({id: 121});
        expect(input).toHaveFocus();
        onActivate.mockClear();
        rerender(table([]));
        fireEvent.keyDown(input, {key: 'Enter'});
        expect(onActivate).not.toHaveBeenCalled();
    } finally {
        HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
        jest.restoreAllMocks();
    }
});
