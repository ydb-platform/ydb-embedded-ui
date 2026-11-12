import {getStorageNodesDataIssuesSubject} from '../index';

describe('getStorageNodesDataIssuesSubject', () => {
    test.each<[Parameters<typeof getStorageNodesDataIssuesSubject>[0], boolean, boolean]>([
        [{}, false, false],
        [{database: '/Root/db'}, true, false],
        [{groupId: '2181038080'}, false, true],
        [{groupId: 2181038080}, false, true],
        // the static group
        [{groupId: 0}, false, true],
        [{groupId: '0'}, false, true],
        [{groupId: ''}, false, false],
    ])('Should describe the storage nodes of %j', (params, hasDatabase, hasGroupFilter) => {
        expect(getStorageNodesDataIssuesSubject(params)).toEqual({
            type: 'nodes',
            storageNodes: true,
            hasDatabase,
            hasGroupFilter,
        });
    });
});
