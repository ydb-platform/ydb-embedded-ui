import {screen, waitFor} from '@testing-library/react';

import {renderWithStore} from '../../../utils/tests/providers';
import {PaginatedTableProvider} from '../PaginatedTableContext';
import {TableChunk} from '../TableChunk';
import {PAGINATED_TABLE_IDS} from '../constants';
import type {Column, FetchData, PaginatedTableData} from '../types';

interface Row {
    id: number;
}

type RowsData = PaginatedTableData<Row> & {note?: string};

const columns: Column<Row>[] = [{name: 'id', align: 'left', render: ({row}) => `row-${row.id}`}];

const CHUNK_SIZE = 20;

function createFetchData(note?: string) {
    return jest.fn<ReturnType<FetchData<Row, string>>, Parameters<FetchData<Row, string>>>(
        async ({offset, filters}) => {
            const data: RowsData = {
                data: [{id: offset}],
                found: 100,
                total: 100,
                note: note ?? filters,
            };

            return data;
        },
    );
}

function Chunk({
    id = 1,
    filters = 'first',
    fetchData,
    onChunkDataChange,
}: {
    id?: number;
    filters?: string;
    fetchData: FetchData<Row, string>;
    onChunkDataChange: jest.Mock;
}) {
    return (
        <PaginatedTableProvider noBatching>
            <table>
                <tbody>
                    <TableChunk<Row, string>
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
                        shouldRender
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
        // Fields that the fetcher adds to the response are kept
        expect(data).toMatchObject({data: [{id: CHUNK_SIZE}], found: 100, note: 'first'});
    });

    test('drops the data of the previous filters before the new data arrives', async () => {
        const onChunkDataChange = jest.fn();
        const fetchData = createFetchData();
        const {rerender} = renderWithStore(
            <Chunk fetchData={fetchData} onChunkDataChange={onChunkDataChange} />,
        );
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]?.note).toBe('first'));

        onChunkDataChange.mockClear();
        rerender(
            <Chunk fetchData={fetchData} filters="second" onChunkDataChange={onChunkDataChange} />,
        );

        // The chunk still renders the old rows, but they do not answer the new filters
        expect(onChunkDataChange).toHaveBeenCalledWith(CHUNK_SIZE, undefined);
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]?.note).toBe('second'));
    });

    test('reports that the chunk holds nothing when it is no longer rendered', async () => {
        const onChunkDataChange = jest.fn();
        const {unmount} = renderWithStore(
            <Chunk fetchData={createFetchData()} onChunkDataChange={onChunkDataChange} />,
        );
        await waitFor(() => expect(lastCall(onChunkDataChange)[1]).toBeDefined());

        unmount();

        expect(lastCall(onChunkDataChange)).toEqual([CHUNK_SIZE, undefined]);
    });
});
