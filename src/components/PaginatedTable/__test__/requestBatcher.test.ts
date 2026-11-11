import {requestBatcher} from '../requestBatcher';
import type {FetchData} from '../types';

interface ResponseMeta {
    note: string;
}

describe('requestBatcher', () => {
    test('gives the metadata of a merged response to every chunk made of it', async () => {
        const fetchData = jest.fn<
            ReturnType<FetchData<number, undefined, {}, ResponseMeta>>,
            Parameters<FetchData<number, undefined, {}, ResponseMeta>>
        >(async ({offset, limit}) => ({
            data: Array.from({length: limit}, (_, index) => offset + index),
            found: 40,
            total: 40,
            meta: {note: 'one response'},
        }));
        const params = {
            fetchData,
            filters: undefined,
            limit: 20,
            columnsIds: [],
            tableName: 'batcher-test',
        };

        const [first, second] = await Promise.all([
            requestBatcher.queueRequest({...params, offset: 0}),
            requestBatcher.queueRequest({...params, offset: 20}),
        ]);

        // Neighbouring chunks are loaded by one request
        expect(fetchData).toHaveBeenCalledTimes(1);
        expect(fetchData).toHaveBeenCalledWith(expect.objectContaining({offset: 0, limit: 40}));
        expect(first).toMatchObject({
            data: {data: expect.arrayContaining([0, 19]), meta: {note: 'one response'}},
        });
        expect(second).toMatchObject({
            data: {data: expect.arrayContaining([20, 39]), meta: {note: 'one response'}},
        });
    });
});
