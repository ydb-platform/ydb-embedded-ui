import {screen, waitFor} from '@testing-library/react';

import {renderWithStore} from '../../../utils/tests/providers';
import {PaginatedTableProvider} from '../PaginatedTableContext';
import {TableChunk} from '../TableChunk';
import {PAGINATED_TABLE_IDS} from '../constants';
import type {Column, FetchData, PaginatedTableData} from '../types';

interface Row {
    id: number;
}

interface RowsMeta {
    note?: string;
}

type RowsData = PaginatedTableData<Row, RowsMeta>;
type FetchRows = FetchData<Row, string, {}, RowsMeta>;

const columns: Column<Row>[] = [{name: 'id', align: 'left', render: ({row}) => `row-${row.id}`}];

const CHUNK_SIZE = 20;

function createFetchData(note?: string) {
    return jest.fn<ReturnType<FetchRows>, Parameters<FetchRows>>(async ({offset, filters}) => {
        const data: RowsData = {
            data: [{id: offset}],
            found: 100,
            total: 100,
            meta: {note: note ?? filters},
        };

        return data;
    });
}

function Chunk({
    id = 1,
    filters = 'first',
    shouldRender = true,
    fetchData,
    onChunkDataChange,
}: {
    id?: number;
    filters?: string;
    shouldRender?: boolean;
    fetchData: FetchRows;
    onChunkDataChange: jest.Mock;
}) {
    return (
        <PaginatedTableProvider noBatching>
            <table>
                <tbody>
                    <TableChunk<Row, string, RowsMeta>
                        id={id}
                        chunkSize={CHUNK_SIZE}
                        calculatedCount={1}
                        rowHeight={40}
                        columns={columns}
                        fetchData={fetchData}
                        filters={filters}
                        tableName={PAGINATED_TABLE_IDS.NODES}
                        onDataFetched={() => undefined}
                        onChunkDataChange={onChunkDataChange}
                        shouldFetch
                        shouldRender={shouldRender}
                    />
                </tbody>
            </table>
        </PaginatedTableProvider>
    );
}

function lastCall(mock: jest.Mock) {
    return mock.mock.calls[mock.mock.calls.length - 1] as [number, RowsData | undefined];
}

describe('TableChunk onChunkDataChange', () => {
    test('reports that the chunk holds nothing until it is loaded, then its data', async () => {
        const onChunkDataChange = jest.fn();
        renderWithStore(
            <Chunk fetchData={createFetchData()} onChunkDataChange={onChunkDataChange} />,
        );

        expect(onChunkDataChange).toHaveBeenCalledWith(CHUNK_SIZE, undefined);

        await screen.findByText(`row-${CHUNK_SIZE}`);

        const [offset, data] = lastCall(onChunkDataChange);
        expect(offset).toBe(CHUNK_SIZE);
        // The metadata of the fetcher comes with the rows
        expect(data).toMatchObject({data: [{id: CHUNK_SIZE}], found: 100, meta: {note: 'first'}});
    });

    test('drops the data of the previous filters before the new data arrives', async () => {
        const onChunkDataChange = jest.fn();
        const fetchData = createFetchData();
        const {rerender} = renderWithStore(
            <Chunk fetchData={fetchData} onChunkDataChange={onChunkDataChange} />,
        );
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]?.meta?.note).toBe('first'));

        onChunkDataChange.mockClear();
        rerender(
            <Chunk fetchData={fetchData} filters="second" onChunkDataChange={onChunkDataChange} />,
        );

        // The chunk still renders the old rows, but they do not answer the new filters
        expect(onChunkDataChange).toHaveBeenCalledWith(CHUNK_SIZE, undefined);
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]?.meta?.note).toBe('second'));
    });

    test('follows the rows as the chunk leaves and enters the render range', async () => {
        const onChunkDataChange = jest.fn();
        const fetchData = createFetchData();
        const {rerender} = renderWithStore(
            <Chunk fetchData={fetchData} onChunkDataChange={onChunkDataChange} />,
        );
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]?.meta?.note).toBe('first'));

        // Scrolled away: the chunk stays mounted and loaded, but its rows are not in the table
        rerender(
            <Chunk
                fetchData={fetchData}
                shouldRender={false}
                onChunkDataChange={onChunkDataChange}
            />,
        );

        expect(screen.queryByText(`row-${CHUNK_SIZE}`)).not.toBeInTheDocument();
        expect(lastCall(onChunkDataChange)).toEqual([CHUNK_SIZE, undefined]);

        // Scrolled back: the rows are rendered from the data the chunk already has
        rerender(<Chunk fetchData={fetchData} onChunkDataChange={onChunkDataChange} />);

        expect(screen.getByText(`row-${CHUNK_SIZE}`)).toBeInTheDocument();
        expect(lastCall(onChunkDataChange)[1]?.meta?.note).toBe('first');
        expect(fetchData).toHaveBeenCalledTimes(1);
    });

    test('reports that the chunk holds nothing when it is unmounted', async () => {
        const onChunkDataChange = jest.fn();
        const {unmount} = renderWithStore(
            <Chunk fetchData={createFetchData()} onChunkDataChange={onChunkDataChange} />,
        );
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]).toBeDefined());

        unmount();

        expect(lastCall(onChunkDataChange)).toEqual([CHUNK_SIZE, undefined]);
    });
});
