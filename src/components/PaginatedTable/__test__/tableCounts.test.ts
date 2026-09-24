import type {TableCountsAction, TableCountsState} from '../tableCounts';
import {tableCountsReducer} from '../tableCounts';

const initialState: TableCountsState = {
    totalEntities: 0,
    foundEntities: 0,
    isInitialLoad: true,
    hasLoadedData: false,
};

const query: TableCountsAction['query'] = {
    tableName: 'storage-groups',
    filters: {database: '/Root', searchValue: ''},
    limit: 20,
    columnsIds: ['GroupId'],
};

describe('tableCountsReducer', () => {
    test.each([0, 45])(
        'preserves a response with %i groups in either initialization order',
        (found) => {
            const initialize: TableCountsAction = {
                type: 'initialize',
                query,
                initialEntitiesCount: 10,
            };
            const receive: TableCountsAction = {type: 'dataReceived', query, total: 100, found};

            for (const actions of [
                [initialize, receive],
                [receive, initialize],
            ]) {
                expect(actions.reduce(tableCountsReducer, initialState)).toMatchObject({
                    query,
                    totalEntities: 100,
                    foundEntities: found,
                    isInitialLoad: false,
                });
            }
        },
    );

    test('updates the initial estimate until data arrives', () => {
        const loading = tableCountsReducer(initialState, {
            type: 'initialize',
            query,
            initialEntitiesCount: 10,
        });
        expect(
            tableCountsReducer(loading, {
                type: 'initialize',
                query,
                initialEntitiesCount: 25,
            }),
        ).toMatchObject({query, totalEntities: 25, foundEntities: 25, isInitialLoad: true});
    });

    test('does not reset loaded counts when the initial estimate changes', () => {
        const loaded = tableCountsReducer(initialState, {
            type: 'dataReceived',
            query,
            total: 100,
            found: 45,
        });
        expect(
            tableCountsReducer(loaded, {
                type: 'initialize',
                query,
                initialEntitiesCount: 25,
            }),
        ).toBe(loaded);
    });

    test('recognizes equivalent query parameters without relying on object identity', () => {
        const loaded = tableCountsReducer(initialState, {
            type: 'dataReceived',
            query,
            total: 100,
            found: 45,
        });
        expect(
            tableCountsReducer(loaded, {
                type: 'initialize',
                query: {
                    ...query,
                    filters: {searchValue: '', database: '/Root'},
                    columnsIds: ['GroupId'],
                },
            }),
        ).toBe(loaded);
    });

    test.each([
        {...query, filters: {database: '/Other', searchValue: ''}},
        {...query, filters: {database: '/Root', searchValue: '9000'}},
        {...query, sortParams: {columnId: 'GroupId', sortOrder: 1 as const}},
        {...query, columnsIds: ['GroupId', 'VDisks']},
    ])('initializes a different query independently: %o', (nextQuery) => {
        const loaded = tableCountsReducer(initialState, {
            type: 'dataReceived',
            query,
            total: 100,
            found: 45,
        });
        const initialize: TableCountsAction = {type: 'initialize', query: nextQuery};
        const receive: TableCountsAction = {
            type: 'dataReceived',
            query: nextQuery,
            total: 60,
            found: 3,
        };

        expect(tableCountsReducer(loaded, initialize)).toMatchObject({
            query: nextQuery,
            totalEntities: 100,
            foundEntities: 45,
            isInitialLoad: true,
        });
        for (const actions of [
            [initialize, receive],
            [receive, initialize],
        ]) {
            expect(actions.reduce(tableCountsReducer, loaded)).toMatchObject({
                query: nextQuery,
                totalEntities: 60,
                foundEntities: 3,
                isInitialLoad: false,
            });
        }
    });

    test('updates loaded counts when another chunk or a refresh reports a change', () => {
        const loaded = tableCountsReducer(initialState, {
            type: 'dataReceived',
            query,
            total: 100,
            found: 45,
        });
        expect(
            tableCountsReducer(loaded, {
                type: 'dataReceived',
                query,
                total: 110,
                found: 46,
            }),
        ).toMatchObject({query, totalEntities: 110, foundEntities: 46, isInitialLoad: false});
    });

    test('keeps the loaded size while new columns are loading, even with an initial estimate', () => {
        const loaded = tableCountsReducer(initialState, {
            type: 'dataReceived',
            query,
            total: 245,
            found: 245,
        });
        const action: TableCountsAction = {
            type: 'initialize',
            query: {...query, columnsIds: ['Erasure', 'GroupId']},
            initialEntitiesCount: 10,
        };
        const loading = tableCountsReducer(loaded, action);
        expect(loading).toMatchObject({
            totalEntities: 245,
            foundEntities: 245,
            isInitialLoad: true,
        });
        expect(tableCountsReducer(loading, action)).toBe(loading);
    });
});
