import {getStorageNodesDataIssuesSubject} from '../index';

describe('getStorageNodesDataIssuesSubject', () => {
    test('Should describe storage nodes of the cluster', () => {
        expect(getStorageNodesDataIssuesSubject({})).toEqual({
            type: 'nodes',
            storageNodes: true,
            hasDatabase: false,
            hasGroupFilter: false,
        });
    });

    test.each([['2181038080'], [2181038080], [0], ['0']])(
        'Should see the storage group filter for group %p',
        (groupId) => {
            expect(getStorageNodesDataIssuesSubject({groupId})).toMatchObject({
                hasGroupFilter: true,
            });
        },
    );

    test('Should not take an empty group id for a filter', () => {
        expect(getStorageNodesDataIssuesSubject({groupId: ''})).toMatchObject({
            hasGroupFilter: false,
        });
    });

    test('Should see the database', () => {
        expect(getStorageNodesDataIssuesSubject({database: '/Root/db'})).toMatchObject({
            hasDatabase: true,
        });
    });
});
