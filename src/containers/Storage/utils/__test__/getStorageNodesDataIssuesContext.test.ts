import {getStorageNodesDataIssuesContext} from '../index';

describe('getStorageNodesDataIssuesContext', () => {
    test('Should describe storage nodes of the cluster', () => {
        expect(getStorageNodesDataIssuesContext({})).toEqual({
            storageNodes: true,
            hasDatabase: false,
            hasGroupFilter: false,
        });
    });

    test.each([['2181038080'], [2181038080], [0], ['0']])(
        'Should see the storage group filter for group %p',
        (groupId) => {
            expect(getStorageNodesDataIssuesContext({groupId}).hasGroupFilter).toBe(true);
        },
    );

    test('Should not take an empty group id for a filter', () => {
        expect(getStorageNodesDataIssuesContext({groupId: ''}).hasGroupFilter).toBe(false);
    });

    test('Should see the database', () => {
        expect(getStorageNodesDataIssuesContext({database: '/Root/db'}).hasDatabase).toBe(true);
    });
});
