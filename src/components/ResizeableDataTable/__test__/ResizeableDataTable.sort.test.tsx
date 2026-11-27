import React from 'react';

import type {Column, SortOrder} from '@gravity-ui/react-data-table';
import {fireEvent, render, screen} from '@testing-library/react';

import {ResizeableDataTable} from '../ResizeableDataTable';

jest.mock('../../../utils/hooks/useTableResize', () => ({
    useTableResize: () => [{}, jest.fn(), false],
}));

interface Row {
    a: number;
    b: number;
}

const columns: Column<Row>[] = [
    {name: 'a', header: 'A', sortable: true},
    {name: 'b', header: 'B', sortable: true},
];
const data: Row[] = [
    {a: 1, b: 2},
    {a: 2, b: 1},
];

test('a controlled multi-column sort keeps the priority of its columns', () => {
    let latest: SortOrder | SortOrder[] | undefined;
    function Table() {
        const [sortOrder, setSortOrder] = React.useState<SortOrder | SortOrder[]>();
        latest = sortOrder;
        return (
            <ResizeableDataTable
                columns={columns}
                data={data}
                settings={{sortable: true, dynamicRender: false}}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
            />
        );
    }
    render(<Table />);
    const header = (title: string) => screen.getAllByText(title)[0];

    fireEvent.click(header('A'));
    fireEvent.click(header('B'), {ctrlKey: true});
    expect(latest).toEqual([
        {columnId: 'a', order: 1},
        {columnId: 'b', order: 1},
    ]);

    // DataTable itself reports the flipped column last
    fireEvent.click(header('A'), {ctrlKey: true});
    expect(latest).toEqual([
        {columnId: 'a', order: -1},
        {columnId: 'b', order: 1},
    ]);
});
